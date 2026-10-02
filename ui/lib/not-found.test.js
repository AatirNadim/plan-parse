import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uiRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(uiRoot, "..");

describe("Server-Served Not Found Page & Clean UI Route Specifications", () => {
  const notFoundHtmlPath = path.join(repoRoot, "pkg", "server", "not_found.html");
  const pagePath = path.join(uiRoot, "app", "page.js");
  const notFoundJsPath = path.join(uiRoot, "app", "not-found.js");

  test("ui/app/not-found.js is removed from the UI application", () => {
    assert.equal(fs.existsSync(notFoundJsPath), false, "ui/app/not-found.js must be removed from ui app");
  });

  test("ui/app/page.js does not contain url-catching notFound logic", () => {
    const pageContent = fs.readFileSync(pagePath, "utf-8");
    assert.equal(pageContent.includes("notFound"), false, "page.js must not import or invoke notFound");
    assert.equal(pageContent.includes("usePathname"), false, "page.js must not import or use usePathname");
  });

  test("pkg/server/not_found.html exists and is embedded by Go", () => {
    assert.ok(fs.existsSync(notFoundHtmlPath), "pkg/server/not_found.html must exist");
  });

  test("not_found.html links back to the root visualization dashboard", () => {
    const content = fs.readFileSync(notFoundHtmlPath, "utf-8");
    assert.ok(content.includes('href="/"'), "Must contain link to dashboard root /");
    assert.ok(content.includes("Dashboard"), "Must label link to dashboard");
  });

  test("not_found.html documents all 4 backend server endpoints", () => {
    const content = fs.readFileSync(notFoundHtmlPath, "utf-8");
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

  test("not_found.html provides curl examples and sample payloads for server endpoints", () => {
    const content = fs.readFileSync(notFoundHtmlPath, "utf-8");
    assert.ok(content.includes("curl -s http://127.0.0.1:9000/api/health"), "Must contain health curl example");
    assert.ok(content.includes("curl -s http://127.0.0.1:9000/api/status"), "Must contain status curl example");
    assert.ok(content.includes("curl -s http://127.0.0.1:9000/api/graph"), "Must contain graph curl example");
    assert.ok(content.includes("curl -X POST http://127.0.0.1:9000/api/parse"), "Must contain parse curl example");
    assert.ok(content.includes("alive"), "Must include sample health response");
    assert.ok(content.includes("cli_loaded"), "Must include sample status response");
  });

  test("not_found.html supports copy-to-clipboard for curl and responses", () => {
    const content = fs.readFileSync(notFoundHtmlPath, "utf-8");
    assert.ok(content.includes("copy-btn"), "Must implement copy buttons");
    assert.ok(content.includes("Copied!"), "Must display Copied! visual confirmation");
  });

  test("not_found.html supports theme toggle synchronized with plan-parse-theme", () => {
    const content = fs.readFileSync(notFoundHtmlPath, "utf-8");
    assert.ok(content.includes("plan-parse-theme"), "Must sync with plan-parse-theme storage key");
  });

  test("not_found.html listens for Escape key to navigate back to dashboard", () => {
    const content = fs.readFileSync(notFoundHtmlPath, "utf-8");
    assert.ok(content.includes("Escape"), "Must listen for Escape key");
  });
});
