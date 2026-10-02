"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "../lib/use-theme";

/**
 * Technical Specification for Plan Parse Server REST Endpoints
 */
const SERVER_ENDPOINTS = [
  {
    id: "health",
    method: "GET",
    path: "/api/health",
    tag: "Liveness Probe",
    badgeColor: "sky",
    summary: "Server health & liveness verification",
    description:
      "Returns HTTP 200 with JSON payload confirming the plan-parse daemon is operational, bound to its socket, and ready to process requests.",
    parameters: "None",
    headers: "Accept: application/json",
    sampleCurl: "curl -s http://127.0.0.1:9000/api/health",
    sampleResponse: JSON.stringify({ alive: true }, null, 2),
    notes: "Utilized by container orchestrators, CLI health checks, and CI/CD readiness probes.",
  },
  {
    id: "status",
    method: "GET",
    path: "/api/status",
    tag: "CLI Plan State",
    badgeColor: "sky",
    summary: "Disclose startup CLI plan state & lock status",
    description:
      "Reports whether a Terraform plan was loaded at server startup via the -plan <file> or -dir <path> flags. Operates with a single-use lifecycle: the initial call returns cli_loaded: true and disabled: true; subsequent page reloads transition to cli_loaded: false.",
    parameters: "None",
    headers: "Accept: application/json",
    sampleCurl: "curl -s http://127.0.0.1:9000/api/status",
    sampleResponse: JSON.stringify(
      {
        cli_loaded: true,
        disabled: true,
      },
      null,
      2
    ),
    notes:
      "Prevents state contamination on UI browser refreshes while preserving initial CLI arguments.",
  },
  {
    id: "graph",
    method: "GET",
    path: "/api/graph",
    tag: "DAG Payload",
    badgeColor: "sky",
    summary: "Retrieve pre-parsed dependency graph structure",
    description:
      "Fetches the parsed Directed Acyclic Graph (DAG) containing all resource nodes, dependency edges, module boundaries, and change summary statistics. When started with a CLI plan, the first request returns the complete graph, and subsequent requests return a blank graph.",
    parameters: "None",
    headers: "Accept: application/json",
    sampleCurl: "curl -s http://127.0.0.1:9000/api/graph",
    sampleResponse: JSON.stringify(
      {
        nodes: [
          {
            id: "aws_vpc.primary",
            type: "resource",
            action: "create",
            resourceType: "aws_vpc",
            name: "primary",
          },
          {
            id: "aws_subnet.public",
            type: "resource",
            action: "create",
            resourceType: "aws_subnet",
            name: "public",
          },
        ],
        edges: [
          {
            id: "edge-aws_subnet.public-aws_vpc.primary",
            source: "aws_subnet.public",
            target: "aws_vpc.primary",
          },
        ],
        summary: {
          total: 2,
          create: 2,
          update: 0,
          delete: 0,
          replace: 0,
        },
      },
      null,
      2
    ),
    notes:
      "Consumes the initial CLI plan buffer upon retrieval. Subsequent browser visits require loading plan JSON via UI or /api/parse.",
  },
  {
    id: "parse",
    method: "POST",
    path: "/api/parse",
    tag: "Plan Ingestion Engine",
    badgeColor: "emerald",
    summary: "Ingest & parse Terraform plan JSON without session storage",
    description:
      "Parses an uploaded Terraform plan JSON and returns the resolved DAG graph without mutating or retaining server state. Supports raw JSON body or multipart/form-data with field 'file' or 'plan' up to 50MB.",
    parameters: "Raw JSON body OR multipart/form-data field 'file' / 'plan'",
    headers: "Content-Type: application/json OR multipart/form-data",
    sampleCurl:
      "curl -X POST http://127.0.0.1:9000/api/parse \\\n  -H \"Content-Type: application/json\" \\\n  --data-binary @tf_plan.json",
    sampleResponse: JSON.stringify(
      {
        nodes: [
          {
            id: "module.database.aws_db_instance.main",
            type: "resource",
            action: "update",
            resourceType: "aws_db_instance",
            name: "main",
          },
        ],
        edges: [],
        summary: {
          total: 1,
          create: 0,
          update: 1,
          delete: 0,
          replace: 0,
        },
      },
      null,
      2
    ),
    notes:
      "Completely stateless; enables parallel CI pipelines and rapid local verification without filesystem persistence.",
  },
];

export default function NotFound() {
  const router = useRouter();
  const rawPathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const [currentPath, setCurrentPath] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname || rawPathname || "";
      setCurrentPath(path);
    }
  }, [rawPathname]);

  // Keyboard shortcut listener: Escape returns to dashboard
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) {
        return;
      }
      if (e.key === "Escape") {
        router.push("/");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  const copyToClipboard = useCallback((text, id) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      });
    }
  }, []);

  // Classify attempted path
  const isServerEndpoint = useMemo(() => {
    if (!currentPath) return false;
    return (
      currentPath.startsWith("/api") ||
      currentPath === "/health" ||
      currentPath === "/status" ||
      currentPath === "/graph" ||
      currentPath === "/parse"
    );
  }, [currentPath]);

  // Check matching endpoint for smart highlight
  const matchedEndpointId = useMemo(() => {
    if (!currentPath) return null;
    if (currentPath.includes("health")) return "health";
    if (currentPath.includes("status")) return "status";
    if (currentPath.includes("graph")) return "graph";
    if (currentPath.includes("parse")) return "parse";
    return null;
  }, [currentPath]);

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-workbench-bg text-slate-800 dark:text-slate-200 antialiased font-sans">
      {/* Top Application Header */}
      <header className="h-11 w-full border-b border-workbench-border bg-workbench-header px-4 flex items-center justify-between shrink-0 select-none z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-900 dark:text-white hover:opacity-85 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 rounded"
            title="Return to Dashboard"
          >
            <img
              src="/icon.svg"
              alt="Plan Parse Logo"
              className="w-5 h-5 rounded shrink-0 select-none"
              width={20}
              height={20}
            />
            <span className="font-mono text-xs font-bold tracking-wider uppercase">
              PLAN-PARSE
            </span>
          </Link>
          <span className="text-slate-400 dark:text-slate-600 font-mono text-xs">/</span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            404 // ROUTE_UNMAPPED
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="px-2.5 py-1 rounded text-xs font-mono text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-workbench-subpanel hover:bg-workbench-hover border border-workbench-border transition flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70"
            aria-label="Toggle Light / Dark Theme"
          >
            {theme === "light" ? (
              <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
            <span className="hidden sm:inline">{theme === "light" ? "Light" : "Dark"}</span>
          </button>

          {/* Return CTA */}
          <Link
            href="/"
            className="px-3 py-1 rounded text-xs font-mono font-medium text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 border border-sky-500 transition shadow-sm flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70"
          >
            <span>Dashboard</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </header>

      {/* Main Scrollable Canvas Content */}
      <main className="flex-1 overflow-y-auto canvas-bg custom-scrollbar p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Hero Diagnostic Card */}
          <div className="bg-workbench-panel border border-workbench-border rounded-lg p-5 md:p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 text-[11px] font-mono font-semibold uppercase tracking-wider rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-workbench-border">
                    HTTP 404
                  </span>
                  {currentPath && (
                    <span className="px-2.5 py-0.5 text-xs font-mono rounded bg-workbench-subpanel text-slate-800 dark:text-slate-200 border border-workbench-border">
                      path: <strong className="text-sky-600 dark:text-sky-400">{currentPath}</strong>
                    </span>
                  )}
                  {isServerEndpoint && (
                    <span className="px-2 py-0.5 text-[11px] font-mono font-medium rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      Backend API Route
                    </span>
                  )}
                </div>

                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Route Not Found in UI Application
                </h1>

                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                  {isServerEndpoint ? (
                    <>
                      You attempted to open a backend server endpoint in the web browser. The Plan Parse
                      browser interface is a single-page interactive DAG workbench hosted exclusively at{" "}
                      <code className="px-1.5 py-0.5 rounded bg-workbench-subpanel text-sky-600 dark:text-sky-400 font-mono text-xs font-semibold">
                        /
                      </code>
                      . Server endpoints are headless REST APIs designed for programmatic CLI automation and
                      parsers, not interactive web views.
                    </>
                  ) : (
                    <>
                      The requested route does not map to any UI view. The Plan Parse application operates as a
                      focused single-page visualization workspace at{" "}
                      <code className="px-1.5 py-0.5 rounded bg-workbench-subpanel text-sky-600 dark:text-sky-400 font-mono text-xs font-semibold">
                        /
                      </code>
                      . All graph inspection, filtering, and blast-radius analysis occur within the primary dashboard.
                    </>
                  )}
                </p>
              </div>

              {/* Primary Redirect Action */}
              <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2 pt-2 md:pt-0">
                <Link
                  href="/"
                  className="px-4 py-2 rounded-md text-xs font-mono font-semibold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 border border-sky-500 transition shadow-sm flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70"
                >
                  <span>Open Visualization Dashboard</span>
                  <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-sky-700/80 rounded text-sky-100">
                    ESC
                  </kbd>
                </Link>

                <a
                  href="#server-endpoints"
                  className="px-3.5 py-1.5 rounded-md text-xs font-mono text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-workbench-subpanel hover:bg-workbench-hover border border-workbench-border transition flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70"
                >
                  <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>View Server REST Endpoints</span>
                </a>
              </div>
            </div>
          </div>

          {/* Server Architecture Explainer Notice */}
          <div className="bg-workbench-panel border border-workbench-border rounded-lg p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
              <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Server & Application Architecture</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Plan Parse is packaged as a unified Go binary with an embedded Next.js static single-page application.
              When executed in headless or server mode, it binds an HTTP daemon (default:{" "}
              <code className="font-mono text-sky-600 dark:text-sky-400">127.0.0.1:9000</code>) exposing REST
              endpoints for pipeline automation, plan parsing, and health probes. The routes below are intended for{" "}
              <strong>HTTP clients, scripts, and curl</strong>, rather than direct browser navigation.
            </p>
          </div>

          {/* Server REST Endpoints Documentation Section */}
          <div id="server-endpoints" className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-workbench-border pb-3">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  <span>Backend Server Endpoints Reference</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  HTTP REST protocol specifications and automated execution examples.
                </p>
              </div>

              {/* Endpoint Filter Tabs */}
              <div className="flex items-center gap-1 bg-workbench-subpanel p-0.5 rounded border border-workbench-border text-xs font-mono">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-2 py-0.5 rounded transition cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-500 ${
                    activeTab === "all"
                      ? "bg-workbench-panel text-slate-900 dark:text-white shadow-xs font-medium"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  All ({SERVER_ENDPOINTS.length})
                </button>
                <button
                  onClick={() => setActiveTab("GET")}
                  className={`px-2 py-0.5 rounded transition cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-500 ${
                    activeTab === "GET"
                      ? "bg-workbench-panel text-sky-600 dark:text-sky-400 shadow-xs font-medium"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  GET (3)
                </button>
                <button
                  onClick={() => setActiveTab("POST")}
                  className={`px-2 py-0.5 rounded transition cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-500 ${
                    activeTab === "POST"
                      ? "bg-workbench-panel text-emerald-600 dark:text-emerald-400 shadow-xs font-medium"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  POST (1)
                </button>
              </div>
            </div>

            {/* List of Endpoint Cards */}
            <div className="space-y-4">
              {SERVER_ENDPOINTS.filter((ep) => activeTab === "all" || ep.method === activeTab).map((ep) => {
                const isMatched = matchedEndpointId === ep.id;
                return (
                  <div
                    key={ep.id}
                    id={`endpoint-${ep.id}`}
                    className={`bg-workbench-panel border rounded-lg overflow-hidden transition-all shadow-sm ${
                      isMatched
                        ? "border-sky-500/80 ring-1 ring-sky-500/30"
                        : "border-workbench-border hover:border-slate-700/60"
                    }`}
                  >
                    {/* Endpoint Card Header */}
                    <div className="p-4 border-b border-workbench-border bg-workbench-header flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span
                          className={`px-2 py-0.5 text-[11px] font-mono font-bold uppercase rounded border ${
                            ep.method === "POST"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
                          }`}
                        >
                          {ep.method}
                        </span>
                        <code className="text-sm font-mono font-semibold text-slate-900 dark:text-white">
                          {ep.path}
                        </code>
                        <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded bg-workbench-subpanel text-slate-500 dark:text-slate-400 border border-workbench-border">
                          {ep.tag}
                        </span>
                        {isMatched && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                            Path Match
                          </span>
                        )}
                      </div>

                      <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                        {ep.summary}
                      </span>
                    </div>

                    {/* Endpoint Card Body */}
                    <div className="p-4 space-y-4">
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {ep.description}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 rounded bg-workbench-subpanel border border-workbench-border">
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                            Parameters
                          </span>
                          <span className="font-mono text-slate-700 dark:text-slate-300">
                            {ep.parameters}
                          </span>
                        </div>
                        <div className="p-2.5 rounded bg-workbench-subpanel border border-workbench-border">
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                            Headers
                          </span>
                          <span className="font-mono text-slate-700 dark:text-slate-300">
                            {ep.headers}
                          </span>
                        </div>
                      </div>

                      {/* Curl Command Box - Dark terminal background across both light/dark themes */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Example cURL Command
                          </span>
                          <button
                            onClick={() => copyToClipboard(ep.sampleCurl, `curl-${ep.id}`)}
                            className="px-2 py-0.5 rounded text-[11px] font-mono text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-workbench-subpanel hover:bg-workbench-hover border border-workbench-border transition flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-500"
                          >
                            {copiedId === `curl-${ep.id}` ? (
                              <>
                                <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-emerald-500 font-semibold">Copied!</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                  />
                                </svg>
                                <span>Copy cURL</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="p-3 rounded bg-slate-950 dark:bg-workbench-card border border-slate-800 dark:border-workbench-border text-xs font-mono text-slate-200 overflow-x-auto custom-scrollbar select-text">
                          <code>{ep.sampleCurl}</code>
                        </pre>
                      </div>

                      {/* Sample Response Box - Dark terminal background across both light/dark themes */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Sample Response (JSON)
                          </span>
                          <button
                            onClick={() => copyToClipboard(ep.sampleResponse, `resp-${ep.id}`)}
                            className="px-2 py-0.5 rounded text-[11px] font-mono text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-workbench-subpanel hover:bg-workbench-hover border border-workbench-border transition flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-500"
                          >
                            {copiedId === `resp-${ep.id}` ? (
                              <>
                                <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-emerald-500 font-semibold">Copied!</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                  />
                                </svg>
                                <span>Copy JSON</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="p-3 rounded bg-slate-950 dark:bg-workbench-card border border-slate-800 dark:border-workbench-border text-xs font-mono text-slate-200 dark:text-slate-200 overflow-x-auto max-h-48 custom-scrollbar select-text">
                          <code>{ep.sampleResponse}</code>
                        </pre>
                      </div>

                      {/* Vector Info Note */}
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="font-semibold text-slate-600 dark:text-slate-300">Note:</span>
                        <span>{ep.notes}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Return Banner */}
          <div className="bg-workbench-panel border border-workbench-border rounded-lg p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Ready to visualize your Terraform dependency graph?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Access the interactive DAG visualizer, blast-radius calculator, and targeted command generator.
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 rounded-md text-xs font-mono font-semibold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 border border-sky-500 transition shadow-sm flex items-center gap-2 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70"
            >
              <span>Return to Dashboard</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
