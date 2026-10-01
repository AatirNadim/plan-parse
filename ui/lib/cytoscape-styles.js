import { ACTION_COLORS } from "./action-theme.js";

/**
 * Precision Technical Schematic styling for Cytoscape DAG.
 * Supports both Dark and Light theme archetypes with crisp 1px borders and semantic action badges.
 *
 * @param {"dark" | "light"} theme
 * @returns {Array<object>} Cytoscape stylesheet array
 */
export function getCytoscapeStyles(theme = "dark") {
  const isLight = theme === "light";

  return [
    {
      selector: "node",
      style: {
        label: "data(label)",
        color: isLight ? "#0f172a" : "#e2e8f0",
        "font-family": "'DM Mono', 'SFMono-Regular', Menlo, Monaco, Consolas, monospace",
        "font-size": "11px",
        "font-weight": "500",
        "text-valign": "center",
        "text-halign": "center",
        width: "label",
        height: "label",
        padding: "8px 14px",
        shape: "roundrectangle",
        "background-color": isLight ? "#ffffff" : "#151924",
        "border-width": 1,
        "border-color": isLight ? "#cbd5e1" : "#2a3346",
        cursor: "pointer",
      },
    },
    {
      selector: "edge",
      style: {
        "curve-style": "taxi",
        "taxi-direction": "rightward",
        width: 1.5,
        "line-color": isLight ? "#94a3b8" : "#334155",
        "target-arrow-shape": "triangle",
        "target-arrow-color": isLight ? "#94a3b8" : "#334155",
        "arrow-scale": 0.7,
        opacity: isLight ? 0.85 : 0.75,
      },
    },
    // Compound Root / Base Container
    {
      selector: ".basename",
      style: {
        padding: "32px",
        "font-family": "'DM Sans', sans-serif",
        "font-weight": "600",
        "font-size": "13px",
        shape: "roundrectangle",
        "border-width": 1,
        "border-color": isLight ? "#cbd5e1" : "#232936",
        "background-color": isLight ? "#f1f5f9" : "#0c0e14",
        "background-opacity": isLight ? 0.75 : 0.8,
        color: isLight ? "#475569" : "#94a3b8",
        "text-valign": "top",
        "text-margin-y": 14,
      },
    },
    // Compound Module Containers
    {
      selector: ".module",
      style: {
        padding: "24px",
        "font-family": "'DM Mono', monospace",
        "font-weight": "500",
        "font-size": "12px",
        shape: "roundrectangle",
        "border-width": 1,
        "border-style": "dashed",
        "border-color": isLight ? "#cbd5e1" : "#323b4e",
        "background-color": isLight ? "#f8fafc" : "#0f121a",
        "background-opacity": isLight ? 0.65 : 0.45,
        color: isLight ? "#7c3aed" : "#c084fc",
        "text-valign": "top",
        "text-margin-y": 12,
      },
    },
    // File scope compound container
    {
      selector: ".fname",
      style: {
        padding: "16px",
        "font-family": "'DM Mono', monospace",
        "font-weight": "400",
        "font-size": "11px",
        shape: "roundrectangle",
        "border-width": 1,
        "border-color": isLight ? "#e2e8f0" : "#1e2638",
        "background-color": isLight ? "#f1f5f9" : "#0a0d14",
        "background-opacity": 0.5,
        color: isLight ? "#64748b" : "#64748b",
        "text-valign": "top",
        "text-margin-y": 10,
      },
    },
    // Semantic Action styling for Leaf Nodes
    {
      selector: ".create",
      style: {
        "border-color": ACTION_COLORS.create,
        "border-width": 1.5,
        "background-color": isLight ? "#ecfdf5" : "#064e3b",
        "background-opacity": isLight ? 0.95 : 0.35,
        color: isLight ? "#065f46" : "#a7f3d0",
      },
    },
    {
      selector: ".delete",
      style: {
        "border-color": ACTION_COLORS.delete,
        "border-width": 1.5,
        "background-color": isLight ? "#fff1f2" : "#881337",
        "background-opacity": isLight ? 0.95 : 0.35,
        color: isLight ? "#9f1239" : "#fecdd3",
      },
    },
    {
      selector: ".update",
      style: {
        "border-color": ACTION_COLORS.update,
        "border-width": 1.5,
        "background-color": isLight ? "#f0f9ff" : "#0c4a6e",
        "background-opacity": isLight ? 0.95 : 0.35,
        color: isLight ? "#075985" : "#bae6fd",
      },
    },
    {
      selector: ".replace",
      style: {
        "border-color": ACTION_COLORS.replace,
        "border-width": 1.5,
        "background-color": isLight ? "#fffbeb" : "#78350f",
        "background-opacity": isLight ? 0.95 : 0.35,
        color: isLight ? "#92400e" : "#fde68a",
      },
    },
    {
      selector: ".no-op",
      style: {
        "border-color": isLight ? "#cbd5e1" : "#334155",
        "border-width": 1,
        "background-color": isLight ? "#f8fafc" : "#151924",
        "background-opacity": isLight ? 0.95 : 0.6,
        color: isLight ? "#475569" : "#94a3b8",
      },
    },
    {
      selector: ".variable",
      style: {
        "border-color": ACTION_COLORS.variable,
        "border-width": 1.5,
        "border-style": "dashed",
        "background-color": isLight ? "#eff6ff" : "#1e1b4b",
        "background-opacity": isLight ? 0.95 : 0.5,
        color: isLight ? "#1e40af" : "#c7d2fe",
      },
    },
    {
      selector: ".output",
      style: {
        "border-color": ACTION_COLORS.output,
        "border-width": 1.5,
        "border-style": "double",
        "background-color": isLight ? "#fdf4ff" : "#4a044e",
        "background-opacity": isLight ? 0.95 : 0.5,
        color: isLight ? "#86198f" : "#f5d0fe",
      },
    },
    // Bridged edges synthesized during intermediate node contraction
    {
      selector: ".collapsed-edge, edge.collapsed-edge",
      style: {
        "line-style": "dashed",
        "line-dash-pattern": [6, 4],
        width: 1.75,
        "line-color": isLight ? "#2563eb" : "#60a5fa",
        "target-arrow-color": isLight ? "#2563eb" : "#60a5fa",
        opacity: 0.9,
      },
    },
    {
      selector: ".dimmed",
      style: {
        opacity: isLight ? 0.2 : 0.15,
      },
    },
    {
      selector: ".highlighted",
      style: {
        "border-width": 2.5,
        "border-color": isLight ? "#0284c7" : "#38bdf8",
        "background-color": isLight ? "#e0f2fe" : "#0f2338",
        "background-opacity": 1,
        color: isLight ? "#0369a1" : "#ffffff",
        opacity: 1,
        "z-index": 999,
      },
    },
    {
      selector: "edge.highlighted-edge",
      style: {
        width: 2.5,
        "line-color": isLight ? "#0284c7" : "#38bdf8",
        "target-arrow-color": isLight ? "#0284c7" : "#38bdf8",
        opacity: 1,
        "z-index": 998,
      },
    },
    // Transitive Multi-Hop Blast Radius Precision Archetype Styles
    {
      selector: ".blast-root",
      style: {
        "border-width": 3,
        "border-color": isLight ? "#0284c7" : "#38bdf8",
        "background-color": isLight ? "#e0f2fe" : "#0c2438",
        "background-opacity": 1,
        color: isLight ? "#0369a1" : "#38bdf8",
        "font-weight": "600",
        opacity: 1,
        "z-index": 1000,
      },
    },
    {
      selector: ".blast-direct",
      style: {
        "border-width": 2,
        "border-color": isLight ? "#0284c7" : "#38bdf8",
        "background-color": isLight ? "#f0f9ff" : "#0e2238",
        "background-opacity": 0.95,
        opacity: 1,
        "z-index": 999,
      },
    },
    {
      selector: ".blast-transitive",
      style: {
        "border-width": 1.5,
        "border-style": "dashed",
        "border-color": isLight ? "#38bdf8" : "#0284c7",
        "background-color": isLight ? "#f8fafc" : "#111827",
        "background-opacity": 0.9,
        opacity: 0.95,
        "z-index": 998,
      },
    },
    {
      selector: ".blast-mutating",
      style: {
        "border-width": 2.5,
        "border-color": isLight ? "#e11d48" : "#fb7185",
        "background-color": isLight ? "#fff1f2" : "#2a0d17",
        "background-opacity": 0.95,
        color: isLight ? "#be123c" : "#fda4af",
        "font-weight": "600",
        opacity: 1,
        "z-index": 1001,
      },
    },
    {
      selector: "edge.blast-edge-direct",
      style: {
        width: 2.5,
        "line-color": isLight ? "#0284c7" : "#38bdf8",
        "target-arrow-color": isLight ? "#0284c7" : "#38bdf8",
        opacity: 1,
        "z-index": 997,
      },
    },
    {
      selector: "edge.blast-edge-transitive",
      style: {
        width: 1.75,
        "line-style": "dashed",
        "line-dash-pattern": [5, 3],
        "line-color": isLight ? "#38bdf8" : "#0284c7",
        "target-arrow-color": isLight ? "#38bdf8" : "#0284c7",
        opacity: 0.85,
        "z-index": 996,
      },
    },
    {
      selector: "edge.blast-edge-mutating",
      style: {
        width: 2.5,
        "line-color": isLight ? "#e11d48" : "#fb7185",
        "target-arrow-color": isLight ? "#e11d48" : "#fb7185",
        opacity: 1,
        "z-index": 998,
      },
    },
  ];
}

export const CYTOSCAPE_STYLES = getCytoscapeStyles("dark");
