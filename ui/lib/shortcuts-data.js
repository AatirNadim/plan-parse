/**
 * Keyboard shortcuts registry and metadata for plan-parse developer workbench.
 * Organized by functional domains for the cheat sheet modal and documentation.
 */
export const SHORTCUT_SECTIONS = [
  {
    title: "Canvas & Viewport",
    items: [
      {
        label: "Fit diagram to viewport",
        keys: [{ key: "F" }, { divider: "/" }, { key: "f" }],
      },
      {
        label: "Reset zoom to 100% (1:1)",
        keys: [{ key: "0" }],
      },
      {
        label: "Zoom in (factor 1.3x)",
        keys: [{ key: "+" }, { divider: "/" }, { key: "=" }],
      },
      {
        label: "Zoom out (factor 0.75x)",
        keys: [{ key: "-" }],
      },
    ],
  },
  {
    title: "Navigation & Panels",
    items: [
      {
        label: "Toggle Left Resources Sidebar",
        keys: [{ key: "[" }],
      },
      {
        label: "Toggle Right Node Inspector",
        detail: "when resource selected",
        keys: [{ key: "]" }],
      },
      {
        label: "Toggle Intermediate Collapse",
        detail: "Mutations only",
        keys: [{ key: "C" }, { divider: "/" }, { key: "c" }],
      },
      {
        label: "Command Palette / Quick Search",
        keys: [{ key: "⌘K" }, { divider: "/" }, { key: "Ctrl+K" }],
      },
      {
        label: "View Resource IaC Diff Modal",
        detail: "when resource selected",
        keys: [{ key: "D" }, { divider: "/" }, { key: "d" }, { divider: "or" }, { key: "Space" }],
      },
    ],
  },
  {
    title: "Dialogs & General",
    items: [
      {
        label: "Toggle Light / Dark Theme",
        keys: [{ key: "T" }, { divider: "/" }, { key: "t" }],
      },
      {
        label: "Toggle Shortcuts Cheat Sheet",
        keys: [{ key: "?" }, { divider: "or" }, { key: "Shift + /" }],
      },
      {
        label: "Close modal / Deselect / Dismiss",
        keys: [{ key: "Escape" }],
      },
    ],
  },
  {
    title: "Command Palette Navigation",
    subtitle: "inside ⌘K",
    items: [
      {
        label: "Navigate list items",
        keys: [{ key: "↑" }, { divider: "/" }, { key: "↓" }],
      },
      {
        label: "Select resource or run action",
        keys: [{ key: "Enter ↵" }],
      },
    ],
  },
];
