"use client";

import React from "react";

const ACTION_COLORS = {
  create: "#22c55e",
  delete: "#ef4444",
  update: "#3b82f6",
  replace: "#f59e0b",
  "no-op": "#64748b",
  data: "#ec4899",
  module: "#a855f7",
  variable: "#0ea5e9",
  output: "#eab308",
};

/**
 * NodeInspector: Slide-over details panel for examining selected resource nodes,
 * dependencies, module links, and attribute diffs.
 */
export default function NodeInspector({ node, onClose, onNavigateToNode }) {
  if (!node) return null;

  const actionColor = ACTION_COLORS[node.change] || "#64748b";

  return (
    <div className="fixed top-0 right-0 h-full w-[400px] max-w-[92vw] z-30 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl p-5 overflow-y-auto flex flex-col transition-all">
      {/* Header */}
      <div className="flex items-start justify-between pb-3.5 border-b border-slate-800">
        <div className="pr-3">
          <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
            {node.type || "Resource"}
          </div>
          <h2 className="text-base font-bold text-white break-words mt-0.5 leading-snug">
            {node.label || node.id}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition"
          title="Close inspector (Esc)"
        >
          ✕
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-4 text-xs">
        {/* Action Badge */}
        {node.change && (
          <div>
            <span className="text-slate-400 block mb-1 font-medium">Change Action:</span>
            <span
              className="inline-block px-2.5 py-0.5 rounded-full font-bold uppercase text-[11px] tracking-wider"
              style={{
                backgroundColor: `${actionColor}20`,
                color: actionColor,
                border: `1px solid ${actionColor}50`,
              }}
            >
              {node.change}
            </span>
          </div>
        )}

        {/* Address */}
        <div>
          <span className="text-slate-400 block mb-1 font-medium">Full Address:</span>
          <div className="font-mono text-[11px] bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 text-slate-200 break-all select-text">
            {node.id}
          </div>
        </div>

        {/* Module & File details */}
        {(node.module || node.file) && (
          <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
            {node.module && (
              <div>
                <span className="text-slate-500 block text-[10px] font-medium">Module</span>
                <span className="text-slate-300 font-mono text-[11px] truncate block" title={node.module}>
                  {node.module}
                </span>
              </div>
            )}
            {node.file && (
              <div>
                <span className="text-slate-500 block text-[10px] font-medium">File</span>
                <span className="text-slate-300 font-mono text-[11px] truncate block" title={node.file}>
                  {node.file}
                  {node.line ? `:${node.line}` : ""}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Dependencies: Depends On */}
        {node.outgoers && node.outgoers.length > 0 && (
          <div>
            <span className="text-slate-400 block mb-1 font-medium">
              Depends On ({node.outgoers.length}):
            </span>
            <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1">
              {node.outgoers.map((id) => (
                <button
                  key={id}
                  onClick={() => onNavigateToNode && onNavigateToNode(id)}
                  className="font-mono text-[11px] text-left bg-slate-950 hover:bg-slate-800/80 px-2.5 py-1.5 rounded-lg text-indigo-300 hover:text-indigo-200 border border-slate-800/60 truncate transition flex items-center justify-between group"
                  title={`Navigate to ${id}`}
                >
                  <span className="truncate">→ {id}</span>
                  <span className="text-[10px] text-slate-500 group-hover:text-indigo-300 ml-1 shrink-0">view</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dependents: Referenced By */}
        {node.incomers && node.incomers.length > 0 && (
          <div>
            <span className="text-slate-400 block mb-1 font-medium">
              Referenced By ({node.incomers.length}):
            </span>
            <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1">
              {node.incomers.map((id) => (
                <button
                  key={id}
                  onClick={() => onNavigateToNode && onNavigateToNode(id)}
                  className="font-mono text-[11px] text-left bg-slate-950 hover:bg-slate-800/80 px-2.5 py-1.5 rounded-lg text-emerald-300 hover:text-emerald-200 border border-slate-800/60 truncate transition flex items-center justify-between group"
                  title={`Navigate to ${id}`}
                >
                  <span className="truncate">← {id}</span>
                  <span className="text-[10px] text-slate-500 group-hover:text-emerald-300 ml-1 shrink-0">view</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Change Details */}
        {node.changeDetails && (
          <div>
            <span className="text-slate-400 block mb-1 font-medium">
              Attribute Changes:
            </span>
            <pre className="font-mono text-[11px] bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 text-slate-300 overflow-x-auto max-h-60 select-text">
              {JSON.stringify(
                node.changeDetails.after ||
                  node.changeDetails.before ||
                  node.changeDetails,
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

