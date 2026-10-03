import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { siteViewport } from "./site-metadata.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uiRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(uiRoot, "..");

describe("Cross-Browser Rendering Engine Adaptability Specifications", () => {
  const packageJsonPath = path.join(uiRoot, "package.json");
  const globalsCssPath = path.join(uiRoot, "app", "globals.css");
  const layoutPath = path.join(uiRoot, "app", "layout.js");
  const pagePath = path.join(uiRoot, "app", "page.js");
  const tailwindConfigPath = path.join(uiRoot, "tailwind.config.js");
  const notFoundHtmlPath = path.join(repoRoot, "pkg", "server", "not_found.html");

  test("package.json specifies browserslist covering Blink, WebKit, and Gecko engines", () => {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    assert.ok(Array.isArray(pkg.browserslist), "package.json must contain browserslist array");
    const blStr = pkg.browserslist.join(" ");

    assert.ok(blStr.includes("Safari >= 14"), "Must target Safari for WebKit vendor prefixing");
    assert.ok(blStr.includes("iOS >= 14"), "Must target iOS Safari for mobile WebKit");
    assert.ok(blStr.includes("Firefox"), "Must target Firefox for Gecko");
    assert.ok(blStr.includes("Chrome") || blStr.includes("last 2 versions"), "Must target Chrome/Chromium for Blink");
  });

  test("globals.css defines standards-compliant scrollbar rules for Gecko (Firefox)", () => {
    const css = fs.readFileSync(globalsCssPath, "utf-8");
    assert.ok(css.includes("scrollbar-width: thin;"), "Must declare standard scrollbar-width: thin");
    assert.ok(css.includes("scrollbar-color:"), "Must declare standard scrollbar-color");
    assert.ok(css.includes("html.light *"), "Must support light theme scrollbar-color on all elements");
  });

  test("globals.css defines WebKit and Blink scrollbar pseudo-elements", () => {
    const css = fs.readFileSync(globalsCssPath, "utf-8");
    assert.ok(css.includes("::-webkit-scrollbar"), "Must declare ::-webkit-scrollbar");
    assert.ok(css.includes("::-webkit-scrollbar-thumb"), "Must declare ::-webkit-scrollbar-thumb");
    assert.ok(css.includes("::-webkit-scrollbar-track"), "Must declare ::-webkit-scrollbar-track");
  });

  test("globals.css implements touch-action and selection isolation for canvas container", () => {
    const css = fs.readFileSync(globalsCssPath, "utf-8");
    assert.ok(css.includes("touch-action: none;"), "#cy must declare touch-action: none to isolate gestures");
    assert.ok(css.includes("-webkit-touch-callout: none;"), "#cy must suppress iOS callout sheet");
    assert.ok(css.includes("-webkit-user-select: none;"), "#cy must suppress WebKit text selection during drag");
    assert.ok(css.includes("-moz-user-select: none;"), "#cy must suppress Gecko text selection during drag");
  });

  test("globals.css implements WebKit vendor prefix fallback for backdrop-filter", () => {
    const css = fs.readFileSync(globalsCssPath, "utf-8");
    assert.ok(css.includes("-webkit-backdrop-filter: blur(2px)"), "Must support -webkit-backdrop-filter on blur-xs");
    assert.ok(css.includes("-webkit-backdrop-filter: blur(4px)"), "Must support -webkit-backdrop-filter on blur-sm");
    assert.ok(css.includes("-webkit-backdrop-filter: blur(12px)"), "Must support -webkit-backdrop-filter on blur-md");
  });

  test("globals.css normalizes text-size-adjust and tap-highlight-color", () => {
    const css = fs.readFileSync(globalsCssPath, "utf-8");
    assert.ok(css.includes("-webkit-text-size-adjust: 100%;"), "Must normalize -webkit-text-size-adjust");
    assert.ok(css.includes("-moz-text-size-adjust: 100%;"), "Must normalize -moz-text-size-adjust");
    assert.ok(css.includes("-webkit-tap-highlight-color: transparent;"), "Must disable mobile tap highlight rectangle");
    assert.ok(css.includes("overscroll-behavior: none;"), "Must prevent elastic bounce scroll and gesture conflict");
  });

  test("globals.css prevents iOS Safari auto-zoom on input focus", () => {
    const css = fs.readFileSync(globalsCssPath, "utf-8");
    assert.ok(css.includes("@media screen and (max-width: 768px)"), "Must declare mobile input media query");
    assert.ok(css.includes("font-size: 16px !important;"), "Must enforce >=16px font-size on mobile inputs");
  });

  test("globals.css defines safe-area padding utilities for notched mobile displays", () => {
    const css = fs.readFileSync(globalsCssPath, "utf-8");
    assert.ok(css.includes("env(safe-area-inset-top"), "Must support safe-area-inset-top");
    assert.ok(css.includes("env(safe-area-inset-bottom"), "Must support safe-area-inset-bottom");
  });

  test("layout.js and page.js use dynamic dvh units and avoid breaking 100vw", () => {
    const layoutContent = fs.readFileSync(layoutPath, "utf-8");
    const pageContent = fs.readFileSync(pagePath, "utf-8");

    assert.ok(layoutContent.includes("h-[100dvh]"), "layout.js must use dynamic viewport height h-[100dvh]");
    assert.ok(layoutContent.includes("w-full"), "layout.js must use w-full rather than w-screen to prevent scrollbar jitter");
    assert.ok(!layoutContent.includes("w-screen"), "layout.js must not use w-screen on body");

    assert.ok(pageContent.includes("h-[100dvh]"), "page.js must use dynamic viewport height h-[100dvh]");
    assert.ok(pageContent.includes("w-full"), "page.js must use w-full rather than w-screen");
    assert.ok(!pageContent.includes("w-screen"), "page.js must not use w-screen");
  });

  test("page.js uses ResizeObserver for responsive canvas recalibration", () => {
    const pageContent = fs.readFileSync(pagePath, "utf-8");
    assert.ok(pageContent.includes("ResizeObserver"), "page.js must implement ResizeObserver for canvas container");
    assert.ok(pageContent.includes("scheduleResize") || pageContent.includes("handleResize"), "page.js must schedule resize");
    assert.ok(pageContent.includes("cancelAnimationFrame"), "page.js must debounce canvas resize with requestAnimationFrame");
  });

  test("tailwind.config.js includes native font fallbacks for Chromium, WebKit, and Gecko", () => {
    const tailwindContent = fs.readFileSync(tailwindConfigPath, "utf-8");
    assert.ok(tailwindContent.includes("-apple-system"), "Must include -apple-system for WebKit/macOS/iOS");
    assert.ok(tailwindContent.includes("BlinkMacSystemFont"), "Must include BlinkMacSystemFont for Chromium on macOS");
    assert.ok(tailwindContent.includes("Segoe UI"), "Must include Segoe UI for Chromium/Gecko on Windows");
    assert.ok(tailwindContent.includes("Liberation Mono"), "Must include Liberation Mono for Gecko/Linux");
    assert.ok(tailwindContent.includes("SFMono-Regular"), "Must include SFMono-Regular for WebKit monospace");
  });

  test("site-metadata.js exports siteViewport with viewportFit cover and themeColor", () => {
    assert.ok(siteViewport, "site-metadata.js must export siteViewport");
    assert.equal(siteViewport.viewportFit, "cover");
    assert.equal(siteViewport.width, "device-width");
    assert.equal(siteViewport.initialScale, 1);
    assert.ok(Array.isArray(siteViewport.themeColor), "siteViewport must define themeColor array");

    const layoutContent = fs.readFileSync(layoutPath, "utf-8");
    assert.ok(layoutContent.includes("export const viewport = siteViewport;"), "layout.js must export viewport");
  });

  test("not_found.html includes cross-engine scrollbars and dynamic dvh height", () => {
    const htmlContent = fs.readFileSync(notFoundHtmlPath, "utf-8");
    assert.ok(htmlContent.includes("100dvh"), "not_found.html must support 100dvh");
    assert.ok(htmlContent.includes("scrollbar-width: thin;"), "not_found.html must support Gecko scrollbars");
    assert.ok(htmlContent.includes("-webkit-tap-highlight-color: transparent;"), "not_found.html must reset tap highlight");
  });
});
