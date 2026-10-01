import test, { describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  isTargetableNode,
  getNodeTargetAddress,
  getUpstreamDependencies,
  generateTargetCommand,
} from "./target-command.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Targeted Apply Command Generator", () => {
  describe("isTargetableNode", () => {
    test("identifies managed resources as targetable", () => {
      assert.equal(
        isTargetableNode({
          id: "module.vpc.aws_route_table.public",
          type: "resource",
        }),
        true
      );
      assert.equal(
        isTargetableNode({
          id: "aws_security_group.allow_tls",
          type: "resource",
        }),
        true
      );
    });

    test("identifies data sources as targetable", () => {
      assert.equal(
        isTargetableNode({
          id: "data.aws_ami.ubuntu",
          type: "data",
        }),
        true
      );
      assert.equal(
        isTargetableNode({
          id: "module.compute.data.aws_ami.selected",
          type: "data",
        }),
        true
      );
    });

    test("identifies module groups as targetable", () => {
      assert.equal(
        isTargetableNode({
          id: "module.vpc",
          type: "module",
        }),
        true
      );
      assert.equal(
        isTargetableNode({
          id: "module.database.module.storage",
          type: "module",
        }),
        true
      );
    });

    test("rejects untargetable entities (variables, outputs, locals, files, root)", () => {
      assert.equal(isTargetableNode({ id: "var.region", type: "variable" }), false);
      assert.equal(isTargetableNode({ id: "output.db_endpoint", type: "output" }), false);
      assert.equal(isTargetableNode({ id: "local.cluster_name", type: "locals" }), false);
      assert.equal(isTargetableNode({ id: "variables.tf", type: "file" }), false);
      assert.equal(isTargetableNode({ id: "root", type: "basename" }), false);
      assert.equal(
        isTargetableNode({
          id: "module.compute/unknown file/local_file",
          type: "resource",
        }),
        false
      );
    });

    test("handles null and undefined gracefully", () => {
      assert.equal(isTargetableNode(null), false);
      assert.equal(isTargetableNode(undefined), false);
      assert.equal(isTargetableNode({}), false);
    });
  });

  describe("getNodeTargetAddress", () => {
    test("resolves resource addresses accurately", () => {
      assert.equal(
        getNodeTargetAddress({ id: "module.vpc.aws_route_table.public", type: "resource" }),
        "module.vpc.aws_route_table.public"
      );
      assert.equal(
        getNodeTargetAddress({ id: "aws_instance.server[0]", type: "resource" }),
        "aws_instance.server[0]"
      );
    });

    test("resolves module addresses", () => {
      assert.equal(
        getNodeTargetAddress({ id: "module.compute", type: "module" }),
        "module.compute"
      );
    });

    test("resolves intermediate container under module to parent module target", () => {
      assert.equal(
        getNodeTargetAddress({ id: "module.compute/unknown file/local_file" }),
        "module.compute"
      );
    });

    test("returns null for untargetable entities", () => {
      assert.equal(getNodeTargetAddress({ id: "var.env", type: "variable" }), null);
      assert.equal(getNodeTargetAddress({ id: "root", type: "basename" }), null);
    });
  });

  describe("generateTargetCommand", () => {
    test("generates single target apply command matching exact user requirement", () => {
      const cmd = generateTargetCommand("module.vpc.aws_route_table.public");
      assert.equal(cmd, 'terraform apply -target="module.vpc.aws_route_table.public"');
    });

    test("generates plan command when command option is 'plan'", () => {
      const cmd = generateTargetCommand("module.vpc.aws_route_table.public", {
        command: "plan",
      });
      assert.equal(cmd, 'terraform plan -target="module.vpc.aws_route_table.public"');
    });

    test("includes -auto-approve flag for apply when specified", () => {
      const cmd = generateTargetCommand("aws_s3_bucket.logs", {
        command: "apply",
        autoApprove: true,
      });
      assert.equal(cmd, 'terraform apply -auto-approve -target="aws_s3_bucket.logs"');
    });

    test("omits -auto-approve flag for plan even if autoApprove is true", () => {
      const cmd = generateTargetCommand("aws_s3_bucket.logs", {
        command: "plan",
        autoApprove: true,
      });
      assert.equal(cmd, 'terraform plan -target="aws_s3_bucket.logs"');
    });

    test("generates multi-target command with upstream dependencies on a single line", () => {
      const cmd = generateTargetCommand("module.vpc.aws_route_table.public", {
        includeUpstream: true,
        upstreamAddresses: ["module.vpc.aws_vpc.main", "module.vpc.aws_subnet.public[0]"],
      });
      assert.equal(
        cmd,
        'terraform apply -target="module.vpc.aws_vpc.main" -target="module.vpc.aws_subnet.public[0]" -target="module.vpc.aws_route_table.public"'
      );
    });

    test("generates multi-line formatted command with line continuation backslashes", () => {
      const cmd = generateTargetCommand("module.vpc.aws_route_table.public", {
        format: "multi-line",
        includeUpstream: true,
        upstreamAddresses: ["module.vpc.aws_vpc.main"],
      });
      const expected = [
        "terraform apply",
        '  -target="module.vpc.aws_vpc.main"',
        '  -target="module.vpc.aws_route_table.public"',
      ].join(" \\\n");
      assert.equal(cmd, expected);
    });

    test("multi-line formatted command with -auto-approve", () => {
      const cmd = generateTargetCommand("module.compute.aws_instance.app", {
        format: "multi-line",
        autoApprove: true,
      });
      const expected = [
        "terraform apply",
        "  -auto-approve",
        '  -target="module.compute.aws_instance.app"',
      ].join(" \\\n");
      assert.equal(cmd, expected);
    });

    test("handles empty target address safely", () => {
      assert.equal(generateTargetCommand(""), "");
      assert.equal(generateTargetCommand(null), "");
    });
  });

  describe("getUpstreamDependencies", () => {
    test("traverses upstream dependencies in topological order and filters non-targetable nodes", () => {
      // Mock graph:
      // resA -> resB -> resC (A depends on B, B depends on C)
      // resA -> var.region (var.region should be filtered out)
      const mockGraph = {
        nodes: [
          { data: { id: "resA", type: "resource", label: "resA", change: "update" } },
          { data: { id: "resB", type: "resource", label: "resB", change: "create" } },
          { data: { id: "resC", type: "resource", label: "resC", change: "create" } },
          { data: { id: "var.region", type: "variable", label: "var.region" } },
        ],
        edges: [
          { data: { source: "resA", target: "resB" } },
          { data: { source: "resB", target: "resC" } },
          { data: { source: "resA", target: "var.region" } },
        ],
      };

      const upstream = getUpstreamDependencies("resA", mockGraph);
      assert.equal(upstream.length, 2);
      // Prerequisite resC should be executed before resB
      assert.equal(upstream[0].id, "resC");
      assert.equal(upstream[1].id, "resB");
    });

    test("guards against cyclical dependencies without hanging", () => {
      // Mock cyclic graph:
      // node1 -> node2 -> node3 -> node1
      const cyclicGraph = {
        nodes: [
          { data: { id: "node1", type: "resource" } },
          { data: { id: "node2", type: "resource" } },
          { data: { id: "node3", type: "resource" } },
        ],
        edges: [
          { data: { source: "node1", target: "node2" } },
          { data: { source: "node2", target: "node3" } },
          { data: { source: "node3", target: "node1" } },
        ],
      };

      const upstream = getUpstreamDependencies("node1", cyclicGraph);
      assert.ok(Array.isArray(upstream));
      assert.equal(upstream.length, 2);
      assert.ok(upstream.some((u) => u.id === "node2"));
      assert.ok(upstream.some((u) => u.id === "node3"));
    });

    test("resolves upstream dependencies from real plan fixture", () => {
      const fixturePath = path.resolve(__dirname, "../../testdata/tf_plan_graph.json");
      if (!fs.existsSync(fixturePath)) return;

      const raw = fs.readFileSync(fixturePath, "utf-8");
      const graph = JSON.parse(raw);

      // Find a resource node that has dependencies
      const resourceNodes = graph.nodes.filter(
        (n) => n.data?.type === "resource" && n.data?.id && !n.data.id.includes("/")
      );
      assert.ok(resourceNodes.length > 0);

      // Check module.compute.local_file.ssh_private_key
      const targetId = "module.compute.local_file.ssh_private_key";
      const upstream = getUpstreamDependencies(targetId, graph);
      assert.ok(Array.isArray(upstream));
    });
  });
});

