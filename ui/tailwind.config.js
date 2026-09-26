/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'DM Sans'", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        mono: ["'DM Mono'", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      colors: {
        workbench: {
          bg: "#090a0f",
          header: "#0c0e14",
          panel: "#0f121a",
          subpanel: "#151924",
          card: "#181d2a",
          border: "#232936",
          hover: "#1c2230",
          active: "#252d3d",
          muted: "#717d96",
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
