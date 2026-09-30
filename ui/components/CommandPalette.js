"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback, useDeferredValue } from "react";
import { ACTION_CONFIG } from "../lib/action-theme";

/**
 * CommandPalette: Global ⌘K quick switcher & node navigation.
 * High-performance, keyboard-first, zero layout interference.
 */
function CommandPalette({
  isOpen,
  onClose,
  nodes = [],
  onSelectNode,
  isCollapsed = false,
  onToggleCollapse,
  onOpenShortcuts,
  theme = "dark",
  onToggleTheme,
}) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Action items
  const actions = useMemo(() => {
    const list = [];
    if (onToggleCollapse) {
      list.push({
        id: "action-toggle-collapse",
        isAction: true,
        label: isCollapsed
          ? "Expand All Nodes (Show intermediate nodes)"
          : "Collapse Intermediate Nodes (Mutations Only)",
        description: isCollapsed
          ? "Restore all variables, outputs, and non-mutating resources"
          : "Contract graph to mutating resources and bridge transitive dependencies",
        shortcut: "C",
        run: onToggleCollapse,
      });
    }
    if (onToggleTheme) {
      list.push({
        id: "action-toggle-theme",
        isAction: true,
        label: theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode",
        description:
          theme === "light"
            ? "Switch workbench to precision technical dark theme"
            : "Switch workbench to precision slate light theme",
        shortcut: "T",
        run: onToggleTheme,
      });
    }
    if (onOpenShortcuts) {
      list.push({
        id: "action-shortcuts",
        isAction: true,
        label: "Keyboard Shortcuts Cheat Sheet",
        description: "View all keyboard navigation and canvas shortcuts",
        shortcut: "?",
        run: onOpenShortcuts,
      });
    }
    return list;
  }, [isCollapsed, onToggleCollapse, onToggleTheme, theme, onOpenShortcuts]);

  const filteredActions = useMemo(() => {
    if (!actions || actions.length === 0) return [];
    if (!deferredQuery.trim()) return actions;
    const q = deferredQuery.toLowerCase().trim();
    return actions.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        (a.shortcut && a.shortcut.toLowerCase().includes(q)) ||
        "shortcuts".includes(q) ||
        "cheat".includes(q) ||
        "sheet".includes(q) ||
        "help".includes(q) ||
        "keys".includes(q) ||
        "collapse".includes(q) ||
        "expand".includes(q) ||
        "mutation".includes(q) ||
        "toggle".includes(q) ||
        "theme".includes(q) ||
        "dark".includes(q) ||
        "light".includes(q)
    );
  }, [actions, deferredQuery]);

  // Filter nodes
  const filteredNodes = useMemo(() => {
    if (!nodes || nodes.length === 0) return [];
    if (!deferredQuery.trim()) {
      return nodes.slice(0, 12);
    }
    const q = deferredQuery.toLowerCase().trim();
    return nodes
      .filter((n) => {
        const id = (n.data?.id || "").toLowerCase();
        const label = (n.data?.label || "").toLowerCase();
        const type = (n.data?.resourceType || n.data?.type || "").toLowerCase();
        const change = (n.data?.change || "").toLowerCase();
        const mod = (n.data?.module || "").toLowerCase();
        return (
          id.includes(q) ||
          label.includes(q) ||
          type.includes(q) ||
          change.includes(q) ||
          mod.includes(q)
        );
      })
      .slice(0, 12);
  }, [deferredQuery, nodes]);

  const allFilteredItems = useMemo(() => {
    return [...filteredActions, ...filteredNodes];
  }, [filteredActions, filteredNodes]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, allFilteredItems.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + allFilteredItems.length) % Math.max(1, allFilteredItems.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (allFilteredItems[selectedIndex]) {
          const target = allFilteredItems[selectedIndex];
          if (target.isAction) {
            target.run();
          } else {
            onSelectNode(target.data?.id || target.id);
          }
          onClose();
        }
      }
    },
    [allFilteredItems, selectedIndex, onSelectNode, onClose]
  );

  // Keep selected item in view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-xs select-none">
      <div
        className="w-full max-w-xl bg-workbench-panel border border-workbench-border rounded shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-workbench-border bg-workbench-header">
          <svg className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Jump to resource, module, command, or theme..."
            className="flex-1 bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none font-mono"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-workbench-subpanel border border-workbench-border rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="max-h-80 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
          {allFilteredItems.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500 font-mono">
              No matching resources or commands found for "{query}"
            </div>
          ) : (
            allFilteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;

              if (item.isAction) {
                return (
                  <button
                    key={item.id || idx}
                    onClick={() => {
                      item.run();
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between gap-3 px-2.5 py-2 text-left rounded transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-workbench-hover text-slate-900 dark:text-white"
                        : "text-slate-700 dark:text-slate-300 hover:bg-workbench-subpanel"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                      <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded shrink-0 uppercase bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                        ⚡ Action
                      </span>
                      <div className="truncate flex-1 min-w-0">
                        <div className="text-xs font-mono text-slate-900 dark:text-slate-100 font-medium truncate">
                          {item.label}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">
                          {item.description}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.shortcut && (
                        <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-workbench-panel border border-workbench-border rounded">
                          {item.shortcut}
                        </kbd>
                      )}
                      {isSelected && (
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          Execute ↵
                        </span>
                      )}
                    </div>
                  </button>
                );
              }

              const data = item.data || {};
              const change = (data.change || "no-op").toLowerCase();
              const cfg = ACTION_CONFIG[change] || ACTION_CONFIG["no-op"];

              return (
                <button
                  key={data.id || idx}
                  onClick={() => {
                    onSelectNode(data.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between gap-3 px-2.5 py-1.5 text-left rounded transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-workbench-hover text-slate-900 dark:text-white"
                      : "text-slate-700 dark:text-slate-300 hover:bg-workbench-subpanel"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                    <span
                      className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded shrink-0 uppercase"
                      style={{
                        backgroundColor: `${cfg.color}15`,
                        color: cfg.color,
                        border: `1px solid ${cfg.color}30`,
                      }}
                    >
                      {cfg.symbol} {change}
                    </span>
                    <div className="truncate flex-1 min-w-0">
                      <div className="text-xs font-mono text-slate-800 dark:text-slate-200 truncate">
                        {data.label || data.id}
                      </div>
                      {data.resourceType && (
                        <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">
                          {data.resourceType}
                          {data.module ? ` • ${data.module}` : ""}
                        </div>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                      Jump ↵
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Palette Footer */}
        <div className="px-3.5 py-1.5 border-t border-workbench-border bg-workbench-header flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span><kbd className="text-slate-600 dark:text-slate-400">↑↓</kbd> navigate</span>
            <span><kbd className="text-slate-600 dark:text-slate-400">↵</kbd> select</span>
            <span><kbd className="text-slate-600 dark:text-slate-400">esc</kbd> close</span>
          </div>
          <span>{allFilteredItems.length} results</span>
        </div>
      </div>
    </div>
  );
}

export default React.memo(CommandPalette);
