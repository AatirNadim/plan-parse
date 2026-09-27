"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import AppHeader from "../components/AppHeader";
import StatusBar from "../components/StatusBar";
import WorkbenchSidebar from "../components/WorkbenchSidebar";
import NodeInspector from "../components/NodeInspector";
import CommandPalette from "../components/CommandPalette";
import { CYTOSCAPE_STYLES } from "../lib/cytoscape-styles";
import { exportGraphAsPng, exportGraphAsSvg, registerCytoscapeSvgPlugin } from "../lib/export-image";

export default function Home() {
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
  const [isExporting, setIsExporting] = useState(null);

  const cyContainerRef = useRef(null);
  const cyRef = useRef(null);

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
      await exportGraphAsPng(cyRef.current, planName);
    } catch (err) {
      console.error("Failed to export graph PNG:", err);
    } finally {
      setIsExporting(null);
    }
  }, [planName, isExporting]);

  const handleExportSvg = useCallback(async () => {
    if (!cyRef.current || isExporting) return;
    setIsExporting("svg");
    try {
      await exportGraphAsSvg(cyRef.current, planName);
    } catch (err) {
      console.error("Failed to export graph SVG:", err);
    } finally {
      setIsExporting(null);
    }
  }, [planName, isExporting]);

  // Navigate to and select a specific node
  const handleNavigateToNode = useCallback((nodeId) => {
    if (!cyRef.current || !nodeId) return;
    const cy = cyRef.current;
    const node = cy.$id(nodeId);

    if (node && node.length > 0) {
      const data = node.data();
      const incomers = node.incomers("node").map((n) => n.data().id);
      const outgoers = node.outgoers("node").map((n) => n.data().id);

      setSelectedNode({
        ...data,
        incomers,
        outgoers,
      });
      setIsInspectorOpen(true);

      // Highlight connections
      cy.elements().removeClass("dimmed highlighted highlighted-edge");
      cy.elements().addClass("dimmed");

      node.removeClass("dimmed").addClass("highlighted");
      node.ancestors().removeClass("dimmed");
      node.descendants().removeClass("dimmed");
      node.connectedEdges().removeClass("dimmed").addClass("highlighted-edge");
      node.incomers().removeClass("dimmed").addClass("highlighted");
      node.outgoers().removeClass("dimmed").addClass("highlighted");

      // Smoothly animate camera to center & zoom onto the node
      cy.animate({
        center: { eles: node },
        zoom: Math.max(cy.zoom(), 1.25),
        duration: 400,
      });
    }
  }, []);

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

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === "[") {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      } else if (e.key === "]") {
        e.preventDefault();
        setIsInspectorOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        if (isCommandPaletteOpen) {
          setIsCommandPaletteOpen(false);
        } else if (selectedNode) {
          setSelectedNode(null);
          if (cyRef.current) {
            cyRef.current.elements().removeClass("dimmed highlighted highlighted-edge");
          }
        }
      } else if (e.key === "f" || e.key === "F") {
        handleFit();
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      } else if (e.key === "0") {
        handleResetZoom();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isCommandPaletteOpen,
    selectedNode,
    handleFit,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
  ]);

  // Render Cytoscape graph when graphData changes
  useEffect(() => {
    if (!graphData || !cyContainerRef.current) return;
    if (typeof window === "undefined" || !window.cytoscape) return;

    try {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }

      const elements = [];
      const nodeIds = new Set();

      // Add nodes
      (graphData.nodes || []).forEach((n) => {
        nodeIds.add(n.data.id);
        elements.push({
          group: "nodes",
          data: { ...n.data },
          classes: n.classes || "",
        });
      });

      // Add edges (ensure both ends exist)
      (graphData.edges || []).forEach((e) => {
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
        style: CYTOSCAPE_STYLES,
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

        setSelectedNode({
          ...data,
          incomers,
          outgoers,
        });
        setIsInspectorOpen(true);

        // Highlight paths
        cy.elements().removeClass("dimmed highlighted highlighted-edge");
        cy.elements().addClass("dimmed");

        node.removeClass("dimmed").addClass("highlighted");
        node.ancestors().removeClass("dimmed");
        node.descendants().removeClass("dimmed");
        node.connectedEdges().removeClass("dimmed").addClass("highlighted-edge");
        node.incomers().removeClass("dimmed").addClass("highlighted");
        node.outgoers().removeClass("dimmed").addClass("highlighted");
      });

      // Double-click to center and zoom in
      cy.on("dbltap", "node", (evt) => {
        const node = evt.target;
        cy.animate({
          center: { eles: node },
          zoom: Math.max(cy.zoom(), 1.3),
          duration: 350,
        });
      });

      // Tap canvas background to deselect
      cy.on("tap", (evt) => {
        if (evt.target === cy) {
          setSelectedNode(null);
          cy.elements().removeClass("dimmed highlighted highlighted-edge");
        }
      });

      // Run Klay DAG layout
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
          layout.run();
        } catch (e) {
          console.warn("Klay layout error, falling back to breadthfirst:", e);
          cy.layout({ name: "breadthfirst", directed: true, padding: 50 }).run();
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
  }, [graphData, cyReady]);

  const handlePlanParsed = useCallback((newGraph, fileName) => {
    setGraphData(newGraph);
    setCliLoaded(false);
    setDisabled(false);
    setSelectedNode(null);
    if (fileName) {
      setPlanName(fileName);
    }
  }, []);

  const handleOpenUpload = useCallback(() => {
    setIsSidebarOpen(true);
    setSidebarTab("source");
  }, []);

  const hasGraph = Boolean(graphData && graphData.nodes && graphData.nodes.length > 0);
  const nodeCount = graphData?.nodes?.length || 0;
  const edgeCount = graphData?.edges?.length || 0;

  return (
    <div className="w-screen h-screen flex flex-col bg-workbench-bg text-slate-200 overflow-hidden font-sans select-none">
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
        onOpenUpload={handleOpenUpload}
        onFit={handleFit}
        onResetZoom={handleResetZoom}
        onExportPng={handleExportPng}
        onExportSvg={handleExportSvg}
        isExporting={isExporting}
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

          {/* Empty Workbench State (Professional CLI drop target, zero AI clichés) */}
          {!hasGraph && (
            <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
              <div className="w-full max-w-md bg-workbench-panel border border-workbench-border rounded p-6 shadow-2xl pointer-events-auto space-y-4 font-mono">
                <div className="flex items-center gap-2 text-xs text-slate-400 border-b border-workbench-border pb-3">
                  <span className="w-2 h-2 rounded-full bg-slate-600" />
                  <span className="font-semibold text-slate-200">Terraform Plan Workbench</span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  No execution plan loaded in active session. Ingest a Terraform plan JSON to compute and render the dependency DAG.
                </p>

                <div className="p-3 bg-workbench-header border border-workbench-border rounded text-[11px] text-slate-300 space-y-1">
                  <div className="text-slate-500 font-semibold text-[10px] uppercase">Export Command:</div>
                  <div className="text-sky-400 select-all font-mono">
                    terraform show -json tfplan &gt; plan.json
                  </div>
                </div>

                <button
                  onClick={handleOpenUpload}
                  className="w-full py-2 px-3 rounded bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-mono font-semibold transition"
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
            onClose={() => setSelectedNode(null)}
            onNavigateToNode={handleNavigateToNode}
          />
        )}
      </div>

      {/* Grounded Engineering Status Bar */}
      <StatusBar
        nodeCount={nodeCount}
        edgeCount={edgeCount}
        zoomLevel={zoomLevel}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        isLocked={isLocked}
        onToggleLock={() => setIsLocked((prev) => !prev)}
      />

      {/* Global ⌘K Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        nodes={graphData?.nodes || []}
        onSelectNode={handleNavigateToNode}
      />
    </div>
  );
}
