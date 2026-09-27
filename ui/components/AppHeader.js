"use client";

import React from "react";

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
  onOpenUpload,
  onFit,
  onResetZoom,
  onExportPng,
  onExportSvg,
  isExporting = null,
}) {
  const counts = {
    create: summary?.create || 0,
    update: summary?.update || 0,
    delete: summary?.delete || 0,
    replace: summary?.replace || 0,
  };

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
            ⌘K
          </kbd>
        </button>
      )}

      {/* Right: Actions & Viewport Controls */}
      <div className="flex items-center gap-1.5">
        {hasGraph && (
          <>
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

            <button
              onClick={onExportPng}
              disabled={Boolean(isExporting)}
              title="Export high-resolution PNG with adaptive scaling"
              className="px-2.5 py-1 rounded text-xs font-mono text-slate-300 hover:text-white bg-workbench-subpanel hover:bg-workbench-hover border border-workbench-border transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isExporting === "png" ? (
                <>
                  <svg className="w-3.5 h-3.5 text-sky-400 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Export PNG</span>
                </>
              )}
            </button>

            <button
              onClick={onExportSvg}
              disabled={Boolean(isExporting)}
              title="Export infinite-zoom vector SVG using cytoscape-svg"
              className="px-2.5 py-1 rounded text-xs font-mono text-slate-300 hover:text-white bg-workbench-subpanel hover:bg-workbench-hover border border-workbench-border transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isExporting === "svg" ? (
                <>
                  <svg className="w-3.5 h-3.5 text-purple-400 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span>Export SVG</span>
                </>
              )}
            </button>
          </>
        )}

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
