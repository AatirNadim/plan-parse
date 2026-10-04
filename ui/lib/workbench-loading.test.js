import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uiRoot = path.resolve(__dirname, "..");

describe("Workbench Loading & Layout Orchestration Specifications", () => {
  const pagePath = path.join(uiRoot, "app", "page.js");
  const globalsPath = path.join(uiRoot, "app", "globals.css");
  const pageContent = fs.readFileSync(pagePath, "utf-8");
  const globalsContent = fs.readFileSync(globalsPath, "utf-8");

  describe("Parallel Request Orchestration", () => {
    test("page.js executes Promise.all to fetch /api/status and /api/graph concurrently", () => {
      assert.ok(
        pageContent.includes("Promise.all(["),
        "page.js must use Promise.all to fetch initial endpoints in parallel"
      );
      assert.ok(
        pageContent.includes('fetch("/api/status")'),
        "page.js must include /api/status in parallel request pool"
      );
      assert.ok(
        pageContent.includes('fetch("/api/graph")'),
        "page.js must include /api/graph in parallel request pool"
      );
    });

    test("page.js contains graceful catch handlers and finally block for initial loading state", () => {
      assert.ok(
        pageContent.includes("setIsInitialLoading(false)"),
        "page.js must resolve isInitialLoading to false in finally block"
      );
    });
  });

  describe("Layout Computation State Tracking", () => {
    test("page.js tracks isLayoutComputing state during layout execution", () => {
      assert.ok(
        pageContent.includes("const [isLayoutComputing, setIsLayoutComputing] = useState(false)"),
        "page.js must declare isLayoutComputing state"
      );
      assert.ok(
        pageContent.includes("setIsLayoutComputing(true)"),
        "page.js must set isLayoutComputing to true when runLayout commences"
      );
      assert.ok(
        pageContent.includes("setIsLayoutComputing(false)"),
        "page.js must set isLayoutComputing to false on layout completion and cleanup"
      );
    });

    test("page.js renders floating layout computing HUD when graph is computing layout", () => {
      assert.ok(
        pageContent.includes("hasGraph && isLayoutComputing && ("),
        "page.js must conditionally render floating HUD when hasGraph and isLayoutComputing"
      );
      assert.ok(
        pageContent.includes("Computing Layout:"),
        "Layout HUD must clearly inform user of DAG layout calculation"
      );
      assert.ok(
        pageContent.includes("resources"),
        "Layout HUD must report resource count being positioned"
      );
      assert.ok(
        pageContent.includes("dependencies"),
        "Layout HUD must report dependency edge count being positioned"
      );
    });
  });

  describe("Session Initialization Card & Animations", () => {
    test("page.js renders structured session initializing card when isInitialLoading", () => {
      assert.ok(
        pageContent.includes("isInitialLoading ? ("),
        "page.js must conditionally render initial loading state before graph resolution"
      );
      assert.ok(
        pageContent.includes("Connecting to plan-parse engine"),
        "Loading card must explain background connection to engine"
      );
      assert.ok(
        pageContent.includes("CONNECTING"),
        "Loading card must display precision status badge"
      );
      assert.ok(
        pageContent.includes("animate-workbench-slide"),
        "Loading card must reference precision indeterminate slide animation"
      );
    });

    test("globals.css defines workbench-slide keyframe animation", () => {
      assert.ok(
        globalsContent.includes("@keyframes workbench-slide"),
        "globals.css must define @keyframes workbench-slide"
      );
      assert.ok(
        globalsContent.includes(".animate-workbench-slide"),
        "globals.css must define .animate-workbench-slide utility class"
      );
    });

    test("page.js includes hover text on Load Plan JSON File button", () => {
      assert.ok(
        pageContent.includes('title="This simply opens the sidebar to upload the plan file"'),
        "Load Plan JSON File button must have hover text title explaining it opens the sidebar"
      );
    });
  });
});

