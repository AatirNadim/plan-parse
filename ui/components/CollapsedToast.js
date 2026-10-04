"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  COLLAPSED_TOAST_PREFIX,
  COLLAPSED_TOAST_ACTION,
  COLLAPSED_TOAST_LINE_2,
  COLLAPSED_TOAST_DISMISS,
  getCollapsedCliCommand,
  shouldShowCollapsedToast,
} from "../lib/collapsed-toast";
import { copyToClipboard } from "../lib/target-command";

/**
 * CollapsedToast: Subtle bottom-right floating notification informing the user that
 * the dependency DAG is collapsed by default to mutating resources, with an interactive
 * toggle trigger on 'here', copyable CLI syntax with copy button, and dismiss control.
 */
export default function CollapsedToast({
  cliOptionCollapsed = true,
  isCollapsed = true,
  hasGraph = false,
  isDismissed = false,
  planName = "",
  onToggleCollapse,
  onDismiss,
}) {
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const cliCommand = getCollapsedCliCommand(planName);

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(cliCommand);
    if (ok) {
      setCopied(true);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  }, [cliCommand]);

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
        <div className="flex-1 text-xs leading-relaxed space-y-1.5 min-w-0">
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
          <div className="flex items-center gap-1.5 pt-0.5">
            <code
              data-testid="collapsed-cli-command"
              className="flex-1 font-mono text-[11px] bg-slate-100 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 px-2 py-1 rounded border border-workbench-border truncate select-all"
              title={cliCommand}
            >
              {cliCommand}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              data-testid="copy-collapsed-command-btn"
              className={`px-2 py-1 rounded text-[11px] font-sans font-medium transition-colors flex items-center gap-1 shrink-0 cursor-pointer border ${
                copied
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  : "bg-workbench-subpanel hover:bg-workbench-hover text-slate-600 dark:text-slate-300 border-workbench-border"
              }`}
              title="Copy CLI command to clipboard"
              aria-label="Copy CLI command"
            >
              {copied ? (
                <>
                  <svg className="w-3 h-3 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-3 h-3 text-slate-500 dark:text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                    />
                  </svg>
                  <span>Copy</span>
                </>
              )}
            </button>
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
