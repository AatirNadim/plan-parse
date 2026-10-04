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
  COLLAPSED_CLI_COMMAND,
  getCollapsedCliCommand,
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

    test("exports copyable CLI command constant matching exact specification", () => {
      assert.equal(
        COLLAPSED_CLI_COMMAND,
        "./plan-parse -collapsed=false ./plan.json"
      );
    });

    test("getCollapsedCliCommand helper returns proper CLI command syntax", () => {
      assert.equal(getCollapsedCliCommand(), COLLAPSED_CLI_COMMAND);
      assert.equal(getCollapsedCliCommand(null), COLLAPSED_CLI_COMMAND);
      assert.equal(getCollapsedCliCommand(""), COLLAPSED_CLI_COMMAND);
      assert.equal(getCollapsedCliCommand("   "), COLLAPSED_CLI_COMMAND);
      assert.equal(getCollapsedCliCommand("CLI Session Plan"), COLLAPSED_CLI_COMMAND);
      assert.equal(getCollapsedCliCommand("plan.json"), "./plan-parse -collapsed=false ./plan.json");
      assert.equal(getCollapsedCliCommand("./plan.json"), "./plan-parse -collapsed=false ./plan.json");
      assert.equal(getCollapsedCliCommand("my_plan.json"), "./plan-parse -collapsed=false ./my_plan.json");
      assert.equal(getCollapsedCliCommand("./infra/prod.plan.json"), "./plan-parse -collapsed=false ./infra/prod.plan.json");
      assert.equal(getCollapsedCliCommand("/tmp/test.json"), "./plan-parse -collapsed=false /tmp/test.json");
      assert.equal(getCollapsedCliCommand("../plans/prod.json"), "./plan-parse -collapsed=false ../plans/prod.json");
      assert.equal(getCollapsedCliCommand("my tf plan.json"), './plan-parse -collapsed=false "./my tf plan.json"');
    });
  });

  describe("Toast Visibility Predicate (shouldShowCollapsedToast)", () => {
    test("a) shows toast on first UI load (when cliOptionCollapsed: true, isCollapsed: true, hasGraph: true, isDismissed: false)", () => {
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

    test("if UI was loaded with -collapsed=false, toast is never displayed even if collapse is later toggled on", () => {
      // First load with cliOptionCollapsed: false
      assert.equal(
        shouldShowCollapsedToast({
          cliOptionCollapsed: false,
          isCollapsed: false,
          hasGraph: true,
          isDismissed: false,
        }),
        false
      );
      // Toggled on from UI
      assert.equal(
        shouldShowCollapsedToast({
          cliOptionCollapsed: false,
          isCollapsed: true,
          hasGraph: true,
          isDismissed: false,
        }),
        false
      );
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

    test("handleToggleCollapse permanently dismisses the toast (setIsToastDismissed(true))", () => {
      const handleToggleCollapseSnippet = pageContent.slice(
        pageContent.indexOf("const handleToggleCollapse ="),
        pageContent.indexOf("const cyContainerRef =")
      );
      assert.ok(
        handleToggleCollapseSnippet.includes("setIsToastDismissed(true)"),
        "handleToggleCollapse must call setIsToastDismissed(true)"
      );
      assert.ok(
        handleToggleCollapseSnippet.includes("setIsCollapsed("),
        "handleToggleCollapse must toggle isCollapsed"
      );
    });

    test("handlePlanParsed defaults isCollapsed to cliOptionCollapsed", () => {
      assert.match(
        pageContent,
        /setIsCollapsed\(cliOptionCollapsed\)/,
        "handlePlanParsed must set isCollapsed to cliOptionCollapsed"
      );
    });

    test("renders CollapsedToast inside page.js DAG canvas area with planName", () => {
      assert.ok(
        pageContent.includes("<CollapsedToast"),
        "page.js must render <CollapsedToast"
      );
      assert.ok(
        pageContent.includes("onToggleCollapse={handleToggleCollapse}"),
        "CollapsedToast must receive onToggleCollapse wired to handleToggleCollapse"
      );
      assert.ok(
        pageContent.includes("planName={planName}"),
        "CollapsedToast must receive planName"
      );
    });
  });

  describe("Interactive Toggle & Dismissal Contracts", () => {
    test("b) once collapse is toggled from UI, toast is dismissed and does NOT re-appear when toggling collapse", () => {
      let isCollapsed = true;
      let isDismissed = false;

      // Real handleToggleCollapse implementation from page.js
      const handleToggleCollapse = () => {
        isDismissed = true;
        isCollapsed = !isCollapsed;
      };

      // 1. First UI load with graph: toast is visible
      assert.equal(
        shouldShowCollapsedToast({
          cliOptionCollapsed: true,
          isCollapsed,
          hasGraph: true,
          isDismissed,
        }),
        true,
        "Toast must be visible on first UI load"
      );

      // 2. Collapse toggled from UI (clicking 'here', header button, 'C' key, command palette)
      handleToggleCollapse();
      assert.equal(isCollapsed, false);
      assert.equal(isDismissed, true);

      // Toast is now hidden
      assert.equal(
        shouldShowCollapsedToast({
          cliOptionCollapsed: true,
          isCollapsed,
          hasGraph: true,
          isDismissed,
        }),
        false,
        "Toast must be hidden after first toggle"
      );

      // 3. User toggles collapse back to true from UI
      handleToggleCollapse();
      assert.equal(isCollapsed, true);
      assert.equal(isDismissed, true);

      // Toast must NEVER re-appear even though isCollapsed is true again
      assert.equal(
        shouldShowCollapsedToast({
          cliOptionCollapsed: true,
          isCollapsed,
          hasGraph: true,
          isDismissed,
        }),
        false,
        "Toast must NEVER re-appear once collapse has been toggled in UI"
      );
    });

    test("simulates clicking dismiss button '×' updates dismissed state and hides toast permanently", () => {
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

      // Toast is hidden
      assert.equal(
        shouldShowCollapsedToast({
          cliOptionCollapsed: true,
          isCollapsed: true,
          hasGraph: true,
          isDismissed,
        }),
        false
      );

      // Toggling collapse afterward still keeps toast hidden
      assert.equal(
        shouldShowCollapsedToast({
          cliOptionCollapsed: true,
          isCollapsed: false,
          hasGraph: true,
          isDismissed,
        }),
        false
      );
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

  describe("c) & d) Copyable CLI Syntax & Copy Button Clipboard Interaction", () => {
    const compContent = fs.readFileSync(componentPath, "utf-8");

    test("c) component renders actual copyable CLI syntax", () => {
      assert.ok(
        compContent.includes("getCollapsedCliCommand"),
        "CollapsedToast must import and use getCollapsedCliCommand"
      );
      assert.ok(
        compContent.includes("data-testid=\"collapsed-cli-command\"") ||
          compContent.includes("{cliCommand}"),
        "CollapsedToast must display the generated CLI command"
      );
      assert.match(
        compContent,
        /<code[^>]*>[^<]*\{cliCommand\}[^<]*<\/code>/,
        "CollapsedToast must render CLI command inside a styled code element"
      );
    });

    test("d) component imports and uses copyToClipboard for clipboard interaction", () => {
      assert.ok(
        compContent.includes('import { copyToClipboard } from "../lib/target-command"'),
        "CollapsedToast must import copyToClipboard from target-command"
      );
      assert.ok(
        compContent.includes("copyToClipboard(cliCommand)"),
        "CollapsedToast must pass cliCommand to copyToClipboard"
      );
    });

    test("d) component renders interactive copy button with feedback state", () => {
      assert.ok(
        compContent.includes('aria-label="Copy CLI command"'),
        "Copy button must have accessible aria-label"
      );
      assert.ok(
        compContent.includes("Copied!"),
        "Copy button must show 'Copied!' feedback"
      );
      assert.match(
        compContent,
        /const\s*\[copied,\s*setCopied\]\s*=\s*useState\(false\)/,
        "CollapsedToast must manage copied feedback state"
      );
    });

    test("d) copyToClipboard contract successfully handles the CLI command string", async () => {
      const { copyToClipboard } = await import("./target-command.js");
      // In Node environment without navigator.clipboard or DOM document, returns false gracefully
      const result = await copyToClipboard(COLLAPSED_CLI_COMMAND);
      assert.equal(typeof result, "boolean");

      // Verify with simulated navigator.clipboard
      let clipboardText = "";
      globalThis.navigator = {
        clipboard: {
          writeText: async (t) => {
            clipboardText = t;
          },
        },
      };

      const success = await copyToClipboard(COLLAPSED_CLI_COMMAND);
      assert.equal(success, true);
      assert.equal(clipboardText, "./plan-parse -collapsed=false ./plan.json");

      // Clean up mock
      delete globalThis.navigator;
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
