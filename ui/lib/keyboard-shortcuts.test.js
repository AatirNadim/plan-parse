import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { SHORTCUT_SECTIONS } from "./shortcuts-data.js";

describe("Keyboard Shortcuts Registry Tests", () => {
  test("defines all 4 required sections", () => {
    const titles = SHORTCUT_SECTIONS.map((s) => s.title);
    assert.deepEqual(titles, [
      "Canvas & Viewport",
      "Navigation & Panels",
      "Dialogs & General",
      "Command Palette Navigation",
    ]);
  });

  test("Canvas & Viewport section includes F, 0, +, and -", () => {
    const canvasSection = SHORTCUT_SECTIONS.find((s) => s.title === "Canvas & Viewport");
    assert.ok(canvasSection, "Canvas section must exist");

    const allKeys = canvasSection.items.flatMap((item) =>
      item.keys.filter((k) => k.key).map((k) => k.key)
    );

    assert.ok(allKeys.includes("F"), "Must include F");
    assert.ok(allKeys.includes("f"), "Must include f");
    assert.ok(allKeys.includes("0"), "Must include 0");
    assert.ok(allKeys.includes("+"), "Must include +");
    assert.ok(allKeys.includes("="), "Must include =");
    assert.ok(allKeys.includes("-"), "Must include -");
  });

  test("Navigation & Panels section includes [, ], C/c, and ⌘K/Ctrl+K", () => {
    const navSection = SHORTCUT_SECTIONS.find((s) => s.title === "Navigation & Panels");
    assert.ok(navSection, "Navigation section must exist");

    const allKeys = navSection.items.flatMap((item) =>
      item.keys.filter((k) => k.key).map((k) => k.key)
    );

    assert.ok(allKeys.includes("["), "Must include [ for sidebar toggle");
    assert.ok(allKeys.includes("]"), "Must include ] for inspector toggle");
    assert.ok(allKeys.includes("C"), "Must include C for collapse toggle");
    assert.ok(allKeys.includes("c"), "Must include c for collapse toggle");
    assert.ok(allKeys.includes("⌘K"), "Must include ⌘K for command palette");
    assert.ok(allKeys.includes("Ctrl+K"), "Must include Ctrl+K for command palette");
    assert.ok(allKeys.includes("D"), "Must include D for diff modal");
    assert.ok(allKeys.includes("d"), "Must include d for diff modal");
    assert.ok(allKeys.includes("Space"), "Must include Space for diff modal");
    assert.ok(allKeys.includes("B"), "Must include B for blast radius isolation toggle");
    assert.ok(allKeys.includes("b"), "Must include b for blast radius isolation toggle");
  });

  test("Dialogs & General section includes ? and Escape", () => {
    const dialogSection = SHORTCUT_SECTIONS.find((s) => s.title === "Dialogs & General");
    assert.ok(dialogSection, "Dialogs section must exist");

    const allKeys = dialogSection.items.flatMap((item) =>
      item.keys.filter((k) => k.key).map((k) => k.key)
    );

    assert.ok(allKeys.includes("?"), "Must include ? for shortcuts cheat sheet");
    assert.ok(allKeys.includes("Shift + /"), "Must include Shift + /");
    assert.ok(allKeys.includes("Escape"), "Must include Escape");
  });

  test("Command Palette Navigation section includes arrows and Enter", () => {
    const cmdSection = SHORTCUT_SECTIONS.find((s) => s.title === "Command Palette Navigation");
    assert.ok(cmdSection, "Command palette section must exist");

    const allKeys = cmdSection.items.flatMap((item) =>
      item.keys.filter((k) => k.key).map((k) => k.key)
    );

    assert.ok(allKeys.includes("↑"), "Must include ↑");
    assert.ok(allKeys.includes("↓"), "Must include ↓");
    assert.ok(allKeys.includes("Enter ↵"), "Must include Enter ↵");
  });

  test("all shortcut items have non-empty labels and at least one key", () => {
    for (const section of SHORTCUT_SECTIONS) {
      assert.ok(section.items.length > 0, `Section ${section.title} must have items`);
      for (const item of section.items) {
        assert.ok(item.label && item.label.trim().length > 0, "Item label must not be empty");
        const keys = item.keys.filter((k) => k.key);
        assert.ok(keys.length > 0, `Item "${item.label}" must have at least one key badge`);
      }
    }
  });
});
