import "./globals.css";
import { siteMetadata } from "../lib/site-metadata";

export const metadata = siteMetadata;

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script src="/cytoscape-bundle.js" async={false}></script>
      </head>
      <body className="font-sans bg-workbench-bg text-slate-200 overflow-hidden w-screen h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
