"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

/**
 * FileProvenanceBadge: Interactive source code provenance pill.
 * Explains how plan-parse discovers filepaths/line numbers via local AST,
 * and why standalone plan JSON uploads gracefully fall back to 'unknown file'.
 *
 * @param {object} props
 * @param {string} props.file - File name or path (e.g. "main.tf", "unknown file")
 * @param {number|null} [props.line] - Source code line number if available
 * @param {"left"|"right"} [props.align="left"] - Popover horizontal alignment
 * @param {string} [props.className] - Optional container classes
 */
export default function FileProvenanceBadge({
  file,
  line,
  align = "left",
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const isUnknown = !file || file.toLowerCase().includes("unknown");
  const fileLocation = file ? `${file}${line ? `:${line}` : ""}` : "unknown file";

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen]);

  const toggleOpen = useCallback((e) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  }, []);

  if (!file) return null;

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center text-[10px] font-mono ${className}`}
    >
      <button
        type="button"
        onClick={toggleOpen}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded transition cursor-pointer select-none ${
          isUnknown
            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25 hover:bg-amber-500/20 hover:border-amber-500/40"
            : "bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/25 hover:bg-sky-500/20 hover:border-sky-500/40"
        }`}
        title={
          isUnknown
            ? "Standalone plan: Click to learn why source file is 'unknown file'"
            : `Source AST resolved from local configuration (${fileLocation})`
        }
        aria-expanded={isOpen}
      >
        {isUnknown ? (
          <>
            <svg
              className="w-3 h-3 text-amber-500 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="truncate max-w-[120px]">{fileLocation}</span>
          </>
        ) : (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate max-w-[140px]">{fileLocation}</span>
          </>
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute top-full mt-1.5 w-72 p-3 rounded-lg bg-workbench-panel border border-workbench-border shadow-2xl z-50 text-[11px] font-sans text-slate-700 dark:text-slate-300 animate-in fade-in duration-100 ${
            align === "right" ? "right-0" : "left-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-workbench-border/60">
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider">
              {isUnknown ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span className="text-amber-600 dark:text-amber-400">
                    Standalone Ingestion
                  </span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-sky-600 dark:text-sky-400">
                    Source AST Resolved
                  </span>
                </>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1"
              aria-label="Close provenance details"
            >
              ✕
            </button>
          </div>

          {isUnknown ? (
            <div className="space-y-2 leading-relaxed">
              <p>
                Terraform plan JSON files do not store source code filepaths or line
                numbers.
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-[10px]">
                In standalone web ingestion without a local workspace, resources
                gracefully default to{" "}
                <code className="px-1 py-0.5 rounded bg-workbench-subpanel text-amber-600 dark:text-amber-400 font-mono">
                  unknown file
                </code>{" "}
                to preserve compound module grouping and dependency arcs.
              </p>
              <div className="p-1.5 rounded bg-workbench-subpanel border border-workbench-border/70 text-[10px] font-mono text-slate-600 dark:text-slate-400">
                <span className="text-sky-600 dark:text-sky-400 font-semibold">
                  Tip:
                </span>{" "}
                Run with CLI (<code>-dir &lt;path&gt;</code>) inside your repo to
                resolve exact <code>.tf</code> source files and line numbers.
              </div>
            </div>
          ) : (
            <div className="space-y-2 leading-relaxed">
              <p>
                Filepath and line number discovered by inspecting your local
                Terraform configuration AST and module manifest.
              </p>
              <div className="p-2 rounded bg-workbench-subpanel border border-workbench-border/70 font-mono text-[10px] space-y-1">
                <div className="text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">File:</span>
                  <span className="font-semibold">{file}</span>
                </div>
                {line && (
                  <div className="text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Line:</span>
                    <span className="text-sky-600 dark:text-sky-400 font-semibold">
                      Line {line}
                    </span>
                  </div>
                )}
                <div className="text-slate-500 dark:text-slate-400 text-[9px] pt-1 border-t border-workbench-border/40">
                  Via .terraform/modules/modules.json
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
