/**
 * Single source of truth for Terraform action colors, symbols, badges, and tokens.
 * Strict semantic discipline: Colors represent Terraform change states only.
 */

export const ACTION_COLORS = {
  create: "#10b981",    // Emerald
  update: "#0284c7",    // Sky/Blue
  delete: "#f43f5e",    // Rose
  replace: "#f59e0b",   // Amber
  "no-op": "#64748b",   // Slate
  noop: "#64748b",
  data: "#ec4899",      // Pink
  read: "#ec4899",
  module: "#8b5cf6",    // Violet
  variable: "#0ea5e9",  // Cyan
  output: "#eab308",    // Yellow
};

export const ACTION_CONFIG = {
  create: {
    label: "Create",
    color: "#10b981",
    textColor: "#090a0f",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    symbol: "+",
    badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  },
  update: {
    label: "Update",
    color: "#0284c7",
    textColor: "#ffffff",
    text: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
    symbol: "~",
    badge: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
  },
  delete: {
    label: "Delete",
    color: "#f43f5e",
    textColor: "#ffffff",
    text: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    symbol: "-",
    badge: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
  },
  replace: {
    label: "Replace",
    color: "#f59e0b",
    textColor: "#090a0f",
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    symbol: "±",
    badge: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  },
  "no-op": {
    label: "No-op",
    color: "#64748b",
    textColor: "#ffffff",
    text: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/30",
    symbol: "=",
    badge: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
  },
  noop: {
    label: "No-op",
    color: "#64748b",
    textColor: "#ffffff",
    text: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/30",
    symbol: "=",
    badge: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
  },
  read: {
    label: "Read",
    color: "#ec4899",
    textColor: "#ffffff",
    text: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
    symbol: "?",
    badge: "bg-pink-500/10 text-pink-400 border border-pink-500/20",
  },
  data: {
    label: "Data Source",
    color: "#ec4899",
    textColor: "#ffffff",
    text: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
    symbol: "D",
    badge: "bg-pink-500/10 text-pink-400 border border-pink-500/20",
  },
  module: {
    label: "Module",
    color: "#8b5cf6",
    textColor: "#ffffff",
    text: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    symbol: "M",
    badge: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  },
  variable: {
    label: "Variable",
    color: "#0ea5e9",
    textColor: "#090a0f",
    text: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    symbol: "V",
    badge: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
  },
  output: {
    label: "Output",
    color: "#eab308",
    textColor: "#090a0f",
    text: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    symbol: "O",
    badge: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
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
];

