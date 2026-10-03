/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "'DM Sans'",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "'Helvetica Neue'",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "'DM Mono'",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "'Liberation Mono'",
          "'Courier New'",
          "monospace",
        ],
      },
      colors: {
        workbench: {
          bg: "rgb(var(--workbench-bg) / <alpha-value>)",
          header: "rgb(var(--workbench-header) / <alpha-value>)",
          panel: "rgb(var(--workbench-panel) / <alpha-value>)",
          subpanel: "rgb(var(--workbench-subpanel) / <alpha-value>)",
          card: "rgb(var(--workbench-card) / <alpha-value>)",
          border: "rgb(var(--workbench-border) / <alpha-value>)",
          hover: "rgb(var(--workbench-hover) / <alpha-value>)",
          active: "rgb(var(--workbench-active) / <alpha-value>)",
          muted: "rgb(var(--workbench-muted) / <alpha-value>)",
        },
        action: {
          create: "#10b981",
          delete: "#f43f5e",
          update: "#0284c7",
          replace: "#f59e0b",
          noop: "#64748b",
          data: "#ec4899",
          module: "#8b5cf6",
          variable: "#0ea5e9",
          output: "#eab308",
        },
      },
    },
  },
  plugins: [],
};
