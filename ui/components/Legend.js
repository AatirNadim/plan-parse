"use client";

import React, { useState } from "react";
import { ACTION_CONFIG, LEGEND_KEYS } from "../lib/action-theme";

/**
 * Legend: Collapsible graph action colors reference.
 */
function Legend() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl overflow-hidden transition-all max-w-xs select-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-800/50 transition text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400" />
          <span className="text-xs font-bold text-slate-200">Legend</span>
        </div>
        <svg
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ml-3 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="p-3 border-t border-slate-800/70 grid grid-cols-2 gap-2 text-[11px]">
          {LEGEND_KEYS.map((key) => {
            const item = ACTION_CONFIG[key];
            if (!item) return null;
            return (
              <div key={key} className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-300 truncate">{item.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default React.memo(Legend);
