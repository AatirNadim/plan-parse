"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ACTION_CONFIG, METRIC_KEYS } from "../lib/action-theme";

/**
 * Format bytes into human-readable string (KB, MB).
 */
function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * InputDrawer: Floating collapsible glassmorphic panel for Terraform plan input,
 * action distribution metrics, and interactive resource exploration.
 * Designed with a Figma/tldraw/React Flow floating workspace architecture.
 */
export default function InputDrawer({
  isOpen,
  onToggle,
  onClose,
  onPlanParsed,
  cliLoaded,
  disabled,
  currentSummary,
  graphData,
  selectedNode,
  onNavigateToNode,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationState, setValidationState] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [lastParsedSummary, setLastParsedSummary] = useState(null);

  const summary = graphData?.summary || currentSummary || lastParsedSummary;
  const hasGraph = Boolean(
    (graphData && graphData.nodes && graphData.nodes.length > 0) ||
    (summary && summary.total > 0)
  );

  const [activeTab, setActiveTab] = useState(hasGraph ? "overview" : "source");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const fileInputRef = useRef(null);

  // If graph arrives and we haven't selected a new file to upload, show overview
  useEffect(() => {
    if (hasGraph && !selectedFile) {
      setActiveTab("overview");
    } else if (!hasGraph) {
      setActiveTab("source");
    }
  }, [hasGraph]);

  // Auto-scroll selected resource into view in the resource explorer list
  useEffect(() => {
    if (selectedNode?.id && isOpen && activeTab === "overview") {
      const el = document.getElementById(`res-item-${selectedNode.id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [selectedNode?.id, isOpen, activeTab]);

  // Compute counts for actions
  const counts = useMemo(() => {
    return {
      create: summary?.create || 0,
      update: summary?.update || 0,
      delete: summary?.delete || 0,
      replace: summary?.replace || 0,
      "no-op": summary ? (summary["no-op"] ?? summary.noop ?? 0) : 0,
      read: summary?.read || 0,
    };
  }, [summary]);

  const totalCount = useMemo(() => {
    return summary?.total ?? Object.values(counts).reduce((a, b) => a + b, 0);
  }, [summary, counts]);

  // Proportional distribution segments for horizontal bar
  const distributionSegments = useMemo(() => {
    if (totalCount === 0) return [];
    return METRIC_KEYS.map((key) => {
      const cfg = ACTION_CONFIG[key];
      const count = counts[key] || 0;
      const percent = (count / totalCount) * 100;
      return {
        action: key,
        label: cfg.label,
        color: cfg.color,
        count,
        percent,
      };
    }).filter((s) => s.count > 0);
  }, [counts, totalCount]);

  // Extract leaf resource nodes for the explorer
  const resourceNodes = useMemo(() => {
    if (!graphData?.nodes || graphData.nodes.length === 0) return [];
    const nonContainers = graphData.nodes.filter(
      (n) =>
        n.data?.type !== "basename" &&
        n.data?.type !== "module" &&
        n.data?.type !== "file"
    );
    return nonContainers.length > 0 ? nonContainers : graphData.nodes;
  }, [graphData]);

  // Filtered resources based on search query and action filter
  const filteredResources = useMemo(() => {
    return resourceNodes.filter((n) => {
      const change = (n.data?.change || "no-op").toLowerCase();
      if (actionFilter !== "all" && change !== actionFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const id = (n.data?.id || "").toLowerCase();
      const label = (n.data?.label || "").toLowerCase();
      const rType = (n.data?.resourceType || "").toLowerCase();
      const rName = (n.data?.resourceName || "").toLowerCase();
      const mod = (n.data?.module || "").toLowerCase();
      return (
        id.includes(q) ||
        label.includes(q) ||
        rType.includes(q) ||
        rName.includes(q) ||
        mod.includes(q)
      );
    });
  }, [resourceNodes, actionFilter, searchQuery]);

  // Validate file content on client-side before submission
  const validateFileContent = useCallback(async (file) => {
    if (!file) {
      setValidationState(null);
      return false;
    }

    if (!file.name.toLowerCase().endsWith(".json")) {
      setValidationState({
        valid: false,
        error: "Invalid file type. Please select a .json file.",
      });
      return false;
    }

    if (file.size > 50 * 1024 * 1024) {
      setValidationState({
        valid: false,
        error: "File size exceeds 50MB limit.",
      });
      return false;
    }

    try {
      const text = await file.text();
      if (!text.trim()) {
        setValidationState({
          valid: false,
          error: "Selected file is empty.",
        });
        return false;
      }

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (jsonErr) {
        setValidationState({
          valid: false,
          error: `JSON syntax error: ${jsonErr.message}`,
        });
        return false;
      }

      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        setValidationState({
          valid: false,
          error: "Invalid plan format: Expected root object.",
        });
        return false;
      }

      const formatVersion = parsed.format_version;
      const tfVersion = parsed.terraform_version;

      if (!formatVersion || typeof formatVersion !== "string" || !formatVersion.trim()) {
        setValidationState({
          valid: false,
          error:
            "Invalid Terraform plan: Missing or empty 'format_version'. Ensure you used 'terraform show -json <plan>'.",
        });
        return false;
      }

      if (!tfVersion || typeof tfVersion !== "string" || !tfVersion.trim()) {
        setValidationState({
          valid: false,
          error:
            "Invalid Terraform plan: Missing or empty 'terraform_version'. Ensure you used 'terraform show -json <plan>'.",
        });
        return false;
      }

      const resourceChanges = Array.isArray(parsed.resource_changes)
        ? parsed.resource_changes.length
        : 0;

      setValidationState({
        valid: true,
        meta: {
          formatVersion,
          tfVersion,
          resourceCount: resourceChanges,
        },
      });
      return true;
    } catch (err) {
      setValidationState({
        valid: false,
        error: `Failed to read file: ${err.message}`,
      });
      return false;
    }
  }, []);

  const handleFileSelect = async (file) => {
    if (!file) return;
    setSelectedFile(file);
    setApiError("");
    setLastParsedSummary(null);
    await validateFileContent(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await handleFileSelect(files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || (validationState && !validationState.valid)) return;

    setLoading(true);
    setApiError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/parse", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}: Failed to parse plan`);
      }

      const graph = await res.json();
      setLastParsedSummary(graph.summary || null);
      if (onPlanParsed) {
        onPlanParsed(graph);
      }
      setActiveTab("overview");
    } catch (err) {
      setApiError(err.message || "Failed to communicate with Go server");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setValidationState(null);
    setApiError("");
    setLastParsedSummary(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // If collapsed, display sleek floating pill
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        title="Open Plan Input Panel"
        className="fixed top-4 left-4 z-30 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-2xl hover:border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800/90 transition-all cursor-pointer select-none group pointer-events-auto"
      >
        <svg
          className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6h16M4 12h16M4 18h7"
          />
        </svg>
        <span className="text-xs font-semibold tracking-wide">
          {hasGraph ? "Plan Overview" : "Plan Input"}
        </span>
        {cliLoaded ? (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
            CLI
          </span>
        ) : totalCount > 0 ? (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {totalCount} res
          </span>
        ) : null}
        <svg
          className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    );
  }

  // Expanded Floating Glassmorphic Panel (No full-screen blocking backdrops)
  return (
    <div
      className="fixed top-4 left-4 z-30 w-[420px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] flex flex-col rounded-2xl border border-slate-800/90 bg-slate-900/90 backdrop-blur-xl shadow-2xl shadow-slate-950/80 overflow-hidden pointer-events-auto transition-all duration-200 select-none"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-900/70 select-none shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500 animate-pulse" />
          <div>
            <h2 className="text-xs font-bold text-white tracking-wide flex items-center gap-2">
              <span>Terraform Plan</span>
              {cliLoaded ? (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  CLI
                </span>
              ) : totalCount > 0 ? (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {totalCount} resources
                </span>
              ) : null}
            </h2>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          title="Collapse panel (Esc)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Dual Tabs Navigation when Graph is Loaded */}
      {hasGraph && (
        <div className="flex border-b border-slate-800/80 bg-slate-950/40 p-1.5 gap-1.5 select-none shrink-0">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              activeTab === "overview"
                ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-semibold shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <span>Graph Overview</span>
          </button>

          <button
            onClick={() => setActiveTab("source")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              activeTab === "source"
                ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-semibold shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <span>Plan Source</span>
          </button>
        </div>
      )}

      {/* Scrollable Panel Body */}
      <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-4 min-h-0 custom-scrollbar">
        {disabled && (
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs leading-relaxed">
            <div className="font-semibold mb-0.5">CLI Session Active</div>
            Input is locked to the CLI-loaded plan. Reload the page to load an arbitrary plan.
          </div>
        )}

        {/* Tab 1: Graph Overview */}
        {activeTab === "overview" && hasGraph && (
          <div className="space-y-4">
            {/* a. Multi-segment Action Distribution Bar */}
            <div className="space-y-2 bg-slate-950/50 p-3 rounded-xl border border-slate-800/70">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-300 tracking-tight">Action Distribution</span>
                <span className="text-slate-400 font-mono font-medium text-[11px]">{totalCount} Changes</span>
              </div>

              {/* Horizontal Bar */}
              <div className="h-3 w-full rounded-full flex overflow-hidden bg-slate-950 border border-slate-800/80 p-0.5 gap-0.5">
                {distributionSegments.length > 0 ? (
                  distributionSegments.map((seg) => (
                    <div
                      key={seg.action}
                      style={{
                        width: `${Math.max(seg.percent, 1.5)}%`,
                        backgroundColor: seg.color,
                      }}
                      title={`${seg.label}: ${seg.count} (${seg.percent.toFixed(1)}%) • Click to filter`}
                      className="h-full rounded-sm transition-all duration-300 hover:brightness-125 cursor-pointer"
                      onClick={() =>
                        setActionFilter((prev) => (prev === seg.action ? "all" : seg.action))
                      }
                    />
                  ))
                ) : (
                  <div className="h-full w-full rounded-sm bg-slate-800" />
                )}
              </div>

              {/* Proportional percentages readout */}
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] pt-1">
                {distributionSegments.map((seg) => (
                  <div
                    key={seg.action}
                    onClick={() =>
                      setActionFilter((prev) => (prev === seg.action ? "all" : seg.action))
                    }
                    className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="text-slate-300 font-medium">{seg.label}</span>
                    <span className="text-slate-400 font-mono font-medium">
                      {seg.percent.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* b. Metric Cards */}
            <div>
              <div className="text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Change Metrics
              </div>
              <div className="grid grid-cols-3 gap-1.5 select-none">
                {METRIC_KEYS.map((key) => {
                  const cfg = ACTION_CONFIG[key];
                  const count = counts[key] || 0;
                  const isCurrentFilter = actionFilter === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setActionFilter(actionFilter === key ? "all" : key)}
                      className={`p-2 rounded-lg border transition-all text-left flex flex-col justify-between cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        isCurrentFilter
                          ? "bg-slate-800/90 border-indigo-400/80 ring-1 ring-indigo-400/40"
                          : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/80 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold ${cfg.text} tracking-wider`}>
                          {cfg.symbol} {cfg.label}
                        </span>
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: cfg.color }}
                        />
                      </div>
                      <div className="text-sm font-medium text-white mt-1 font-mono tracking-tight">
                        {count}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* c. Interactive Resource Explorer */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 tracking-tight">
                  Resource Explorer
                </span>
                <span className="text-[11px] text-slate-400 font-mono font-medium">
                  {filteredResources.length} of {resourceNodes.length}
                </span>
              </div>

              {/* Search input within panel */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter resources by name, type, module..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/50 shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-200 transition focus:outline-none focus-visible:text-white"
                    title="Clear filter"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Action Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar text-[10px]">
                {["all", "create", "update", "delete", "replace", "no-op", "read"].map((act) => {
                  const isActive = actionFilter === act;
                  return (
                    <button
                      key={act}
                      onClick={() => setActionFilter(act)}
                      className={`px-2 py-0.5 rounded-lg font-medium whitespace-nowrap transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        isActive
                          ? "bg-indigo-600 text-white font-bold shadow-sm"
                          : "bg-slate-950/80 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      {act === "all" ? "All" : act.charAt(0).toUpperCase() + act.slice(1)}
                    </button>
                  );
                })}
              </div>

              {/* Interactive Resource List */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5 custom-scrollbar">
                {filteredResources.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/50">
                    No resources found matching filter
                  </div>
                ) : (
                  filteredResources.map((n) => {
                    const isSelected = selectedNode?.id === n.data?.id;
                    const change = (n.data?.change || "no-op").toLowerCase();
                    const cfg = ACTION_CONFIG[change] || ACTION_CONFIG["no-op"];
                    return (
                      <div
                        key={n.data?.id}
                        id={`res-item-${n.data?.id}`}
                        onClick={() => onNavigateToNode && onNavigateToNode(n.data?.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 select-none ${
                          isSelected
                            ? "bg-indigo-950/80 border-indigo-500/90 ring-1 ring-indigo-500/50 shadow-md shadow-indigo-950/60"
                            : "bg-slate-950/60 border-slate-800/70 hover:bg-slate-800/60 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0"
                            style={{
                              backgroundColor: `${cfg.color}20`,
                              color: cfg.color,
                              border: `1px solid ${cfg.color}40`,
                            }}
                          >
                            {cfg.symbol} {change}
                          </span>
                          {n.data?.module && (
                            <span
                              className="text-[10px] font-mono font-medium text-purple-300 bg-purple-950/50 border border-purple-800/50 px-1.5 py-0.5 rounded truncate max-w-[150px] tracking-tight"
                              title={n.data.module}
                            >
                              {n.data.module}
                            </span>
                          )}
                        </div>

                        <div className="text-xs font-medium text-white font-mono break-all leading-snug tracking-tight">
                          {n.data?.label || n.data?.id}
                        </div>

                        {n.data?.resourceType && (
                          <div className="text-[10px] text-slate-400 font-mono font-normal truncate tracking-tight">
                            {n.data.resourceType}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Plan Source / Upload Plan */}
        {(activeTab === "source" || !hasGraph) && (
          <div className="space-y-4">
            {/* If a plan is already loaded, show metadata overview card */}
            {hasGraph && (
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">Loaded Plan Details</span>
                  <span className="text-[10px] text-emerald-400 font-medium bg-emerald-950/50 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                    Active on Canvas
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono font-medium text-slate-300">
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-sans font-semibold tracking-wider">
                      Total Resources
                    </span>
                    <span className="text-white font-medium">{totalCount}</span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-sans font-semibold tracking-wider">
                      Source
                    </span>
                    <span className="text-white font-medium truncate block">
                      {cliLoaded ? "CLI Mode" : selectedFile ? selectedFile.name : "Server Plan"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Dedicated File Dropzone / Upload Area */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {hasGraph ? "Upload or Replace Plan JSON" : "Plan JSON File"}
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() =>
                  !disabled &&
                  !loading &&
                  fileInputRef.current &&
                  fileInputRef.current.click()
                }
                className={`relative border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                  disabled
                    ? "border-slate-800 bg-slate-950/40 opacity-50 cursor-not-allowed"
                    : isDragging
                    ? "border-indigo-400 bg-indigo-950/30 scale-[1.01]"
                    : selectedFile
                    ? "border-emerald-500/50 bg-slate-950/60 hover:border-emerald-500/70"
                    : "border-slate-700/80 bg-slate-950/50 hover:border-indigo-500/70 hover:bg-slate-950/80"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  disabled={disabled || loading}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                  accept=".json,application/json"
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center gap-2 text-center">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      selectedFile
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-slate-200">
                      {selectedFile ? (
                        <span className="text-emerald-300 font-mono font-medium break-all tracking-tight">
                          {selectedFile.name}
                        </span>
                      ) : (
                        <>
                          <span className="text-indigo-400 underline underline-offset-2">
                            Click to upload
                          </span>{" "}
                          or drag & drop
                        </>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {selectedFile
                        ? `${formatBytes(selectedFile.size)} • Click to replace`
                        : "Terraform plan output (.json format)"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pre-Flight Validation State */}
            {validationState && (
              <div>
                {validationState.valid ? (
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>Valid Terraform Plan JSON</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300 mt-2 font-mono font-medium">
                      <div className="bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                        Format: <span className="text-emerald-300">{validationState.meta.formatVersion}</span>
                      </div>
                      <div className="bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                        TF Version: <span className="text-emerald-300">{validationState.meta.tfVersion}</span>
                      </div>
                    </div>
                    {validationState.meta.resourceCount > 0 && (
                      <div className="text-[11px] text-emerald-400/90 mt-1.5 font-medium">
                        Detected {validationState.meta.resourceCount} resource changes in plan.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-xs">
                    <div className="flex items-center gap-2 text-rose-400 font-semibold mb-1">
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <span>Validation Failed</span>
                    </div>
                    <div className="text-rose-200 leading-relaxed">
                      {validationState.error}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* API Error Notification */}
            {apiError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-xs text-rose-200">
                <div className="font-semibold text-rose-400 mb-0.5">Go Server Error</div>
                <div className="break-words">{apiError}</div>
              </div>
            )}

            {/* Submit Action Button */}
            {selectedFile && validationState && validationState.valid && (
              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  disabled={loading || disabled}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
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
                      <span>Parsing on Go Server...</span>
                    </>
                  ) : (
                    <>
                      <span>Parse & Load Graph</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>

                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  title="Clear file"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Guidance Info */}
            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
              <div className="font-semibold text-slate-300">Exporting your Terraform Plan:</div>
              <pre className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-indigo-300 font-mono text-[10px] overflow-x-auto select-all leading-relaxed">
                terraform plan -out=tfplan{"\n"}terraform show -json tfplan &gt; plan.json
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Status Footer */}
      <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-400 shrink-0 select-none">
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium bg-slate-800 border border-slate-700 rounded text-slate-300">
            Esc
          </kbd>
          <span>to collapse</span>
        </span>
        <span className="text-[10px] text-slate-400 font-mono font-medium">
          {hasGraph ? "Canvas Active" : "No Plan Loaded"}
        </span>
      </div>
    </div>
  );
}
