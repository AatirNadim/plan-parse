"use client";

import React, { useState } from "react";

const ACTION_COLORS = {
  create: { color: "#22c55e", label: "Create" },
  update: { color: "#3b82f6", label: "Update" },
  delete: { color: "#ef4444", label: "Delete" },
  replace: { color: "#f59e0b", label: "Replace" },
  "no-op": { color: "#64748b", label: "No-op" },
  data: { color: "#ec4899", label: "Data Source" },
  module: { color: "#a855f7", label: "Module" },
  variable: { color: "#0ea5e9", label: "Variable" },
  output: { color: "#eab308", label: "Output" },
};

/**
 * Legend: Collapsible graph action colors reference.
 */
export default function Legend() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl overflow-hidden transition-all max-w-xs select-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-800/50 transition text-left"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400" />
          <span className="text-xs font-bold text-slate-300">Legend</span>
        </div>
        <span className="text-xs text-slate-400 ml-3">
          {isOpen ? "▼" : "▲"}
        </span>
      </button>

      {isOpen && (
        <div className="p-3 border-t border-slate-800/70 grid grid-cols-2 gap-2 text-[11px]">
          {Object.entries(ACTION_COLORS).map(([key, item]) => (
            <div key={key} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-slate-300 truncate">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

