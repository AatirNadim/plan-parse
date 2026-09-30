import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatHclValue,
  computeAttributeDiff,
  getDiffSummary,
  generateHclDiff,
} from "./hcl-diff.js";

describe("HCL Diff Engine", () => {
  describe("formatHclValue", () => {
    it("formats primitives accurately", () => {
      assert.equal(formatHclValue(null), "null");
      assert.equal(formatHclValue(undefined), "null");
      assert.equal(formatHclValue(true), "true");
      assert.equal(formatHclValue(false), "false");
      assert.equal(formatHclValue(42), "42");
      assert.equal(formatHclValue("t3.large"), '"t3.large"');
    });

    it("formats arrays and objects cleanly", () => {
      assert.equal(formatHclValue([]), "[]");
      assert.equal(formatHclValue({}), "{}");

      const objStr = formatHclValue({ env: "prod", count: 2 });
      assert.ok(objStr.includes('"prod"'));
      assert.ok(objStr.includes("2"));
    });
  });

  describe("computeAttributeDiff", () => {
    it("handles creations (before is null, after has values)", () => {
      const change = {
        actions: ["create"],
        before: null,
        after: {
          ami: "ami-12345",
          instance_type: "t3.micro",
        },
      };

      const diff = computeAttributeDiff(change);
      assert.equal(diff.length, 2);
      assert.equal(diff[0].isAdded, true);
      assert.equal(diff[1].isAdded, true);
      assert.equal(diff[0].isRemoved, false);
      assert.equal(diff[0].isModified, false);
    });

    it("handles deletions (after is null, before has values)", () => {
      const change = {
        actions: ["delete"],
        before: {
          bucket: "legacy-bucket",
        },
        after: null,
      };

      const diff = computeAttributeDiff(change);
      assert.equal(diff.length, 1);
      assert.equal(diff[0].isRemoved, true);
      assert.equal(diff[0].isAdded, false);
      assert.equal(diff[0].before, "legacy-bucket");
    });

    it("handles updates and detected modifications vs unchanged attributes", () => {
      const change = {
        actions: ["update"],
        before: {
          instance_type: "t2.micro",
          region: "us-east-1",
        },
        after: {
          instance_type: "t3.large",
          region: "us-east-1",
        },
      };

      const diff = computeAttributeDiff(change);
      assert.equal(diff.length, 2);

      const inst = diff.find((d) => d.key === "instance_type");
      assert.ok(inst);
      assert.equal(inst.isModified, true);
      assert.equal(inst.isSame, false);

      const reg = diff.find((d) => d.key === "region");
      assert.ok(reg);
      assert.equal(reg.isModified, false);
      assert.equal(reg.isSame, true);
    });

    it("handles sensitive and unknown attributes correctly", () => {
      const change = {
        actions: ["create"],
        before: null,
        after: {
          password: "supersecret",
          public_ip: null,
        },
        after_unknown: {
          public_ip: true,
        },
        after_sensitive: {
          password: true,
        },
      };

      const diff = computeAttributeDiff(change);
      const pass = diff.find((d) => d.key === "password");
      const ip = diff.find((d) => d.key === "public_ip");

      assert.equal(pass.isSensitive, true);
      assert.equal(ip.isUnknown, true);
    });

    it("detects replacement attributes via replace_paths", () => {
      const change = {
        actions: ["create", "delete"],
        before: {
          name: "app-server",
          tags: { env: "prod" },
        },
        after: {
          name: "app-server-v2",
          tags: { env: "prod" },
        },
        replace_paths: [["name"]],
      };

      const diff = computeAttributeDiff(change);
      const nameDiff = diff.find((d) => d.key === "name");
      assert.equal(nameDiff.isModified, true);
      assert.equal(nameDiff.forcesReplacement, true);
    });
  });

  describe("getDiffSummary", () => {
    it("returns accurate counts and top changes preview", () => {
      const node = {
        id: "aws_instance.app",
        change: "update",
        changeDetails: {
          actions: ["update"],
          before: {
            ami: "ami-1111",
            instance_type: "t2.micro",
            tags: {},
          },
          after: {
            ami: "ami-2222",
            instance_type: "t3.large",
            tags: { env: "stage" },
          },
          replace_paths: [["ami"]],
        },
      };

      const summary = getDiffSummary(node);
      assert.equal(summary.action, "update");
      assert.equal(summary.modifiedCount, 3);
      assert.equal(summary.forcesReplacement, true);
      assert.ok(summary.topChanges.length <= 3);

      assert.equal(summary.topChanges[0].key, "ami");
      assert.equal(summary.topChanges[0].forcesReplacement, true);
    });
  });

  describe("generateHclDiff", () => {
    it("generates authentic HCL diff lines for updates", () => {
      const node = {
        id: "aws_security_group.web",
        resourceType: "aws_security_group",
        resourceName: "web",
        change: "update",
        changeDetails: {
          actions: ["update"],
          before: {
            description: "Old description",
          },
          after: {
            description: "New description",
          },
        },
      };

      const result = generateHclDiff(node);
      assert.ok(Array.isArray(result.lines));
      assert.ok(result.rawHcl.includes('resource "aws_security_group" "web" {'));
      assert.ok(result.rawHcl.includes("will be updated in-place"));

      const modLine = result.lines.find((l) => l.type === "modify");
      assert.ok(modLine);
      assert.ok(modLine.text.includes('"Old description" -> "New description"'));
    });

    it("generates clean additions for creates", () => {
      const node = {
        id: "aws_s3_bucket.data",
        resourceType: "aws_s3_bucket",
        resourceName: "data",
        change: "create",
        changeDetails: {
          actions: ["create"],
          before: null,
          after: {
            bucket: "my-new-bucket",
          },
        },
      };

      const result = generateHclDiff(node);
      assert.ok(result.rawHcl.includes("+ resource"));
      assert.ok(result.rawHcl.includes("will be created"));
      const addLine = result.lines.find((l) => l.type === "add");
      assert.ok(addLine);
      assert.ok(addLine.text.includes('"my-new-bucket"'));
    });

    it("handles nodes without changeDetails gracefully", () => {
      const node = {
        id: "var.env",
        change: "no-op",
      };

      const result = generateHclDiff(node);
      assert.ok(result.rawHcl.includes("no planned changes"));
    });
  });
});
