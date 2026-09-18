"use strict";
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

const ACTION_COLORS = {
  create: "#22c55e",
  delete: "#ef4444",
  update: "#3b82f6",
  replace: "#f59e0b",
  "no-op": "#64748b",
  data: "#ec4899",
  module: "#a855f7",
  variable: "#0ea5e9",
  output: "#eab308",
};

export default function Home() {
  const [graphData, setGraphData] = useState(null);
  const [cliLoaded, setCliLoaded] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedNode, setSelectedNode] = useState(null);
  const [isLegendOpen, setIsLegendOpen] = useState(true);
  const [cyReady, setCyReady] = useState(false);

  const cyContainerRef = useRef(null);
  const cyRef = useRef(null);
  const fileInputRef = useRef(null);

  // Ready check for window.cytoscape bundle loading
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.cytoscape) {
      setCyReady(true);
      return;
    }
    const interval = setInterval(() => {
      if (window.cytoscape) {
        setCyReady(true);
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Initialize and check status on mount
  useEffect(() => {
    async function init() {
      try {
        const statusRes = await fetch("/api/status");
        if (statusRes.ok) {
          const status = await statusRes.json();
          setCliLoaded(Boolean(status.cli_loaded));
          setDisabled(Boolean(status.disabled));
        }

        const graphRes = await fetch("/api/graph");
        if (graphRes.ok) {
          const graph = await graphRes.json();
          if (graph && graph.nodes && graph.nodes.length > 0) {
            setGraphData(graph);
          }
        }
      } catch (err) {
        console.error("Failed to initialize plan-parse:", err);
      }
    }

    init();
  }, []);

  // Render Cytoscape graph when graphData changes
  useEffect(() => {
    if (!graphData || !cyContainerRef.current) return;
    if (typeof window === "undefined" || !window.cytoscape) return;

    try {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }

      const elements = [];
      const nodeIds = new Set();

      // Add nodes
      (graphData.nodes || []).forEach((n) => {
        nodeIds.add(n.data.id);
        elements.push({
          group: "nodes",
          data: { ...n.data },
          classes: n.classes || "",
        });
      });

      // Add edges (ensure both ends exist)
      (graphData.edges || []).forEach((e) => {
        if (nodeIds.has(e.data.source) && nodeIds.has(e.data.target)) {
          elements.push({
            group: "edges",
            data: { ...e.data },
            classes: e.classes || "edge",
          });
        }
      });

      const cy = window.cytoscape({
        container: cyContainerRef.current,
        elements: elements,
        boxSelectionEnabled: false,
        autounselectify: false,
        style: [
          {
            selector: "node",
            style: {
              label: "data(label)",
              color: "#f8fafc",
              "font-family": "ui-sans-serif, system-ui, sans-serif",
              "font-size": "13px",
              "text-valign": "center",
              "text-halign": "center",
              width: "label",
              height: "label",
              padding: "10px",
            },
          },
          {
            selector: "edge",
            style: {
              "curve-style": "taxi",
              "taxi-direction": "rightward",
              width: 2,
              "line-color": "#475569",
              "target-arrow-shape": "triangle",
              "target-arrow-color": "#475569",
              "arrow-scale": 0.8,
              opacity: 0.7,
            },
          },
          {
            selector: ".basename",
            style: {
              padding: "40px",
              "font-weight": "bold",
              "font-size": "16px",
              shape: "roundrectangle",
              "border-width": 2,
              "border-color": "#4f46e5",
              "background-color": "#0f172a",
              "background-opacity": 0.6,
              "text-valign": "top",
              "text-margin-y": 15,
            },
          },
          {
            selector: ".module",
            style: {
              padding: "30px",
              "font-weight": "600",
              "font-size": "14px",
              shape: "roundrectangle",
              "border-width": 2,
              "border-color": "#a855f7",
              "background-color": "#1e1b4b",
              "background-opacity": 0.5,
              "text-valign": "top",
              "text-margin-y": 15,
            },
          },
          {
            selector: ".fname",
            style: {
              padding: "20px",
              "font-weight": "500",
              "font-size": "13px",
              shape: "roundrectangle",
              "border-width": 1,
              "border-color": "#334155",
              "background-color": "#090d16",
              "background-opacity": 0.6,
              "text-valign": "top",
              "text-margin-y": 12,
            },
          },
          {
            selector: ".resource-type",
            style: {
              padding: "16px",
              "font-weight": "500",
              "font-size": "12px",
              shape: "roundrectangle",
              "border-width": 1,
              "border-color": "#475569",
              "background-color": "#1e293b",
              "background-opacity": 0.5,
              "text-valign": "top",
              "text-margin-y": 10,
            },
          },
          {
            selector: ".data-type",
            style: {
              padding: "16px",
              "font-weight": "500",
              "font-size": "12px",
              shape: "roundrectangle",
              "border-width": 1,
              "border-color": "#ec4899",
              "background-color": "#1e293b",
              "background-opacity": 0.5,
              "text-valign": "top",
              "text-margin-y": 10,
            },
          },
          {
            selector: ".resource-name, .data-name",
            style: {
              shape: "roundrectangle",
              padding: "10px",
              "text-valign": "center",
              "text-halign": "center",
              "font-weight": "600",
              "font-size": "12px",
              color: "#ffffff",
              "border-width": 1,
              "border-color": "rgba(255,255,255,0.2)",
            },
          },
          {
            selector: ".create",
            style: { "background-color": ACTION_COLORS.create },
          },
          {
            selector: ".delete",
            style: { "background-color": ACTION_COLORS.delete },
          },
          {
            selector: ".update",
            style: { "background-color": ACTION_COLORS.update },
          },
          {
            selector: ".replace",
            style: { "background-color": ACTION_COLORS.replace, color: "#000" },
          },
          {
            selector: ".no-op",
            style: { "background-color": ACTION_COLORS["no-op"] },
          },
          {
            selector: ".variable",
            style: {
              "background-color": ACTION_COLORS.variable,
              shape: "roundrectangle",
              "font-size": "12px",
              padding: "8px",
            },
          },
          {
            selector: ".output",
            style: {
              "background-color": ACTION_COLORS.output,
              color: "#000",
              shape: "roundrectangle",
              "font-size": "12px",
              padding: "8px",
            },
          },
          {
            selector: ".locals",
            style: {
              "background-color": "#0f172a",
              "border-width": 1,
              "border-color": "#64748b",
              shape: "roundrectangle",
              "font-size": "12px",
              padding: "8px",
            },
          },
          {
            selector: ".dimmed",
            style: { opacity: 0.2 },
          },
          {
            selector: ".highlighted",
            style: {
              "border-width": 3,
              "border-color": "#38bdf8",
              opacity: 1,
            },
          },
          {
            selector: "edge.highlighted-edge",
            style: {
              width: 3,
              "line-color": "#38bdf8",
              "target-arrow-color": "#38bdf8",
              opacity: 1,
            },
          },
        ],
      });

      cy.on("tap", "node", (evt) => {
        const node = evt.target;
        const data = node.data();
        const incomers = node.incomers("node").map((n) => n.data().id);
        const outgoers = node.outgoers("node").map((n) => n.data().id);

        setSelectedNode({
          ...data,
          incomers,
          outgoers,
        });

        // Highlight paths
        cy.elements().removeClass("dimmed highlighted highlighted-edge");
        cy.elements().addClass("dimmed");

        node.removeClass("dimmed").addClass("highlighted");
        node.ancestors().removeClass("dimmed");
        node.descendants().removeClass("dimmed");
        node.connectedEdges().removeClass("dimmed").addClass("highlighted-edge");
        node.incomers().removeClass("dimmed").addClass("highlighted");
        node.outgoers().removeClass("dimmed").addClass("highlighted");
      });

      cy.on("tap", (evt) => {
        if (evt.target === cy) {
          setSelectedNode(null);
          cy.elements().removeClass("dimmed highlighted highlighted-edge");
        }
      });

      // Run layout
      try {
        const layout = cy.layout({
          name: "klay",
          nodeDimensionsIncludeLabels: true,
          fit: true,
          padding: 60,
          klay: {
            direction: "RIGHT",
            borderSpacing: 40,
            spacing: 30,
            nodeLayering: "NETWORK_SIMPLEX",
          },
        });
        layout.run();
      } catch (e) {
        console.warn("Klay layout error, falling back to breadthfirst:", e);
        cy.layout({ name: "breadthfirst", directed: true, padding: 50 }).run();
      }

      cyRef.current = cy;
    } catch (err) {
      console.error("Error setting up Cytoscape:", err);
    }

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [graphData, cyReady]);

  // Handle plan file upload
  const handleFileUpload = useCallback(
    async (file) => {
      if (!file) return;
      if (!file.name.endsWith(".json")) {
        setErrorMsg("Please upload a valid .json Terraform plan file.");
        return;
      }

      setLoading(true);
      setErrorMsg("");

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/parse", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}: Failed to parse plan`);
        }

        const graph = await res.json();
        setGraphData(graph);
        setCliLoaded(false);
        setDisabled(false);
      } catch (err) {
        setErrorMsg(err.message || "Failed to process plan file");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  // Zoom controls
  const handleZoomIn = () => cyRef.current && cyRef.current.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current && cyRef.current.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current && cyRef.current.fit(undefined, 50);
  const handleResetZoom = () => cyRef.current && cyRef.current.zoom(1);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* Cytoscape Canvas */}
      <div id="cy" ref={cyContainerRef} className="w-full h-full" />

      {/* Floating Header & Input Panel (Top-Left) */}
      <div className="absolute top-4 left-4 z-20 w-96 flex flex-col gap-3 pointer-events-auto">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse" />
              <h1 className="text-base font-bold text-white tracking-wide">
                Plan Parse
              </h1>
            </div>
            {cliLoaded ? (
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                CLI Mode
              </span>
            ) : graphData ? (
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Loaded
              </span>
            ) : (
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-700/50 text-slate-400">
                Idle
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400 mb-3">
            {disabled
              ? "Initialized via CLI. Input disabled for this session. Reload to reset."
              : "Upload or drag & drop a Terraform JSON plan file to inspect DAG."}
          </p>

          {/* Upload Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => !disabled && fileInputRef.current && fileInputRef.current.click()}
            className={`border-2 border-dashed rounded-lg p-3 text-center transition-all cursor-pointer ${
              disabled
                ? "border-slate-800 bg-slate-950/40 opacity-50 cursor-not-allowed"
                : "border-slate-700 hover:border-indigo-500 hover:bg-slate-800/50"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              disabled={disabled}
              onChange={(e) => handleFileUpload(e.target.files[0])}
              accept=".json"
              className="hidden"
            />
            {loading ? (
              <div className="flex items-center justify-center gap-2 text-xs text-indigo-400 py-1">
                <svg
                  className="animate-spin h-4 w-4 text-indigo-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Parsing plan...</span>
              </div>
            ) : (
              <div className="text-xs text-slate-300">
                <span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop
                <div className="text-[10px] text-slate-500 mt-0.5">Terraform plan (.json)</div>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="mt-2 p-2 rounded bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Plan Summary Chips */}
          {graphData && graphData.summary && (
            <div className="mt-3 pt-3 border-t border-slate-800/80">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Plan Summary ({graphData.summary.total} resources)
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                <div className="p-1.5 rounded bg-emerald-950/40 border border-emerald-900/50 text-emerald-400">
                  <div className="font-bold">+{graphData.summary.create}</div>
                  <div className="text-[10px] text-emerald-500/80">Create</div>
                </div>
                <div className="p-1.5 rounded bg-blue-950/40 border border-blue-900/50 text-blue-400">
                  <div className="font-bold">~{graphData.summary.update}</div>
                  <div className="text-[10px] text-blue-500/80">Update</div>
                </div>
                <div className="p-1.5 rounded bg-rose-950/40 border border-rose-900/50 text-rose-400">
                  <div className="font-bold">-{graphData.summary.delete}</div>
                  <div className="text-[10px] text-rose-500/80">Delete</div>
                </div>
                <div className="p-1.5 rounded bg-amber-950/40 border border-amber-900/50 text-amber-400">
                  <div className="font-bold">±{graphData.summary.replace}</div>
                  <div className="text-[10px] text-amber-500/80">Replace</div>
                </div>
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                  <div className="font-bold">={graphData.summary["no-op"]}</div>
                  <div className="text-[10px] text-slate-500">No-op</div>
                </div>
                <div className="p-1.5 rounded bg-pink-950/40 border border-pink-900/50 text-pink-400">
                  <div className="font-bold">?{graphData.summary.read}</div>
                  <div className="text-[10px] text-pink-500/80">Read</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Zoom / Reset Controls (Bottom-Left) */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg p-1.5 shadow-xl">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-800 text-slate-200 text-base font-bold transition"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-800 text-slate-200 text-base font-bold transition"
        >
          -
        </button>
        <button
          onClick={handleFit}
          title="Fit View"
          className="px-2.5 h-8 flex items-center justify-center rounded hover:bg-slate-800 text-slate-300 text-xs font-semibold transition"
        >
          Fit
        </button>
        <button
          onClick={handleResetZoom}
          title="Reset Zoom (100%)"
          className="px-2 h-8 flex items-center justify-center rounded hover:bg-slate-800 text-slate-300 text-xs font-semibold transition"
        >
          1:1
        </button>
      </div>

      {/* Floating Legend (Bottom-Right) */}
      <div className="absolute bottom-4 right-4 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg shadow-xl overflow-hidden transition-all max-w-xs">
        <div
          onClick={() => setIsLegendOpen(!isLegendOpen)}
          className="flex items-center justify-between px-3 py-2 cursor-pointer border-b border-slate-800/60 hover:bg-slate-800/40"
        >
          <span className="text-xs font-bold text-slate-300">Legend</span>
          <span className="text-xs text-slate-400">{isLegendOpen ? "▼" : "▲"}</span>
        </div>
        {isLegendOpen && (
          <div className="p-2.5 grid grid-cols-2 gap-1.5 text-[11px]">
            {Object.entries(ACTION_COLORS).map(([name, color]) => (
              <div key={name} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="capitalize text-slate-300">{name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Slide-over / Modal Details Drawer */}
      {selectedNode && (
        <div className="absolute top-0 right-0 h-full w-96 z-30 bg-slate-900/95 backdrop-blur-lg border-l border-slate-800 shadow-2xl p-5 overflow-y-auto flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                {selectedNode.type || "Resource"}
              </div>
              <h2 className="text-base font-bold text-white break-words mt-0.5">
                {selectedNode.label || selectedNode.id}
              </h2>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-4 text-xs">
            {/* Action Badge */}
            {selectedNode.change && (
              <div>
                <span className="text-slate-400 block mb-1">Change Action:</span>
                <span
                  className="inline-block px-2 py-0.5 rounded font-bold uppercase text-[11px]"
                  style={{
                    backgroundColor: `${ACTION_COLORS[selectedNode.change] || "#64748b"}25`,
                    color: ACTION_COLORS[selectedNode.change] || "#f8fafc",
                    border: `1px solid ${ACTION_COLORS[selectedNode.change] || "#64748b"}60`,
                  }}
                >
                  {selectedNode.change}
                </span>
              </div>
            )}

            {/* Address */}
            <div>
              <span className="text-slate-400 block mb-0.5">Full Address:</span>
              <div className="font-mono bg-slate-950 p-2 rounded border border-slate-800/80 text-slate-200 break-all select-text">
                {selectedNode.id}
              </div>
            </div>

            {/* Module & File details */}
            {(selectedNode.module || selectedNode.file) && (
              <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-2.5 rounded border border-slate-800/60">
                {selectedNode.module && (
                  <div>
                    <span className="text-slate-500 block text-[10px]">Module</span>
                    <span className="text-slate-300 font-mono truncate block">
                      {selectedNode.module}
                    </span>
                  </div>
                )}
                {selectedNode.file && (
                  <div>
                    <span className="text-slate-500 block text-[10px]">File</span>
                    <span className="text-slate-300 font-mono truncate block">
                      {selectedNode.file}
                      {selectedNode.line ? `:${selectedNode.line}` : ""}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Dependencies */}
            {selectedNode.outgoers && selectedNode.outgoers.length > 0 && (
              <div>
                <span className="text-slate-400 block mb-1">
                  Depends On ({selectedNode.outgoers.length}):
                </span>
                <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                  {selectedNode.outgoers.map((id) => (
                    <div
                      key={id}
                      className="font-mono text-[11px] bg-slate-950 px-2 py-1 rounded text-slate-300 border border-slate-800/60 truncate"
                      title={id}
                    >
                      → {id}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedNode.incomers && selectedNode.incomers.length > 0 && (
              <div>
                <span className="text-slate-400 block mb-1">
                  Dependents / Referenced By ({selectedNode.incomers.length}):
                </span>
                <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                  {selectedNode.incomers.map((id) => (
                    <div
                      key={id}
                      className="font-mono text-[11px] bg-slate-950 px-2 py-1 rounded text-slate-300 border border-slate-800/60 truncate"
                      title={id}
                    >
                      ← {id}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Change Details */}
            {selectedNode.changeDetails && (
              <div>
                <span className="text-slate-400 block mb-1 font-semibold">
                  Attribute Changes:
                </span>
                <pre className="font-mono text-[11px] bg-slate-950 p-2.5 rounded border border-slate-800/80 text-slate-300 overflow-x-auto max-h-56 select-text">
                  {JSON.stringify(
                    selectedNode.changeDetails.after ||
                      selectedNode.changeDetails.before ||
                      selectedNode.changeDetails,
                    null,
                    2
                  )}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
