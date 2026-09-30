"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ACTION_CONFIG } from "../lib/action-theme";
import {
  computeAttributeDiff,
  generateHclDiff,
  getDiffSummary,
  formatHclValue,
} from "../lib/hcl-diff";

/**
 * NodeDiffModal: Tier 2 Deep IaC Diff Modal.
 * Precision side-by-side, unified CLI-style HCL diff with sticky line gutters,
 * and attribute matrix for deep architectural inspection of Terraform plan mutations.
 */
function NodeDiffModal({ isOpen, node, onClose }) {
  const [viewMode, setViewMode] = useState("unified"); // "unified" | "split" | "matrix"
  const [filterChangedOnly, setFilterChangedOnly] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedHcl, setCopiedHcl] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Close on Escape or switch view on Tab
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if (e.key === "Tab" && !e.shiftKey && e.target.tagName !== "INPUT") {
        e.preventDefault();
        setViewMode((curr) => {
          if (curr === "unified") return "split";
          if (curr === "split") return "matrix";
          return "unified";
        });
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const summary = useMemo(() => {
    if (!node) return null;
    return getDiffSummary(node);
  }, [node]);

  const hclDiff = useMemo(() => {
    if (!node) return { rawHcl: "", lines: [] };
    return generateHclDiff(node);
  }, [node]);

  const attributeDiff = useMemo(() => {
    if (!node) return [];
    return computeAttributeDiff(node.changeDetails || node.data?.changeDetails);
  }, [node]);

  // Filtered attribute entries
  const filteredAttributes = useMemo(() => {
    return attributeDiff.filter((attr) => {
      if (filterChangedOnly && attr.isSame) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const k = attr.key.toLowerCase();
      const bStr = JSON.stringify(attr.before || "").toLowerCase();
      const aStr = JSON.stringify(attr.after || "").toLowerCase();
      return k.includes(q) || bStr.includes(q) || aStr.includes(q);
    });
  }, [attributeDiff, filterChangedOnly, searchQuery]);

  const handleCopyHcl = useCallback(() => {
    if (hclDiff.rawHcl && typeof navigator !== "undefined") {
      navigator.clipboard.writeText(hclDiff.rawHcl);
      setCopiedHcl(true);
      setTimeout(() => setCopiedHcl(false), 1600);
    }
  }, [hclDiff.rawHcl]);

  const handleCopyAddress = useCallback(() => {
    const addr = node?.id || node?.label;
    if (addr && typeof navigator !== "undefined") {
      navigator.clipboard.writeText(addr);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 1600);
    }
  }, [node]);

  if (!isOpen || !node) return null;

  const isEntity = node.type === "variable" || node.type === "output";
  const badgeKey = isEntity ? node.type : (node.change ? node.change.toLowerCase() : "no-op");
  const cfg = ACTION_CONFIG[badgeKey] || ACTION_CONFIG["no-op"];
  const badgeLabel = isEntity ? cfg.label : (node.change || "no-op");
  const address = node.id || node.label || "resource";
  const fileLocation = node.file ? `${node.file}${node.line ? `:${node.line}` : ""}` : null;
  const moduleBreadcrumb = node.module || "root";
  const typeBreadcrumb = isEntity ? (node.type || "resource") : (node.resourceType || "resource");
  const nameBreadcrumb = node.resourceName || node.label || address;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl h-[85vh] bg-workbench-panel border border-workbench-border rounded-xl shadow-2xl flex flex-col overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Breadcrumbs + Action Badge + Utility Actions */}
        <div className="px-5 py-3.5 border-b border-workbench-border bg-workbench-header flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="px-2 py-0.5 text-xs font-mono font-bold rounded uppercase tracking-wider shrink-0"
              style={{
                backgroundColor: `${cfg.color}15`,
                color: cfg.color,
                border: `1px solid ${cfg.color}35`,
              }}
            >
              {cfg.symbol} {badgeLabel}
            </span>

            <div className="min-w-0">
              {/* Breadcrumbs: Module > Type > Name */}
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                <span className="text-purple-600 dark:text-purple-400 font-medium truncate max-w-[140px]">{moduleBreadcrumb}</span>
                <span>/</span>
                <span className="text-slate-600 dark:text-slate-300 truncate max-w-[160px]">{typeBreadcrumb}</span>
                <span>/</span>
                <span className="text-slate-800 dark:text-slate-100 font-semibold truncate max-w-[200px] select-text">{nameBreadcrumb}</span>
              </div>

              {/* Full Address & File info */}
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                <span className="select-text truncate text-slate-600 dark:text-slate-400">{address}</span>
                {fileLocation && (
                  <>
                    <span>•</span>
                    <span className="text-sky-600 dark:text-sky-400 truncate">{fileLocation}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleCopyAddress}
              className="px-2 py-1 text-xs font-mono text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-workbench-subpanel hover:bg-workbench-hover border border-workbench-border rounded transition cursor-pointer"
              title="Copy resource address"
            >
              {copiedAddress ? "Copied Address!" : "Copy Address"}
            </button>

            <button
              onClick={handleCopyHcl}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-workbench-subpanel hover:bg-workbench-hover border border-workbench-border rounded transition cursor-pointer"
              title="Copy formatted HCL to clipboard"
            >
              <svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>{copiedHcl ? "Copied Diff!" : "Copy Diff"}</span>
            </button>

            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-2 py-1 rounded bg-workbench-subpanel hover:bg-workbench-hover text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border border-workbench-border transition text-xs font-mono cursor-pointer"
              title="Close dialog (Escape)"
            >
              <span className="text-[10px]">Esc</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* View Switcher Segmented Control & Search Filters */}
        <div className="px-5 py-2 border-b border-workbench-border bg-workbench-subpanel/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1 bg-workbench-panel p-0.5 rounded border border-workbench-border">
            <button
              onClick={() => setViewMode("unified")}
              className={`px-3 py-1 rounded text-xs font-mono transition cursor-pointer ${
                viewMode === "unified"
                  ? "bg-workbench-subpanel text-slate-900 dark:text-white font-medium shadow-xs border border-workbench-border"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Unified HCL
            </button>
            <button
              onClick={() => setViewMode("split")}
              className={`px-3 py-1 rounded text-xs font-mono transition cursor-pointer ${
                viewMode === "split"
                  ? "bg-workbench-subpanel text-slate-900 dark:text-white font-medium shadow-xs border border-workbench-border"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Side-by-Side HCL
            </button>
            <button
              onClick={() => setViewMode("matrix")}
              className={`px-3 py-1 rounded text-xs font-mono transition cursor-pointer ${
                viewMode === "matrix"
                  ? "bg-workbench-subpanel text-slate-900 dark:text-white font-medium shadow-xs border border-workbench-border"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Attributes JSON
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Search filter */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter attributes..."
                className="w-40 sm:w-48 px-2 py-1 pl-6 bg-workbench-panel border border-workbench-border rounded text-xs font-mono text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              <svg className="w-3 h-3 text-slate-400 dark:text-slate-500 absolute left-2 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Changed only toggle */}
            <label className="flex items-center gap-1.5 text-xs font-mono text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={filterChangedOnly}
                onChange={(e) => setFilterChangedOnly(e.target.checked)}
                className="rounded border-workbench-border bg-workbench-panel text-sky-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span className="hidden sm:inline">Changed Only</span>
            </label>
          </div>
        </div>

        {/* Modal Body: Monospace Diff Typography with Sticky Line Gutter */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-workbench-panel select-text">
          {/* View 1: Unified HCL Diff */}
          {viewMode === "unified" && (
            <div className="font-mono text-[12px] leading-relaxed rounded-lg border border-workbench-border bg-workbench-header overflow-x-auto custom-scrollbar">
              <div className="divide-y divide-workbench-border/40 min-w-full w-max">
                {hclDiff.lines.map((line, idx) => {
                  let rowBg = "text-slate-600 dark:text-slate-400 hover:bg-workbench-subpanel/30";
                  let symbolColor = "text-slate-400 dark:text-slate-500";
                  let badge = null;

                  if (line.type === "add") {
                    rowBg = "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-l-2 border-emerald-500";
                    symbolColor = "text-emerald-500 font-bold";
                  } else if (line.type === "remove") {
                    rowBg = "bg-rose-500/10 text-rose-800 dark:text-rose-300 border-l-2 border-rose-500";
                    symbolColor = "text-rose-500 font-bold";
                  } else if (line.type === "modify") {
                    rowBg = "bg-amber-500/10 text-amber-900 dark:text-amber-300 border-l-2 border-amber-500";
                    symbolColor = "text-amber-500 font-bold";
                  } else if (line.type === "header") {
                    rowBg = "font-bold text-slate-900 dark:text-white bg-workbench-subpanel/40";
                    symbolColor = "text-sky-500 font-bold";
                  } else if (line.type === "comment") {
                    rowBg = "text-slate-500 dark:text-slate-400 italic bg-workbench-subpanel/20";
                    symbolColor = "text-slate-400 dark:text-slate-500";
                  }

                  if (line.forcesReplacement) {
                    badge = (
                      <span className="ml-3 px-1.5 py-[1px] text-[9px] rounded uppercase font-bold bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/40 shrink-0">
                        forces replacement
                      </span>
                    );
                  }

                  return (
                    <div key={idx} className={`flex items-center justify-between px-2 py-0.5 transition-colors ${rowBg}`}>
                      <div className="flex items-center min-w-0 pr-4">
                        {/* Sticky Gutter Line Number */}
                        <span className="w-10 text-right pr-3 select-none text-slate-400 dark:text-slate-600 font-mono text-[11px] shrink-0 border-r border-workbench-border/40 mr-2.5">
                          {line.lineNum}
                        </span>
                        {/* Gutter Symbol */}
                        <span className={`w-4 text-center select-none font-mono mr-1.5 shrink-0 ${symbolColor}`}>
                          {line.symbol}
                        </span>
                        {/* Line Text */}
                        <span className="whitespace-pre font-mono">{line.text}</span>
                      </div>
                      {badge}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* View 2: Split (Side-by-Side) Diff */}
          {viewMode === "split" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[12px] h-full">
              {/* Left Pane: Current State (Before) */}
              <div className="border border-workbench-border rounded-lg bg-workbench-header overflow-hidden flex flex-col">
                <div className="px-3.5 py-2 bg-workbench-subpanel border-b border-workbench-border flex items-center justify-between text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
                  <span>Current State (Before)</span>
                  <span className="text-rose-500 font-bold">- DELETIONS</span>
                </div>
                <div className="p-3 space-y-1.5 flex-1 overflow-y-auto max-h-[55vh] custom-scrollbar">
                  {filteredAttributes.length > 0 ? (
                    filteredAttributes.map((attr) => (
                      <div
                        key={attr.key}
                        className={`p-2 rounded border border-workbench-border/60 ${
                          attr.isRemoved || attr.isModified
                            ? "bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/30"
                            : "bg-workbench-panel text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <div className="font-semibold mb-0.5">{attr.key}</div>
                        <div className="text-[11px] break-all leading-snug">
                          {attr.before !== undefined
                            ? attr.isSensitive
                              ? "(sensitive value)"
                              : formatHclValue(attr.before)
                            : "(null / absent)"}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-500 dark:text-slate-400">No matching attributes</div>
                  )}
                </div>
              </div>

              {/* Right Pane: Planned State (After) */}
              <div className="border border-workbench-border rounded-lg bg-workbench-header overflow-hidden flex flex-col">
                <div className="px-3.5 py-2 bg-workbench-subpanel border-b border-workbench-border flex items-center justify-between text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
                  <span>Planned State (After)</span>
                  <span className="text-emerald-500 font-bold">+ ADDITIONS</span>
                </div>
                <div className="p-3 space-y-1.5 flex-1 overflow-y-auto max-h-[55vh] custom-scrollbar">
                  {filteredAttributes.length > 0 ? (
                    filteredAttributes.map((attr) => (
                      <div
                        key={attr.key}
                        className={`p-2 rounded border border-workbench-border/60 ${
                          attr.isAdded || attr.isModified
                            ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30"
                            : "bg-workbench-panel text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <div className="font-semibold mb-0.5 flex items-center justify-between">
                          <span>{attr.key}</span>
                          {attr.forcesReplacement && (
                            <span className="text-[9px] uppercase px-1.5 py-[1px] rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40">
                              replaces
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] break-all leading-snug">
                          {attr.after !== undefined
                            ? attr.isUnknown
                              ? "(known after apply)"
                              : attr.isSensitive
                              ? "(sensitive value)"
                              : formatHclValue(attr.after)
                            : "(null / removed)"}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-500 dark:text-slate-400">No matching attributes</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* View 3: Attribute Matrix */}
          {viewMode === "matrix" && (
            <div className="border border-workbench-border rounded-lg overflow-hidden">
              <table className="w-full text-left font-mono text-[11px] divide-y divide-workbench-border">
                <thead className="bg-workbench-header text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-2.5">Attribute</th>
                    <th className="p-2.5">Change Type</th>
                    <th className="p-2.5">Before</th>
                    <th className="p-2.5">After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-workbench-border/60 bg-workbench-panel">
                  {filteredAttributes.length > 0 ? (
                    filteredAttributes.map((attr) => {
                      let typeLabel = "UNCHANGED";
                      let typeBadge = "text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/20";

                      if (attr.isAdded) {
                        typeLabel = "+ ADDED";
                        typeBadge = "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
                      } else if (attr.isRemoved) {
                        typeLabel = "- REMOVED";
                        typeBadge = "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30";
                      } else if (attr.isModified) {
                        typeLabel = "~ MODIFIED";
                        typeBadge = "text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/30";
                      }

                      return (
                        <tr key={attr.key} className="hover:bg-workbench-subpanel/50 transition-colors">
                          <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">
                            <div>{attr.key}</div>
                            {attr.forcesReplacement && (
                              <div className="text-[9px] text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                (forces replacement)
                              </div>
                            )}
                          </td>
                          <td className="p-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${typeBadge}`}>
                              {typeLabel}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-600 dark:text-slate-400 max-w-xs break-all">
                            {attr.before !== undefined
                              ? attr.isSensitive
                                ? "(sensitive)"
                                : formatHclValue(attr.before)
                              : "-"}
                          </td>
                          <td className="p-2.5 text-slate-800 dark:text-slate-200 max-w-xs break-all font-semibold">
                            {attr.after !== undefined
                              ? attr.isUnknown
                                ? "(known after apply)"
                                : attr.isSensitive
                                ? "(sensitive)"
                                : formatHclValue(attr.after)
                              : "-"}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-500 dark:text-slate-400 font-mono">
                        No attribute changes match the current filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-workbench-border bg-workbench-header flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">Delta Metrics:</span>
            {summary?.addedCount > 0 && (
              <span className="px-1.5 py-[1px] rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                +{summary.addedCount} added
              </span>
            )}
            {summary?.modifiedCount > 0 && (
              <span className="px-1.5 py-[1px] rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                ~{summary.modifiedCount} modified
              </span>
            )}
            {summary?.removedCount > 0 && (
              <span className="px-1.5 py-[1px] rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                -{summary.removedCount} removed
              </span>
            )}
            {summary?.forcesReplacement && (
              <span className="px-1.5 py-[1px] rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-bold">
                ± forces replacement
              </span>
            )}
          </div>

          <div className="text-slate-400 dark:text-slate-500 text-[10px] flex items-center gap-2">
            <span><kbd className="px-1 py-[1px] rounded bg-workbench-subpanel border border-workbench-border text-slate-600 dark:text-slate-300">Tab</kbd> switch view</span>
            <span>•</span>
            <span><kbd className="px-1 py-[1px] rounded bg-workbench-subpanel border border-workbench-border text-slate-600 dark:text-slate-300">Esc</kbd> close</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(NodeDiffModal);
