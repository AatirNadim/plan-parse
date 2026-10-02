import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uiRoot = path.resolve(__dirname, "..");

describe("Not Found (404) & Server Endpoints Guidance Specifications", () => {
  const notFoundPath = path.join(uiRoot, "app", "not-found.js");
  const pagePath = path.join(uiRoot, "app", "page.js");
  const out404Path = path.join(uiRoot, "out", "404.html");

  test("ui/app/not-found.js exists and is configured as a client component", () => {
    assert.ok(fs.existsSync(notFoundPath), "ui/app/not-found.js must exist");
    const content = fs.readFileSync(notFoundPath, "utf-8");
    assert.ok(content.startsWith('"use client"') || content.startsWith("'use client'"), "Must be a client component");
  });

  test("not-found.js links back to the root visualization dashboard", () => {
    const content = fs.readFileSync(notFoundPath, "utf-8");
    assert.ok(content.includes('href="/"'), "Must contain link to dashboard root /");
    assert.ok(content.includes("Visualization Dashboard") || content.includes("Dashboard"), "Must label link to dashboard");
  });

  test("not-found.js documents all 4 backend server endpoints", () => {
    const content = fs.readFileSync(notFoundPath, "utf-8");
    const requiredEndpoints = [
      "/api/health",
      "/api/status",
      "/api/graph",
      "/api/parse",
    ];

    for (const ep of requiredEndpoints) {
      assert.ok(content.includes(ep), `Must document endpoint ${ep}`);
    }

    assert.ok(content.includes("GET"), "Must specify GET HTTP method");
    assert.ok(content.includes("POST"), "Must specify POST HTTP method");
  });

  test("not-found.js provides curl examples and sample payloads for server endpoints", () => {
    const content = fs.readFileSync(notFoundPath, "utf-8");
    assert.ok(content.includes("curl -s http://127.0.0.1:9000/api/health"), "Must contain health curl example");
    assert.ok(content.includes("curl -s http://127.0.0.1:9000/api/status"), "Must contain status curl example");
    assert.ok(content.includes("curl -s http://127.0.0.1:9000/api/graph"), "Must contain graph curl example");
    assert.ok(content.includes("curl -X POST http://127.0.0.1:9000/api/parse"), "Must contain parse curl example");
    assert.ok(content.includes("alive"), "Must include sample health response");
    assert.ok(content.includes("cli_loaded"), "Must include sample status response");
  });

  test("not-found.js supports copy-to-clipboard for curl and responses", () => {
    const content = fs.readFileSync(notFoundPath, "utf-8");
    assert.ok(content.includes("copyToClipboard"), "Must implement copyToClipboard function");
    assert.ok(content.includes("Copied!"), "Must display Copied! visual confirmation");
  });

  test("not-found.js integrates dark/light theme switching with useTheme", () => {
    const content = fs.readFileSync(notFoundPath, "utf-8");
    assert.ok(content.includes('import { useTheme } from "../lib/use-theme"'), "Must import useTheme");
    assert.ok(content.includes("toggleTheme"), "Must expose theme toggle trigger");
  });

  test("not-found.js listens for Escape key to navigate back to dashboard", () => {
    const content = fs.readFileSync(notFoundPath, "utf-8");
    assert.ok(content.includes('"Escape"'), "Must listen for Escape key");
  });

  test("ui/app/page.js invokes notFound() when accessed on non-root paths", () => {
    const pageContent = fs.readFileSync(pagePath, "utf-8");
    assert.ok(pageContent.includes("notFound"), "page.js must import or reference notFound");
    assert.ok(pageContent.includes("usePathname"), "page.js must inspect usePathname");
    assert.ok(
      pageContent.includes('pathname !== "/"') || pageContent.includes("pathname !== '/'"),
      "page.js must verify pathname is not root"
    );
  });

  test("Next.js build exports out/404.html with not-found content", () => {
    assert.ok(fs.existsSync(out404Path), "out/404.html must exist from build");
    const outContent = fs.readFileSync(out404Path, "utf-8");
    assert.ok(outContent.includes("Route Not Found") || outContent.includes("404"), "out/404.html must contain 404 header");
    assert.ok(outContent.includes("/api/health"), "out/404.html must contain /api/health");
    assert.ok(outContent.includes("/api/parse"), "out/404.html must contain /api/parse");
  });
});
