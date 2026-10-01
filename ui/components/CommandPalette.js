"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback, useDeferredValue } from "react";
import { ACTION_CONFIG } from "../lib/action-theme";
import {
  getNodeTargetAddress,
  getUpstreamDependencies,
  generateTargetCommand,
  copyToClipboard,
} from "../lib/target-command";

/**
 * CommandPalette: Global ⌘K quick switcher & node navigation.
 * High-performance, keyboard-first, zero layout interference.
 */
function CommandPalette({
  isOpen,
  onClose,
  nodes = [],
  selectedNode = null,
  graphData = null,
  onOpenDiffModal,
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
    if (selectedNode && onOpenDiffModal) {
      list.push({
        id: "action-open-diff",
        isAction: true,
        label: `View IaC Diff: ${selectedNode.label || selectedNode.id}`,
        description: "Open unified and side-by-side Terraform HCL diff modal",
        shortcut: "D",
        run: () => onOpenDiffModal(selectedNode),
      });
    }

    if (selectedNode) {
      const targetAddr = getNodeTargetAddress(selectedNode);
      if (targetAddr) {
        list.push({
          id: "action-copy-target",
          isAction: true,
          label: `Copy Target Apply: ${selectedNode.label || selectedNode.id}`,
          description: `Generate and copy 'terraform apply -target="${targetAddr}"'`,
          shortcut: "T",
          run: async () => {
            const cmd = `terraform apply -target="${targetAddr}"`;
            await copyToClipboard(cmd);
          },
        });

        const upstream = graphData ? getUpstreamDependencies(selectedNode.id || targetAddr, graphData) : [];
        if (upstream.length > 0) {
          list.push({
            id: "action-copy-target-upstream",
            isAction: true,
            label: `Copy Target Apply (+${upstream.length} Upstream Prerequisites): ${selectedNode.label || selectedNode.id}`,
            description: "Generate targeted apply command including topological prerequisite chain",
            run: async () => {
              const cmd = generateTargetCommand(targetAddr, {
                command: "apply",
                includeUpstream: true,
                upstreamAddresses: upstream.map((u) => u.id),
              });
              await copyToClipboard(cmd);
            },
          });
        }
      }
    }

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
        shortcut: "Shift+T",
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
  }, [selectedNode, graphData, onOpenDiffModal, isCollapsed, onToggleCollapse, onToggleTheme, theme, onOpenShortcuts]);

  const filteredActions = useMemo(() => {
    if (!actions || actions.length === 0) return [];
    if (!deferredQuery.trim()) return actions;
    const q = deferredQuery.toLowerCase().trim();
    return actions.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        (a.shortcut && a.shortcut.toLowerCase().includes(q)) ||
        "target".includes(q) ||
        "apply".includes(q) ||
        "upstream".includes(q) ||
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-xs select-none font-sans">
      <div
        className="w-full max-w-xl bg-workbench-panel border border-workbench-border rounded-lg shadow-2xl overflow-hidden flex flex-col"
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
            placeholder="Jump to resource, module, command (target, apply, diff)..."
            className="flex-1 bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none font-mono"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-workbench-subpanel border border-workbench-border rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="max-h-80 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
          {allFilteredItems.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500 font-mono">
              No matching resources or commands found for "{query}"
            </div>
          ) : (
            allFilteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;

              if (item.isAction) {
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      item.run();
                      onClose();
                    }}
                    className={`p-2 rounded cursor-pointer transition flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-workbench-subpanel border border-workbench-border shadow-xs text-slate-900 dark:text-white"
                        : "hover:bg-workbench-hover text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="p-1 rounded bg-sky-500/10 text-sky-500 dark:text-sky-400 shrink-0">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-medium font-sans truncate">{item.label}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate font-sans">
                          {item.description}
                        </div>
                      </div>
                    </div>
                    {item.shortcut && (
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-workbench-panel border border-workbench-border rounded text-slate-500 dark:text-slate-400 shrink-0">
                        {item.shortcut}
                      </kbd>
                    )}
                  </div>
                );
              }

              // Resource item
              const data = item.data || item;
              const isEntity = data.type === "variable" || data.type === "output";
              const badgeKey = isEntity ? data.type : (data.change ? data.change.toLowerCase() : "no-op");
              const cfg = ACTION_CONFIG[badgeKey] || ACTION_CONFIG["no-op"];

              return (
                <div
                  key={data.id}
                  onClick={() => {
                    onSelectNode(data.id);
                    onClose();
                  }}
                  className={`p-2 rounded cursor-pointer transition flex items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-workbench-subpanel border border-workbench-border shadow-xs text-slate-900 dark:text-white"
                      : "hover:bg-workbench-hover text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded uppercase tracking-wider shrink-0"
                      style={{
                        backgroundColor: `${cfg.color}15`,
                        color: cfg.color,
                        border: `1px solid ${cfg.color}30`,
                      }}
                    >
                      {cfg.symbol} {data.change || data.type || "no-op"}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-mono font-medium truncate text-slate-900 dark:text-white">
                        {data.label || data.id}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">
                        {data.id}
                      </div>
                    </div>
                  </div>
                  {data.module && (
                    <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1 py-0.5 rounded truncate max-w-[120px] shrink-0">
                      {data.module}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Info */}
        <div className="p-2 px-3 border-t border-workbench-border bg-workbench-header/50 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="text-[9px] uppercase tracking-wider text-slate-400">plan-parse quick command</span>
        </div>
      </div>
    </div>
  );
}

export default React.memo(CommandPalette);
