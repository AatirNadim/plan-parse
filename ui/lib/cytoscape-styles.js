import { ACTION_COLORS, ACTION_TEXT_COLORS } from "./action-theme";

export const CYTOSCAPE_STYLES = [
  {
    selector: "node",
    style: {
      label: "data(label)",
      color: "#f8fafc",
      "font-family": "'DM Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "font-size": "13px",
      "text-valign": "center",
      "text-halign": "center",
      width: "label",
      height: "label",
      padding: "10px",
      cursor: "pointer",
    },
  },
  {
    selector: "edge",
    style: {
      "curve-style": "taxi",
      "taxi-direction": "rightward",
      width: 2,
      "line-color": "#475569",
      "target-arrow-shape": "triangle",
      "target-arrow-color": "#475569",
      "arrow-scale": 0.8,
      opacity: 0.7,
    },
  },
  {
    selector: ".basename",
    style: {
      padding: "40px",
      "font-weight": "bold",
      "font-size": "16px",
      shape: "roundrectangle",
      "border-width": 2,
      "border-color": "#4f46e5",
      "background-color": "#0f172a",
      "background-opacity": 0.6,
      "text-valign": "top",
      "text-margin-y": 15,
    },
  },
  {
    selector: ".module",
    style: {
      padding: "30px",
      "font-weight": "600",
      "font-size": "14px",
      shape: "roundrectangle",
      "border-width": 2,
      "border-color": "#a855f7",
      "background-color": "#1e1b4b",
      "background-opacity": 0.5,
      "text-valign": "top",
      "text-margin-y": 15,
    },
  },
  {
    selector: ".fname",
    style: {
      padding: "20px",
      "font-weight": "500",
      "font-size": "13px",
      shape: "roundrectangle",
      "border-width": 1,
      "border-color": "#334155",
      "background-color": "#090d16",
      "background-opacity": 0.6,
      "text-valign": "top",
      "text-margin-y": 12,
    },
  },
  {
    selector: ".resource-type",
    style: {
      padding: "16px",
      "font-weight": "500",
      "font-size": "12px",
      shape: "roundrectangle",
      "border-width": 1,
      "border-color": "#475569",
      "background-color": "#1e293b",
      "background-opacity": 0.5,
      "text-valign": "top",
      "text-margin-y": 10,
    },
  },
  {
    selector: ".data-type",
    style: {
      padding: "16px",
      "font-weight": "500",
      "font-size": "12px",
      shape: "roundrectangle",
      "border-width": 1,
      "border-color": "#ec4899",
      "background-color": "#1e293b",
      "background-opacity": 0.5,
      "text-valign": "top",
      "text-margin-y": 10,
    },
  },
  {
    selector: ".resource-name, .data-name",
    style: {
      shape: "roundrectangle",
      padding: "10px",
      "text-valign": "center",
      "text-halign": "center",
      "font-weight": "600",
      "font-size": "12px",
      color: "#ffffff",
      "border-width": 1,
      "border-color": "rgba(255,255,255,0.2)",
    },
  },
  {
    selector: ".create",
    style: {
      "background-color": ACTION_COLORS.create,
      color: ACTION_TEXT_COLORS.create,
    },
  },
  {
    selector: ".delete",
    style: {
      "background-color": ACTION_COLORS.delete,
      color: ACTION_TEXT_COLORS.delete,
    },
  },
  {
    selector: ".update",
    style: {
      "background-color": ACTION_COLORS.update,
      color: ACTION_TEXT_COLORS.update,
    },
  },
  {
    selector: ".replace",
    style: {
      "background-color": ACTION_COLORS.replace,
      color: ACTION_TEXT_COLORS.replace,
    },
  },
  {
    selector: ".no-op",
    style: {
      "background-color": ACTION_COLORS["no-op"],
      color: ACTION_TEXT_COLORS["no-op"],
    },
  },
  {
    selector: ".variable",
    style: {
      "background-color": ACTION_COLORS.variable,
      color: ACTION_TEXT_COLORS.variable,
      shape: "roundrectangle",
      "font-size": "12px",
      padding: "8px",
    },
  },
  {
    selector: ".output",
    style: {
      "background-color": ACTION_COLORS.output,
      color: ACTION_TEXT_COLORS.output,
      shape: "roundrectangle",
      "font-size": "12px",
      padding: "8px",
    },
  },
  {
    selector: ".locals",
    style: {
      "background-color": "#0f172a",
      "border-width": 1,
      "border-color": "#64748b",
      shape: "roundrectangle",
      "font-size": "12px",
      padding: "8px",
    },
  },
  {
    selector: ".dimmed",
    style: { opacity: 0.18 },
  },
  {
    selector: ".highlighted",
    style: {
      "border-width": 3,
      "border-color": "#38bdf8",
      opacity: 1,
    },
  },
  {
    selector: "edge.highlighted-edge",
    style: {
      width: 3,
      "line-color": "#38bdf8",
      "target-arrow-color": "#38bdf8",
      opacity: 1,
    },
  },
];
