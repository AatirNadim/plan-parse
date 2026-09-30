"use client";

import React, { useMemo } from "react";
import { ACTION_CONFIG } from "../lib/action-theme";
import { getDiffSummary } from "../lib/hcl-diff";

/**
 * NodePopover: Tier 1 Quick-Look Floating Canvas Popover.
 * Positioned adjacent to the selected/hovered Cytoscape node with viewport clamping.
 * Shows resource change summary, top attribute deltas, and keyboard shortcut to the full diff modal.
 */
function NodePopover({
  node,
  position,
  onOpenModal,
  onClose,
  canvasWidth = 1000,
  canvasHeight = 700,
}) {
  const summary = useMemo(() => {
    if (!node) return null;
    return getDiffSummary(node);
  }, [node]);

  if (!node || !position) return null;

  const isEntity = node.type === "variable" || node.type === "output";
  const badgeKey = isEntity ? node.type : (node.change ? node.change.toLowerCase() : "no-op");
  const cfg = ACTION_CONFIG[badgeKey] || ACTION_CONFIG["no-op"];
  const badgeLabel = isEntity ? cfg.label : (node.change || "no-op");

  // Viewport clamping so popover never overflows past window boundaries
  const popoverWidth = 320;
  const popoverHeight = 280;
  const margin = 16;

  let left = position.x + 20;
  let top = position.y - 40;

  if (left + popoverWidth > canvasWidth - margin) {
    left = position.x - popoverWidth - 20;
  }
  if (left < margin) {
    left = margin;
  }

  if (top + popoverHeight > canvasHeight - margin) {
    top = canvasHeight - popoverHeight - margin;
  }
  if (top < margin) {
    top = margin;
  }

  const hasChanges = summary && summary.totalChanges > 0;
  const address = node.label || node.id || "resource";

  return (
    <div
      className="absolute z-30 w-80 max-h-[320px] overflow-y-auto custom-scrollbar rounded-lg shadow-xl shadow-black/25 border border-workbench-border bg-workbench-panel/95 backdrop-blur-md p-3 select-none pointer-events-auto font-sans animate-in fade-in zoom-in-95 duration-100"
      style={{
        left: `${left}px`,
        top: `${top}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 pb-2 border-b border-workbench-border/70">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded uppercase tracking-wider shrink-0"
              style={{
                backgroundColor: `${cfg.color}15`,
                color: cfg.color,
                border: `1px solid ${cfg.color}35`,
              }}
            >
              {cfg.symbol} {badgeLabel}
            </span>
            {node.module && (
              <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1 py-[1px] rounded truncate max-w-[130px]">
                {node.module}
              </span>
            )}
          </div>

          <h3 className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-100 truncate" title={address}>
            {address}
          </h3>
          {(node.resourceType || isEntity) && (
            <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
              {node.resourceType || cfg.label}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded hover:bg-workbench-subpanel transition cursor-pointer shrink-0"
          title="Dismiss (Esc)"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Delta Metrics & Replacement Alert */}
      <div className="py-2 space-y-1.5">
        <div className="flex items-center gap-1.5 text-[10px] font-mono">
          {summary?.addedCount > 0 && (
            <span className="px-1.5 py-[1px] rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
              +{summary.addedCount} added
            </span>
          )}
          {summary?.modifiedCount > 0 && (
            <span className="px-1.5 py-[1px] rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-medium">
              ~{summary.modifiedCount} modified
            </span>
          )}
          {summary?.removedCount > 0 && (
            <span className="px-1.5 py-[1px] rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-medium">
              -{summary.removedCount} removed
            </span>
          )}
          {!hasChanges && (
            <span className="text-slate-400 text-[10px] font-mono">
              No attribute modifications
            </span>
          )}
        </div>

        {summary?.forcesReplacement && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-700 dark:text-amber-400">
            <svg className="w-3.5 h-3.5 shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="truncate">Modifications require resource re-creation</span>
          </div>
        )}
      </div>

      {/* Changed Attributes Preview */}
      {hasChanges && summary?.topChanges?.length > 0 && (
        <div className="space-y-1 pb-1">
          <div className="text-[9px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Changed Attributes Preview
          </div>
          <div className="space-y-1">
            {summary.topChanges.map((tc) => (
              <div
                key={tc.key}
                className="text-[10px] font-mono p-1 px-1.5 rounded bg-workbench-header/70 border border-workbench-border flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`font-bold ${
                      tc.symbol === "+"
                        ? "text-emerald-500"
                        : tc.symbol === "-"
                        ? "text-rose-500"
                        : "text-sky-500"
                    }`}
                  >
                    {tc.symbol}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                    {tc.key}
                  </span>
                </div>
                <span className="text-slate-500 dark:text-slate-400 truncate max-w-[130px] text-right" title={tc.summaryText}>
                  {tc.summaryText}
                </span>
              </div>
            ))}
            {summary.extraChangesCount > 0 && (
              <div className="text-[9px] font-mono text-slate-400 text-center py-0.5">
                +{summary.extraChangesCount} more attribute changes...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer shortcut hint & CTA */}
      <div className="font-mono text-[10px] text-slate-500 flex items-center justify-between border-t border-workbench-border/60 pt-2 mt-2">
        <div className="flex items-center gap-1">
          <kbd className="px-1 py-[1px] rounded bg-workbench-subpanel border border-workbench-border text-[9px] text-slate-600 dark:text-slate-300">Space</kbd>
          <span className="text-slate-400">or</span>
          <kbd className="px-1 py-[1px] rounded bg-workbench-subpanel border border-workbench-border text-[9px] text-slate-600 dark:text-slate-300">D</kbd>
        </div>

        <button
          onClick={onOpenModal}
          className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-mono text-[11px] font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <span>Full Diff</span>
          <kbd className="px-1 text-[9px] bg-sky-700 rounded border border-sky-500/40">D</kbd>
        </button>
      </div>
    </div>
  );
}

export default React.memo(NodePopover);
