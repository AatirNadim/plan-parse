import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collapseGraph, isMutatingNode, isContainerNode } from "./graph-collapse.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../");

describe("collapseGraph unit tests", () => {
  // Test case a: Direct mutating edges (M1 -> M2) are preserved with isBridged: false
  it("a) preserves direct mutating edges with isBridged: false", () => {
    const graphData = {
      nodes: [
        {
          data: { id: "m1", label: "res_a", change: "create", type: "resource" },
          classes: "create",
        },
        {
          data: { id: "m2", label: "res_b", change: "update", type: "resource" },
          classes: "update",
        },
      ],
      edges: [
        {
          data: { id: "m1->m2", source: "m1", target: "m2" },
          classes: "edge",
        },
      ],
    };

    const result = collapseGraph(graphData);

    assert.equal(result.mutatingCount, 2);
    assert.equal(result.hiddenCount, 0);
    assert.equal(result.bridgedCount, 0);
    assert.equal(result.nodes.length, 2);
    assert.equal(result.edges.length, 1);

    const edge = result.edges[0];
    assert.equal(edge.data.source, "m1");
    assert.equal(edge.data.target, "m2");
    assert.equal(edge.data.isBridged, false);
    assert.equal(edge.classes, "edge");
  });

  // Test case b: Multi-hop intermediate chains (M1 -> I1 -> I2 -> M2) synthesize bridged edge
  it("b) multi-hop intermediate chains synthesize bridged edge with correct hops and gradient colors", () => {
    const graphData = {
      nodes: [
        {
          data: { id: "m1", label: "app_server", change: "create", type: "resource" },
          classes: "create",
        },
        {
          data: { id: "i1", label: "var.env", change: "no-op", type: "variable" },
          classes: "variable",
        },
        {
          data: { id: "i2", label: "local.config", change: "noop", type: "local" },
          classes: "locals",
        },
        {
          data: { id: "m2", label: "db_cluster", change: "delete", type: "resource" },
          classes: "delete",
        },
      ],
      edges: [
        { data: { id: "e1", source: "m1", target: "i1" } },
        { data: { id: "e2", source: "i1", target: "i2" } },
        { data: { id: "e3", source: "i2", target: "m2" } },
      ],
    };

    const result = collapseGraph(graphData);

    // Only m1 and m2 should remain visible
    assert.equal(result.mutatingCount, 2);
    assert.equal(result.hiddenCount, 2); // i1, i2
    assert.equal(result.bridgedCount, 1);
    assert.equal(result.nodes.length, 2);
    assert.deepEqual(
      result.nodes.map((n) => n.data.id).sort(),
      ["m1", "m2"].sort()
    );

    // Should synthesize a bridged edge from m1 to m2
    assert.equal(result.edges.length, 1);
    const bridgedEdge = result.edges[0];
    assert.equal(bridgedEdge.data.source, "m1");
    assert.equal(bridgedEdge.data.target, "m2");
    assert.equal(bridgedEdge.data.isBridged, true);
    assert.deepEqual(bridgedEdge.data.intermediateHops, ["i1", "i2"]);
    // Gradient from create (#10b981) to delete (#f43f5e)
    assert.equal(bridgedEdge.data.gradient, "#10b981 #f43f5e");
    assert.ok(bridgedEdge.classes.includes("collapsed-edge"));
  });

  // Test case c: Intermediate cycles (M1 -> I1 -> I2 -> I1 -> M2) do not cause infinite loops
  it("c) intermediate cycles do not cause infinite loops and still synthesize bridged edges", () => {
    const graphData = {
      nodes: [
        {
          data: { id: "m1", label: "service_a", change: "create", type: "resource" },
          classes: "create",
        },
        {
          data: { id: "i1", label: "cycle_node_1", change: "no-op", type: "variable" },
          classes: "variable",
        },
        {
          data: { id: "i2", label: "cycle_node_2", change: "no-op", type: "variable" },
          classes: "variable",
        },
        {
          data: { id: "m2", label: "service_b", change: "update", type: "resource" },
          classes: "update",
        },
      ],
      edges: [
        { data: { id: "e1", source: "m1", target: "i1" } },
        { data: { id: "e2", source: "i1", target: "i2" } },
        { data: { id: "e3", source: "i2", target: "i1" } }, // cycle i2 -> i1
        { data: { id: "e4", source: "i2", target: "i2" } }, // self-loop i2 -> i2
        { data: { id: "e5", source: "i2", target: "m2" } },
      ],
    };

    const startTime = Date.now();
    const result = collapseGraph(graphData);
    const elapsedMs = Date.now() - startTime;

    // Must complete fast (< 500ms) without infinite loops
    assert.ok(elapsedMs < 500, `Expected fast termination, took ${elapsedMs}ms`);
    assert.equal(result.mutatingCount, 2);
    assert.equal(result.bridgedCount, 1);
    assert.equal(result.edges.length, 1);
    assert.equal(result.edges[0].data.source, "m1");
    assert.equal(result.edges[0].data.target, "m2");
    assert.equal(result.edges[0].data.isBridged, true);
  });

  // Test case d: Empty container pruning (containers with zero mutating descendants are pruned)
  it("d) prunes empty containers that have zero mutating descendants", () => {
    const graphData = {
      nodes: [
        // Root container
        { data: { id: "root", label: "root", type: "basename" } },
        // Container 1: only has non-mutating intermediate children
        { data: { id: "mod_empty", label: "empty_module", type: "module", parent: "root" } },
        { data: { id: "var_noop", label: "var.a", change: "no-op", type: "variable", parent: "mod_empty" } },
        { data: { id: "out_noop", label: "output.b", change: "no-op", type: "output", parent: "mod_empty" } },
        // Container 2: has a mutating child
        { data: { id: "mod_active", label: "active_module", type: "module", parent: "root" } },
        { data: { id: "m_active", label: "res_c", change: "create", type: "resource", parent: "mod_active" } },
      ],
      edges: [],
    };

    const result = collapseGraph(graphData);

    const retainedIds = new Set(result.nodes.map((n) => n.data.id));

    // mod_empty should be pruned
    assert.equal(retainedIds.has("mod_empty"), false);
    assert.equal(retainedIds.has("var_noop"), false);
    assert.equal(retainedIds.has("out_noop"), false);

    // root, mod_active, and m_active should be retained
    assert.equal(retainedIds.has("root"), true);
    assert.equal(retainedIds.has("mod_active"), true);
    assert.equal(retainedIds.has("m_active"), true);
  });

  // Test case e: Container retention and re-parenting
  it("e) retains active containers and properly re-parents descendants if an intermediate container is pruned", () => {
    const graphData = {
      nodes: [
        // Retained grand-parent container
        { data: { id: "root", label: "root", type: "basename" } },
        // Non-container intermediate parent or un-retained intermediate
        { data: { id: "unretained_node", label: "plain_group", type: "unrecognized", parent: "root" } },
        // Child container containing mutating resource
        { data: { id: "child_mod", label: "child_module", type: "module", parent: "unretained_node" } },
        { data: { id: "m1", label: "instance", change: "replace", type: "resource", parent: "child_mod" } },
      ],
      edges: [],
    };

    const result = collapseGraph(graphData);

    const childMod = result.nodes.find((n) => n.data.id === "child_mod");
    assert.ok(childMod, "child_mod must be retained");
    // child_mod's parent was unretained_node (which is not a retained container),
    // so it should be re-parented to root
    assert.equal(childMod.data.parent, "root");

    const m1 = result.nodes.find((n) => n.data.id === "m1");
    assert.ok(m1, "m1 must be retained");
    assert.equal(m1.data.parent, "child_mod");

    // All referenced parents in result.nodes must exist in result.nodes
    const nodeIds = new Set(result.nodes.map((n) => n.data.id));
    result.nodes.forEach((n) => {
      if (n.data.parent) {
        assert.ok(
          nodeIds.has(n.data.parent),
          `Node ${n.data.id} has parent ${n.data.parent} which is not in retained nodes`
        );
      }
    });
  });

  // Test case f: Deduplication of bridged edges when multiple paths exist between M1 and M2
  it("f) deduplicates bridged edges when multiple paths exist between M1 and M2", () => {
    const graphData = {
      nodes: [
        { data: { id: "m1", label: "producer", change: "create", type: "resource" } },
        { data: { id: "i1", label: "intermediate_1", change: "no-op", type: "variable" } },
        { data: { id: "i2", label: "intermediate_2", change: "no-op", type: "output" } },
        { data: { id: "i3", label: "intermediate_3", change: "no-op", type: "local" } },
        { data: { id: "m2", label: "consumer", change: "update", type: "resource" } },
      ],
      edges: [
        // Path 1: m1 -> i1 -> m2
        { data: { id: "p1_1", source: "m1", target: "i1" } },
        { data: { id: "p1_2", source: "i1", target: "m2" } },
        // Path 2: m1 -> i2 -> m2
        { data: { id: "p2_1", source: "m1", target: "i2" } },
        { data: { id: "p2_2", source: "i2", target: "m2" } },
        // Path 3: m1 -> i3 -> m2
        { data: { id: "p3_1", source: "m1", target: "i3" } },
        { data: { id: "p3_2", source: "i3", target: "m2" } },
      ],
    };

    const result = collapseGraph(graphData);

    // Exactly one bridged edge between m1 and m2 should exist
    assert.equal(result.bridgedCount, 1);
    assert.equal(result.edges.length, 1);
    assert.equal(result.edges[0].data.source, "m1");
    assert.equal(result.edges[0].data.target, "m2");
    assert.equal(result.edges[0].data.isBridged, true);
  });

  it("f.2) does not create duplicate bridged edge if a direct edge already exists", () => {
    const graphData = {
      nodes: [
        { data: { id: "m1", label: "producer", change: "create", type: "resource" } },
        { data: { id: "i1", label: "intermediate_1", change: "no-op", type: "variable" } },
        { data: { id: "m2", label: "consumer", change: "update", type: "resource" } },
      ],
      edges: [
        // Direct edge
        { data: { id: "direct_m1_m2", source: "m1", target: "m2" } },
        // Indirect path: m1 -> i1 -> m2
        { data: { id: "e1", source: "m1", target: "i1" } },
        { data: { id: "e2", source: "i1", target: "m2" } },
      ],
    };

    const result = collapseGraph(graphData);

    // Direct edge is preserved, bridged edge is NOT added
    assert.equal(result.bridgedCount, 0);
    assert.equal(result.edges.length, 1);
    assert.equal(result.edges[0].data.isBridged, false);
    assert.equal(result.edges[0].data.source, "m1");
    assert.equal(result.edges[0].data.target, "m2");
  });

  // Parent cycle guard test
  it("guards against circular parent hierarchies without hanging", () => {
    const graphData = {
      nodes: [
        { data: { id: "mod_a", label: "mod_a", type: "module", parent: "mod_b" } },
        { data: { id: "mod_b", label: "mod_b", type: "module", parent: "mod_a" } },
        { data: { id: "m1", label: "resource", change: "create", type: "resource", parent: "mod_a" } },
      ],
      edges: [],
    };

    const startTime = Date.now();
    const result = collapseGraph(graphData);
    const elapsedMs = Date.now() - startTime;

    assert.ok(elapsedMs < 500, `Expected fast termination, took ${elapsedMs}ms`);
    assert.equal(result.mutatingCount, 1);
    assert.ok(result.nodes.length >= 1);
  });

  // Test case g: Real plan fixture test with testdata/tf_plan.json
  it("g) real plan fixture test with testdata/tf_plan.json", () => {
    const planRawPath = path.join(repoRoot, "testdata/tf_plan.json");
    const planGraphPath = path.join(repoRoot, "testdata/tf_plan_graph.json");

    assert.ok(fs.existsSync(planRawPath), "testdata/tf_plan.json fixture must exist");

    // Test passing raw tf_plan.json to collapseGraph safely handles missing nodes
    const rawPlan = JSON.parse(fs.readFileSync(planRawPath, "utf8"));
    const rawResult = collapseGraph(rawPlan);
    assert.equal(rawResult.originalNodeCount, 0);
    assert.equal(rawResult.nodes.length, 0);
    assert.equal(rawResult.edges.length, 0);

    // Test collapseGraph on the parsed graph of tf_plan.json
    assert.ok(
      fs.existsSync(planGraphPath),
      "testdata/tf_plan_graph.json must exist (generated from tf_plan.json)"
    );
    const graphData = JSON.parse(fs.readFileSync(planGraphPath, "utf8"));

    const result = collapseGraph(graphData);

    // Verify key counts from the real 66-resource plan
    assert.equal(result.originalNodeCount, 217);
    assert.equal(result.mutatingCount, 66);
    assert.equal(result.hiddenCount, 151);
    assert.ok(result.bridgedCount > 0, "Real plan fixture must produce bridged edges");
    assert.equal(result.bridgedCount, 7);

    // Verify no dangling edges: every edge source and target must exist in result.nodes
    const finalNodeIds = new Set(result.nodes.map((n) => n.data.id));
    for (const edge of result.edges) {
      assert.ok(
        finalNodeIds.has(edge.data.source),
        `Edge source ${edge.data.source} must exist in collapsed nodes`
      );
      assert.ok(
        finalNodeIds.has(edge.data.target),
        `Edge target ${edge.data.target} must exist in collapsed nodes`
      );
    }

    // Verify all retained parents exist in result.nodes
    for (const node of result.nodes) {
      if (node.data.parent) {
        assert.ok(
          finalNodeIds.has(node.data.parent),
          `Node ${node.data.id} has parent ${node.data.parent} which must exist in collapsed nodes`
        );
      }
    }

    // Verify mutating nodes are all retained
    const mutatingInCollapsed = result.nodes.filter((n) => isMutatingNode(n));
    assert.equal(mutatingInCollapsed.length, 66);

    // Verify that every bridged edge has intermediateHops array and valid gradient
    const bridgedEdges = result.edges.filter((e) => e.data.isBridged);
    assert.equal(bridgedEdges.length, 7);
    for (const be of bridgedEdges) {
      assert.ok(Array.isArray(be.data.intermediateHops), "intermediateHops must be an array");
      assert.ok(be.data.intermediateHops.length > 0, "intermediateHops must have at least 1 hop");
      assert.ok(typeof be.data.gradient === "string" && be.data.gradient.includes("#"), "gradient must be hex colors");
    }
  });

  // Robustness tests
  it("handles null, undefined, and empty objects gracefully", () => {
    assert.deepEqual(collapseGraph(null).nodes, []);
    assert.deepEqual(collapseGraph(undefined).nodes, []);
    assert.deepEqual(collapseGraph({}).nodes, []);
    assert.deepEqual(collapseGraph({ nodes: [] }).edges, []);
  });
});
