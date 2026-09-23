/**
 * Single source of truth for Terraform action colors, badges, symbols, and contrast tokens.
 * Complies with WCAG AA (>= 4.5:1 text-to-background contrast ratio).
 */

export const ACTION_COLORS = {
  create: "#22c55e",
  update: "#3b82f6",
  delete: "#ef4444",
  replace: "#f59e0b",
  "no-op": "#64748b",
  noop: "#64748b",
  data: "#ec4899",
  read: "#ec4899",
  module: "#a855f7",
  variable: "#0ea5e9",
  output: "#eab308",
};

/**
 * High-contrast foreground text colors for Cytoscape nodes and canvas badges.
 * Dark text (#020617) on light/bright backgrounds (green, yellow, amber, sky) ensures WCAG AA compliance.
 */
export const ACTION_TEXT_COLORS = {
  create: "#020617",
  update: "#ffffff",
  delete: "#ffffff",
  replace: "#020617",
  "no-op": "#ffffff",
  noop: "#ffffff",
  data: "#ffffff",
  read: "#ffffff",
  module: "#ffffff",
  variable: "#020617",
  output: "#020617",
};

export const ACTION_CONFIG = {
  create: {
    label: "Create",
    color: "#22c55e",
    textColor: "#020617",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    symbol: "+",
  },
  update: {
    label: "Update",
    color: "#3b82f6",
    textColor: "#ffffff",
    text: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    symbol: "~",
  },
  delete: {
    label: "Delete",
    color: "#ef4444",
    textColor: "#ffffff",
    text: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    symbol: "-",
  },
  replace: {
    label: "Replace",
    color: "#f59e0b",
    textColor: "#020617",
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    symbol: "±",
  },
  "no-op": {
    label: "No-op",
    color: "#64748b",
    textColor: "#ffffff",
    text: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/30",
    symbol: "=",
  },
  read: {
    label: "Read",
    color: "#ec4899",
    textColor: "#ffffff",
    text: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
    symbol: "?",
  },
  data: {
    label: "Data Source",
    color: "#ec4899",
    textColor: "#ffffff",
    text: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
    symbol: "?",
  },
  module: {
    label: "Module",
    color: "#a855f7",
    textColor: "#ffffff",
    text: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    symbol: "M",
  },
  variable: {
    label: "Variable",
    color: "#0ea5e9",
    textColor: "#020617",
    text: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
    symbol: "V",
  },
  output: {
    label: "Output",
    color: "#eab308",
    textColor: "#020617",
    text: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    symbol: "O",
  },
};

export const METRIC_KEYS = ["create", "update", "delete", "replace", "no-op", "read"];

export const LEGEND_KEYS = [
  "create",
  "update",
  "delete",
  "replace",
  "no-op",
  "data",
  "module",
  "variable",
  "output",
];

