import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  COLLAPSED_TOAST_LINE_1,
  COLLAPSED_TOAST_LINE_2,
  COLLAPSED_TOAST_PREFIX,
  COLLAPSED_TOAST_ACTION,
  COLLAPSED_TOAST_DISMISS,
  COLLAPSED_TOAST_TEXT,
  shouldShowCollapsedToast,
} from "./collapsed-toast.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uiRoot = path.resolve(__dirname, "..");

describe("Collapsed Graph Toast & Default State Specifications", () => {
  const pagePath = path.join(uiRoot, "app", "page.js");
  const componentPath = path.join(uiRoot, "components", "CollapsedToast.js");
  const helperPath = path.join(uiRoot, "lib", "collapsed-toast.js");

  describe("Toast Content Contract", () => {
    test("defines exact required two-line message", () => {
      const expectedText =
        "the graph is collapsed by default, you can toggle it here\nand you can pass the cli option collapsed as false";
      assert.equal(COLLAPSED_TOAST_TEXT, expectedText);
    });

    test("defines line 1 and line 2 strings accurately", () => {
      assert.equal(
        COLLAPSED_TOAST_LINE_1,
        "the graph is collapsed by default, you can toggle it here"
      );
      assert.equal(
        COLLAPSED_TOAST_LINE_2,
        "and you can pass the cli option collapsed as false"
      );
    });

    test("line 1 separates into prefix and interactive trigger word 'here'", () => {
      assert.equal(
        COLLAPSED_TOAST_PREFIX,
        "the graph is collapsed by default, you can toggle it "
      );
      assert.equal(COLLAPSED_TOAST_ACTION, "here");
      assert.equal(
        `${COLLAPSED_TOAST_PREFIX}${COLLAPSED_TOAST_ACTION}`,
        COLLAPSED_TOAST_LINE_1
      );
    });

    test("dismiss symbol is standard multiplication/cross sign '×'", () => {
      assert.equal(COLLAPSED_TOAST_DISMISS, "×");
    });
  });

  describe("Toast Visibility Predicate (shouldShowCollapsedToast)", () => {
    test("shows toast when CLI option is true, graph is collapsed, graph is loaded, and not dismissed", () => {
      const visible = shouldShowCollapsedToast({
        cliOptionCollapsed: true,
        isCollapsed: true,
        hasGraph: true,
        isDismissed: false,
      });
      assert.equal(visible, true);
    });

    test("hides toast when graph is uncollapsed (isCollapsed: false)", () => {
      const visible = shouldShowCollapsedToast({
        cliOptionCollapsed: true,
        isCollapsed: false,
        hasGraph: true,
        isDismissed: false,
      });
      assert.equal(visible, false);
    });

    test("hides toast when CLI option collapsed is false", () => {
      const visible = shouldShowCollapsedToast({
        cliOptionCollapsed: false,
        isCollapsed: true,
        hasGraph: true,
        isDismissed: false,
      });
      assert.equal(visible, false);
    });

    test("hides toast when no graph is loaded (hasGraph: false)", () => {
      const visible = shouldShowCollapsedToast({
        cliOptionCollapsed: true,
        isCollapsed: true,
        hasGraph: false,
        isDismissed: false,
      });
      assert.equal(visible, false);
    });

    test("hides toast when user has dismissed it (isDismissed: true)", () => {
      const visible = shouldShowCollapsedToast({
        cliOptionCollapsed: true,
        isCollapsed: true,
        hasGraph: true,
        isDismissed: true,
      });
      assert.equal(visible, false);
    });

    test("defaults cliOptionCollapsed and isCollapsed to true when omitted", () => {
      assert.equal(shouldShowCollapsedToast({ hasGraph: true }), true);
      assert.equal(shouldShowCollapsedToast({ hasGraph: false }), false);
    });
  });

  describe("Application Default State & page.js Integration", () => {
    const pageContent = fs.readFileSync(pagePath, "utf-8");

    test("defaults isCollapsed state to true in page.js", () => {
      assert.match(
        pageContent,
        /const\s*\[isCollapsed,\s*setIsCollapsed\]\s*=\s*useState\(true\)/,
        "isCollapsed must default to true"
      );
    });

    test("defaults cliOptionCollapsed state to true in page.js", () => {
      assert.match(
        pageContent,
        /const\s*\[cliOptionCollapsed,\s*setCliOptionCollapsed\]\s*=\s*useState\(true\)/,
        "cliOptionCollapsed must default to true"
      );
    });

    test("queries /api/status on mount and syncs status.collapsed boolean", () => {
      assert.ok(
        pageContent.includes("/api/status"),
        "page.js must query /api/status"
      );
      assert.match(
        pageContent,
        /status\.collapsed/,
        "page.js must read status.collapsed"
      );
      assert.match(
        pageContent,
        /setCliOptionCollapsed\(status\.collapsed\)/,
        "page.js must store cliOptionCollapsed from status.collapsed"
      );
      assert.match(
        pageContent,
        /setIsCollapsed\(status\.collapsed\)/,
        "page.js must update isCollapsed from status.collapsed"
      );
    });

    test("handlePlanParsed defaults isCollapsed to cliOptionCollapsed/true instead of false", () => {
      assert.match(
        pageContent,
        /setIsCollapsed\(cliOptionCollapsed\)/,
        "handlePlanParsed must set isCollapsed to cliOptionCollapsed"
      );
      // Ensure it doesn't hardcode false
      const handlePlanParsedSnippet = pageContent.slice(
        pageContent.indexOf("const handlePlanParsed ="),
        pageContent.indexOf("const handleOpenUpload =")
      );
      assert.equal(
        handlePlanParsedSnippet.includes("setIsCollapsed(false)"),
        false,
        "handlePlanParsed must not hardcode setIsCollapsed(false)"
      );
    });

    test("renders CollapsedToast inside page.js DAG canvas area", () => {
      assert.ok(
        pageContent.includes("<CollapsedToast"),
        "page.js must render <CollapsedToast"
      );
      assert.ok(
        pageContent.includes("onToggleCollapse={handleToggleCollapse}"),
        "CollapsedToast must receive onToggleCollapse wired to handleToggleCollapse"
      );
    });
  });

  describe("Interactive Toggle & Dismissal Contracts", () => {
    test("simulates clicking 'here' triggers handleToggleCollapse and hides toast", () => {
      let collapsedState = true;
      const handleToggleCollapse = () => {
        collapsedState = !collapsedState;
      };

      // Initially collapsed with graph loaded
      assert.equal(
        shouldShowCollapsedToast({
          cliOptionCollapsed: true,
          isCollapsed: collapsedState,
          hasGraph: true,
          isDismissed: false,
        }),
        true
      );

      // User clicks 'here' -> toggles collapsed
      handleToggleCollapse();
      assert.equal(collapsedState, false);

      // Toast is now hidden
      assert.equal(
        shouldShowCollapsedToast({
          cliOptionCollapsed: true,
          isCollapsed: collapsedState,
          hasGraph: true,
          isDismissed: false,
        }),
        false
      );

      // User toggles back on -> toast is shown again (if not dismissed)
      handleToggleCollapse();
      assert.equal(collapsedState, true);
      assert.equal(
        shouldShowCollapsedToast({
          cliOptionCollapsed: true,
          isCollapsed: collapsedState,
          hasGraph: true,
          isDismissed: false,
        }),
        true
      );
    });

    test("simulates clicking dismiss button '×' updates dismissed state and hides toast", () => {
      let isDismissed = false;
      const onDismiss = () => {
        isDismissed = true;
      };

      assert.equal(
        shouldShowCollapsedToast({
          cliOptionCollapsed: true,
          isCollapsed: true,
          hasGraph: true,
          isDismissed,
        }),
        true
      );

      onDismiss();
      assert.equal(isDismissed, true);

      assert.equal(
        shouldShowCollapsedToast({
          cliOptionCollapsed: true,
          isCollapsed: true,
          hasGraph: true,
          isDismissed,
        }),
        false
      );
    });
  });

  describe("Component Styling & Accessibility Tokens", () => {
    const compContent = fs.readFileSync(componentPath, "utf-8");

    test("component file exists and uses semantic workbench tokens", () => {
      assert.ok(
        compContent.includes("bg-workbench-panel"),
        "Must use workbench panel background"
      );
      assert.ok(
        compContent.includes("border-workbench-border"),
        "Must use workbench border token"
      );
      assert.ok(
        compContent.includes("backdrop-blur"),
        "Must use backdrop blur for elevated glass HUD"
      );
    });

    test("positions cleanly at bottom-right above status bar", () => {
      assert.match(
        compContent,
        /absolute|fixed/,
        "Must use absolute or fixed positioning"
      );
      assert.match(compContent, /bottom-\d+/, "Must specify bottom offset");
      assert.match(compContent, /right-\d+/, "Must specify right offset");
    });

    test("implements accessible status role and polite announcement", () => {
      assert.ok(
        compContent.includes('role="status"'),
        "Must include role='status'"
      );
      assert.ok(
        compContent.includes('aria-live="polite"'),
        "Must include aria-live='polite'"
      );
      assert.ok(
        compContent.includes('aria-label="Dismiss notification"'),
        "Must include accessible dismiss label"
      );
    });

    test("uses monospace font for CLI command hint", () => {
      assert.ok(
        compContent.includes("font-mono"),
        "Must style CLI option text in monospace"
      );
    });
  });
});
