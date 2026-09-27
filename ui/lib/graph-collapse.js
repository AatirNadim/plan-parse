import { ACTION_COLORS } from "./action-theme.js";

const MUTATING_ACTIONS = new Set(["create", "update", "delete", "replace"]);
const CONTAINER_TYPES = new Set(["basename", "module", "file"]);

/**
 * Returns whether a node represents a mutating resource change.
 * @param {object} node
 * @returns {boolean}
 */
export function isMutatingNode(node) {
  const change = (node?.data?.change || "").toLowerCase().trim();
  return MUTATING_ACTIONS.has(change);
}

/**
 * Returns whether a node is a compound container grouping node.
 * @param {object} node
 * @returns {boolean}
 */
export function isContainerNode(node) {
  const type = (node?.data?.type || "").toLowerCase().trim();
  return CONTAINER_TYPES.has(type) && !isMutatingNode(node);
}

/**
 * Resolves semantic action color for edge gradient endpoints.
 * @param {string} action
 * @returns {string}
 */
function getActionHexColor(action) {
  const act = (action || "").toLowerCase().trim();
  if (act && ACTION_COLORS[act]) {
    return ACTION_COLORS[act];
  }
  return "#64748b"; // default slate
}

/**
 * Collapses non-mutating intermediate nodes (variables, outputs, data sources,
 * locals, no-op resources) while preserving dependency causality via transitive
 * edge bridging between mutating nodes, and pruning empty compound containers.
 *
 * @param {object} graphData - { nodes: [], edges: [], summary: {} }
 * @returns {{
 *   nodes: Array,
 *   edges: Array,
 *   hiddenCount: number,
 *   bridgedCount: number,
 *   originalNodeCount: number,
 *   originalEdgeCount: number,
 *   mutatingCount: number
 * }}
 */
export function collapseGraph(graphData) {
  if (!graphData || !Array.isArray(graphData.nodes)) {
    return {
      nodes: [],
      edges: [],
      hiddenCount: 0,
      bridgedCount: 0,
      originalNodeCount: 0,
      originalEdgeCount: 0,
      mutatingCount: 0,
    };
  }

  const originalNodes = graphData.nodes || [];
  const originalEdges = graphData.edges || [];
  const originalNodeCount = originalNodes.length;
  const originalEdgeCount = originalEdges.length;

  const nodeMap = new Map();
  originalNodes.forEach((n) => {
    if (n?.data?.id) {
      nodeMap.set(n.data.id, n);
    }
  });

  // 1. Identify mutating nodes
  const mutatingNodes = [];
  const mutatingNodeIds = new Set();

  originalNodes.forEach((n) => {
    if (isMutatingNode(n)) {
      mutatingNodes.push(n);
      mutatingNodeIds.add(n.data.id);
    }
  });

  // 2. Compound Container Pruning:
  // A container is retained IF AND ONLY IF it has at least one visible mutating child
  // (or a descendant module with mutating children).
  const retainedContainerIds = new Set();

  mutatingNodes.forEach((m) => {
    let curr = m.data?.parent;
    const visitedParents = new Set();
    while (curr && !visitedParents.has(curr)) {
      visitedParents.add(curr);
      const parentNode = nodeMap.get(curr);
      if (!parentNode) break;
      if (CONTAINER_TYPES.has(parentNode.data?.type)) {
        retainedContainerIds.add(curr);
      }
      curr = parentNode.data?.parent;
    }
  });

  // Helper to re-link to closest retained ancestor or clear
  function getRetainedParent(origParent) {
    let curr = origParent;
    const visitedParents = new Set();
    while (curr && !visitedParents.has(curr)) {
      visitedParents.add(curr);
      if (retainedContainerIds.has(curr)) {
        return curr;
      }
      const pNode = nodeMap.get(curr);
      curr = pNode?.data?.parent;
    }
    return undefined;
  }

  const finalNodes = [];

  // Add retained compound containers
  originalNodes.forEach((n) => {
    if (retainedContainerIds.has(n.data.id)) {
      const parent = getRetainedParent(n.data.parent);
      const cloned = {
        ...n,
        data: {
          ...n.data,
        },
      };
      if (parent) {
        cloned.data.parent = parent;
      } else {
        delete cloned.data.parent;
      }
      finalNodes.push(cloned);
    }
  });

  // Add mutating nodes with re-linked parent references
  mutatingNodes.forEach((m) => {
    const parent = getRetainedParent(m.data.parent);
    const cloned = {
      ...m,
      data: {
        ...m.data,
      },
    };
    if (parent) {
      cloned.data.parent = parent;
    } else {
      delete cloned.data.parent;
    }
    finalNodes.push(cloned);
  });

  // 3. Adjacency list for outgoing edges from all nodes
  const outgoing = new Map();
  originalNodes.forEach((n) => outgoing.set(n.data.id, []));
  originalEdges.forEach((e) => {
    if (outgoing.has(e.data?.source)) {
      outgoing.get(e.data.source).push(e.data.target);
    }
  });

  // 4. Preserve direct edges between mutating nodes
  const directEdgeKeys = new Set();
  const finalEdges = [];

  originalEdges.forEach((e) => {
    if (
      e?.data?.source &&
      e?.data?.target &&
      mutatingNodeIds.has(e.data.source) &&
      mutatingNodeIds.has(e.data.target)
    ) {
      const key = `${e.data.source}->${e.data.target}`;
      if (!directEdgeKeys.has(key)) {
        directEdgeKeys.add(key);
        finalEdges.push({
          ...e,
          data: {
            ...e.data,
            isBridged: false,
          },
          classes: e.classes || "edge",
        });
      }
    }
  });

  // 5. Transitive Edge Bridging:
  // For every mutating node M1, follow outgoing edges through chains of intermediate
  // nodes to reach all target mutating nodes M2.
  const bridgedEdgesMap = new Map(); // key -> { source, target, hops }

  mutatingNodes.forEach((mNode) => {
    const m1 = mNode.data.id;
    const queue = [];
    const visited = new Set([m1]);

    const firstHops = outgoing.get(m1) || [];
    firstHops.forEach((targetId) => {
      if (mutatingNodeIds.has(targetId)) {
        // Direct edge between mutating nodes is already handled
      } else {
        visited.add(targetId);
        queue.push({ curr: targetId, hops: [targetId] });
      }
    });

    while (queue.length > 0) {
      const { curr, hops } = queue.shift();
      const nexts = outgoing.get(curr) || [];
      for (const nextId of nexts) {
        if (mutatingNodeIds.has(nextId)) {
          if (nextId !== m1) {
            const edgeKey = `${m1}->${nextId}`;
            // Prevent duplicate edges between the same pair of nodes (consolidate multiple paths)
            // and do not override existing direct edges.
            if (!directEdgeKeys.has(edgeKey) && !bridgedEdgesMap.has(edgeKey)) {
              bridgedEdgesMap.set(edgeKey, {
                source: m1,
                target: nextId,
                hops: hops,
              });
            }
          }
        } else if (!visited.has(nextId)) {
          visited.add(nextId);
          queue.push({ curr: nextId, hops: [...hops, nextId] });
        }
      }
    }
  });

  // Synthesize bridged direct edges
  bridgedEdgesMap.forEach(({ source, target, hops }, edgeKey) => {
    const sNode = nodeMap.get(source);
    const tNode = nodeMap.get(target);
    const sColor = getActionHexColor(sNode?.data?.change);
    const tColor = getActionHexColor(tNode?.data?.change);

    finalEdges.push({
      data: {
        id: edgeKey,
        source: source,
        target: target,
        gradient: `${sColor} ${tColor}`,
        isBridged: true,
        intermediateHops: hops,
        classes: "edge collapsed-edge",
      },
      classes: "edge collapsed-edge",
    });
  });

  const hiddenCount = originalNodeCount - mutatingNodes.length;
  const bridgedCount = bridgedEdgesMap.size;

  return {
    nodes: finalNodes,
    edges: finalEdges,
    hiddenCount,
    bridgedCount,
    originalNodeCount,
    originalEdgeCount,
    mutatingCount: mutatingNodes.length,
  };
}
