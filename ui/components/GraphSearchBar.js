"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { ACTION_CONFIG } from "../lib/action-theme";

/**
 * GraphSearchBar: Quick resource finder & navigator.
 * Searches graph nodes by address, label, or type, and smoothly navigates camera to it.
 */
export default function GraphSearchBar({ nodes = [], onSelectNode }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut (⌘K or Ctrl+K) to focus search
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter leaf and module nodes
  const filteredNodes = useMemo(() => {
    if (!query.trim() || !nodes || nodes.length === 0) return [];
    const q = query.toLowerCase();

    return nodes
      .filter((n) => {
        const id = (n.data?.id || "").toLowerCase();
        const label = (n.data?.label || "").toLowerCase();
        const type = (n.data?.type || "").toLowerCase();
        return id.includes(q) || label.includes(q) || type.includes(q);
      })
      .slice(0, 8);
  }, [query, nodes]);

  const handleSelect = (node) => {
    if (onSelectNode) {
      onSelectNode(node.data?.id || node.id);
    }
    setIsOpen(false);
    setQuery("");
  };

  if (!nodes || nodes.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="fixed top-4 right-4 z-20 w-72 md:w-80 select-none"
    >
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search resources... (⌘K)"
          className="w-full pl-9 pr-8 py-2 text-xs bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/50 shadow-2xl transition"
        />

        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition focus:outline-none focus-visible:text-white"
            title="Clear search"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Autocomplete Results Dropdown */}
      {isOpen && query.trim() && (
        <div className="absolute top-full mt-1.5 w-full bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto py-1 z-30">
          {filteredNodes.length > 0 ? (
            filteredNodes.map((n) => {
              const id = n.data?.id;
              const label = n.data?.label || id;
              const change = n.data?.change;
              const type = n.data?.type;
              const cfg = change ? ACTION_CONFIG[change.toLowerCase()] : null;

              return (
                <button
                  key={id}
                  onClick={() => handleSelect(n)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800/80 focus:bg-slate-800/80 focus:outline-none transition flex items-center justify-between gap-2 border-b border-slate-800/40 last:border-0"
                >
                  <div className="truncate flex-1">
                    <div className="text-xs font-semibold text-slate-200 truncate">
                      {label}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 truncate">
                      {id}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {change && (
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
                          cfg
                            ? `${cfg.bg} ${cfg.text} border ${cfg.border}`
                            : "bg-slate-800 text-slate-300 border border-slate-700"
                        }`}
                      >
                        {change}
                      </span>
                    )}
                    {type && (
                      <span className="text-[10px] text-slate-400 capitalize">
                        {type}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="px-3 py-3 text-center text-xs text-slate-500">
              No matching resources found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

