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
      colors: {
        action: {
          create: "#22c55e",
          delete: "#ef4444",
          update: "#3b82f6",
          replace: "#f59e0b",
          noop: "#64748b",
          data: "#ec4899",
          module: "#a855f7",
          variable: "#0ea5e9",
          output: "#eab308",
        },
      },
    },
  },
  plugins: [],
};
