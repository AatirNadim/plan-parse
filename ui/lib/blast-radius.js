/**
 * blast-radius.js
 * Transitive Multi-Hop Blast Radius & Dependency Lineage Engine.
 *
 * In this application's Cytoscape DAG schema:
 * - Directed edges point from dependent (source) to prerequisite (target).
 *   Example: `aws_instance.web` (source) -> `aws_security_group.sg` (target)
 *
 * Therefore:
 * - DOWNSTREAM BLAST RADIUS: Follow incoming edges (where edge.target === node, explore edge.source).
 *   These are all resources that reference or depend on this node.
 * - UPSTREAM LINEAGE: Follow outgoing edges (where edge.source === node, explore edge.target).
 *   These are all prerequisite resources this node depends on.
 */

/**
 * Checks if a node is considered a mutating change (destructive or state-altering).
 *
 * @param {Object} node - Node data object
 * @returns {boolean}
 */
export function isMutatingNode(node) {
  if (!node) return false;
  const change = (node.change || "").toLowerCase();
  return (
    change === "replace" ||
    change === "delete" ||
    change === "update" ||
    change === "create"
  );
}

/**
 * Normalizes graph data elements into node and edge arrays.
 *
 * @param {Object} graphData - Graph payload { nodes: [...], edges: [...] }
 * @returns {{ nodes: Array<Object>, edges: Array<Object> }}
 */
function normalizeGraphData(graphData) {
  if (!graphData) return { nodes: [], edges: [] };
  const rawNodes = Array.isArray(graphData.nodes) ? graphData.nodes : [];
  const rawEdges = Array.isArray(graphData.edges) ? graphData.edges : [];

  const nodes = rawNodes.map((n) => n.data || n);
  const edges = rawEdges.map((e) => e.data || e);

  return { nodes, edges };
}

/**
 * Computes the complete multi-hop downstream blast radius for a given node.
 *
 * @param {string} nodeId - Root node ID to evaluate
 * @param {Object} graphData - Full graph payload { nodes, edges }
 * @param {Object} [options]
 * @param {number} [options.maxDepth=Infinity] - Maximum depth to traverse (1 = direct only)
 * @param {boolean} [options.mutatingOnly=false] - If true, only include downstream nodes with mutations
 * @returns {Object} Blast radius analysis result
 */
export function computeBlastRadius(nodeId, graphData, options = {}) {
  const { maxDepth = Infinity, mutatingOnly = false } = options;

  const emptyResult = {
    rootId: nodeId || "",
    rootNode: null,
    direct: [],
    transitive: [],
    all: [],
    byDepth: {},
    maxDepth: 0,
    mutatingNodes: [],
    stats: {
      directCount: 0,
      transitiveCount: 0,
      totalCount: 0,
      mutatingCount: 0,
      replaceCount: 0,
      deleteCount: 0,
      updateCount: 0,
      createCount: 0,
      noopCount: 0,
    },
    nodeIds: new Set(),
    edgeIds: new Set(),
  };

  if (!nodeId || !graphData) return emptyResult;

  const { nodes, edges } = normalizeGraphData(graphData);

  // Map nodes by ID
  const nodeMap = new Map();
  for (const n of nodes) {
    if (n && n.id) {
      nodeMap.set(n.id, n);
    }
  }

  const rootNode = nodeMap.get(nodeId) || null;
  if (!rootNode) return emptyResult;

  // Build incoming adjacency: target -> array of { sourceId, edgeId, edge }
  // Since edges point from dependent (source) to dependency (target),
  // incoming edges to `nodeId` represent the direct casualties.
  const downstreamAdj = new Map();
  for (const edge of edges) {
    const src = edge.source;
    const tgt = edge.target;
    if (!src || !tgt) continue;

    if (!downstreamAdj.has(tgt)) {
      downstreamAdj.set(tgt, []);
    }
    const edgeId = edge.id || `${src}->${tgt}`;
    downstreamAdj.get(tgt).push({ sourceId: src, edgeId, edge });
  }

  // Multi-hop BFS traversal
  const visited = new Set([nodeId]);
  const depthMap = new Map([[nodeId, 0]]);
  const edgeIds = new Set();
  const pathMap = new Map([[nodeId, [nodeId]]]);

  const queue = [{ id: nodeId, depth: 0 }];
  const discoveredNodes = [];

  while (queue.length > 0) {
    const { id: currId, depth: currDepth } = queue.shift();

    if (currDepth >= maxDepth) continue;

    const casualties = downstreamAdj.get(currId) || [];
    for (const { sourceId, edgeId } of casualties) {
      // Don't cycle back to root or re-explore cycles
      const nextDepth = currDepth + 1;
      const isAlreadyVisited = visited.has(sourceId);

      if (!isAlreadyVisited) {
        visited.add(sourceId);
        depthMap.set(sourceId, nextDepth);
        edgeIds.add(edgeId);

        const currentPath = pathMap.get(currId) || [currId];
        pathMap.set(sourceId, [...currentPath, sourceId]);

        const rawNode = nodeMap.get(sourceId);
        if (rawNode) {
          discoveredNodes.push({
            node: rawNode,
            depth: nextDepth,
            via: currId,
            edgeId,
          });
        }

        queue.push({ id: sourceId, depth: nextDepth });
      } else {
        // If already visited at same or deeper depth, we still record edge if part of blast tree
        if ((depthMap.get(sourceId) || 0) > currDepth) {
          edgeIds.add(edgeId);
        }
      }
    }
  }

  // Filter and categorize nodes
  const direct = [];
  const transitive = [];
  const all = [];
  const byDepth = {};
  const mutatingNodes = [];

  let replaceCount = 0;
  let deleteCount = 0;
  let updateCount = 0;
  let createCount = 0;
  let noopCount = 0;
  let maxDiscoveredDepth = 0;

  for (const item of discoveredNodes) {
    const { node, depth, via, edgeId } = item;
    const isMutating = isMutatingNode(node);

    if (mutatingOnly && !isMutating) {
      continue;
    }

    const change = (node.change || "no-op").toLowerCase();
    if (change === "replace") replaceCount++;
    else if (change === "delete") deleteCount++;
    else if (change === "update") updateCount++;
    else if (change === "create") createCount++;
    else noopCount++;

    const enrichedNode = {
      ...node,
      blastDepth: depth,
      blastVia: via,
      blastEdgeId: edgeId,
      isMutating,
    };

    if (isMutating) {
      mutatingNodes.push(enrichedNode);
    }

    if (depth === 1) {
      direct.push(enrichedNode);
    } else {
      transitive.push(enrichedNode);
    }

    all.push(enrichedNode);

    if (!byDepth[depth]) {
      byDepth[depth] = [];
    }
    byDepth[depth].push(enrichedNode);

    if (depth > maxDiscoveredDepth) {
      maxDiscoveredDepth = depth;
    }
  }

  const mutatingCount = mutatingNodes.length;

  return {
    rootId: nodeId,
    rootNode,
    direct,
    transitive,
    all,
    byDepth,
    maxDepth: maxDiscoveredDepth,
    mutatingNodes,
    stats: {
      directCount: direct.length,
      transitiveCount: transitive.length,
      totalCount: all.length,
      mutatingCount,
      replaceCount,
      deleteCount,
      updateCount,
      createCount,
      noopCount,
    },
    nodeIds: visited,
    edgeIds,
  };
}

/**
 * Computes multi-hop upstream prerequisite lineage for a given node.
 * Follows outgoing edges (where edge.source === node, explore edge.target).
 *
 * @param {string} nodeId - Root node ID
 * @param {Object} graphData - Full graph payload { nodes, edges }
 * @param {Object} [options]
 * @param {number} [options.maxDepth=Infinity]
 * @returns {Object} Upstream lineage analysis result
 */
export function computeUpstreamLineage(nodeId, graphData, options = {}) {
  const { maxDepth = Infinity } = options;

  const emptyResult = {
    rootId: nodeId || "",
    rootNode: null,
    direct: [],
    transitive: [],
    all: [],
    byDepth: {},
    maxDepth: 0,
    nodeIds: new Set(),
    edgeIds: new Set(),
    stats: { directCount: 0, transitiveCount: 0, totalCount: 0 },
  };

  if (!nodeId || !graphData) return emptyResult;

  const { nodes, edges } = normalizeGraphData(graphData);
  const nodeMap = new Map();
  for (const n of nodes) {
    if (n && n.id) nodeMap.set(n.id, n);
  }

  const rootNode = nodeMap.get(nodeId);
  if (!rootNode) return emptyResult;

  // Build outgoing adjacency: source -> array of { targetId, edgeId, edge }
  const upstreamAdj = new Map();
  for (const edge of edges) {
    const src = edge.source;
    const tgt = edge.target;
    if (!src || !tgt) continue;

    if (!upstreamAdj.has(src)) {
      upstreamAdj.set(src, []);
    }
    const edgeId = edge.id || `${src}->${tgt}`;
    upstreamAdj.get(src).push({ targetId: tgt, edgeId, edge });
  }

  const visited = new Set([nodeId]);
  const depthMap = new Map([[nodeId, 0]]);
  const edgeIds = new Set();
  const queue = [{ id: nodeId, depth: 0 }];
  const discovered = [];

  while (queue.length > 0) {
    const { id: currId, depth: currDepth } = queue.shift();
    if (currDepth >= maxDepth) continue;

    const prereqs = upstreamAdj.get(currId) || [];
    for (const { targetId, edgeId } of prereqs) {
      const nextDepth = currDepth + 1;
      if (!visited.has(targetId)) {
        visited.add(targetId);
        depthMap.set(targetId, nextDepth);
        edgeIds.add(edgeId);

        const rawNode = nodeMap.get(targetId);
        if (rawNode) {
          discovered.push({
            node: rawNode,
            depth: nextDepth,
            via: currId,
            edgeId,
          });
        }
        queue.push({ id: targetId, depth: nextDepth });
      } else {
        if ((depthMap.get(targetId) || 0) > currDepth) {
          edgeIds.add(edgeId);
        }
      }
    }
  }

  const direct = [];
  const transitive = [];
  const all = [];
  const byDepth = {};
  let maxDiscoveredDepth = 0;

  for (const item of discovered) {
    const { node, depth, via, edgeId } = item;
    const enriched = {
      ...node,
      lineageDepth: depth,
      lineageVia: via,
      lineageEdgeId: edgeId,
    };

    if (depth === 1) direct.push(enriched);
    else transitive.push(enriched);

    all.push(enriched);
    if (!byDepth[depth]) byDepth[depth] = [];
    byDepth[depth].push(enriched);

    if (depth > maxDiscoveredDepth) maxDiscoveredDepth = depth;
  }

  return {
    rootId: nodeId,
    rootNode,
    direct,
    transitive,
    all,
    byDepth,
    maxDepth: maxDiscoveredDepth,
    nodeIds: visited,
    edgeIds,
    stats: {
      directCount: direct.length,
      transitiveCount: transitive.length,
      totalCount: all.length,
    },
  };
}

/**
 * Extracts an isolated subgraph for Cytoscape containing only the blast radius
 * nodes, the root node, traversed edges, and necessary module container ancestors.
 *
 * @param {Object} graphData - Full graph payload { nodes: [...], edges: [...] }
 * @param {Object} blastResult - Output from computeBlastRadius
 * @param {Object} [options]
 * @param {boolean} [options.includeContainers=true] - Whether to include parent module/basename nodes
 * @returns {{ nodes: Array<Object>, edges: Array<Object> }}
 */
export function extractBlastSubgraph(graphData, blastResult, options = {}) {
  if (
    !graphData ||
    !blastResult ||
    !blastResult.nodeIds ||
    blastResult.nodeIds.size === 0
  ) {
    return { nodes: [], edges: [] };
  }

  const { includeContainers = true } = options;
  const rawNodes = Array.isArray(graphData.nodes) ? graphData.nodes : [];
  const rawEdges = Array.isArray(graphData.edges) ? graphData.edges : [];

  const blastNodeIds = blastResult.nodeIds;
  const blastEdgeIds = blastResult.edgeIds;

  const nodeMap = new Map();
  for (const n of rawNodes) {
    const data = n.data || n;
    if (data && data.id) {
      nodeMap.set(data.id, n);
    }
  }

  const includedNodeIds = new Set(blastNodeIds);

  // If container hierarchy should be preserved for compound visualization:
  if (includeContainers) {
    for (const nodeId of Array.from(blastNodeIds)) {
      let curr = nodeMap.get(nodeId);
      while (curr) {
        const parentId = (curr.data || curr).parent;
        if (parentId && nodeMap.has(parentId)) {
          includedNodeIds.add(parentId);
          curr = nodeMap.get(parentId);
        } else {
          break;
        }
      }
    }
  }

  // Filter nodes
  const filteredNodes = [];
  for (const n of rawNodes) {
    const data = n.data || n;
    if (includedNodeIds.has(data.id)) {
      filteredNodes.push(n);
    }
  }

  // Filter edges: must connect two included nodes, and either be in blastEdgeIds or connect included nodes
  const filteredEdges = [];
  for (const e of rawEdges) {
    const data = e.data || e;
    const edgeId = data.id || `${data.source}->${data.target}`;
    if (
      includedNodeIds.has(data.source) &&
      includedNodeIds.has(data.target) &&
      (blastEdgeIds.has(edgeId) ||
        (blastNodeIds.has(data.source) && blastNodeIds.has(data.target)))
    ) {
      filteredEdges.push(e);
    }
  }

  return {
    nodes: filteredNodes,
    edges: filteredEdges,
  };
}
