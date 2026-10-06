"use client";

import React from "react";
import { ACTION_CONFIG } from "../lib/action-theme";
import { usePlatformModifier } from "../lib/use-platform";

const STATUS_ACTIONS = ["create", "update", "delete", "replace"];

/**
 * StatusBar: Persistent bottom workbench status strip.
 * Houses viewport metrics, zoom HUD, lock status, and semantic action legend.
 */
function StatusBar({
  nodeCount = 0,
  edgeCount = 0,
  zoomLevel = 1,
  onZoomIn,
  onZoomOut,
  isLocked,
  onToggleLock,
  isCollapsed = false,
  collapsedCount = 0,
  bridgedCount = 0,
  onOpenShortcuts,
}) {
  const formattedPercent = Math.round(zoomLevel * 100);
  const { paletteKey } = usePlatformModifier();

  return (
    <footer className="h-7 w-full border-t border-workbench-border bg-workbench-header px-3.5 flex items-center justify-between shrink-0 select-none text-[11px] font-mono text-slate-500 dark:text-slate-400 z-20 safe-area-bottom">
      {/* Left: Viewport Metrics & Zoom HUD */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <span className={`w-1.5 h-1.5 rounded-full ${isCollapsed ? "bg-sky-500" : "bg-emerald-500"}`} />
          <span>
            {nodeCount} nodes
            {isCollapsed && collapsedCount > 0 ? (
              <span className="text-slate-500 dark:text-slate-400 ml-1">({collapsedCount} collapsed)</span>
            ) : null}
          </span>
          <span className="text-slate-400 dark:text-slate-500">•</span>
          <span>
            {edgeCount} edges
            {isCollapsed && bridgedCount > 0 ? (
              <span className="text-sky-600 dark:text-sky-400 ml-1">({bridgedCount} bridged)</span>
            ) : null}
          </span>
        </div>

        <div className="h-3 w-px bg-workbench-border" />

        {/* Inline Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={onZoomOut}
            title="Zoom out (-)"
            disabled={isLocked}
            className="w-4 h-4 flex items-center justify-center rounded hover:bg-workbench-subpanel text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
          >
            -
          </button>
          <span className="min-w-[36px] text-center text-slate-700 dark:text-slate-300">
            {formattedPercent}%
          </span>
          <button
            onClick={onZoomIn}
            title="Zoom in (+)"
            disabled={isLocked}
            className="w-4 h-4 flex items-center justify-center rounded hover:bg-workbench-subpanel text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
          >
            +
          </button>
        </div>

        {onToggleLock && (
          <button
            onClick={onToggleLock}
            title={isLocked ? "Unlock navigation" : "Lock navigation"}
            className={`px-1.5 py-0.5 rounded text-[10px] transition cursor-pointer ${
              isLocked
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            {isLocked ? "LOCKED" : "UNLOCKED"}
          </button>
        )}
      </div>

      {/* Right: Integrated Action & Entity Legend */}
      <div className="hidden sm:flex items-center gap-2.5">
        {/* Actions */}
        <div className="flex items-center gap-2.5">
          {STATUS_ACTIONS.map((key) => {
            const cfg = ACTION_CONFIG[key];
            if (!cfg) return null;
            return (
              <div key={key} className="flex items-center gap-1">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: cfg.color }}
                />
                <span className="text-slate-600 dark:text-slate-400">{cfg.label}</span>
              </div>
            );
          })}
        </div>

        <div className="h-3 w-px bg-workbench-border" />

        {/* Entities */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: ACTION_CONFIG.variable?.color || "#6366f1" }}
            />
            <span className="text-slate-600 dark:text-slate-400">Var</span>
          </div>
          <div className="flex items-center gap-1">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: ACTION_CONFIG.output?.color || "#d946ef" }}
            />
            <span className="text-slate-600 dark:text-slate-400">Output</span>
          </div>
        </div>

        <div className="h-3 w-px bg-workbench-border" />

        <div className="text-slate-600 dark:text-slate-400 flex items-center">
          <span><kbd className="text-slate-600 dark:text-slate-400">{paletteKey}</kbd> search</span>
          <span className="mx-1">•</span>
          <span><kbd className="text-slate-600 dark:text-slate-400">c</kbd> collapse</span>
          <span className="mx-1">•</span>
          <span><kbd className="text-slate-600 dark:text-slate-400">f</kbd> fit</span>
          <span className="mx-1">•</span>
          <button
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts (?)"
            className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors inline-flex items-center gap-1 cursor-pointer focus:outline-none"
          >
            <kbd className="text-slate-600 dark:text-slate-400">?</kbd>
            <span>shortcuts</span>
          </button>
        </div>
      </div>
    </footer>
  );
}

export default React.memo(StatusBar);
