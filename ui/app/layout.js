import { DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata = {
  title: "Plan Parse - Terraform DAG Visualizer",
  description: "Interactive Terraform Plan DAG Visualizer and Inspector",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable}`}>
      <head>
        <script src="/cytoscape-bundle.js" async={false}></script>
      </head>
      <body className={`${dmSans.variable} ${dmMono.variable} font-sans bg-slate-950 text-slate-100 overflow-hidden w-screen h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}
