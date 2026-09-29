"use client";

import React, { useEffect } from "react";
import { SHORTCUT_SECTIONS } from "../lib/shortcuts-data";

/**
 * KeyboardShortcutsModal: Dedicated cheat sheet modal displaying all navigation and canvas shortcuts.
 * Supports both Precision Dark and Slate Light themes.
 */
function KeyboardShortcutsModal({ isOpen, onClose }) {
  // Listen for Escape or ? to close while modal is open
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === "Escape" || e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-workbench-panel border border-workbench-border rounded-lg shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-workbench-border bg-workbench-header">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-workbench-subpanel border border-workbench-border flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
              <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="1.8" />
                <path strokeLinecap="round" strokeWidth="1.8" d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M7 13h.01M17 13h.01M10 14h4" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-sans tracking-tight">
                Keyboard Shortcuts
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Workbench navigation and canvas control
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-workbench-subpanel hover:bg-workbench-hover text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-workbench-border transition text-xs font-mono cursor-pointer"
            title="Close dialog (Escape)"
          >
            <span className="text-[10px]">Esc</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body: 2-column clean layout */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {SHORTCUT_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-workbench-border/80">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-400" />
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {section.title}
                  </span>
                </div>
                {section.subtitle && (
                  <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {section.subtitle}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {section.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 py-1 px-1 rounded hover:bg-workbench-subpanel/50 transition-colors"
                  >
                    <div className="min-w-0 pr-1">
                      <div className="text-xs text-slate-700 dark:text-slate-300 font-sans leading-snug">
                        {item.label}
                      </div>
                      {item.detail && (
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          {item.detail}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {item.keys.map((k, kIdx) =>
                        k.divider ? (
                          <span key={kIdx} className="text-[10px] text-slate-400 dark:text-slate-500 font-mono px-0.5">
                            {k.divider}
                          </span>
                        ) : (
                          <kbd
                            key={kIdx}
                            className="px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-800 dark:text-slate-200 bg-workbench-subpanel border border-workbench-border rounded shadow-xs"
                          >
                            {k.key}
                          </kbd>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-workbench-border bg-workbench-header flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
            <span className="truncate">Shortcuts are active when focus is outside text inputs.</span>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 hidden sm:inline">
            Press ? or Esc to close
          </span>
        </div>
      </div>
    </div>
  );
}

export default React.memo(KeyboardShortcutsModal);
