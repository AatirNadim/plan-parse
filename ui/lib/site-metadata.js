/**
 * Global site metadata configuration for Plan Parse.
 * Configures title, description, favicon, OpenGraph, and Twitter card preview metadata.
 */
export const siteMetadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "Workbench - Plan Parse",
  description: "Interactive Terraform Plan DAG Visualizer and Workbench",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Plan Parse - Terraform DAG Visualizer",
    description: "Interactive Terraform Plan DAG Visualizer and Workbench",
    images: [
      {
        url: "/icon.svg",
        width: 512,
        height: 512,
        type: "image/svg+xml",
        alt: "Plan Parse DAG Visualizer",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Plan Parse - Terraform DAG Visualizer",
    description: "Interactive Terraform Plan DAG Visualizer and Workbench",
    images: ["/icon.svg"],
  },
};

/**
 * Viewport configuration ensuring mobile rendering adaptability across all engines.
 * Configures interactive viewport fit, device-width, initial scale, and dynamic theme colors.
 */
export const siteViewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#090a0f" },
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
  ],
};

