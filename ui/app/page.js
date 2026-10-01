"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import AppHeader from "../components/AppHeader";
import StatusBar from "../components/StatusBar";
import WorkbenchSidebar from "../components/WorkbenchSidebar";
import NodeInspector from "../components/NodeInspector";
import CommandPalette from "../components/CommandPalette";
import KeyboardShortcutsModal from "../components/KeyboardShortcutsModal";
import NodePopover from "../components/NodePopover";
import NodeDiffModal from "../components/NodeDiffModal";
import { getCytoscapeStyles } from "../lib/cytoscape-styles";
import { exportGraphAsPng, exportGraphAsSvg, registerCytoscapeSvgPlugin } from "../lib/export-image";
import { collapseGraph } from "../lib/graph-collapse";
import { useTheme } from "../lib/use-theme";
import { computeBlastRadius, extractBlastSubgraph } from "../lib/blast-radius";

export default function Home() {
  const { theme, toggleTheme } = useTheme();

  const [graphData, setGraphData] = useState(null);
  const [cliLoaded, setCliLoaded] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [planName, setPlanName] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState("resources");
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isLocked, setIsLocked] = useState(false);
  const [cyReady, setCyReady] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [diffModalNode, setDiffModalNode] = useState(null);
  const [popoverState, setPopoverState] = useState(null); // { node, position: { x, y } }

  // Blast Radius Isolation state
  const [isBlastIsolated, setIsBlastIsolated] = useState(false);
  const [blastIsolatedNodeId, setBlastIsolatedNodeId] = useState(null);
  const [blastDepthFilter, setBlastDepthFilter] = useState("all"); // 'all' | 1 | 2
  const [blastMutatingOnly, setBlastMutatingOnly] = useState(false);

  // Compute collapsed graph representation with transitive edge bridging
  const collapsedGraph = useMemo(() => {
    if (!graphData) return null;
    return collapseGraph(graphData);
  }, [graphData]);

  // Compute active elements to feed Cytoscape canvas (with optional collapse or blast isolation)
  const activeGraphData = useMemo(() => {
    if (!graphData) return null;
    const base = isCollapsed && collapsedGraph ? collapsedGraph : graphData;
    if (isBlastIsolated && blastIsolatedNodeId) {
      const blast = computeBlastRadius(blastIsolatedNodeId, base, {
        maxDepth: blastDepthFilter === "all" ? Infinity : Number(blastDepthFilter),
        mutatingOnly: blastMutatingOnly,
      });
      return extractBlastSubgraph(base, blast, { includeContainers: true });
    }
    return base;
  }, [graphData, isCollapsed, collapsedGraph, isBlastIsolated, blastIsolatedNodeId, blastDepthFilter, blastMutatingOnly]);

  // Current blast radius analysis of the selected node
  const currentBlastRadius = useMemo(() => {
    if (!selectedNode || !selectedNode.id || !activeGraphData) return null;
    return computeBlastRadius(selectedNode.id, activeGraphData);
  }, [selectedNode, activeGraphData]);

  const handleToggleBlastIsolation = useCallback(() => {
    if (isBlastIsolated) {
      setIsBlastIsolated(false);
      setBlastIsolatedNodeId(null);
    } else if (selectedNode?.id) {
      setBlastIsolatedNodeId(selectedNode.id);
      setIsBlastIsolated(true);
    }
  }, [isBlastIsolated, selectedNode]);

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const cyContainerRef = useRef(null);
  const cyRef = useRef(null);
  const pendingNavigateNodeIdRef = useRef(null);

  // Check for window.cytoscape loaded via layout.js script tag
  useEffect(() => {
    if (typeof window === "undefined") return;

    let mounted = true;
    const initCytoscape = async () => {
      if (window.cytoscape) {
        try {
          await registerCytoscapeSvgPlugin(window.cytoscape);
        } catch (e) {
          console.warn("cytoscape-svg pre-registration warning:", e);
        }
        if (mounted) {
          setCyReady(true);
        }
        return true;
      }
      return false;
    };

    if (window.cytoscape) {
      initCytoscape();
      return;
    }

    const interval = setInterval(async () => {
      if (window.cytoscape) {
        await initCytoscape();
        clearInterval(interval);
      }
    }, 50);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Initialize status and initial graph from Go server on mount
  useEffect(() => {
    async function init() {
      try {
        const statusRes = await fetch("/api/status");
        let isCli = false;
        if (statusRes.ok) {
          const status = await statusRes.json();
          isCli = Boolean(status.cli_loaded);
          setCliLoaded(isCli);
          setDisabled(Boolean(status.disabled));
          if (isCli) {
            setPlanName("CLI Session Plan");
          }
        }

        const graphRes = await fetch("/api/graph");
        if (graphRes.ok) {
          const graph = await graphRes.json();
          if (graph && graph.nodes && graph.nodes.length > 0) {
            setGraphData(graph);
            setSidebarTab("resources");
            return;
          }
        }

        // If no graph loaded via CLI, switch sidebar to source upload tab
        if (!isCli) {
          setSidebarTab("source");
        }
      } catch (err) {
        console.error("Failed to initialize plan-parse:", err);
      }
    }

    init();
  }, []);

  // Sync Cytoscape navigation lock with state
  useEffect(() => {
    if (!cyRef.current) return;
    cyRef.current.userPanningEnabled(!isLocked);
    cyRef.current.userZoomingEnabled(!isLocked);
  }, [isLocked]);

  // Dynamic Cytoscape style update on theme change
  useEffect(() => {
    if (cyRef.current && !cyRef.current.destroyed()) {
      cyRef.current.style(getCytoscapeStyles(theme));
    }
  }, [theme]);

  // Handle resizing of Cytoscape viewport when sidebars toggle
  useEffect(() => {
    if (!cyRef.current) return;
    const timer = setTimeout(() => {
      if (cyRef.current && !cyRef.current.destroyed()) {
        cyRef.current.resize();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [isSidebarOpen, isInspectorOpen, selectedNode]);

  // Viewport navigation helpers
  const handleZoomIn = useCallback(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    cy.animate({
      zoom: cy.zoom() * 1.3,
      duration: 200,
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    cy.animate({
      zoom: cy.zoom() * 0.75,
      duration: 200,
    });
  }, []);

  const handleFit = useCallback(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    cy.animate({
      fit: {
        eles: cy.elements(),
        padding: 50,
      },
      duration: 350,
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    cy.animate({
      zoom: 1.0,
      duration: 250,
    });
  }, []);

  const handleExportPng = useCallback(async () => {
    if (!cyRef.current || isExporting) return;
    setIsExporting("png");
    try {
      const cleanName = (planName || "terraform-plan").replace(/\.[^/.]+$/, "");
      const exportName = isCollapsed ? `${cleanName}-collapsed` : cleanName;
      const bg = theme === "light" ? "#f8fafc" : "#090a0f";
      await exportGraphAsPng(cyRef.current, exportName, { theme, bg });
    } catch (err) {
      console.error("Failed to export graph PNG:", err);
    } finally {
      setIsExporting(null);
    }
  }, [planName, isExporting, isCollapsed, theme]);

  const handleExportSvg = useCallback(async () => {
    if (!cyRef.current || isExporting) return;
    setIsExporting("svg");
    try {
      const cleanName = (planName || "terraform-plan").replace(/\.[^/.]+$/, "");
      const exportName = isCollapsed ? `${cleanName}-collapsed` : cleanName;
      const bg = theme === "light" ? "#f8fafc" : "#090a0f";
      await exportGraphAsSvg(cyRef.current, exportName, { theme, bg });
    } catch (err) {
      console.error("Failed to export graph SVG:", err);
    } finally {
      setIsExporting(null);
    }
  }, [planName, isExporting, isCollapsed, theme]);

  // Clear selected node if it was hidden in current collapsed view
  useEffect(() => {
    if (selectedNode && activeGraphData) {
      const exists = (activeGraphData.nodes || []).some((n) => n.data?.id === selectedNode.id);
      if (!exists) {
        setSelectedNode(null);
      }
    }
  }, [activeGraphData, selectedNode]);

  // Precision highlighting helper that illuminates transitive downstream blast radius and upstream lineage
  const applyBlastHighlight = useCallback((cy, node, targetGraphData) => {
    if (!cy || cy.destroyed() || !node || node.length === 0) return;
    const targetNodeId = node.data().id;
    const blast = computeBlastRadius(targetNodeId, targetGraphData || { nodes: [], edges: [] });

    cy.elements().removeClass(
      "dimmed highlighted highlighted-edge blast-root blast-direct blast-transitive blast-mutating blast-edge-direct blast-edge-transitive blast-edge-mutating"
    );
    cy.elements().addClass("dimmed");

    node.removeClass("dimmed").addClass("blast-root highlighted");
    node.ancestors().removeClass("dimmed");
    node.descendants().removeClass("dimmed");

    // Un-dim immediate outgoers (upstream prerequisites)
    node.outgoers().removeClass("dimmed").addClass("highlighted");
    node.outgoers("edge").removeClass("dimmed").addClass("highlighted-edge");

    if (blast && blast.all.length > 0) {
      for (const item of blast.all) {
        const itemNode = cy.$id(item.id);
        if (itemNode && itemNode.length > 0) {
          itemNode.removeClass("dimmed");
          itemNode.ancestors().removeClass("dimmed");
          if (item.isMutating) {
            itemNode.addClass("blast-mutating");
          } else if (item.blastDepth === 1) {
            itemNode.addClass("blast-direct");
          } else {
            itemNode.addClass("blast-transitive");
          }
        }
      }

      for (const edgeId of blast.edgeIds) {
        const edge = cy.$id(edgeId);
        if (edge && edge.length > 0) {
          const edgeData = edge.data();
          const isMut = blast.mutatingNodes.some((m) => m.id === edgeData.source);
          edge.removeClass("dimmed");
          if (isMut) {
            edge.addClass("blast-edge-mutating");
          } else {
            edge.addClass("blast-edge-direct");
          }
        }
      }
    } else {
      node.connectedEdges().removeClass("dimmed").addClass("highlighted-edge");
      node.incomers().removeClass("dimmed").addClass("highlighted");
    }
  }, []);

  // Helper to focus, highlight, and smoothly zoom to a node in Cytoscape
  const selectAndFocusNode = useCallback((cy, targetNodeId) => {
    if (!cy || cy.destroyed() || !targetNodeId) return;
    const node = cy.$id(targetNodeId);
    if (!node || node.length === 0) return;

    const data = node.data();
    const incomers = node.incomers("node").map((n) => n.data().id);
    const outgoers = node.outgoers("node").map((n) => n.data().id);

    setSelectedNode({
      ...data,
      incomers,
      outgoers,
    });
    setIsInspectorOpen(true);
    setPopoverState(null);

    applyBlastHighlight(cy, node, activeGraphData);

    // Smoothly animate camera to center & zoom onto the node
    cy.animate({
      center: { eles: node },
      zoom: Math.max(cy.zoom(), 1.25),
      duration: 400,
    });
  }, [activeGraphData, applyBlastHighlight]);

  // Navigate to and select a specific node
  const handleNavigateToNode = useCallback((nodeId) => {
    if (!nodeId) return;
    const cy = cyRef.current;
    const node = cy ? cy.$id(nodeId) : null;

    // If node is not on canvas because graph is collapsed, expand first and queue smooth navigation
    if ((!node || node.length === 0) && isCollapsed) {
      pendingNavigateNodeIdRef.current = nodeId;
      setIsCollapsed(false);
      return;
    }

    if (cy && node && node.length > 0) {
      selectAndFocusNode(cy, nodeId);
    }
  }, [isCollapsed, selectAndFocusNode]);

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e) {
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      if (e.key === "Escape") {
        if (diffModalNode) {
          setDiffModalNode(null);
          return;
        }
        if (popoverState) {
          setPopoverState(null);
          return;
        }
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
          return;
        }
        if (isCommandPaletteOpen) {
          setIsCommandPaletteOpen(false);
          return;
        }
        if (isBlastIsolated) {
          setIsBlastIsolated(false);
          setBlastIsolatedNodeId(null);
          return;
        }
        if (selectedNode) {
          setSelectedNode(null);
          setPopoverState(null);
          if (cyRef.current) {
            cyRef.current.elements().removeClass("dimmed highlighted highlighted-edge blast-root blast-direct blast-transitive blast-mutating blast-edge-direct blast-edge-transitive blast-edge-mutating");
          }
          return;
        }
        return;
      }

      if ((e.key === "?" || (e.shiftKey && e.key === "/")) && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // If a modal or palette is open, do not handle canvas/workbench single-character shortcuts
      if (isShortcutsOpen || isCommandPaletteOpen || diffModalNode) {
        return;
      }

      // Single-character shortcuts: MUST ensure no modifier keys (Cmd/Ctrl/Alt) are pressed.
      const isPlainKey = !e.metaKey && !e.ctrlKey && !e.altKey;
      if (!isPlainKey) {
        return;
      }

      if ((e.key === "b" || e.key === "B") && selectedNode) {
        e.preventDefault();
        handleToggleBlastIsolation();
        return;
      }

      if ((e.key === "d" || e.key === "D") && selectedNode) {
        e.preventDefault();
        setDiffModalNode(selectedNode);
        setPopoverState(null);
        return;
      }

      if (e.key === " " && selectedNode) {
        e.preventDefault();
        setPopoverState((curr) => {
          if (curr) return null;
          if (!cyRef.current) return null;
          const cyNode = cyRef.current.$id(selectedNode.id);
          if (!cyNode || cyNode.length === 0) return null;
          const pos = cyNode.renderedPosition();
          return { node: selectedNode, position: { x: pos.x, y: pos.y } };
        });
        return;
      }

      if (e.key === "[") {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      } else if (e.key === "]") {
        e.preventDefault();
        setIsInspectorOpen((prev) => !prev);
      } else if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        toggleTheme();
      } else if (e.key === "c" || e.key === "C") {
        if (graphData && graphData.nodes && graphData.nodes.length > 0) {
          e.preventDefault();
          handleToggleCollapse();
        }
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        handleFit();
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === "-") {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === "0") {
        e.preventDefault();
        handleResetZoom();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isShortcutsOpen,
    isCommandPaletteOpen,
    diffModalNode,
    popoverState,
    selectedNode,
    graphData,
    isBlastIsolated,
    handleToggleBlastIsolation,
    handleToggleCollapse,
    handleFit,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    toggleTheme,
  ]);

  // Render Cytoscape graph when activeGraphData changes
  useEffect(() => {
    if (!activeGraphData || !cyContainerRef.current) return;
    if (typeof window === "undefined" || !window.cytoscape) return;

    try {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }

      const elements = [];
      const nodeIds = new Set();

      // Add nodes
      (activeGraphData.nodes || []).forEach((n) => {
        nodeIds.add(n.data.id);
        elements.push({
          group: "nodes",
          data: { ...n.data },
          classes: n.classes || "",
        });
      });

      // Add edges (ensure both ends exist)
      (activeGraphData.edges || []).forEach((e) => {
        if (nodeIds.has(e.data.source) && nodeIds.has(e.data.target)) {
          elements.push({
            group: "edges",
            data: { ...e.data },
            classes: e.classes || "edge",
          });
        }
      });

      const cy = window.cytoscape({
        container: cyContainerRef.current,
        elements: elements,
        boxSelectionEnabled: false,
        autounselectify: false,
        userPanningEnabled: !isLocked,
        userZoomingEnabled: !isLocked,
        wheelSensitivity: 0.2,
        minZoom: 0.05,
        maxZoom: 3.5,
        style: getCytoscapeStyles(theme),
      });

      // Real-time Zoom tracking
      const updateZoom = () => {
        const newZoom = cy.zoom();
        setZoomLevel((prev) => (Math.abs(prev - newZoom) > 0.005 ? newZoom : prev));
      };
      cy.on("zoom", updateZoom);

      // Node selection on tap
      cy.on("tap", "node", (evt) => {
        const node = evt.target;
        const data = node.data();
        const incomers = node.incomers("node").map((n) => n.data().id);
        const outgoers = node.outgoers("node").map((n) => n.data().id);

        const nodeObj = {
          ...data,
          incomers,
          outgoers,
        };

        setSelectedNode(nodeObj);
        setIsInspectorOpen(true);

        const pos = node.renderedPosition();
        setPopoverState({
          node: nodeObj,
          position: { x: pos.x, y: pos.y },
        });

        // Highlight paths using precision multi-hop blast radius
        applyBlastHighlight(cy, node, activeGraphData);
      });

      // Double-click to open full diff modal
      cy.on("dbltap", "node", (evt) => {
        const node = evt.target;
        const data = node.data();
        const incomers = node.incomers("node").map((n) => n.data().id);
        const outgoers = node.outgoers("node").map((n) => n.data().id);
        const nodeObj = { ...data, incomers, outgoers };
        setDiffModalNode(nodeObj);
        setPopoverState(null);
      });

      // Dismiss popover on pan or zoom
      cy.on("pan zoom", () => {
        setPopoverState(null);
      });

      // Tap canvas background to deselect
      cy.on("tap", (evt) => {
        if (evt.target === cy) {
          setSelectedNode(null);
          setPopoverState(null);
          cy.elements().removeClass(
            "dimmed highlighted highlighted-edge blast-root blast-direct blast-transitive blast-mutating blast-edge-direct blast-edge-transitive blast-edge-mutating"
          );
        }
      });

      // Run Klay DAG layout with breadthfirst fallback
      const runLayout = () => {
        if (!cy || cy.destroyed()) return;
        try {
          const layout = cy.layout({
            name: "klay",
            nodeDimensionsIncludeLabels: true,
            fit: true,
            padding: 60,
            klay: {
              direction: "RIGHT",
              borderSpacing: 40,
              spacing: 30,
              nodeLayering: "NETWORK_SIMPLEX",
            },
          });
          layout.one("layoutstop", () => {
            if (!cy.destroyed()) {
              if (pendingNavigateNodeIdRef.current) {
                const targetId = pendingNavigateNodeIdRef.current;
                pendingNavigateNodeIdRef.current = null;
                selectAndFocusNode(cy, targetId);
              } else if (isBlastIsolated && blastIsolatedNodeId) {
                const isolatedRoot = cy.$id(blastIsolatedNodeId);
                if (isolatedRoot && isolatedRoot.length > 0) {
                  applyBlastHighlight(cy, isolatedRoot, activeGraphData);
                }
                cy.fit(undefined, 50);
                setZoomLevel(cy.zoom());
              } else {
                cy.fit(undefined, 50);
                setZoomLevel(cy.zoom());
              }
            }
          });
          layout.run();
        } catch (e) {
          console.warn("Klay layout error, falling back to breadthfirst:", e);
          const bf = cy.layout({ name: "breadthfirst", directed: true, padding: 50 });
          bf.one("layoutstop", () => {
            if (!cy.destroyed()) {
              if (pendingNavigateNodeIdRef.current) {
                const targetId = pendingNavigateNodeIdRef.current;
                pendingNavigateNodeIdRef.current = null;
                selectAndFocusNode(cy, targetId);
              } else if (isBlastIsolated && blastIsolatedNodeId) {
                const isolatedRoot = cy.$id(blastIsolatedNodeId);
                if (isolatedRoot && isolatedRoot.length > 0) {
                  applyBlastHighlight(cy, isolatedRoot, activeGraphData);
                }
                cy.fit(undefined, 50);
                setZoomLevel(cy.zoom());
              } else {
                cy.fit(undefined, 50);
                setZoomLevel(cy.zoom());
              }
            }
          });
          bf.run();
        }
        setZoomLevel(cy.zoom());
      };

      if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
        document.fonts.ready
          .then(() => {
            if (!cy.destroyed()) runLayout();
          })
          .catch(() => {
            if (!cy.destroyed()) runLayout();
          });
      } else {
        runLayout();
      }

      cyRef.current = cy;
    } catch (err) {
      console.error("Error setting up Cytoscape:", err);
    }

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [activeGraphData, cyReady, selectAndFocusNode, theme]);

  const handlePlanParsed = useCallback((newGraph, fileName) => {
    setGraphData(newGraph);
    setCliLoaded(false);
    setDisabled(false);
    setSelectedNode(null);
    setDiffModalNode(null);
    setPopoverState(null);
    setIsCollapsed(false);
    if (fileName) {
      setPlanName(fileName);
    }
  }, []);

  const handleOpenUpload = useCallback(() => {
    setIsSidebarOpen(true);
    setSidebarTab("source");
  }, []);

  const hasGraph = Boolean(graphData && graphData.nodes && graphData.nodes.length > 0);
  const originalNodeCount = graphData?.nodes?.length || 0;
  const originalEdgeCount = graphData?.edges?.length || 0;

  const collapsedCount = collapsedGraph?.hiddenCount || 0;
  const bridgedCount = collapsedGraph?.bridgedCount || 0;

  const displayNodeCount = isCollapsed
    ? (collapsedGraph?.mutatingCount ?? collapsedGraph?.nodes?.length ?? 0)
    : originalNodeCount;

  const displayEdgeCount = isCollapsed
    ? (collapsedGraph?.edges?.length ?? 0)
    : originalEdgeCount;

  return (
    <div className="w-screen h-screen flex flex-col bg-workbench-bg text-slate-800 dark:text-slate-200 overflow-hidden font-sans select-none transition-colors duration-150">
      {/* Grounded Top Application Header */}
      <AppHeader
        cliLoaded={cliLoaded}
        planName={planName}
        summary={graphData?.summary}
        hasGraph={hasGraph}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isInspectorOpen={isInspectorOpen && Boolean(selectedNode)}
        onToggleInspector={() => setIsInspectorOpen((prev) => !prev)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenUpload={handleOpenUpload}
        onFit={handleFit}
        onResetZoom={handleResetZoom}
        onExportPng={handleExportPng}
        onExportSvg={handleExportSvg}
        isExporting={isExporting}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        collapsedCount={collapsedCount}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Workbench Middle Area */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Docked Left Sidebar */}
        <WorkbenchSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          graphData={graphData}
          summary={graphData?.summary}
          cliLoaded={cliLoaded}
          disabled={disabled}
          selectedNode={selectedNode}
          onNavigateToNode={handleNavigateToNode}
          onPlanParsed={handlePlanParsed}
          activeTab={sidebarTab}
          onTabChange={setSidebarTab}
        />

        {/* Central DAG Canvas Viewport */}
        <main className="flex-1 relative h-full overflow-hidden canvas-bg">
          <div id="cy" ref={cyContainerRef} className="w-full h-full" />

          {/* Floating Transitive Blast Radius Canvas HUD */}
          {hasGraph && (currentBlastRadius?.stats?.totalCount > 0 || isBlastIsolated) && (
            <div className="absolute top-3 left-3 z-20 flex items-center gap-2 p-1.5 px-3 rounded-md border border-workbench-border bg-workbench-panel/95 backdrop-blur-md shadow-lg shadow-black/20 text-xs font-mono select-none pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {isBlastIsolated ? "Isolated Subgraph:" : "Blast Radius:"}
                </span>
                <span className="text-sky-600 dark:text-sky-400 font-medium">
                  {currentBlastRadius?.stats?.directCount || 0} direct
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-purple-600 dark:text-purple-400 font-medium">
                  {currentBlastRadius?.stats?.transitiveCount || 0} transitive
                </span>
                {currentBlastRadius?.stats?.mutatingCount > 0 && (
                  <>
                    <span className="text-slate-400">•</span>
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">
                      {currentBlastRadius.stats.mutatingCount} mutating
                    </span>
                  </>
                )}
              </div>

              <div className="h-3.5 w-px bg-workbench-border mx-0.5 shrink-0" />

              {/* Isolation Action Button */}
              <button
                onClick={handleToggleBlastIsolation}
                className={`px-2 py-1 rounded text-[11px] font-mono font-semibold border transition cursor-pointer flex items-center gap-1 shrink-0 ${
                  isBlastIsolated
                    ? "bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/40"
                    : "bg-workbench-subpanel hover:bg-workbench-hover text-slate-700 dark:text-slate-200 border-workbench-border"
                }`}
                title="Toggle Blast Radius Subgraph Isolation (B)"
              >
                <span>{isBlastIsolated ? "Exit Isolation" : "Isolate Subgraph"}</span>
                <kbd className="px-1 text-[9px] bg-workbench-panel rounded border border-workbench-border text-slate-500">B</kbd>
              </button>

              {/* Depth & Mutation Filter Controls when Isolated */}
              {isBlastIsolated && (
                <div className="flex items-center gap-1 pl-1.5 border-l border-workbench-border shrink-0">
                  <span className="text-[10px] text-slate-400 mr-0.5">Depth:</span>
                  {["all", 1, 2].map((depth) => (
                    <button
                      key={depth}
                      onClick={() => setBlastDepthFilter(depth)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                        blastDepthFilter === depth
                          ? "bg-sky-600 text-white font-bold"
                          : "bg-workbench-subpanel text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {depth === "all" ? "All" : `${depth}h`}
                    </button>
                  ))}

                  <button
                    onClick={() => setBlastMutatingOnly((prev) => !prev)}
                    className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-mono border transition cursor-pointer ${
                      blastMutatingOnly
                        ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40 font-bold"
                        : "bg-workbench-subpanel text-slate-600 dark:text-slate-400 border-workbench-border hover:text-slate-900 dark:hover:text-white"
                    }`}
                    title="Toggle filtering for mutating casualties only"
                  >
                    Mutating Only
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tier 1 Floating On-Canvas Popover */}
          {popoverState && (
            <NodePopover
              node={popoverState.node}
              graphData={activeGraphData}
              position={popoverState.position}
              onOpenModal={() => {
                setDiffModalNode(popoverState.node);
                setPopoverState(null);
              }}
              onClose={() => setPopoverState(null)}
              isBlastIsolated={isBlastIsolated}
              onToggleBlastIsolation={handleToggleBlastIsolation}
              canvasWidth={cyContainerRef.current?.clientWidth || 1000}
              canvasHeight={cyContainerRef.current?.clientHeight || 700}
            />
          )}

          {/* Empty Workbench State (Professional CLI drop target, zero AI clichés) */}
          {!hasGraph && (
            <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
              <div className="w-full max-w-md bg-workbench-panel border border-workbench-border rounded p-6 shadow-2xl pointer-events-auto space-y-4 font-mono">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 border-b border-workbench-border pb-3">
                  <img
                    src="/icon.svg"
                    alt="Plan Parse"
                    className="w-5 h-5 rounded shrink-0 select-none"
                    width={20}
                    height={20}
                  />
                  <span className="font-semibold text-slate-900 dark:text-slate-200">Terraform Plan Workbench</span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  No execution plan loaded in active session. Ingest a Terraform plan JSON to compute and render the dependency DAG.
                </p>

                <div className="p-3 bg-workbench-header border border-workbench-border rounded text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
                  <div className="text-slate-500 dark:text-slate-500 font-semibold text-[10px] uppercase">Export Command:</div>
                  <div className="text-sky-600 dark:text-sky-400 select-all font-mono">
                    terraform show -json tfplan &gt; plan.json
                  </div>
                </div>

                <button
                  onClick={handleOpenUpload}
                  className="w-full py-2 px-3 rounded bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-mono font-semibold transition cursor-pointer"
                >
                  Load Plan JSON File
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Docked Right Inspector Panel */}
        {selectedNode && isInspectorOpen && (
          <NodeInspector
            node={selectedNode}
            graphData={graphData}
            onClose={() => {
              setSelectedNode(null);
              setPopoverState(null);
            }}
            onNavigateToNode={handleNavigateToNode}
            onOpenFullDiff={(n) => {
              setDiffModalNode(n || selectedNode);
              setPopoverState(null);
            }}
            isBlastIsolated={isBlastIsolated}
            onToggleBlastIsolation={handleToggleBlastIsolation}
          />
        )}
      </div>

      {/* Grounded Engineering Status Bar */}
      <StatusBar
        nodeCount={displayNodeCount}
        edgeCount={displayEdgeCount}
        zoomLevel={zoomLevel}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        isLocked={isLocked}
        onToggleLock={() => setIsLocked((prev) => !prev)}
        isCollapsed={isCollapsed}
        collapsedCount={collapsedCount}
        bridgedCount={bridgedCount}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Global ⌘K Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        nodes={graphData?.nodes || []}
        selectedNode={selectedNode}
        graphData={graphData}
        onOpenDiffModal={(n) => {
          setDiffModalNode(n || selectedNode);
          setPopoverState(null);
        }}
        onSelectNode={handleNavigateToNode}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        isBlastIsolated={isBlastIsolated}
        onToggleBlastIsolation={handleToggleBlastIsolation}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Dedicated Keyboard Shortcuts Cheat Sheet Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Tier 2 Deep IaC Diff Modal */}
      <NodeDiffModal
        isOpen={Boolean(diffModalNode)}
        node={diffModalNode}
        onClose={() => setDiffModalNode(null)}
      />
    </div>
  );
}
