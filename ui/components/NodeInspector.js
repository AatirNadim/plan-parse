"use client";

import React, { useState, useMemo } from "react";
import { ACTION_CONFIG } from "../lib/action-theme";

/**
 * NodeInspector: Docked right-hand inspector panel.
 * Provides deep architectural insight into selected resources:
 * 1. Visual Attribute Diff
 * 2. Dependency & Blast Radius Lineage
 * 3. Raw HCL/JSON representation
 */
function NodeInspector({ node, onClose, onNavigateToNode }) {
  const [activeTab, setActiveTab] = useState("diff");
  const [copied, setCopied] = useState(false);

  if (!node) return null;

  const isEntity = node.type === "variable" || node.type === "output";
  const badgeKey = isEntity ? node.type : (node.change ? node.change.toLowerCase() : "no-op");
  const cfg = ACTION_CONFIG[badgeKey] || ACTION_CONFIG["no-op"];
  const badgeLabel = isEntity ? cfg.label : (node.change || "no-op");

  const handleCopyId = () => {
    if (node.id && typeof navigator !== "undefined") {
      navigator.clipboard.writeText(node.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  // Compute attribute diff entries
  const diffEntries = useMemo(() => {
    if (!node.changeDetails) return null;
    const before = node.changeDetails.before || {};
    const after = node.changeDetails.after || {};
    const allKeys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).sort();

    return allKeys.map((key) => {
      const bVal = before[key];
      const aVal = after[key];
      const isAdded = bVal === undefined && aVal !== undefined;
      const isRemoved = bVal !== undefined && aVal === undefined;
      const isModified = JSON.stringify(bVal) !== JSON.stringify(aVal);

      return {
        key,
        before: bVal,
        after: aVal,
        isAdded,
        isRemoved,
        isModified,
      };
    });
  }, [node.changeDetails]);

  return (
    <aside className="w-96 h-full border-l border-workbench-border bg-workbench-panel flex flex-col shrink-0 select-none z-10">
      {/* Header */}
      <div className="p-3 border-b border-workbench-border bg-workbench-header shrink-0 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded uppercase tracking-wider"
              style={{
                backgroundColor: `${cfg.color}15`,
                color: cfg.color,
                border: `1px solid ${cfg.color}30`,
              }}
            >
              {cfg.symbol} {badgeLabel}
            </span>
            {node.module && (
              <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded truncate max-w-[140px]">
                {node.module}
              </span>
            )}
          </div>
          <h2 className="text-xs font-mono font-semibold text-white break-all leading-snug select-text">
            {node.label || node.id}
          </h2>
          {(node.resourceType || isEntity) && (
            <div className="text-[10px] font-mono text-slate-500 mt-0.5 truncate">
              {node.resourceType || cfg.label}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-workbench-subpanel transition shrink-0"
          title="Close inspector (Esc)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-workbench-border bg-workbench-subpanel/50 p-1 gap-1 shrink-0">
        <button
          onClick={() => setActiveTab("diff")}
          className={`flex-1 py-1 px-2 rounded text-xs font-mono transition ${
            activeTab === "diff"
              ? "bg-workbench-subpanel text-white border border-workbench-border font-medium"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Attribute Diff
        </button>
        <button
          onClick={() => setActiveTab("lineage")}
          className={`flex-1 py-1 px-2 rounded text-xs font-mono transition ${
            activeTab === "lineage"
              ? "bg-workbench-subpanel text-white border border-workbench-border font-medium"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Lineage
        </button>
        <button
          onClick={() => setActiveTab("json")}
          className={`flex-1 py-1 px-2 rounded text-xs font-mono transition ${
            activeTab === "json"
              ? "bg-workbench-subpanel text-white border border-workbench-border font-medium"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Raw JSON
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar text-xs">
        {/* Tab 1: Diff View */}
        {activeTab === "diff" && (
          <div className="space-y-3">
            {diffEntries && diffEntries.length > 0 ? (
              <div className="space-y-2">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Resource Attribute Changes
                </div>
                <div className="divide-y divide-workbench-border border border-workbench-border rounded bg-workbench-header overflow-hidden font-mono text-[11px]">
                  {diffEntries.map((item) => (
                    <div
                      key={item.key}
                      className={`p-2 ${
                        item.isAdded
                          ? "bg-emerald-950/20 text-emerald-300"
                          : item.isRemoved
                          ? "bg-rose-950/20 text-rose-300"
                          : item.isModified
                          ? "bg-amber-950/15 text-slate-200"
                          : "text-slate-400"
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold mb-1">
                        <span className="truncate">{item.key}</span>
                        <span className="text-[10px] uppercase font-bold shrink-0">
                          {item.isAdded ? "+ ADDED" : item.isRemoved ? "- REMOVED" : item.isModified ? "~ MODIFIED" : "= SAME"}
                        </span>
                      </div>
                      {item.isModified && item.before !== undefined && (
                        <div className="text-rose-400/80 line-through truncate text-[10px]">
                          - {JSON.stringify(item.before)}
                        </div>
                      )}
                      <div className="truncate text-[10px] text-slate-300">
                        {item.after !== undefined ? `+ ${JSON.stringify(item.after)}` : "(removed)"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-slate-500 font-mono text-xs">
                No granular attribute change diff available for this resource.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Lineage (Dependencies & Blast Radius) */}
        {activeTab === "lineage" && (
          <div className="space-y-4">
            {/* Depends On */}
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Depends On ({node.outgoers ? node.outgoers.length : 0})</span>
                <span className="text-slate-600">Upstream</span>
              </div>
              {node.outgoers && node.outgoers.length > 0 ? (
                <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                  {node.outgoers.map((id) => (
                    <button
                      key={id}
                      onClick={() => onNavigateToNode && onNavigateToNode(id)}
                      className="w-full text-left p-1.5 rounded bg-workbench-header hover:bg-workbench-subpanel border border-workbench-border text-slate-300 hover:text-white font-mono text-[11px] truncate flex items-center justify-between transition"
                      title={id}
                    >
                      <span className="truncate">→ {id}</span>
                      <span className="text-[10px] text-slate-500 shrink-0 ml-1">focus</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-2 text-slate-600 font-mono text-[11px] rounded bg-workbench-header border border-workbench-border">
                  No upstream dependencies
                </div>
              )}
            </div>

            {/* Referenced By (Blast Radius) */}
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Referenced By ({node.incomers ? node.incomers.length : 0})</span>
                <span className="text-slate-600">Blast Radius</span>
              </div>
              {node.incomers && node.incomers.length > 0 ? (
                <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                  {node.incomers.map((id) => (
                    <button
                      key={id}
                      onClick={() => onNavigateToNode && onNavigateToNode(id)}
                      className="w-full text-left p-1.5 rounded bg-workbench-header hover:bg-workbench-subpanel border border-workbench-border text-slate-300 hover:text-white font-mono text-[11px] truncate flex items-center justify-between transition"
                      title={id}
                    >
                      <span className="truncate">← {id}</span>
                      <span className="text-[10px] text-slate-500 shrink-0 ml-1">focus</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-2 text-slate-600 font-mono text-[11px] rounded bg-workbench-header border border-workbench-border">
                  No downstream dependents (leaf node)
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Raw JSON */}
        {activeTab === "json" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Raw JSON Definition
              </span>
              <button
                onClick={handleCopyId}
                className="px-2 py-0.5 rounded text-[10px] font-mono bg-workbench-subpanel hover:bg-workbench-hover border border-workbench-border text-slate-300 transition"
              >
                {copied ? "Copied!" : "Copy Address"}
              </button>
            </div>
            <pre className="p-2.5 rounded bg-workbench-header border border-workbench-border text-slate-300 font-mono text-[10px] overflow-x-auto max-h-80 custom-scrollbar select-text leading-relaxed">
              {JSON.stringify(node, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </aside>
  );
}

export default React.memo(NodeInspector);
