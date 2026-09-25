"use client";

import React from "react";

/**
 * CanvasControls: React Flow-style floating viewport controls.
 * Features Zoom In, Zoom Out, Fit to View, 1:1 Reset, Dynamic Zoom % HUD, and Lock.
 */
function CanvasControls({
  zoomLevel = 1,
  onZoomIn,
  onZoomOut,
  onFit,
  onResetZoom,
  isLocked = false,
  onToggleLock,
}) {
  const formattedPercent = Math.round(zoomLevel * 100);

  return (
    <div className="fixed bottom-5 left-5 z-20 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-xl p-1 shadow-2xl shadow-slate-950/80 select-none">
      {/* Zoom In */}
      <button
        onClick={onZoomIn}
        title="Zoom In (+)"
        disabled={isLocked}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 active:bg-slate-700 disabled:opacity-40 text-slate-200 hover:text-white text-base font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Zoom Out */}
      <button
        onClick={onZoomOut}
        title="Zoom Out (-)"
        disabled={isLocked}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 active:bg-slate-700 disabled:opacity-40 text-slate-200 hover:text-white text-base font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" />
        </svg>
      </button>

      {/* Dynamic Zoom Percentage HUD */}
      <div
        title="Current Zoom Level"
        className="px-2 h-8 flex items-center justify-center text-[11px] font-mono font-semibold text-slate-300 bg-slate-950/60 rounded-lg border border-slate-800/60 min-w-[50px]"
      >
        {formattedPercent}%
      </div>

      {/* Fit to View */}
      <button
        onClick={onFit}
        title="Fit all nodes in viewport (F)"
        className="px-2.5 h-8 flex items-center justify-center gap-1 rounded-lg hover:bg-slate-800 active:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
        <span>Fit</span>
      </button>

      {/* 1:1 Reset Zoom */}
      <button
        onClick={onResetZoom}
        title="Reset Zoom to 100%"
        className="px-2 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 active:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        1:1
      </button>

      {/* Lock / Unlock Navigation */}
      {onToggleLock && (
        <button
          onClick={onToggleLock}
          title={isLocked ? "Unlock Canvas Panning & Zooming" : "Lock Canvas Panning & Zooming"}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
            isLocked
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
          }`}
        >
          {isLocked ? (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

export default React.memo(CanvasControls);

