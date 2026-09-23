import "./globals.css";

export const metadata = {
  title: "Plan Parse - Terraform DAG Visualizer",
  description: "Interactive Terraform Plan DAG Visualizer and Inspector",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script src="/cytoscape-bundle.js" async={false}></script>
      </head>
      <body className="bg-slate-950 text-slate-100 overflow-hidden w-screen h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
