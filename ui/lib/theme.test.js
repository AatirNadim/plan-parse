import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { THEME_STORAGE_KEY, applyThemeToDOM } from "./use-theme.js";
import { getCytoscapeStyles, CYTOSCAPE_STYLES } from "./cytoscape-styles.js";
import { SHORTCUT_SECTIONS } from "./shortcuts-data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uiRoot = path.resolve(__dirname, "..");

describe("Theme System & Light/Dark Mode Specification", () => {
  describe("DOM Theme Application & Storage Contracts", () => {
    test("THEME_STORAGE_KEY is standardized", () => {
      assert.equal(THEME_STORAGE_KEY, "plan-parse-theme");
    });

    test("applyThemeToDOM handles light and dark transitions with DOM mock", () => {
      // Mock global document if running in node test environment
      const originalDocument = globalThis.document;
      const classListSet = new Set();
      const styleObj = { colorScheme: "" };

      globalThis.document = {
        documentElement: {
          classList: {
            add: (cls) => classListSet.add(cls),
            remove: (cls) => classListSet.delete(cls),
            contains: (cls) => classListSet.has(cls),
          },
          style: styleObj,
        },
      };

      try {
        // Apply light
        applyThemeToDOM("light");
        assert.ok(classListSet.has("light"), "Must add light class");
        assert.ok(!classListSet.has("dark"), "Must remove dark class");
        assert.equal(styleObj.colorScheme, "light", "colorScheme must be light");

        // Apply dark
        applyThemeToDOM("dark");
        assert.ok(classListSet.has("dark"), "Must add dark class");
        assert.ok(!classListSet.has("light"), "Must remove light class");
        assert.equal(styleObj.colorScheme, "dark", "colorScheme must be dark");
      } finally {
        globalThis.document = originalDocument;
      }
    });
  });

  describe("Cytoscape Theme-Aware Stylesheets", () => {
    test("getCytoscapeStyles produces valid styles for dark theme", () => {
      const darkStyles = getCytoscapeStyles("dark");
      assert.ok(Array.isArray(darkStyles), "Must return stylesheet array");
      assert.ok(darkStyles.length >= 10, "Must include all node and edge selectors");

      const nodeStyle = darkStyles.find((s) => s.selector === "node");
      assert.ok(nodeStyle, "Must define node selector");
      assert.equal(nodeStyle.style["background-color"], "#151924");
      assert.equal(nodeStyle.style.color, "#e2e8f0");
      assert.equal(nodeStyle.style["border-color"], "#2a3346");

      const edgeStyle = darkStyles.find((s) => s.selector === "edge");
      assert.ok(edgeStyle, "Must define edge selector");
      assert.equal(edgeStyle.style["line-color"], "#334155");
    });

    test("getCytoscapeStyles produces high-contrast styles for light theme", () => {
      const lightStyles = getCytoscapeStyles("light");
      assert.ok(Array.isArray(lightStyles), "Must return stylesheet array");

      const nodeStyle = lightStyles.find((s) => s.selector === "node");
      assert.ok(nodeStyle, "Must define node selector");
      assert.equal(nodeStyle.style["background-color"], "#ffffff");
      assert.equal(nodeStyle.style.color, "#0f172a");
      assert.equal(nodeStyle.style["border-color"], "#cbd5e1");

      const edgeStyle = lightStyles.find((s) => s.selector === "edge");
      assert.ok(edgeStyle, "Must define edge selector");
      assert.equal(edgeStyle.style["line-color"], "#94a3b8");
    });

    test("CYTOSCAPE_STYLES constant defaults to dark theme for backwards compatibility", () => {
      assert.deepEqual(CYTOSCAPE_STYLES, getCytoscapeStyles("dark"));
    });

    test("Semantic action badges preserve contrast in both themes", () => {
      const darkStyles = getCytoscapeStyles("dark");
      const lightStyles = getCytoscapeStyles("light");

      const actions = [".create", ".delete", ".update", ".replace"];
      for (const action of actions) {
        const darkAction = darkStyles.find((s) => s.selector === action);
        const lightAction = lightStyles.find((s) => s.selector === action);

        assert.ok(darkAction, `Dark styles must define ${action}`);
        assert.ok(lightAction, `Light styles must define ${action}`);
        assert.notEqual(
          darkAction.style["background-color"],
          lightAction.style["background-color"],
          `${action} background must adapt across themes`
        );
      }
    });
  });

  describe("Keyboard Shortcuts & Palette Registration", () => {
    test("shortcuts registry includes Theme Toggle in Dialogs & General", () => {
      const dialogSection = SHORTCUT_SECTIONS.find((s) => s.title === "Dialogs & General");
      assert.ok(dialogSection, "Dialogs section must exist");

      const themeShortcut = dialogSection.items.find((item) =>
        item.label.toLowerCase().includes("theme")
      );
      assert.ok(themeShortcut, "Must register theme toggle shortcut");
      const keys = themeShortcut.keys.filter((k) => k.key).map((k) => k.key);
      assert.ok(keys.includes("T") || keys.includes("t"), "Must include T shortcut key");
    });

    test("CommandPalette.js registers action-toggle-theme", () => {
      const cpPath = path.join(uiRoot, "components", "CommandPalette.js");
      const cpContent = fs.readFileSync(cpPath, "utf-8");
      assert.ok(
        cpContent.includes("action-toggle-theme"),
        "CommandPalette must register action-toggle-theme"
      );
      assert.ok(
        cpContent.includes('shortcut: "T"'),
        "CommandPalette theme action must have shortcut T"
      );
    });
  });

  describe("Layout & Anti-FOUC Configuration", () => {
    test("layout.js includes suppressHydrationWarning and inline anti-FOUC script", () => {
      const layoutPath = path.join(uiRoot, "app", "layout.js");
      const layoutContent = fs.readFileSync(layoutPath, "utf-8");

      assert.ok(
        layoutContent.includes("suppressHydrationWarning"),
        "layout.js html element must have suppressHydrationWarning"
      );
      assert.ok(
        layoutContent.includes("plan-parse-theme"),
        "layout.js must read plan-parse-theme from localStorage in head script"
      );
    });

    test("globals.css defines both html.dark and html.light variable palettes", () => {
      const cssPath = path.join(uiRoot, "app", "globals.css");
      const cssContent = fs.readFileSync(cssPath, "utf-8");

      assert.ok(cssContent.includes("html.dark"), "globals.css must define html.dark");
      assert.ok(cssContent.includes("html.light"), "globals.css must define html.light");
      assert.ok(cssContent.includes("--workbench-bg"), "globals.css must define --workbench-bg");
      assert.ok(
        cssContent.includes("html.light .canvas-bg"),
        "globals.css must define light canvas dot matrix"
      );
    });
  });

  describe("Component Props & Theme Integration", () => {
    test("AppHeader.js accepts onToggleTheme and theme props and renders toggle button", () => {
      const headerPath = path.join(uiRoot, "components", "AppHeader.js");
      const headerContent = fs.readFileSync(headerPath, "utf-8");

      assert.ok(headerContent.includes("onToggleTheme"), "AppHeader must accept onToggleTheme");
      assert.ok(
        headerContent.includes("Toggle Light / Dark Theme") || headerContent.includes("Toggle Theme"),
        "AppHeader must render theme toggle button"
      );
      assert.ok(
        headerContent.includes("Light theme (#f8fafc)") && headerContent.includes("Dark theme (#090a0f)"),
        "AppHeader export dropdown must show theme-aware background description"
      );
    });

    test("page.js uses useTheme hook and synchronizes Cytoscape styles", () => {
      const pagePath = path.join(uiRoot, "app", "page.js");
      const pageContent = fs.readFileSync(pagePath, "utf-8");

      assert.ok(pageContent.includes("useTheme()"), "page.js must call useTheme()");
      assert.ok(
        pageContent.includes("getCytoscapeStyles(theme)"),
        "page.js must pass theme to getCytoscapeStyles"
      );
      assert.ok(
        pageContent.includes('e.key === "t"') || pageContent.includes('e.key === "T"'),
        "page.js must handle T shortcut for theme toggle"
      );
    });

    test("export-image.js adapts default canvas background based on theme option", () => {
      const exportPath = path.join(uiRoot, "lib", "export-image.js");
      const exportContent = fs.readFileSync(exportPath, "utf-8");

      assert.ok(
        exportContent.includes('options.theme === "light"'),
        "export-image.js must check options.theme"
      );
      assert.ok(
        exportContent.includes("#f8fafc") && exportContent.includes("#090a0f"),
        "export-image.js must use light/dark background colors"
      );
    });
  });

  describe("NodePopover & NodeDiffModal Theme Conformance", () => {
    test("NodePopover.js utilizes semantic workbench tokens and dark contrast pairs", () => {
      const popoverPath = path.join(uiRoot, "components", "NodePopover.js");
      const popoverContent = fs.readFileSync(popoverPath, "utf-8");

      assert.ok(popoverContent.includes("bg-workbench-panel"), "NodePopover must use bg-workbench-panel");
      assert.ok(popoverContent.includes("border-workbench-border"), "NodePopover must use border-workbench-border");
      assert.ok(popoverContent.includes("bg-workbench-subpanel"), "NodePopover must use bg-workbench-subpanel");
      assert.ok(popoverContent.includes("dark:text-slate-100"), "NodePopover must have dark mode header text");
      assert.ok(popoverContent.includes("dark:text-slate-400"), "NodePopover must have dark mode secondary text");
      assert.ok(popoverContent.includes("custom-scrollbar"), "NodePopover must use theme-aware custom-scrollbar");
    });

    test("NodeDiffModal.js utilizes semantic workbench tokens and dark contrast pairs", () => {
      const modalPath = path.join(uiRoot, "components", "NodeDiffModal.js");
      const modalContent = fs.readFileSync(modalPath, "utf-8");

      assert.ok(modalContent.includes("bg-workbench-panel"), "NodeDiffModal must use bg-workbench-panel");
      assert.ok(modalContent.includes("bg-workbench-header"), "NodeDiffModal must use bg-workbench-header");
      assert.ok(modalContent.includes("bg-workbench-subpanel"), "NodeDiffModal must use bg-workbench-subpanel");
      assert.ok(modalContent.includes("border-workbench-border"), "NodeDiffModal must use border-workbench-border");
      assert.ok(modalContent.includes("dark:bg-black/75"), "NodeDiffModal backdrop must be dark-theme aware");
      assert.ok(modalContent.includes("dark:text-emerald-300"), "NodeDiffModal additions must be dark-theme aware");
      assert.ok(modalContent.includes("dark:text-rose-300"), "NodeDiffModal deletions must be dark-theme aware");
      assert.ok(modalContent.includes("dark:text-amber-300"), "NodeDiffModal modifications must be dark-theme aware");
      assert.ok(modalContent.includes("custom-scrollbar"), "NodeDiffModal must use theme-aware custom-scrollbar");
    });
  });
});

