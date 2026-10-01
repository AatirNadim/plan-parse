import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeBlastRadius,
  computeUpstreamLineage,
  extractBlastSubgraph,
  isMutatingNode,
} from "./blast-radius.js";

describe("Blast Radius Engine", () => {
  // Test DAG fixture:
  // vpc (target)
  //   <- subnet_a (depends on vpc) [direct / hop 1]
  //   <- subnet_b (depends on vpc) [direct / hop 1]
  // subnet_a
  //   <- db_instance (depends on subnet_a) [transitive / hop 2] (action: replace)
  // db_instance
  //   <- app_server (depends on db_instance) [transitive / hop 3] (action: update)
  //   <- worker (depends on db_instance) [transitive / hop 3] (action: no-op)
  // worker
  //   <- cron (depends on worker) [transitive / hop 4] (action: delete)
  const sampleGraph = {
    nodes: [
      { data: { id: "aws_vpc.main", label: "aws_vpc.main", change: "no-op" } },
      { data: { id: "aws_subnet.a", label: "aws_subnet.a", change: "no-op" } },
      { data: { id: "aws_subnet.b", label: "aws_subnet.b", change: "update" } },
      {
        data: {
          id: "aws_db_instance.db",
          label: "aws_db_instance.db",
          change: "replace",
        },
      },
      {
        data: {
          id: "aws_instance.app",
          label: "aws_instance.app",
          change: "update",
        },
      },
      {
        data: {
          id: "aws_instance.worker",
          label: "aws_instance.worker",
          change: "no-op",
        },
      },
      {
        data: {
          id: "aws_cloudwatch.cron",
          label: "aws_cloudwatch.cron",
          change: "delete",
        },
      },
      {
        data: {
          id: "unrelated_s3.bucket",
          label: "unrelated_s3.bucket",
          change: "create",
        },
      },
    ],
    edges: [
      { data: { id: "e1", source: "aws_subnet.a", target: "aws_vpc.main" } },
      { data: { id: "e2", source: "aws_subnet.b", target: "aws_vpc.main" } },
      {
        data: {
          id: "e3",
          source: "aws_db_instance.db",
          target: "aws_subnet.a",
        },
      },
      {
        data: {
          id: "e4",
          source: "aws_instance.app",
          target: "aws_db_instance.db",
        },
      },
      {
        data: {
          id: "e5",
          source: "aws_instance.worker",
          target: "aws_db_instance.db",
        },
      },
      {
        data: {
          id: "e6",
          source: "aws_cloudwatch.cron",
          target: "aws_instance.worker",
        },
      },
    ],
  };

  it("identifies mutating nodes accurately", () => {
    assert.equal(isMutatingNode({ change: "replace" }), true);
    assert.equal(isMutatingNode({ change: "delete" }), true);
    assert.equal(isMutatingNode({ change: "update" }), true);
    assert.equal(isMutatingNode({ change: "create" }), true);
    assert.equal(isMutatingNode({ change: "no-op" }), false);
    assert.equal(isMutatingNode(null), false);
  });

  describe("computeBlastRadius", () => {
    it("computes direct (1-hop) and multi-hop (transitive) downstream casualties", () => {
      const result = computeBlastRadius("aws_vpc.main", sampleGraph);

      assert.equal(result.rootId, "aws_vpc.main");
      // Direct (hop 1): subnet.a, subnet.b
      assert.equal(result.stats.directCount, 2);
      const directIds = result.direct.map((n) => n.id).sort();
      assert.deepEqual(directIds, ["aws_subnet.a", "aws_subnet.b"]);

      // Transitive (hop 2+): db (hop 2), app (hop 3), worker (hop 3), cron (hop 4)
      assert.equal(result.stats.transitiveCount, 4);
      const transitiveIds = result.transitive.map((n) => n.id).sort();
      assert.deepEqual(transitiveIds, [
        "aws_cloudwatch.cron",
        "aws_db_instance.db",
        "aws_instance.app",
        "aws_instance.worker",
      ]);

      assert.equal(result.stats.totalCount, 6);
      assert.equal(result.maxDepth, 4);

      // Verify depth stratification
      assert.equal(result.byDepth[1].length, 2);
      assert.equal(result.byDepth[2].length, 1);
      assert.equal(result.byDepth[2][0].id, "aws_db_instance.db");
      assert.equal(result.byDepth[3].length, 2);
      assert.equal(result.byDepth[4].length, 1);
      assert.equal(result.byDepth[4][0].id, "aws_cloudwatch.cron");
    });

    it("accurately categorizes mutating vs non-mutating casualties", () => {
      const result = computeBlastRadius("aws_vpc.main", sampleGraph);

      // Mutating: subnet.b (update), db (replace), app (update), cron (delete) = 4
      assert.equal(result.stats.mutatingCount, 4);
      assert.equal(result.stats.replaceCount, 1);
      assert.equal(result.stats.deleteCount, 1);
      assert.equal(result.stats.updateCount, 2);
      assert.equal(result.stats.noopCount, 2); // subnet.a, worker

      const mutatingIds = result.mutatingNodes.map((n) => n.id).sort();
      assert.deepEqual(mutatingIds, [
        "aws_cloudwatch.cron",
        "aws_db_instance.db",
        "aws_instance.app",
        "aws_subnet.b",
      ]);
    });

    it("respects maxDepth constraint", () => {
      // Depth = 1 should only return direct dependents
      const directOnly = computeBlastRadius("aws_vpc.main", sampleGraph, {
        maxDepth: 1,
      });
      assert.equal(directOnly.stats.directCount, 2);
      assert.equal(directOnly.stats.transitiveCount, 0);
      assert.equal(directOnly.stats.totalCount, 2);
      assert.equal(directOnly.maxDepth, 1);

      // Depth = 2 should return direct + db_instance
      const depthTwo = computeBlastRadius("aws_vpc.main", sampleGraph, {
        maxDepth: 2,
      });
      assert.equal(depthTwo.stats.directCount, 2);
      assert.equal(depthTwo.stats.transitiveCount, 1);
      assert.equal(depthTwo.stats.totalCount, 3);
      assert.equal(depthTwo.maxDepth, 2);
    });

    it("supports mutatingOnly filter", () => {
      const result = computeBlastRadius("aws_vpc.main", sampleGraph, {
        mutatingOnly: true,
      });
      assert.equal(result.stats.totalCount, 4);
      assert.ok(result.all.every((n) => n.change !== "no-op"));
    });

    it("guards against cyclical references without infinite loop", () => {
      const cyclicGraph = {
        nodes: [
          { data: { id: "node_a", change: "update" } },
          { data: { id: "node_b", change: "update" } },
          { data: { id: "node_c", change: "update" } },
        ],
        edges: [
          { data: { id: "e1", source: "node_b", target: "node_a" } },
          { data: { id: "e2", source: "node_c", target: "node_b" } },
          { data: { id: "e3", source: "node_a", target: "node_c" } }, // cycle back
        ],
      };

      const result = computeBlastRadius("node_a", cyclicGraph);
      assert.equal(result.stats.totalCount, 2);
      assert.ok(result.nodeIds.has("node_b"));
      assert.ok(result.nodeIds.has("node_c"));
    });

    it("returns zero counts for leaf node with no downstream dependents", () => {
      const result = computeBlastRadius("aws_cloudwatch.cron", sampleGraph);
      assert.equal(result.stats.totalCount, 0);
      assert.equal(result.stats.directCount, 0);
      assert.equal(result.stats.transitiveCount, 0);
      assert.equal(result.direct.length, 0);
    });
  });

  describe("computeUpstreamLineage", () => {
    it("traces prerequisite dependency path upstream", () => {
      const result = computeUpstreamLineage("aws_cloudwatch.cron", sampleGraph);
      assert.equal(result.rootId, "aws_cloudwatch.cron");

      // Immediate prerequisite: worker (hop 1)
      assert.equal(result.stats.directCount, 1);
      assert.equal(result.direct[0].id, "aws_instance.worker");

      // Transitive prerequisites: db (hop 2), subnet.a (hop 3), vpc (hop 4)
      assert.equal(result.stats.transitiveCount, 3);
      const upstreamIds = result.all.map((n) => n.id);
      assert.ok(upstreamIds.includes("aws_instance.worker"));
      assert.ok(upstreamIds.includes("aws_db_instance.db"));
      assert.ok(upstreamIds.includes("aws_subnet.a"));
      assert.ok(upstreamIds.includes("aws_vpc.main"));
    });
  });

  describe("extractBlastSubgraph", () => {
    it("extracts clean isolated subgraph matching blast tree", () => {
      const blast = computeBlastRadius("aws_db_instance.db", sampleGraph);
      const subgraph = extractBlastSubgraph(sampleGraph, blast, {
        includeContainers: false,
      });

      // Root (db), app, worker, cron = 4 nodes
      assert.equal(subgraph.nodes.length, 4);
      const ids = subgraph.nodes.map((n) => n.data.id).sort();
      assert.deepEqual(ids, [
        "aws_cloudwatch.cron",
        "aws_db_instance.db",
        "aws_instance.app",
        "aws_instance.worker",
      ]);

      // e4 (app -> db), e5 (worker -> db), e6 (cron -> worker)
      assert.equal(subgraph.edges.length, 3);
    });
  });
});
