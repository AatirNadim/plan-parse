import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uiRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(uiRoot, "..");

describe("Source Filepath & AST Provenance Specifications", () => {
  describe("Component Existence & Implementation Contracts", () => {
    test("FileProvenanceBadge.js component exists and defines interactive provenance badge", () => {
      const filePath = path.join(uiRoot, "components", "FileProvenanceBadge.js");
      assert.ok(fs.existsSync(filePath), "FileProvenanceBadge.js must exist");
      const content = fs.readFileSync(filePath, "utf-8");

      assert.ok(content.includes("export default function FileProvenanceBadge"), "Must export default component");
      assert.ok(content.includes("unknown file"), "Must handle unknown file condition");
      assert.ok(content.includes("Terraform plan JSON files do not store source code filepaths"), "Must explain plan JSON limitation");
      assert.ok(content.includes("Source AST Resolved"), "Must document AST resolved mode");
      assert.ok(content.includes("Standalone Ingestion"), "Must document standalone ingestion mode");
    });

    test("NodeDiffModal.js integrates FileProvenanceBadge", () => {
      const modalPath = path.join(uiRoot, "components", "NodeDiffModal.js");
      const content = fs.readFileSync(modalPath, "utf-8");

      assert.ok(content.includes('import FileProvenanceBadge from "./FileProvenanceBadge"'), "Must import FileProvenanceBadge");
      assert.ok(content.includes("<FileProvenanceBadge file={node.file} line={node.line} />"), "Must render FileProvenanceBadge with file and line");
    });

    test("NodeInspector.js integrates FileProvenanceBadge in header", () => {
      const inspectorPath = path.join(uiRoot, "components", "NodeInspector.js");
      const content = fs.readFileSync(inspectorPath, "utf-8");

      assert.ok(content.includes('import FileProvenanceBadge from "./FileProvenanceBadge"'), "Must import FileProvenanceBadge");
      assert.ok(content.includes("<FileProvenanceBadge file={node.file} line={node.line}"), "Must render FileProvenanceBadge");
    });

    test("WorkbenchSidebar.js documents AST resolution and unknown file fallback", () => {
      const sidebarPath = path.join(uiRoot, "components", "WorkbenchSidebar.js");
      const content = fs.readFileSync(sidebarPath, "utf-8");

      assert.ok(content.includes("Source Filepath") && content.includes("AST Discovery"), "Must include dedicated AST discovery card");
      assert.ok(content.includes(".terraform/modules/modules.json"), "Must explain modules.json mapping");
      assert.ok(content.includes("CLI Workspace Mode"), "Must explain workspace mode");
      assert.ok(content.includes("Standalone Web Upload"), "Must explain standalone mode and unknown file container");
    });
  });

  describe("Landing Page Feature Documentation Contracts", () => {
    test("features-data.js documents AST recovery in resource-diff and workbench-sidebar", () => {
      const featuresPath = path.join(repoRoot, "landing", "lib", "features-data.js");
      assert.ok(fs.existsSync(featuresPath), "features-data.js must exist");
      const content = fs.readFileSync(featuresPath, "utf-8");

      assert.ok(content.includes("AST Source Filepath Recovery"), "resource-diff must have AST callout");
      assert.ok(content.includes("Source Filepath & AST Provenance"), "workbench-sidebar must have AST callout");
      assert.ok(content.includes("Progressive Disclosure & AST Recovery Engine"), "resource-diff theAlgorithm must mention AST recovery");
      assert.ok(content.includes("Zero-Transmission Client-Side Ingestion & Dual Modes"), "workbench-sidebar theAlgorithm must mention dual modes");
    });

    test("SVGs include Pin 5 callout pins for AST provenance", () => {
      const diffSvgPath = path.join(repoRoot, "landing", "public", "images", "features", "resource-diff.svg");
      const sidebarSvgPath = path.join(repoRoot, "landing", "public", "images", "features", "workbench-sidebar.svg");

      assert.ok(fs.existsSync(diffSvgPath), "resource-diff.svg must exist");
      assert.ok(fs.existsSync(sidebarSvgPath), "workbench-sidebar.svg must exist");

      const diffSvg = fs.readFileSync(diffSvgPath, "utf-8");
      const sidebarSvg = fs.readFileSync(sidebarSvgPath, "utf-8");

      assert.ok(diffSvg.includes(">5</text>"), "resource-diff.svg must have Pin 5 text");
      assert.ok(sidebarSvg.includes(">5</text>"), "workbench-sidebar.svg must have Pin 5 text");
    });
  });
});
