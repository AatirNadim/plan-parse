"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  getNodeTargetAddress,
  getUpstreamDependencies,
  generateTargetCommand,
  copyToClipboard,
} from "../lib/target-command";
import { ACTION_CONFIG } from "../lib/action-theme";

/**
 * TargetCommandCard: Surgical targeted apply & plan command generator.
 * Gives SREs 1-click precision CLI commands for unstucking plans, staging migrations,
 * and inspecting topological prerequisite dependency chains.
 */
export default function TargetCommandCard({
  node,
  graphData,
  onNavigateToNode,
}) {
  const [commandType, setCommandType] = useState("apply"); // 'apply' | 'plan'
  const [includeUpstream, setIncludeUpstream] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);
  const [format, setFormat] = useState("single-line"); // 'single-line' | 'multi-line'
  const [copied, setCopied] = useState(false);
  const [showSequence, setShowSequence] = useState(true);

  const targetAddress = useMemo(() => {
    return getNodeTargetAddress(node);
  }, [node]);

  const isTargetable = Boolean(targetAddress);

  // Compute upstream prerequisites in topological order
  const upstreamDependencies = useMemo(() => {
    if (!node || !graphData || !targetAddress) return [];
    return getUpstreamDependencies(node.id || targetAddress, graphData);
  }, [node, graphData, targetAddress]);

  const upstreamAddresses = useMemo(() => {
    return upstreamDependencies.map((d) => d.id);
  }, [upstreamDependencies]);

  // Generate the formatted CLI command string
  const generatedCommand = useMemo(() => {
    if (!targetAddress) return "";
    return generateTargetCommand(targetAddress, {
      command: commandType,
      includeUpstream,
      upstreamAddresses,
      autoApprove,
      format,
    });
  }, [targetAddress, commandType, includeUpstream, upstreamAddresses, autoApprove, format]);

  const handleCopy = useCallback(async () => {
    if (!generatedCommand) return;
    const ok = await copyToClipboard(generatedCommand);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [generatedCommand]);

  if (!node) return null;

  // Render informative guide if current selection cannot be targeted in Terraform
  if (!isTargetable) {
    return (
      <div className="p-3.5 rounded border border-workbench-border bg-workbench-header text-xs font-sans space-y-2.5 select-none">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="uppercase text-[11px] font-semibold tracking-wider">Untargetable Node</span>
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
          Terraform <code className="font-mono text-slate-900 dark:text-slate-200 px-1 py-0.5 rounded bg-workbench-subpanel border border-workbench-border text-[11px]">-target</code> arguments must specify a managed resource, data source, or module. Pure variables, local values, and files cannot be targeted directly.
        </p>
        {node.incomers && node.incomers.length > 0 && (
          <div className="pt-2 border-t border-workbench-border/60">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5 font-medium">
              Dependent resources to target instead:
            </div>
            <div className="space-y-1 max-h-28 overflow-y-auto custom-scrollbar">
              {node.incomers.slice(0, 4).map((depId) => (
                <button
                  key={depId}
                  onClick={() => onNavigateToNode && onNavigateToNode(depId)}
                  className="w-full text-left p-1.5 rounded bg-workbench-subpanel hover:bg-workbench-hover text-sky-600 dark:text-sky-400 font-mono text-[11px] truncate transition cursor-pointer flex items-center justify-between"
                >
                  <span className="truncate">→ {depId}</span>
                  <span className="text-[10px] text-slate-500 shrink-0 ml-1 font-sans">target this</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-workbench-border bg-workbench-panel flex flex-col font-sans text-xs overflow-hidden select-none">
      {/* Header Bar */}
      <div className="p-3 border-b border-workbench-border bg-workbench-header flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex items-center justify-center w-6 h-6 rounded bg-sky-500/10 text-sky-500 dark:text-sky-400 border border-sky-500/25 shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
              Targeted CLI Command
            </div>
            <div className="text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 truncate" title={targetAddress}>
              {targetAddress}
            </div>
          </div>
        </div>

        {/* Format switch */}
        <div className="flex items-center gap-1 shrink-0 font-sans">
          <button
            onClick={() => setFormat(format === "single-line" ? "multi-line" : "single-line")}
            className="px-2 py-1 rounded text-[11px] font-medium bg-workbench-subpanel hover:bg-workbench-hover border border-workbench-border text-slate-700 dark:text-slate-300 transition cursor-pointer"
            title={format === "single-line" ? "Switch to multi-line (\\) format" : "Switch to single-line format"}
          >
            {format === "single-line" ? "1-line" : "multi-line (\\)"}
          </button>
        </div>
      </div>

      {/* Control Options */}
      <div className="p-3 border-b border-workbench-border/70 bg-workbench-subpanel/30 space-y-3 font-sans">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Apply vs Plan Segmented Toggle */}
          <div className="inline-flex rounded-md border border-workbench-border bg-workbench-panel p-0.5 text-xs font-medium">
            <button
              onClick={() => setCommandType("apply")}
              className={`px-3 py-1 rounded font-semibold transition cursor-pointer font-mono ${
                commandType === "apply"
                  ? "bg-sky-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              apply
            </button>
            <button
              onClick={() => setCommandType("plan")}
              className={`px-3 py-1 rounded font-semibold transition cursor-pointer font-mono ${
                commandType === "plan"
                  ? "bg-sky-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              plan
            </button>
          </div>

          {/* -auto-approve Checkbox (apply only) */}
          {commandType === "apply" && (
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-workbench-border accent-sky-600"
              />
              <span className="font-mono text-[11px]">-auto-approve</span>
            </label>
          )}
        </div>

        {/* Upstream Dependencies Toggle */}
        <div className="pt-2.5 border-t border-workbench-border/50 flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeUpstream}
              onChange={(e) => setIncludeUpstream(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-workbench-border accent-sky-600"
            />
            <span>Include upstream dependencies</span>
          </label>

          <span
            className={`text-[10px] px-2 py-0.5 rounded border font-mono font-semibold ${
              upstreamDependencies.length > 0
                ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25"
                : "bg-slate-500/10 text-slate-500 border-slate-500/20"
            }`}
          >
            +{upstreamDependencies.length} prerequisite{upstreamDependencies.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Embedded Terminal Box (enforced dark across all themes for authentic CLI contrast) */}
      <div className="p-3 bg-workbench-panel space-y-2.5">
        <div className="relative group rounded-md border border-slate-800 bg-slate-950 overflow-hidden shadow-inner">
          {/* Terminal Chrome Header */}
          <div className="p-1.5 px-3 bg-slate-900 border-b border-slate-800/90 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              </span>
              <span className="text-slate-400 ml-1">bash — terraform</span>
            </div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              {includeUpstream ? `${upstreamAddresses.length + 1} targets` : "1 target"}
            </span>
          </div>

          {/* Terminal Code Content */}
          <pre className="p-3 text-[12px] leading-relaxed text-slate-100 select-all overflow-x-auto custom-scrollbar font-mono whitespace-pre">
            <span className="text-emerald-400 font-bold select-none">$ </span>
            {generatedCommand}
          </pre>
        </div>

        {/* Primary Action Button: Copy Target Command */}
        <button
          onClick={handleCopy}
          className={`w-full py-2.5 px-3 rounded-md font-sans text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm ${
            copied
              ? "bg-emerald-600 text-white"
              : "bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white"
          }`}
          title="Copy exact command to system clipboard"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4 animate-in zoom-in-75 duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span>Copied Target Command!</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                />
              </svg>
              <span>Copy Target Command</span>
            </>
          )}
        </button>
      </div>

      {/* Upstream Prerequisites Sequence Breakdown (when enabled) */}
      {includeUpstream && upstreamDependencies.length > 0 && (
        <div className="border-t border-workbench-border bg-workbench-header/50 p-3 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
            <span>Execution Order (Topological)</span>
            <button
              onClick={() => setShowSequence(!showSequence)}
              className="text-sky-600 dark:text-sky-400 hover:underline cursor-pointer font-sans text-xs"
            >
              {showSequence ? "collapse" : `show (${upstreamDependencies.length + 1})`}
            </button>
          </div>

          {showSequence && (
            <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pt-1">
              {/* Upstream prerequisite steps */}
              {upstreamDependencies.map((dep, idx) => {
                const actionKey = dep.change ? dep.change.toLowerCase() : "no-op";
                const cfg = ACTION_CONFIG[actionKey] || ACTION_CONFIG["no-op"];
                return (
                  <div
                    key={dep.id}
                    className="p-1.5 px-2 rounded border border-workbench-border bg-workbench-panel flex items-center justify-between gap-2 text-[11px]"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-slate-400 font-bold shrink-0 font-mono text-[10px]">{idx + 1}.</span>
                      <span
                        className="px-1.5 py-[1px] text-[9px] font-bold rounded uppercase shrink-0 font-mono"
                        style={{
                          backgroundColor: `${cfg.color}15`,
                          color: cfg.color,
                          border: `1px solid ${cfg.color}30`,
                        }}
                      >
                        {cfg.symbol} {dep.change}
                      </span>
                      <span className="truncate text-slate-700 dark:text-slate-300 font-mono text-[11px]" title={dep.id}>
                        {dep.id}
                      </span>
                    </div>

                    {onNavigateToNode && (
                      <button
                        onClick={() => onNavigateToNode(dep.id)}
                        className="px-1.5 py-0.5 rounded text-[10px] font-sans bg-workbench-subpanel hover:bg-workbench-hover text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shrink-0 transition cursor-pointer"
                        title="Focus on canvas"
                      >
                        focus
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Final target step */}
              <div className="p-1.5 px-2 rounded border border-sky-500/30 bg-sky-500/5 flex items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sky-500 font-bold shrink-0 font-mono text-[10px]">{upstreamDependencies.length + 1}.</span>
                  <span className="px-1.5 py-[1px] text-[9px] font-bold rounded uppercase shrink-0 bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-500/30 font-mono">
                    🎯 TARGET
                  </span>
                  <span className="truncate font-semibold text-slate-900 dark:text-white font-mono text-[11px]" title={targetAddress}>
                    {targetAddress}
                  </span>
                </div>
                <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold shrink-0 font-sans">final</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

