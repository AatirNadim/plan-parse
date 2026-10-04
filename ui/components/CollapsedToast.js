"use client";

import React from "react";
import {
  COLLAPSED_TOAST_PREFIX,
  COLLAPSED_TOAST_ACTION,
  COLLAPSED_TOAST_LINE_2,
  COLLAPSED_TOAST_DISMISS,
  shouldShowCollapsedToast,
} from "../lib/collapsed-toast";

/**
 * CollapsedToast: Subtle bottom-right floating notification informing the user that
 * the dependency DAG is collapsed by default to mutating resources, with an interactive
 * toggle trigger on 'here' and dismiss control.
 */
export default function CollapsedToast({
  cliOptionCollapsed = true,
  isCollapsed = true,
  hasGraph = false,
  isDismissed = false,
  onToggleCollapse,
  onDismiss,
}) {
  const isVisible = shouldShowCollapsedToast({
    cliOptionCollapsed,
    isCollapsed,
    hasGraph,
    isDismissed,
  });

  if (!isVisible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="collapsed-toast"
      className="absolute bottom-3 right-3 z-30 max-w-sm rounded-lg border border-workbench-border bg-workbench-panel/95 backdrop-blur-md shadow-xl shadow-black/25 p-3 select-none pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-150 text-slate-700 dark:text-slate-200"
    >
      <div className="flex items-start gap-2.5">
        <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shrink-0 mt-1" />
        <div className="flex-1 text-xs leading-relaxed space-y-1">
          <div className="font-sans">
            <span>{COLLAPSED_TOAST_PREFIX}</span>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 font-semibold underline underline-offset-2 cursor-pointer transition-colors"
              title="Toggle graph collapse"
            >
              {COLLAPSED_TOAST_ACTION}
            </button>
          </div>
          <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
            {COLLAPSED_TOAST_LINE_2}
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 -mr-1 -mt-1 rounded hover:bg-workbench-subpanel transition cursor-pointer text-sm leading-none shrink-0"
          title="Dismiss notification"
          aria-label="Dismiss notification"
        >
          {COLLAPSED_TOAST_DISMISS}
        </button>
      </div>
    </div>
  );
}
