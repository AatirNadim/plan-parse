import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { siteMetadata } from "./site-metadata.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uiRoot = path.resolve(__dirname, "..");

describe("Site Metadata & Favicon Specifications", () => {
  test("metadata contains correct favicon and touch icons", () => {
    assert.ok(siteMetadata.icons, "metadata must define icons");
    assert.equal(siteMetadata.icons.icon, "/icon.svg");
    assert.equal(siteMetadata.icons.shortcut, "/icon.svg");
    assert.equal(siteMetadata.icons.apple, "/icon.svg");
  });

  test("metadata contains OpenGraph specification with 512x512 SVG image", () => {
    assert.ok(siteMetadata.openGraph, "metadata must define openGraph");
    assert.equal(siteMetadata.openGraph.title, "Plan Parse - Terraform DAG Visualizer");
    assert.equal(siteMetadata.openGraph.description, "Interactive Terraform Plan DAG Visualizer and Workbench");
    assert.ok(Array.isArray(siteMetadata.openGraph.images), "openGraph.images must be an array");
    assert.equal(siteMetadata.openGraph.images.length, 1);

    const ogImage = siteMetadata.openGraph.images[0];
    assert.equal(ogImage.url, "/icon.svg");
    assert.equal(ogImage.width, 512);
    assert.equal(ogImage.height, 512);
    assert.equal(ogImage.type, "image/svg+xml");
    assert.equal(ogImage.alt, "Plan Parse DAG Visualizer");
  });

  test("metadata contains Twitter summary card with icon preview", () => {
    assert.ok(siteMetadata.twitter, "metadata must define twitter");
    assert.equal(siteMetadata.twitter.card, "summary");
    assert.equal(siteMetadata.twitter.title, "Plan Parse - Terraform DAG Visualizer");
    assert.equal(siteMetadata.twitter.description, "Interactive Terraform Plan DAG Visualizer and Workbench");
    assert.deepEqual(siteMetadata.twitter.images, ["/icon.svg"]);
  });

  test("public/icon.svg exists and has valid 512x512 SVG structure", () => {
    const iconPath = path.join(uiRoot, "public", "icon.svg");
    assert.ok(fs.existsSync(iconPath), "public/icon.svg must exist");

    const svgContent = fs.readFileSync(iconPath, "utf-8");
    assert.ok(svgContent.includes('<svg width="512" height="512" viewBox="0 0 512 512"'), "Must be 512x512 SVG");
    assert.ok(svgContent.includes('xmlns="http://www.w3.org/2000/svg"'), "Must have SVG namespace");
    assert.ok(svgContent.trim().endsWith("</svg>"), "Must be closed SVG");
  });

  test("layout.js imports metadata and defines head link tags for favicon", () => {
    const layoutPath = path.join(uiRoot, "app", "layout.js");
    const layoutContent = fs.readFileSync(layoutPath, "utf-8");

    assert.ok(
      layoutContent.includes('import { siteMetadata } from "../lib/site-metadata"'),
      "layout.js must import siteMetadata"
    );
    assert.ok(
      layoutContent.includes("export const metadata = siteMetadata;"),
      "layout.js must export metadata"
    );
    assert.ok(
      layoutContent.includes('<link rel="icon" type="image/svg+xml" href="/icon.svg" />'),
      "layout.js must include SVG favicon link in head"
    );
    assert.ok(
      layoutContent.includes('<link rel="apple-touch-icon" href="/icon.svg" />'),
      "layout.js must include apple-touch-icon link in head"
    );
  });

  test("AppHeader.js permanently renders icon.svg regardless of graph state", () => {
    const headerPath = path.join(uiRoot, "components", "AppHeader.js");
    const headerContent = fs.readFileSync(headerPath, "utf-8");

    assert.ok(!headerContent.includes("hasGraph && (\n            <img"), "AppHeader icon must not be guarded by hasGraph");
    assert.ok(!headerContent.includes("hasGraph && <img"), "AppHeader icon must not be guarded by hasGraph");
    assert.ok(headerContent.includes('src="/icon.svg"'), "AppHeader must reference /icon.svg");
    assert.ok(
      headerContent.includes('alt="Plan Parse DAG Icon"'),
      "AppHeader must specify accessible alt text"
    );
    assert.ok(
      headerContent.includes("w-5 h-5 rounded shrink-0"),
      "AppHeader must apply crisp sizing and styling"
    );
  });

  test("WorkbenchSidebar.js renders icon.svg in the input panel and reverted upload symbol in dropzone", () => {
    const sidebarPath = path.join(uiRoot, "components", "WorkbenchSidebar.js");
    const sidebarContent = fs.readFileSync(sidebarPath, "utf-8");

    assert.ok(sidebarContent.includes('activeTab === "source"'), "WorkbenchSidebar must have source input panel");
    assert.ok(sidebarContent.includes('src="/icon.svg"'), "WorkbenchSidebar must reference /icon.svg");
    assert.ok(
      sidebarContent.includes("Plan Ingestion"),
      "WorkbenchSidebar input panel must display Plan Ingestion title"
    );
    assert.ok(
      sidebarContent.includes("Terraform &amp; OpenTofu DAG Engine"),
      "WorkbenchSidebar input panel must display DAG engine subtitle"
    );
    assert.ok(
      sidebarContent.includes("w-14 h-14 rounded-lg shrink-0 shadow-md select-none"),
      "WorkbenchSidebar banner must display 56x56 icon"
    );
    assert.ok(
      sidebarContent.includes("M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"),
      "WorkbenchSidebar dropzone must revert to upload cloud/arrow SVG symbol"
    );
  });

  test("page.js renders icon.svg in empty workbench canvas card", () => {
    const pagePath = path.join(uiRoot, "app", "page.js");
    const pageContent = fs.readFileSync(pagePath, "utf-8");

    assert.ok(pageContent.includes("!hasGraph && ("), "page.js must have empty canvas card");
    assert.ok(pageContent.includes('src="/icon.svg"'), "page.js empty canvas card must render /icon.svg");
    assert.ok(
      pageContent.includes('alt="Plan Parse"'),
      "page.js empty canvas card must specify alt text"
    );
  });
});
