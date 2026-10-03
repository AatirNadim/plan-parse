"use client";

import React, { useState, useMemo, useCallback } from "react";
import { ACTION_CONFIG } from "../lib/action-theme";
import TargetCommandCard from "./TargetCommandCard";
import { getNodeTargetAddress, copyToClipboard } from "../lib/target-command";
import { computeBlastRadius, computeUpstreamLineage } from "../lib/blast-radius";

/**
 * NodeInspector: Docked right-hand inspector panel.
 * Provides deep architectural insight into selected resources:
 * 1. Visual Attribute Diff
 * 2. Targeted Apply Command Generator (Target CLI)
 * 3. Dependency & Transitive Blast Radius Lineage
 * 4. Raw HCL/JSON representation
 */
function NodeInspector({
  node,
  graphData,
  onClose,
  onNavigateToNode,
  onOpenFullDiff,
  isBlastIsolated = false,
  onToggleBlastIsolation,
}) {
  const [activeTab, setActiveTab] = useState("diff");
  const [copied, setCopied] = useState(false);
  const [targetCopied, setTargetCopied] = useState(false);
  const [mutatingOnlyBlast, setMutatingOnlyBlast] = useState(false);

  if (!node) return null;

  const isEntity = node.type === "variable" || node.type === "output";
  const badgeKey = isEntity ? node.type : (node.change ? node.change.toLowerCase() : "no-op");
  const cfg = ACTION_CONFIG[badgeKey] || ACTION_CONFIG["no-op"];
  const badgeLabel = isEntity ? cfg.label : (node.change || "no-op");

  const targetAddress = useMemo(() => {
    return getNodeTargetAddress(node);
  }, [node]);

  const handleCopyId = () => {
    if (node.id && typeof navigator !== "undefined") {
      navigator.clipboard.writeText(node.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleQuickCopyTarget = useCallback(async () => {
    if (!targetAddress) return;
    const cmd = `terraform apply -target="${targetAddress}"`;
    const ok = await copyToClipboard(cmd);
    if (ok) {
      setTargetCopied(true);
      setTimeout(() => setTargetCopied(false), 1800);
    }
  }, [targetAddress]);

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

  // Compute transitive blast radius and upstream lineage
  const blastRadius = useMemo(() => {
    if (!node || !node.id || !graphData) return null;
    return computeBlastRadius(node.id, graphData);
  }, [node, graphData]);

  const upstreamLineage = useMemo(() => {
    if (!node || !node.id || !graphData) return null;
    return computeUpstreamLineage(node.id, graphData);
  }, [node, graphData]);

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
              <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded truncate max-w-[140px]">
                {node.module}
              </span>
            )}
          </div>
          <h2 className="text-xs font-mono font-semibold text-slate-900 dark:text-white break-all leading-snug select-text">
            {node.label || node.id}
          </h2>
          {(node.resourceType || isEntity) && (
            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {node.resourceType || cfg.label}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {targetAddress && (
            <button
              onClick={handleQuickCopyTarget}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono border transition cursor-pointer ${
                targetCopied
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-semibold"
                  : "bg-workbench-subpanel hover:bg-workbench-hover border border-workbench-border text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
              title={`Quick copy: terraform apply -target="${targetAddress}"`}
            >
              {targetCopied ? (
                <>
                  <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>-target</span>
                </>
              )}
            </button>
          )}

          {onOpenFullDiff && (
            <button
              onClick={() => onOpenFullDiff(node)}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-mono bg-workbench-subpanel hover:bg-workbench-hover border border-workbench-border text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              title="Open full diff modal (D)"
            >
              <svg className="w-3.5 h-3.5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              <span>Full Diff</span>
              <kbd className="px-1 text-[9px] bg-workbench-panel rounded border border-workbench-border text-slate-500">D</kbd>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-workbench-subpanel transition shrink-0 cursor-pointer"
            title="Close inspector (Esc)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-workbench-border bg-workbench-subpanel/50 p-1 gap-1 shrink-0 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab("diff")}
          className={`flex-1 py-1 px-2 rounded text-xs font-mono transition cursor-pointer whitespace-nowrap ${
            activeTab === "diff"
              ? "bg-workbench-subpanel text-slate-900 dark:text-white border border-workbench-border font-medium"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          Attribute Diff
        </button>
        <button
          onClick={() => setActiveTab("target")}
          className={`flex-1 py-1 px-2 rounded text-xs font-mono transition cursor-pointer whitespace-nowrap flex items-center justify-center gap-1 ${
            activeTab === "target"
              ? "bg-workbench-subpanel text-slate-900 dark:text-white border border-workbench-border font-medium"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <span>Target CLI</span>
        </button>
        <button
          onClick={() => setActiveTab("lineage")}
          className={`flex-1 py-1 px-2 rounded text-xs font-mono transition cursor-pointer whitespace-nowrap ${
            activeTab === "lineage"
              ? "bg-workbench-subpanel text-slate-900 dark:text-white border border-workbench-border font-medium"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          Lineage
        </button>
        <button
          onClick={() => setActiveTab("json")}
          className={`flex-1 py-1 px-2 rounded text-xs font-mono transition cursor-pointer whitespace-nowrap ${
            activeTab === "json"
              ? "bg-workbench-subpanel text-slate-900 dark:text-white border border-workbench-border font-medium"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          Raw JSON
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4 custom-scrollbar text-xs">
        {/* Tab 1: Diff View */}
        {activeTab === "diff" && (
          <div className="space-y-3">
            {diffEntries && diffEntries.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Resource Attribute Changes
                  </span>
                  {onOpenFullDiff && (
                    <button
                      onClick={() => onOpenFullDiff(node)}
                      className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-workbench-header hover:bg-workbench-subpanel border border-workbench-border text-sky-600 dark:text-sky-400 transition cursor-pointer flex items-center gap-1"
                      title="Open full diff modal (D)"
                    >
                      <span>Full Diff</span>
                      <kbd className="text-[9px] px-1 bg-workbench-panel rounded border border-workbench-border">D</kbd>
                    </button>
                  )}
                </div>
                <div className="divide-y divide-workbench-border border border-workbench-border rounded bg-workbench-header overflow-hidden font-mono text-[11px]">
                  {diffEntries.map((item) => (
                    <div
                      key={item.key}
                      className={`p-2 ${
                        item.isAdded
                          ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                          : item.isRemoved
                          ? "bg-rose-500/10 text-rose-800 dark:text-rose-300"
                          : item.isModified
                          ? "bg-amber-500/10 text-slate-900 dark:text-slate-200"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold mb-1">
                        <span className="truncate">{item.key}</span>
                        <span className="text-[10px] uppercase font-bold shrink-0">
                          {item.isAdded ? "+ ADDED" : item.isRemoved ? "- REMOVED" : item.isModified ? "~ MODIFIED" : "= SAME"}
                        </span>
                      </div>
                      {item.isModified && item.before !== undefined && (
                        <div className="text-rose-600/80 dark:text-rose-400/80 line-through truncate text-[10px]">
                          - {JSON.stringify(item.before)}
                        </div>
                      )}
                      <div className="truncate text-[10px] text-slate-700 dark:text-slate-300">
                        {item.after !== undefined ? `+ ${JSON.stringify(item.after)}` : "(removed)"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-slate-400 dark:text-slate-500 font-mono text-xs">
                No granular attribute change diff available for this resource.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Targeted Command Generator (Target CLI) */}
        {activeTab === "target" && (
          <div className="space-y-3">
            <TargetCommandCard
              node={node}
              graphData={graphData}
              onNavigateToNode={onNavigateToNode}
            />
          </div>
        )}

        {/* Tab 3: Lineage (Dependencies & Blast Radius) */}
        {activeTab === "lineage" && (
          <div className="space-y-4">
            {/* Blast Radius Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Downstream Blast Radius</span>
                </span>
                {blastRadius && (
                  <span className="text-[10px] font-mono font-medium text-slate-400">
                    Max Depth: {blastRadius.maxDepth} {blastRadius.maxDepth === 1 ? "hop" : "hops"}
                  </span>
                )}
              </div>

              {blastRadius && blastRadius.stats.totalCount > 0 ? (
                <div className="space-y-2.5">
                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-3 gap-1.5 p-2 rounded bg-workbench-header border border-workbench-border text-center font-mono">
                    <div className="p-1 rounded bg-workbench-subpanel/50 border border-workbench-border/50">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Direct</div>
                      <div className="text-xs font-bold text-sky-600 dark:text-sky-400">
                        {blastRadius.stats.directCount}
                      </div>
                    </div>
                    <div className="p-1 rounded bg-workbench-subpanel/50 border border-workbench-border/50">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Transitive</div>
                      <div className="text-xs font-bold text-purple-600 dark:text-purple-400">
                        {blastRadius.stats.transitiveCount}
                      </div>
                    </div>
                    <div className="p-1 rounded bg-workbench-subpanel/50 border border-workbench-border/50">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Mutating</div>
                      <div className={`text-xs font-bold ${
                        blastRadius.stats.mutatingCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-500"
                      }`}>
                        {blastRadius.stats.mutatingCount}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Filters */}
                  <div className="flex flex-col gap-2">
                    {onToggleBlastIsolation && (
                      <button
                        onClick={onToggleBlastIsolation}
                        className={`w-full py-1.5 px-2.5 rounded text-xs font-mono border flex items-center justify-center gap-2 transition cursor-pointer ${
                          isBlastIsolated
                            ? "bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/40 font-semibold shadow-sm"
                            : "bg-workbench-subpanel hover:bg-workbench-hover border-workbench-border text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                        }`}
                        title="Toggle Subgraph Isolation on Canvas (B)"
                      >
                        <span className={`w-2 h-2 rounded-full ${isBlastIsolated ? "bg-sky-500 animate-pulse" : "bg-slate-400"}`} />
                        <span>{isBlastIsolated ? "Exit Subgraph Isolation" : "Isolate Blast Radius Subgraph"}</span>
                        <kbd className="px-1 text-[9px] bg-workbench-panel rounded border border-workbench-border text-slate-500">B</kbd>
                      </button>
                    )}

                    {blastRadius.stats.mutatingCount > 0 && (
                      <label className="flex items-center gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-400 cursor-pointer select-none px-1">
                        <input
                          type="checkbox"
                          checked={mutatingOnlyBlast}
                          onChange={(e) => setMutatingOnlyBlast(e.target.checked)}
                          className="rounded border-workbench-border text-sky-500 focus:ring-0 focus:ring-offset-0 bg-workbench-subpanel"
                        />
                        <span>Only show mutating casualties ({blastRadius.stats.mutatingCount} of {blastRadius.stats.totalCount})</span>
                      </label>
                    )}
                  </div>

                  {/* Tiered Casualty List */}
                  <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar pr-0.5">
                    {/* Tier 1: Direct Dependents */}
                    {blastRadius.byDepth[1] && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
                          <span>Tier 1 • Direct Dependents (1 hop)</span>
                          <span className="font-semibold">{blastRadius.byDepth[1].length}</span>
                        </div>
                        <div className="space-y-1">
                          {blastRadius.byDepth[1]
                            .filter((item) => !mutatingOnlyBlast || item.isMutating)
                            .map((item) => {
                              const actionKey = item.change ? item.change.toLowerCase() : "no-op";
                              const actCfg = ACTION_CONFIG[actionKey] || ACTION_CONFIG["no-op"];
                              return (
                                <button
                                  key={item.id}
                                  onClick={() => onNavigateToNode && onNavigateToNode(item.id)}
                                  className="w-full text-left p-1.5 rounded bg-workbench-header hover:bg-workbench-subpanel border border-workbench-border text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-mono text-[11px] flex items-center justify-between gap-1.5 transition cursor-pointer group"
                                  title={`Focus ${item.id}`}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span
                                      className="px-1 py-0.2 text-[9px] font-bold rounded uppercase shrink-0"
                                      style={{
                                        backgroundColor: `${actCfg.color}15`,
                                        color: actCfg.color,
                                        border: `1px solid ${actCfg.color}35`,
                                      }}
                                    >
                                      {actCfg.symbol}
                                    </span>
                                    <span className="truncate">{item.label || item.id}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 group-hover:text-sky-500 shrink-0 transition">
                                    focus →
                                  </span>
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Tier 2: Secondary Dependents */}
                    {blastRadius.byDepth[2] && (
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
                          <span>Tier 2 • Secondary Dependents (2 hops)</span>
                          <span className="font-semibold">{blastRadius.byDepth[2].length}</span>
                        </div>
                        <div className="space-y-1">
                          {blastRadius.byDepth[2]
                            .filter((item) => !mutatingOnlyBlast || item.isMutating)
                            .map((item) => {
                              const actionKey = item.change ? item.change.toLowerCase() : "no-op";
                              const actCfg = ACTION_CONFIG[actionKey] || ACTION_CONFIG["no-op"];
                              return (
                                <button
                                  key={item.id}
                                  onClick={() => onNavigateToNode && onNavigateToNode(item.id)}
                                  className="w-full text-left p-1.5 rounded bg-workbench-header hover:bg-workbench-subpanel border border-workbench-border text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-mono text-[11px] flex items-center justify-between gap-1.5 transition cursor-pointer group"
                                  title={`Focus ${item.id}`}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span
                                      className="px-1 py-0.2 text-[9px] font-bold rounded uppercase shrink-0"
                                      style={{
                                        backgroundColor: `${actCfg.color}15`,
                                        color: actCfg.color,
                                        border: `1px solid ${actCfg.color}35`,
                                      }}
                                    >
                                      {actCfg.symbol}
                                    </span>
                                    <span className="truncate">{item.label || item.id}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 group-hover:text-sky-500 shrink-0 transition">
                                    focus →
                                  </span>
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Tier 3+: Deep Cascades */}
                    {Object.keys(blastRadius.byDepth)
                      .filter((d) => Number(d) >= 3)
                      .map((d) => (
                        <div key={d} className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
                            <span>Tier {d} • Deep Cascades ({d} hops)</span>
                            <span className="font-semibold">{blastRadius.byDepth[d].length}</span>
                          </div>
                          <div className="space-y-1">
                            {blastRadius.byDepth[d]
                              .filter((item) => !mutatingOnlyBlast || item.isMutating)
                              .map((item) => {
                                const actionKey = item.change ? item.change.toLowerCase() : "no-op";
                                const actCfg = ACTION_CONFIG[actionKey] || ACTION_CONFIG["no-op"];
                                return (
                                  <button
                                    key={item.id}
                                    onClick={() => onNavigateToNode && onNavigateToNode(item.id)}
                                    className="w-full text-left p-1.5 rounded bg-workbench-header hover:bg-workbench-subpanel border border-workbench-border text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-mono text-[11px] flex items-center justify-between gap-1.5 transition cursor-pointer group"
                                    title={`Focus ${item.id}`}
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span
                                        className="px-1 py-0.2 text-[9px] font-bold rounded uppercase shrink-0"
                                        style={{
                                          backgroundColor: `${actCfg.color}15`,
                                          color: actCfg.color,
                                          border: `1px solid ${actCfg.color}35`,
                                        }}
                                      >
                                        {actCfg.symbol}
                                      </span>
                                      <span className="truncate">{item.label || item.id}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 group-hover:text-sky-500 shrink-0 transition">
                                      focus →
                                    </span>
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="p-2.5 text-slate-500 dark:text-slate-500 font-mono text-[11px] rounded bg-workbench-header border border-workbench-border">
                  No downstream dependents (leaf resource with zero blast radius).
                </div>
              )}
            </div>

            {/* Upstream Prerequisites Section */}
            <div className="pt-3 border-t border-workbench-border/70 space-y-2">
              <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Depends On ({upstreamLineage ? upstreamLineage.stats.totalCount : (node.outgoers ? node.outgoers.length : 0)})</span>
                <span className="text-slate-400 dark:text-slate-600">Upstream Prerequisites</span>
              </div>
              {upstreamLineage && upstreamLineage.stats.totalCount > 0 ? (
                <div className="space-y-2">
                  <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                    {upstreamLineage.all.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => onNavigateToNode && onNavigateToNode(item.id)}
                        className="w-full text-left p-1.5 rounded bg-workbench-header hover:bg-workbench-subpanel border border-workbench-border text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-mono text-[11px] truncate flex items-center justify-between transition cursor-pointer"
                        title={item.id}
                      >
                        <span className="truncate">→ {item.label || item.id}</span>
                        <span className="text-[9px] text-slate-400 px-1 py-0.5 rounded bg-workbench-panel border border-workbench-border/60 shrink-0 ml-1">
                          hop {item.lineageDepth}
                        </span>
                      </button>
                    ))}
                  </div>

                  {targetAddress && (
                    <button
                      onClick={() => setActiveTab("target")}
                      className="w-full p-2 rounded bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/25 text-sky-600 dark:text-sky-400 font-sans text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Generate Target Command with Prerequisite Dependencies</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-2 text-slate-500 dark:text-slate-600 font-mono text-[11px] rounded bg-workbench-header border border-workbench-border">
                  No upstream dependencies (root resource)
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Raw JSON */}
        {activeTab === "json" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Raw JSON Definition
              </span>
              <button
                onClick={handleCopyId}
                className="px-2 py-0.5 rounded text-[10px] font-mono bg-workbench-subpanel hover:bg-workbench-hover border border-workbench-border text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                {copied ? "Copied!" : "Copy Address"}
              </button>
            </div>
            <pre className="p-2.5 rounded bg-workbench-header border border-workbench-border text-slate-800 dark:text-slate-300 font-mono text-[10px] overflow-x-auto max-h-80 custom-scrollbar select-text leading-relaxed">
              {JSON.stringify(node, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </aside>
  );
}

export default React.memo(NodeInspector);
