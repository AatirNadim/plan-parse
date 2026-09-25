"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import InputDrawer from "../components/InputDrawer";
import CanvasControls from "../components/CanvasControls";
import GraphSearchBar from "../components/GraphSearchBar";
import NodeInspector from "../components/NodeInspector";
import Legend from "../components/Legend";
import { CYTOSCAPE_STYLES } from "../lib/cytoscape-styles";

export default function Home() {
  const [graphData, setGraphData] = useState(null);
  const [cliLoaded, setCliLoaded] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isLocked, setIsLocked] = useState(false);
  const [cyReady, setCyReady] = useState(false);

  const cyContainerRef = useRef(null);
  const cyRef = useRef(null);

  // Check for window.cytoscape loaded via layout.js script tag
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.cytoscape) {
      setCyReady(true);
      return;
    }
    const interval = setInterval(() => {
      if (window.cytoscape) {
        setCyReady(true);
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
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
        }

        const graphRes = await fetch("/api/graph");
        if (graphRes.ok) {
          const graph = await graphRes.json();
          if (graph && graph.nodes && graph.nodes.length > 0) {
            setGraphData(graph);
            setIsDrawerOpen(false);
            return;
          }
        }

        // If no graph loaded via CLI, open input drawer for user
        if (!isCli) {
          setIsDrawerOpen(true);
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

  // Global keyboard shortcuts for canvas navigation
  useEffect(() => {
    function handleKeyDown(e) {
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable
      ) {
        return;
      }

      if (e.key === "Escape") {
        if (selectedNode) {
          setSelectedNode(null);
        } else if (isDrawerOpen) {
          setIsDrawerOpen(false);
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
  }, [selectedNode, isDrawerOpen, handleFit, handleZoomIn, handleZoomOut, handleResetZoom]);

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

      // React Flow-tuned Cytoscape instance
      const cy = window.cytoscape({
        container: cyContainerRef.current,
        elements: elements,
        boxSelectionEnabled: false,
        autounselectify: false,
        userPanningEnabled: !isLocked,
        userZoomingEnabled: !isLocked,
        wheelSensitivity: 0.2, // Smooth React Flow mousewheel zooming
        minZoom: 0.05,
        maxZoom: 3.5,
        style: CYTOSCAPE_STYLES,
      });

      // Real-time Zoom tracking for live percentage HUD
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

      // Double-click/double-tap on node to center and zoom in
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

      // Run layout
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

  const handlePlanParsed = useCallback((newGraph) => {
    setGraphData(newGraph);
    setCliLoaded(false);
    setDisabled(false);
    setSelectedNode(null);
  }, []);

  const handleToggleDrawer = useCallback(() => setIsDrawerOpen((prev) => !prev), []);
  const handleCloseDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const handleOpenDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const handleToggleLock = useCallback(() => setIsLocked((prev) => !prev), []);
  const handleCloseInspector = useCallback(() => setSelectedNode(null), []);

  const hasGraph = Boolean(graphData && graphData.nodes && graphData.nodes.length > 0);

  return (
    <div className="relative w-screen h-screen overflow-hidden canvas-bg select-none">
      {/* Cytoscape Graph Canvas */}
      <div id="cy" ref={cyContainerRef} className="w-full h-full" />

      {/* Empty Canvas Guidance State (shown when no graph is loaded and drawer is collapsed) */}
      {!hasGraph && !isDrawerOpen && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
          <div className="p-8 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800/80 shadow-2xl text-center max-w-md pointer-events-auto space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner shadow-indigo-500/20">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.75"
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                />
              </svg>
            </div>

            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Terraform DAG Canvas
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Open the plan input panel to insert your Terraform plan JSON file.
                The DAG will render here with full zoom and navigation.
              </p>
            </div>

            <button
              onClick={handleOpenDrawer}
              className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 mx-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Open Plan Input Panel</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Collapsible Panel */}
      <InputDrawer
        isOpen={isDrawerOpen}
        onToggle={handleToggleDrawer}
        onClose={handleCloseDrawer}
        onPlanParsed={handlePlanParsed}
        cliLoaded={cliLoaded}
        disabled={disabled}
        currentSummary={graphData?.summary}
        graphData={graphData}
        selectedNode={selectedNode}
        onNavigateToNode={handleNavigateToNode}
      />

      {/* Quick Search & Navigate Bar (Top-Right) */}
      {hasGraph && (
        <GraphSearchBar
          nodes={graphData.nodes || []}
          onSelectNode={handleNavigateToNode}
        />
      )}

      {/* React Flow-style Viewport Controls (Bottom-Left) */}
      <CanvasControls
        zoomLevel={zoomLevel}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFit={handleFit}
        onResetZoom={handleResetZoom}
        isLocked={isLocked}
        onToggleLock={handleToggleLock}
      />

      {/* Collapsible Action Legend (Bottom-Right) */}
      {hasGraph && <Legend />}

      {/* Slide-over Node Detail Inspector */}
      {selectedNode && (
        <NodeInspector
          node={selectedNode}
          onClose={handleCloseInspector}
          onNavigateToNode={handleNavigateToNode}
        />
      )}
    </div>
  );
}
