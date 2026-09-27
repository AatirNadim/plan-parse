import { ACTION_COLORS } from "./action-theme";

/**
 * Precision Technical Schematic styling for Cytoscape DAG.
 * High-contrast dark engineering nodes with crisp 1px borders and semantic action badges.
 */
export const CYTOSCAPE_STYLES = [
  {
    selector: "node",
    style: {
      label: "data(label)",
      color: "#e2e8f0",
      "font-family": "'DM Mono', 'SFMono-Regular', Menlo, Monaco, Consolas, monospace",
      "font-size": "11px",
      "font-weight": "500",
      "text-valign": "center",
      "text-halign": "center",
      width: "label",
      height: "label",
      padding: "8px 14px",
      shape: "roundrectangle",
      "background-color": "#151924",
      "border-width": 1,
      "border-color": "#2a3346",
      cursor: "pointer",
    },
  },
  {
    selector: "edge",
    style: {
      "curve-style": "taxi",
      "taxi-direction": "rightward",
      width: 1.5,
      "line-color": "#334155",
      "target-arrow-shape": "triangle",
      "target-arrow-color": "#334155",
      "arrow-scale": 0.7,
      opacity: 0.75,
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
      "border-color": "#232936",
      "background-color": "#0c0e14",
      "background-opacity": 0.8,
      color: "#94a3b8",
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
      "border-color": "#323b4e",
      "background-color": "#0f121a",
      "background-opacity": 0.45,
      color: "#c084fc",
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
      "border-color": "#1e2638",
      "background-color": "#0a0d14",
      "background-opacity": 0.5,
      color: "#64748b",
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
      "background-color": "#064e3b",
      "background-opacity": 0.35,
      color: "#a7f3d0",
    },
  },
  {
    selector: ".delete",
    style: {
      "border-color": ACTION_COLORS.delete,
      "border-width": 1.5,
      "background-color": "#881337",
      "background-opacity": 0.35,
      color: "#fecdd3",
    },
  },
  {
    selector: ".update",
    style: {
      "border-color": ACTION_COLORS.update,
      "border-width": 1.5,
      "background-color": "#0c4a6e",
      "background-opacity": 0.35,
      color: "#bae6fd",
    },
  },
  {
    selector: ".replace",
    style: {
      "border-color": ACTION_COLORS.replace,
      "border-width": 1.5,
      "background-color": "#78350f",
      "background-opacity": 0.35,
      color: "#fde68a",
    },
  },
  {
    selector: ".no-op",
    style: {
      "border-color": "#334155",
      "border-width": 1,
      "background-color": "#151924",
      "background-opacity": 0.6,
      color: "#94a3b8",
    },
  },
  {
    selector: ".variable",
    style: {
      "border-color": ACTION_COLORS.variable,
      "border-width": 1.5,
      "border-style": "dashed",
      "background-color": "#1e1b4b",
      "background-opacity": 0.5,
      color: "#c7d2fe",
    },
  },
  {
    selector: ".output",
    style: {
      "border-color": ACTION_COLORS.output,
      "border-width": 1.5,
      "border-style": "double",
      "background-color": "#4a044e",
      "background-opacity": 0.5,
      color: "#f5d0fe",
    },
  },
  {
    selector: ".dimmed",
    style: {
      opacity: 0.15,
    },
  },
  {
    selector: ".highlighted",
    style: {
      "border-width": 2.5,
      "border-color": "#38bdf8",
      "background-color": "#0f2338",
      "background-opacity": 0.9,
      color: "#ffffff",
      opacity: 1,
      "z-index": 999,
    },
  },
  {
    selector: "edge.highlighted-edge",
    style: {
      width: 2.5,
      "line-color": "#38bdf8",
      "target-arrow-color": "#38bdf8",
      opacity: 1,
      "z-index": 998,
    },
  },
];
