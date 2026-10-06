"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo, useDeferredValue } from "react";
import { ACTION_CONFIG, METRIC_KEYS, ACTION_KEYS, ENTITY_KEYS } from "../lib/action-theme";
import { copyToClipboard } from "../lib/target-command";

function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * WorkbenchSidebar: Docked left-hand panel for resource exploration,
 * blast-radius metrics, and plan file ingestion.
 * Replaces the floating InputDrawer with a structured IDE-style workbench panel.
 */
function WorkbenchSidebar({
  isOpen,
  onClose,
  graphData,
  summary,
  cliLoaded,
  disabled,
  selectedNode,
  onNavigateToNode,
  onPlanParsed,
  activeTab = "resources",
  onTabChange,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationState, setValidationState] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [actionFilter, setActionFilter] = useState("all");
  const [groupByModule, setGroupByModule] = useState(true);
  const [copiedModule, setCopiedModule] = useState(null);

  const handleCopyModuleTarget = useCallback(async (moduleName) => {
    const cmd = `terraform apply -target="${moduleName}"`;
    const ok = await copyToClipboard(cmd);
    if (ok) {
      setCopiedModule(moduleName);
      setTimeout(() => setCopiedModule(null), 1800);
    }
  }, []);

  const fileInputRef = useRef(null);

  // Compute entity counts from graphData.nodes
  const { variableCount, outputCount, moduleCount, totalEntities } = useMemo(() => {
    const nodes = graphData?.nodes || [];
    const variableCount = nodes.filter((n) => n.data?.type === "variable").length;
    const outputCount = nodes.filter((n) => n.data?.type === "output").length;
    const moduleCount = nodes.filter((n) => n.data?.type === "module").length;
    const totalEntities = variableCount + outputCount;
    return { variableCount, outputCount, moduleCount, totalEntities };
  }, [graphData]);

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

  // Distribution segments for horizontal bar
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

  // Leaf resource nodes
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

  // Filtered resources
  const filteredResources = useMemo(() => {
    return resourceNodes.filter((n) => {
      const nodeType = n.data?.type;
      const isEntity = nodeType === "variable" || nodeType === "output";
      const change = (n.data?.change || "no-op").toLowerCase();

      if (actionFilter !== "all") {
        if (actionFilter === "variable" || actionFilter === "output") {
          if (nodeType !== actionFilter) return false;
        } else {
          if (isEntity && !n.data?.change) return false;
          if (change !== actionFilter) return false;
        }
      }

      if (!deferredSearchQuery.trim()) return true;
      const q = deferredSearchQuery.toLowerCase();
      const id = (n.data?.id || "").toLowerCase();
      const label = (n.data?.label || "").toLowerCase();
      const rType = (n.data?.resourceType || "").toLowerCase();
      const mod = (n.data?.module || "").toLowerCase();
      return id.includes(q) || label.includes(q) || rType.includes(q) || mod.includes(q);
    });
  }, [resourceNodes, actionFilter, deferredSearchQuery]);

  // Grouped resources by module
  const groupedResources = useMemo(() => {
    if (!groupByModule) return { "All Resources": filteredResources };
    const groups = {};
    filteredResources.forEach((n) => {
      const mod = n.data?.module || "root";
      if (!groups[mod]) groups[mod] = [];
      groups[mod].push(n);
    });
    return groups;
  }, [filteredResources, groupByModule]);

  // Auto-scroll selected resource into view
  useEffect(() => {
    if (selectedNode?.id && isOpen) {
      const el = document.getElementById(`tree-item-${selectedNode.id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [selectedNode?.id, isOpen]);

  // File validation
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
        setValidationState({ valid: false, error: "Selected file is empty." });
        return false;
      }

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (jsonErr) {
        setValidationState({ valid: false, error: `JSON syntax error: ${jsonErr.message}` });
        return false;
      }

      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        setValidationState({ valid: false, error: "Invalid plan format: Expected root object." });
        return false;
      }

      const formatVersion = parsed.format_version;
      const tfVersion = parsed.terraform_version;

      if (!formatVersion || typeof formatVersion !== "string" || !formatVersion.trim()) {
        setValidationState({
          valid: false,
          error: "Missing format_version. Ensure you used 'terraform show -json <plan>'.",
        });
        return false;
      }

      if (!tfVersion || typeof tfVersion !== "string" || !tfVersion.trim()) {
        setValidationState({
          valid: false,
          error: "Missing terraform_version. Ensure you used 'terraform show -json <plan>'.",
        });
        return false;
      }

      const resourceChanges = Array.isArray(parsed.resource_changes) ? parsed.resource_changes.length : 0;

      setValidationState({
        valid: true,
        meta: { formatVersion, tfVersion, resourceCount: resourceChanges },
      });
      return true;
    } catch (err) {
      setValidationState({ valid: false, error: `Failed to read file: ${err.message}` });
      return false;
    }
  }, []);

  const handleFileSelect = useCallback(async (file) => {
    if (!file) return;
    setSelectedFile(file);
    setApiError("");
    await validateFileContent(file);
  }, [validateFileContent]);

  const handleSubmit = useCallback(async () => {
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
      if (onPlanParsed) {
        onPlanParsed(graph, selectedFile.name);
      }
      if (onTabChange) {
        onTabChange("resources");
      }
    } catch (err) {
      setApiError(err.message || "Failed to communicate with Go server");
    } finally {
      setLoading(false);
    }
  }, [selectedFile, validationState, onPlanParsed, onTabChange]);

  if (!isOpen) return null;

  return (
    <aside className="w-80 h-full border-r border-workbench-border bg-workbench-panel flex flex-col shrink-0 select-none z-10">
      {/* Panel Top Tabs */}
      <div className="flex border-b border-workbench-border bg-workbench-header p-1 gap-1 shrink-0">
        <button
          onClick={() => onTabChange && onTabChange("resources")}
          className={`flex-1 py-1 px-2 rounded text-xs font-mono font-medium transition cursor-pointer ${
            activeTab === "resources"
              ? "bg-workbench-subpanel text-slate-900 dark:text-white border border-workbench-border"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          Resources {totalCount > 0 ? `(${totalCount})` : ""}
        </button>
        <button
          onClick={() => onTabChange && onTabChange("source")}
          className={`flex-1 py-1 px-2 rounded text-xs font-mono font-medium transition cursor-pointer ${
            activeTab === "source"
              ? "bg-workbench-subpanel text-slate-900 dark:text-white border border-workbench-border"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          Plan Source
        </button>
      </div>

      {/* Tab Content: Resources Explorer */}
      {activeTab === "resources" && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Action Distribution Bar & Graph Entities Legend */}
          {(totalCount > 0 || totalEntities > 0) && (
            <div className="p-2.5 border-b border-workbench-border bg-workbench-subpanel/40 space-y-2 shrink-0">
              {/* Plan Changes Section */}
              {totalCount > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Plan Changes</span>
                    <span className="text-slate-700 dark:text-slate-300">{totalCount} Changes</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1.5 w-full rounded bg-workbench-bg border border-workbench-border flex overflow-hidden p-[1px] gap-0.5">
                    {distributionSegments.map((seg) => (
                      <div
                        key={seg.action}
                        style={{
                          width: `${Math.max(seg.percent, 2)}%`,
                          backgroundColor: seg.color,
                        }}
                        title={`${seg.label}: ${seg.count} (${seg.percent.toFixed(1)}%)`}
                        className="h-full rounded-xs transition-opacity hover:opacity-80 cursor-pointer"
                        onClick={() =>
                          setActionFilter((prev) => (prev === seg.action ? "all" : seg.action))
                        }
                      />
                    ))}
                  </div>

                  {/* Action Filter Chips */}
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    <button
                      onClick={() => setActionFilter("all")}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                        actionFilter === "all"
                          ? "bg-workbench-hover text-slate-900 dark:text-white border border-workbench-border font-bold"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      }`}
                    >
                      All ({totalCount})
                    </button>
                    {METRIC_KEYS.map((key) => {
                      const cfg = ACTION_CONFIG[key];
                      const count = counts[key] || 0;
                      if (count === 0) return null;
                      const isActive = actionFilter === key;
                      return (
                        <button
                          key={key}
                          onClick={() => setActionFilter(isActive ? "all" : key)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition flex items-center gap-1 cursor-pointer ${
                            isActive
                              ? "bg-workbench-hover text-slate-900 dark:text-white border border-workbench-border font-bold"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                          <span>{cfg.label}</span>
                          <span className="text-slate-500">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Graph Entities Section */}
              {totalEntities > 0 && (
                <div className={`${totalCount > 0 ? "pt-2 border-t border-workbench-border/60" : ""} space-y-1.5`}>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Graph Entities</span>
                    <span className="text-slate-500 dark:text-slate-400">{totalEntities} Entities</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {variableCount > 0 && (
                      <button
                        onClick={() => setActionFilter(actionFilter === "variable" ? "all" : "variable")}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition flex items-center gap-1.5 cursor-pointer ${
                          actionFilter === "variable"
                            ? "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/50 font-bold"
                            : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/40"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span>Variables ({variableCount})</span>
                      </button>
                    )}
                    {outputCount > 0 && (
                      <button
                        onClick={() => setActionFilter(actionFilter === "output" ? "all" : "output")}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition flex items-center gap-1.5 cursor-pointer ${
                          actionFilter === "output"
                            ? "bg-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-500/50 font-bold"
                            : "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-500/20 hover:border-fuchsia-500/40"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500" />
                        <span>Outputs ({outputCount})</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Filter Search & Grouping Toggle */}
          <div className="p-2 border-b border-workbench-border bg-workbench-header flex items-center gap-2 shrink-0">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter explorer..."
                className="w-full pl-6 pr-2 py-1 text-xs bg-workbench-subpanel border border-workbench-border rounded text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 font-mono focus:outline-none focus:border-slate-400 dark:focus:border-slate-500"
              />
              <svg className="w-3 h-3 text-slate-400 dark:text-slate-500 absolute left-2 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              onClick={() => setGroupByModule(!groupByModule)}
              title={groupByModule ? "Switch to flat list" : "Group by module"}
              className={`p-1 rounded border text-[10px] font-mono transition cursor-pointer ${
                groupByModule
                  ? "bg-workbench-subpanel text-slate-700 dark:text-slate-300 border-workbench-border"
                  : "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              MOD
            </button>
          </div>

          {/* Hierarchical Resource Tree */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-2.5 custom-scrollbar">
            {filteredResources.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
                {totalCount === 0 && totalEntities === 0 ? "No plan loaded" : "No matching resources"}
              </div>
            ) : (
              Object.entries(groupedResources).map(([groupName, items]) => (
                <div key={groupName} className="space-y-0.5">
                  {groupByModule && (
                    <div
                      onClick={() => groupName.startsWith("module.") && onNavigateToNode && onNavigateToNode(groupName)}
                      className="px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between group/mod hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer rounded hover:bg-workbench-subpanel/50 transition"
                      title={groupName.startsWith("module.") ? `Focus ${groupName} on canvas` : groupName}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {groupName.startsWith("module.") && (
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                        )}
                        <span className="truncate">{groupName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {groupName.startsWith("module.") && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyModuleTarget(groupName);
                            }}
                            className={`px-1.5 py-[1px] rounded border text-[9px] font-mono transition cursor-pointer ${
                              copiedModule === groupName
                                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold"
                                : "border-workbench-border bg-workbench-header hover:bg-workbench-subpanel text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 opacity-70 group-hover/mod:opacity-100"
                            }`}
                            title={`Copy terraform apply -target="${groupName}"`}
                          >
                            {copiedModule === groupName ? "Copied!" : "-target"}
                          </button>
                        )}
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{items.length}</span>
                      </div>
                    </div>
                  )}
                  {items.map((n) => {
                    const data = n.data || {};
                    const isSelected = selectedNode?.id === data.id;
                    const nodeType = data.type;
                    const isEntity = nodeType === "variable" || nodeType === "output";
                    const key = isEntity && !data.change ? nodeType : (data.change || "no-op").toLowerCase();
                    const cfg = ACTION_CONFIG[key] || ACTION_CONFIG["no-op"];

                    return (
                      <div
                        key={data.id}
                        id={`tree-item-${data.id}`}
                        onClick={() => onNavigateToNode && onNavigateToNode(data.id)}
                        className={`px-2 py-1 rounded transition-colors cursor-pointer border flex items-center justify-between gap-2 ${
                          isSelected
                            ? "bg-workbench-hover border-sky-500/50 text-slate-900 dark:text-white"
                            : "bg-workbench-panel border-transparent hover:bg-workbench-subpanel text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="truncate flex-1 min-w-0">
                          <div className="text-xs font-mono truncate">
                            {data.label || data.id}
                          </div>
                          {(data.resourceType || isEntity) && (
                            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">
                              {data.resourceType || (isEntity ? cfg.label : "")}
                            </div>
                          )}
                        </div>
                        <span
                          className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded shrink-0 uppercase"
                          style={{
                            backgroundColor: `${cfg.color}15`,
                            color: cfg.color,
                            border: `1px solid ${cfg.color}30`,
                          }}
                        >
                          {cfg.symbol}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab Content: Plan Source Upload */}
      {activeTab === "source" && (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4 custom-scrollbar">
          {/* Brand Ingestion Header */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-lg bg-workbench-subpanel border border-workbench-border shadow-sm">
            <img
              src="/icon.svg"
              alt="Plan Parse Icon"
              className="w-14 h-14 rounded-lg shrink-0 shadow-md select-none"
              width={60}
              height={60}
            />
            <div className="min-w-0">
              <div className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100 tracking-wide leading-tight mb-1">
                Plan Ingestion
              </div>
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400 leading-snug truncate">
                Terraform &amp; OpenTofu DAG Engine
              </div>
            </div>
          </div>

          {disabled && (
            <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-300 text-xs font-mono">
              CLI Session active. Plan is loaded directly from server CLI flags.
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              {totalCount > 0 ? "Replace Plan File" : "Upload Plan File"}
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={async (e) => {
                e.preventDefault();
                setIsDragging(false);
                if (!disabled && e.dataTransfer.files[0]) {
                  await handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => !disabled && !loading && fileInputRef.current?.click()}
              className={`group border-2 border-dashed rounded p-4 text-center cursor-pointer transition ${
                disabled
                  ? "border-workbench-border bg-workbench-subpanel opacity-50 cursor-not-allowed"
                  : isDragging
                  ? "border-sky-500 bg-sky-50 dark:bg-sky-950/20"
                  : selectedFile
                  ? "border-emerald-500/40 bg-workbench-subpanel"
                  : "border-workbench-border bg-workbench-subpanel hover:border-slate-400 dark:hover:border-slate-500"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                disabled={disabled || loading}
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                accept=".json,application/json"
                className="hidden"
              />
              <div className="flex flex-col items-center gap-1.5">
                <svg
                  className="w-6 h-6 text-slate-400 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <div className="text-xs font-mono text-slate-700 dark:text-slate-200">
                  {selectedFile ? selectedFile.name : "Drop plan.json here or click to browse"}
                </div>
                <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  {selectedFile ? formatBytes(selectedFile.size) : "JSON output of 'terraform show -json'"}
                </div>
              </div>
            </div>
          </div>

          {/* Validation Feedback */}
          {validationState && (
            <div className={`p-2.5 rounded border text-xs font-mono ${
              validationState.valid
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
            }`}>
              {validationState.valid ? (
                <div>
                  <div className="font-semibold">✓ Valid Plan JSON</div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    TF: {validationState.meta.tfVersion} • {validationState.meta.resourceCount} changes detected
                  </div>
                </div>
              ) : (
                <div>
                  <div className="font-semibold">✗ Invalid Plan</div>
                  <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{validationState.error}</div>
                </div>
              )}
            </div>
          )}

          {/* Server Error */}
          {apiError && (
            <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-mono">
              {apiError}
            </div>
          )}

          {/* Parse Button */}
          {selectedFile && validationState?.valid && (
            <button
              onClick={handleSubmit}
              disabled={loading || disabled}
              className="w-full py-1.5 px-3 rounded bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-50 text-white text-xs font-mono font-semibold transition cursor-pointer"
            >
              {loading ? "Parsing on Go server..." : "Parse & Update Canvas"}
            </button>
          )}

          {/* CLI Export Guidance */}
          <div className="p-2.5 rounded border border-workbench-border bg-workbench-header space-y-1.5 text-[11px] font-mono text-slate-600 dark:text-slate-400">
            <div className="text-slate-800 dark:text-slate-300 font-semibold">Generate JSON Plan:</div>
            <pre className="p-1.5 bg-workbench-subpanel rounded text-slate-800 dark:text-slate-300 overflow-x-auto select-all">
              terraform plan -out=tfplan{"\n"}terraform show -json tfplan &gt; plan.json
            </pre>
          </div>

          {/* Filepath AST Discovery & Ingestion Modes */}
          <div className="p-2.5 rounded border border-workbench-border bg-workbench-header space-y-2 text-[11px] font-sans">
            <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
              <svg className="w-3.5 h-3.5 text-sky-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Source Filepath &amp; AST Discovery</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
              Terraform plans omit source filepaths. <span className="font-semibold text-slate-700 dark:text-slate-300">plan-parse</span> discovers them depending on ingestion mode:
            </p>
            <div className="space-y-1.5 pt-0.5">
              <div className="p-2 rounded bg-workbench-subpanel border border-workbench-border/70 text-[10px]">
                <div className="flex items-center gap-1 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>CLI Workspace Mode</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  Launches with <code className="font-mono text-slate-700 dark:text-slate-300">-dir</code> or <code className="font-mono text-slate-700 dark:text-slate-300">-plan</code> in your repo. Reads <code className="font-mono text-sky-600 dark:text-sky-400">.terraform/modules/modules.json</code> and parses <code className="font-mono">.tf</code> ASTs to pinpoint exact files (<code className="font-mono text-sky-600 dark:text-sky-400">main.tf</code>) and lines.
                </p>
              </div>
              <div className="p-2 rounded bg-workbench-subpanel border border-workbench-border/70 text-[10px]">
                <div className="flex items-center gap-1 font-mono font-semibold text-amber-600 dark:text-amber-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span>Standalone Web Upload</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  Without local <code className="font-mono">.tf</code> files, resources gracefully default to <code className="font-mono text-amber-600 dark:text-amber-400">unknown file</code> while keeping full module trees, diffs, and blast radius intact.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default React.memo(WorkbenchSidebar);
