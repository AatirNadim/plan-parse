"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePlatformModifier } from "../lib/use-platform";

/**
 * AppHeader: Persistent Developer Workbench top navigation bar.
 * Houses branding, active plan context, blast-radius metrics, global ⌘K trigger, and view controls.
 */
function AppHeader({
  cliLoaded,
  planName,
  summary,
  hasGraph,
  isSidebarOpen,
  onToggleSidebar,
  isInspectorOpen,
  onToggleInspector,
  onOpenCommandPalette,
  onOpenShortcuts,
  onOpenUpload,
  onFit,
  onResetZoom,
  onExportPng,
  onExportSvg,
  isExporting = null,
  isCollapsed = false,
  onToggleCollapse,
  collapsedCount = 0,
}) {
  const counts = {
    create: summary?.create || 0,
    update: summary?.update || 0,
    delete: summary?.delete || 0,
    replace: summary?.replace || 0,
  };

  const { paletteKey } = usePlatformModifier();

  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setIsExportMenuOpen(false);
      }
    }
    if (isExportMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isExportMenuOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isExportMenuOpen) {
        setIsExportMenuOpen(false);
      }
    }
    if (isExportMenuOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isExportMenuOpen]);

  return (
    <header className="h-11 w-full border-b border-workbench-border bg-workbench-header px-3.5 flex items-center justify-between shrink-0 select-none z-20">
      {/* Left: Brand + Context + Blast Radius */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          title="Toggle Sidebar ([)"
          className={`p-1 rounded transition text-xs font-mono ${
            isSidebarOpen
              ? "bg-workbench-subpanel text-slate-200 border border-workbench-border"
              : "text-slate-400 hover:text-white hover:bg-workbench-subpanel"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          {hasGraph && (
            <img
              src="/icon.svg"
              alt="Plan Parse DAG Icon"
              className="w-5 h-5 rounded shrink-0 select-none"
              width={20}
              height={20}
            />
          )}
          <span className="font-mono text-xs font-bold text-white tracking-wider uppercase">
            PLAN-PARSE
          </span>
          <span className="text-slate-600 font-mono">/</span>
        </div>

        {/* Source Badge */}
        <div className="flex items-center gap-1.5 truncate">
          {cliLoaded ? (
            <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
              CLI Mode
            </span>
          ) : planName ? (
            <span className="text-xs font-mono text-slate-300 truncate max-w-[160px]" title={planName}>
              {planName}
            </span>
          ) : (
            <span className="text-xs font-mono text-slate-500">
              No Plan Loaded
            </span>
          )}
        </div>

        {/* Blast Radius Micro-Chips */}
        {hasGraph && (
          <div className="hidden md:flex items-center gap-1.5 pl-2 border-l border-workbench-border">
            {counts.create > 0 && (
              <span
                className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                title={`${counts.create} to create`}
              >
                +{counts.create}
              </span>
            )}
            {counts.update > 0 && (
              <span
                className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-sky-500/10 text-sky-400 border border-sky-500/20"
                title={`${counts.update} to update`}
              >
                ~{counts.update}
              </span>
            )}
            {counts.delete > 0 && (
              <span
                className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-rose-500/10 text-rose-400 border border-rose-500/20"
                title={`${counts.delete} to delete`}
              >
                -{counts.delete}
              </span>
            )}
            {counts.replace > 0 && (
              <span
                className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-amber-500/10 text-amber-400 border border-amber-500/20"
                title={`${counts.replace} to replace`}
              >
                ±{counts.replace}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Center: Command Palette Trigger */}
      {hasGraph && (
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center justify-between w-64 md:w-80 px-2.5 py-1 bg-workbench-subpanel hover:bg-workbench-hover border border-workbench-border rounded text-xs text-slate-400 transition cursor-pointer"
        >
          <div className="flex items-center gap-2 truncate">
            <svg className="w-3.5 h-3.5 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="truncate">Quick jump to resource...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-workbench-panel border border-workbench-border rounded text-slate-400 shrink-0">
            {paletteKey}
          </kbd>
        </button>
      )}

      {/* Right: Actions & Viewport Controls */}
      <div className="flex items-center gap-1.5">
        {hasGraph && (
          <>
            {/* Collapse / Mutations Only Toggle */}
            <button
              onClick={onToggleCollapse}
              title={
                isCollapsed
                  ? "Expand all intermediate nodes (C)"
                  : "Collapse intermediate nodes / Mutations only (C)"
              }
              className={`px-2 py-1 rounded text-xs font-mono transition flex items-center gap-1.5 cursor-pointer ${
                isCollapsed
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-xs font-medium"
                  : "text-slate-300 hover:text-white bg-workbench-subpanel hover:bg-workbench-hover border border-workbench-border"
              }`}
            >
              <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>{isCollapsed ? "Mutations Only" : "Collapse"}</span>
              {isCollapsed && collapsedCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] rounded bg-sky-500/30 text-sky-200 border border-sky-500/40 font-mono">
                  ({collapsedCount})
                </span>
              )}
            </button>

            <button
              onClick={onFit}
              title="Fit to view (F)"
              className="px-2 py-1 rounded text-xs font-mono text-slate-300 hover:text-white bg-workbench-subpanel hover:bg-workbench-hover border border-workbench-border transition flex items-center gap-1.5"
            >
              <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              <span>Fit</span>
            </button>

            <button
              onClick={onResetZoom}
              title="Reset Zoom to 100% (0)"
              className="px-2 py-1 rounded text-xs font-mono text-slate-400 hover:text-white bg-workbench-subpanel hover:bg-workbench-hover border border-workbench-border transition"
            >
              1:1
            </button>

            {/* Unified Export Dropdown */}
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setIsExportMenuOpen((prev) => !prev)}
                disabled={Boolean(isExporting)}
                title="Export DAG visualization (PNG or SVG)"
                className={`px-2.5 py-1 rounded text-xs font-mono transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  isExportMenuOpen
                    ? "bg-workbench-hover text-white border border-slate-600 shadow-xs"
                    : "text-slate-300 hover:text-white bg-workbench-subpanel hover:bg-workbench-hover border border-workbench-border"
                }`}
              >
                {isExporting ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-sky-400 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Exporting {isExporting.toUpperCase()}...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Export</span>
                    <svg
                      className={`w-3 h-3 text-slate-500 transition-transform duration-150 ${
                        isExportMenuOpen ? "rotate-180 text-slate-300" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>

              {isExportMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-72 bg-workbench-panel border border-workbench-border rounded-md shadow-2xl overflow-hidden py-1 z-50 font-mono animate-in fade-in duration-100">
                  <div className="px-3 py-1.5 border-b border-workbench-border/60 flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    <span>Export Diagram</span>
                    <span className="text-[9px] text-slate-600">Full DAG</span>
                  </div>

                  <div className="p-1 space-y-0.5">
                    <button
                      onClick={() => {
                        setIsExportMenuOpen(false);
                        onExportPng();
                      }}
                      disabled={Boolean(isExporting)}
                      className="w-full flex items-start gap-2.5 p-2 rounded text-left text-xs transition-colors hover:bg-workbench-subpanel text-slate-200 group cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-sky-500/40">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200 group-hover:text-white">PNG Image</span>
                          <span className="text-[10px] text-sky-400/90 font-medium px-1.5 py-0.5 bg-sky-500/10 rounded border border-sky-500/20">
                            High-DPI
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-sans leading-tight mt-0.5">
                          Adaptive Retina raster (up to 2.5x). Best for Slack, PRs, and tickets.
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setIsExportMenuOpen(false);
                        onExportSvg();
                      }}
                      disabled={Boolean(isExporting)}
                      className="w-full flex items-start gap-2.5 p-2 rounded text-left text-xs transition-colors hover:bg-workbench-subpanel text-slate-200 group cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-purple-500/40">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200 group-hover:text-white">SVG Vector</span>
                          <span className="text-[10px] text-purple-400/90 font-medium px-1.5 py-0.5 bg-purple-500/10 rounded border border-purple-500/20">
                            Vector
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-sans leading-tight mt-0.5">
                          Infinite zoom vector schematic. Ideal for architecture docs and diagrams.
                        </p>
                      </div>
                    </button>
                  </div>

                  <div className="px-3 py-1.5 border-t border-workbench-border/60 bg-workbench-header text-[10px] text-slate-500 flex items-center justify-between">
                    <span>Dark theme (#090a0f)</span>
                    <span>All nodes & edges</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <button
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts (?)"
          className="px-2 py-1 rounded text-xs font-mono text-slate-300 hover:text-white bg-workbench-subpanel hover:bg-workbench-hover border border-workbench-border transition flex items-center gap-1.5 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="1.8" />
            <path strokeLinecap="round" strokeWidth="1.8" d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M7 13h.01M17 13h.01M10 14h4" />
          </svg>
          <span>Shortcuts</span>
          <kbd className="hidden sm:inline-block px-1 py-0.2 text-[9px] font-mono bg-workbench-panel border border-workbench-border rounded text-slate-400">
            ?
          </kbd>
        </button>

        <button
          onClick={onOpenUpload}
          className="px-2.5 py-1 rounded text-xs font-mono font-medium text-slate-200 hover:text-white bg-workbench-subpanel hover:bg-workbench-hover border border-workbench-border transition flex items-center gap-1.5"
          title="Upload or Replace Plan JSON"
        >
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span>{hasGraph ? "Replace Plan" : "Load Plan"}</span>
        </button>

        {hasGraph && (
          <button
            onClick={onToggleInspector}
            title="Toggle Inspector Details"
            className={`p-1 rounded transition ${
              isInspectorOpen
                ? "bg-workbench-subpanel text-slate-200 border border-workbench-border"
                : "text-slate-400 hover:text-white hover:bg-workbench-subpanel"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
}

export default React.memo(AppHeader);
