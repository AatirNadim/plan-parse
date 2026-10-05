"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { FEATURES } from "../lib/features-data";
import FeatureCleanVisual from "./FeatureCleanVisuals";

/**
 * Transitions metadata between consecutive deep-dive features.
 * Defines the semantic Terraform action token, symbol, and badge styling
 * modeled directly after BrandLogo's curved action conduit.
 */
const FLOW_TRANSITIONS = [
  {
    // Between 0 (Collapsed Nodes) and 1 (Blast Radius)
    symbol: "±",
    actionName: "REPLACE CASCADE",
    description: "Evaluates cascading resource re-creations down the DAG",
    color: "amber",
    borderColor: "#F59E0B",
    strokeColor: "#FBBF24",
    badgeBg: "bg-amber-500/10",
    badgeText: "text-amber-500 dark:text-amber-400",
    badgeBorder: "border-amber-500/30",
    glowColor: "rgba(245, 158, 11, 0.4)",
  },
  {
    // Between 1 (Blast Radius) and 2 (Resource Diff)
    symbol: "~",
    actionName: "IN-PLACE UPDATE",
    description: "Inspects line-by-line attribute deltas before apply",
    color: "sky",
    borderColor: "#0EA5E9",
    strokeColor: "#38BDF8",
    badgeBg: "bg-sky-500/10",
    badgeText: "text-sky-500 dark:text-sky-400",
    badgeBorder: "border-sky-500/30",
    glowColor: "rgba(14, 165, 233, 0.4)",
  },
  {
    // Between 2 (Resource Diff) and 3 (Color Grading)
    symbol: "+",
    actionName: "CREATION AUDIT",
    description: "Maps visual grammar tokens across new resources",
    color: "emerald",
    borderColor: "#10B981",
    strokeColor: "#34D399",
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-500 dark:text-emerald-400",
    badgeBorder: "border-emerald-500/30",
    glowColor: "rgba(16, 185, 129, 0.4)",
  },
  {
    // Between 3 (Color Grading) and 4 (Resource Panel)
    symbol: "⇲",
    actionName: "LINEAGE INSPECT",
    description: "Traverses bidirectional dependency parent/child arcs",
    color: "purple",
    borderColor: "#A855F7",
    strokeColor: "#C084FC",
    badgeBg: "bg-purple-500/10",
    badgeText: "text-purple-500 dark:text-purple-400",
    badgeBorder: "border-purple-500/30",
    glowColor: "rgba(168, 85, 247, 0.4)",
  },
  {
    // Between 4 (Resource Panel) and 5 (Workbench Sidebar)
    symbol: "↓",
    actionName: "INGESTION STREAM",
    description: "Streamlines 100% client-side zero-telemetry plan ingestion",
    color: "cyan",
    borderColor: "#06B6D4",
    strokeColor: "#22D3EE",
    badgeBg: "bg-cyan-500/10",
    badgeText: "text-cyan-500 dark:text-cyan-400",
    badgeBorder: "border-cyan-500/30",
    glowColor: "rgba(6, 182, 212, 0.4)",
  },
  {
    // Between 5 (Workbench Sidebar) and 6 (Workstation Tools)
    symbol: "⌘",
    actionName: "WORKSTATION CLI",
    description: "Triggers keyboard navigation and high-DPI visual exports",
    color: "indigo",
    borderColor: "#6366F1",
    strokeColor: "#818CF8",
    badgeBg: "bg-indigo-500/10",
    badgeText: "text-indigo-500 dark:text-indigo-400",
    badgeBorder: "border-indigo-500/30",
    glowColor: "rgba(99, 102, 241, 0.4)",
  },
];

/**
 * Editorial section styling matching the pipeline conduit colors.
 * Maps each deep-dive chapter to its corresponding conduit theme:
 * Directional gradients flow from bottom-left to top-right on the left,
 * and bottom-right to top-left on the right, occluding the background dot grid
 * with a solid opaque card surface.
 */
const SECTION_EDITORIAL_THEMES = [
  {
    // Chapter 01: Collapsed Nodes (Conduit: Amber / REPLACE CASCADE)
    color: "amber",
    rgb: "245, 158, 11",
    badgeBg: "bg-amber-500/10",
    badgeText: "text-amber-700 dark:text-amber-400 font-bold",
    badgeBorder: "border-amber-500/30",
    pinBg: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    cardBorderHover: "hover:border-amber-500/40",
    ctaHoverText: "hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-500/40",
  },
  {
    // Chapter 02: Blast Radius (Conduit: Sky / IN-PLACE UPDATE)
    color: "sky",
    rgb: "14, 165, 233",
    badgeBg: "bg-sky-500/10",
    badgeText: "text-sky-700 dark:text-sky-400 font-bold",
    badgeBorder: "border-sky-500/30",
    pinBg: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
    cardBorderHover: "hover:border-sky-500/40",
    ctaHoverText: "hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-500/40",
  },
  {
    // Chapter 03: Resource Diff (Conduit: Emerald / CREATION AUDIT)
    color: "emerald",
    rgb: "16, 185, 129",
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-700 dark:text-emerald-400 font-bold",
    badgeBorder: "border-emerald-500/30",
    pinBg: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    cardBorderHover: "hover:border-emerald-500/40",
    ctaHoverText: "hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40",
  },
  {
    // Chapter 04: Color Grading (Conduit: Purple / LINEAGE INSPECT)
    color: "purple",
    rgb: "168, 85, 247",
    badgeBg: "bg-purple-500/10",
    badgeText: "text-purple-700 dark:text-purple-400 font-bold",
    badgeBorder: "border-purple-500/30",
    pinBg: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
    cardBorderHover: "hover:border-purple-500/40",
    ctaHoverText: "hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-500/40",
  },
  {
    // Chapter 05: Resource Panel (Conduit: Cyan / INGESTION STREAM)
    color: "cyan",
    rgb: "6, 182, 212",
    badgeBg: "bg-cyan-500/10",
    badgeText: "text-cyan-700 dark:text-cyan-400 font-bold",
    badgeBorder: "border-cyan-500/30",
    pinBg: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
    cardBorderHover: "hover:border-cyan-500/40",
    ctaHoverText: "hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-500/40",
  },
  {
    // Chapter 06: Workbench Sidebar (Conduit: Indigo / WORKSTATION CLI)
    color: "indigo",
    rgb: "99, 102, 241",
    badgeBg: "bg-indigo-500/10",
    badgeText: "text-indigo-700 dark:text-indigo-400 font-bold",
    badgeBorder: "border-indigo-500/30",
    pinBg: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
    cardBorderHover: "hover:border-indigo-500/40",
    ctaHoverText: "hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500/40",
  },
  {
    // Chapter 07: Workstation Tools (Closing Terminal Node / Action Teardown)
    color: "rose",
    rgb: "244, 63, 94",
    badgeBg: "bg-rose-500/10",
    badgeText: "text-rose-700 dark:text-rose-400 font-bold",
    badgeBorder: "border-rose-500/30",
    pinBg: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
    cardBorderHover: "hover:border-rose-500/40",
    ctaHoverText: "hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-500/40",
  },
];

/**
 * Connecting conduit component between two deep dive rows.
 * Implements the brand logo's signature curved tube track:
 * - Outer casing: Dark workbench casing track
 * - Inner core: Dashed animated pulse conduit
 * - Midpoint action node badge with semantic symbol (+, -, ~, ±, ⇲)
 * - Responsive: S-curve across columns on desktop, straight spine on mobile
 */
function FlowConduit({ transition, isEvenToOdd, index, hasDynamicPath }) {
  // isEvenToOdd: true = from right column (~71%) to left column (~29%)
  // false = from left column (~29%) to right column (~71%)
  const startX = isEvenToOdd ? 710 : 290;
  const endX = isEvenToOdd ? 290 : 710;

  // Extended fallback SVG curved path (visible when dynamic path is not yet computed, e.g. SSR)
  const pathD = isEvenToOdd
    ? "M 710 -40 V 30 C 710 54, 690 60, 665 60 H 335 C 310 60, 290 66, 290 90 V 160"
    : "M 290 -40 V 30 C 290 54, 310 60, 335 60 H 665 C 690 60, 710 66, 710 90 V 160";

  return (
    <div className="relative w-full h-24 sm:h-28 lg:h-32 flex items-center justify-center select-none overflow-visible">
      {/* Desktop Curved Flow (Fallback for SSR / before mount) */}
      {!hasDynamicPath && (
        <div className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none overflow-visible">
          <svg
            viewBox="0 0 1000 120"
            fill="none"
            preserveAspectRatio="none"
            className="w-full h-full overflow-visible"
          >
            {/* Outer Casing Track (Dark obsidian / slate casing from BrandLogo) */}
            <path
              d={pathD}
              fill="none"
              className="stroke-[#1F2638] dark:stroke-[#1F2638] light:stroke-[#CBD5E1]"
              strokeWidth="16"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Intermediate Track Border Outline */}
            <path
              d={pathD}
              fill="none"
              className="stroke-[#3B4861] dark:stroke-[#3B4861] light:stroke-[#94A3B8]"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
            />
            {/* Inner Glowing Conduit Wire (Animated Dashed Pulse) */}
            <path
              d={pathD}
              fill="none"
              stroke={transition.strokeColor}
              strokeWidth="2.5"
              strokeDasharray="8 8"
              strokeLinecap="round"
              className="animate-flow-pulse"
            />
          </svg>
        </div>
      )}

      {/* Mobile & Tablet Vertical Center Spine (< lg) */}
      <div className="lg:hidden absolute -top-4 -bottom-4 inset-x-0 flex items-center justify-center pointer-events-none">
        <div className="h-full w-4 bg-[#1F2638] dark:bg-[#1F2638] light:bg-[#CBD5E1] rounded-full flex items-center justify-center">
          <div
            className="h-full w-0.5 border-l-2 border-dashed animate-flow-pulse"
            style={{ borderColor: transition.strokeColor }}
          />
        </div>
      </div>

      {/* Center Action Node Badge (Embedded on the Conduit) */}
      <div
        id={`transition-badge-${index}`}
        className="relative z-20 flex flex-col items-center pt-4"
      >
        <div
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full border ${transition.badgeBorder} bg-workbench-panel dark:bg-[#0C0E14] light:bg-white shadow-lg transition-transform hover:scale-105 cursor-default`}
          style={{
            boxShadow: `0 0 16px ${transition.glowColor}`,
          }}
        >
          {/* Action Node Circular Token */}
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-extrabold border ${transition.badgeBorder} ${transition.badgeBg} ${transition.badgeText}`}
          >
            {transition.symbol}
          </span>

          {/* Action Transition Title */}
          <span className="font-mono text-[11px] font-extrabold tracking-wider text-slate-900 dark:text-slate-100 uppercase">
            {transition.actionName}
          </span>
        </div>

        {/* Micro Sub-label */}
        <span className="hidden sm:inline-block mt-1 font-mono text-[10px] text-slate-700 dark:text-slate-300 font-semibold bg-slate-100 dark:bg-workbench-bg/90 px-2 py-0.5 rounded border border-slate-300 dark:border-workbench-border/60">
          {transition.description}
        </span>
      </div>
    </div>
  );
}

/**
 * Workstation Viewport Frame:
 * Visual aid card embedding the high-DPI vector SVG diagram inside an authentic IDE canvas.
 * Now equipped with top and bottom docking ports for seamless pipeline conduit connectivity.
 */
function WorkstationViewport({
  feature,
  index,
  isLeftOnDesktop,
  showTopPort,
  showBottomPort,
  topTransition,
  bottomTransition,
}) {
  return (
    <div
      className={`relative group rounded-2xl border border-slate-200 dark:border-workbench-border bg-white dark:bg-[#0C0E15] shadow-xl hover:shadow-2xl hover:border-sky-500/40 transition-all duration-300 w-full max-w-[94%] mx-auto ${
        isLeftOnDesktop ? "lg:mr-auto lg:ml-0" : "lg:ml-auto lg:mr-0"
      }`}
    >
      {/* Top Connector Port (Dock Node) */}
      {showTopPort && (
        <div
          id={`viewport-dock-top-${index}`}
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex items-center justify-center pointer-events-none"
        >
          <span
            className="absolute w-5 h-5 rounded-full animate-ping opacity-25"
            style={{ backgroundColor: topTransition?.strokeColor || "#38BDF8" }}
          />
          <span
            className="w-4 h-4 rounded-full border-2 bg-white dark:bg-[#0C0E15] shadow-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110"
            style={{
              borderColor: topTransition?.borderColor || "#38BDF8",
              boxShadow: `0 0 10px ${topTransition?.glowColor || "rgba(56,189,248,0.6)"}`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: topTransition?.strokeColor || "#38BDF8" }}
            />
          </span>
        </div>
      )}

      {/* Viewport macOS/IDE Window Header */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-t-2xl border-b border-slate-200 dark:border-workbench-border/70 bg-slate-100 dark:bg-[#161B26] text-xs font-mono select-none">
        {/* Window controls & file path */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="ml-2 text-[11px] text-slate-700 dark:text-slate-400 font-bold truncate max-w-[160px] sm:max-w-[240px]">
            {feature.slug}.hcl • dag.viewport
          </span>
        </div>

        {/* Live Canvas Beacon & Hotkey */}
        <div className="flex items-center space-x-2">
          <span className="hidden sm:inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>DAG CANVAS</span>
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-workbench-bg border border-slate-300 dark:border-workbench-border text-slate-900 dark:text-slate-200">
            [{feature.hotkey}]
          </span>
        </div>
      </div>

      {/* Viewport Canvas Body (100% Solid Background, Zero Dots) */}
      <div className="relative aspect-[16/9] w-full rounded-b-2xl overflow-hidden bg-[#F8FAFC] dark:bg-[#090A0F] flex items-center justify-center">
        {/* Clean, Focused Visual Aid (Zero Numbered Pins, Minimal Overwhelm) */}
        <div className="relative z-10 w-full h-full p-2 sm:p-4 transition-transform duration-500 group-hover:scale-[1.01] flex items-center justify-center">
          <FeatureCleanVisual featureId={feature.id} />
        </div>

        {/* Floating Canvas Controls (Zoom In, Zoom Out, Fit) in corner */}
        <div className="absolute bottom-3 right-3 z-20 flex flex-col rounded-lg border border-slate-200 dark:border-workbench-border/80 bg-white dark:bg-[#0C0E14] shadow-md text-slate-500 dark:text-slate-400 text-xs font-mono overflow-hidden">
          <button
            type="button"
            title="Zoom In"
            className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-workbench-hover hover:text-sky-600 dark:hover:text-sky-400 transition-colors border-b border-slate-200 dark:border-workbench-border/60"
          >
            +
          </button>
          <button
            type="button"
            title="Zoom Out"
            className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-workbench-hover hover:text-sky-600 dark:hover:text-sky-400 transition-colors border-b border-slate-200 dark:border-workbench-border/60"
          >
            −
          </button>
          <button
            type="button"
            title="Fit Viewport"
            className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-workbench-hover hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
          >
            ⛶
          </button>
        </div>
      </div>

      {/* Bottom Connector Port (Dock Node) */}
      {showBottomPort && (
        <div
          id={`viewport-dock-bottom-${index}`}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-30 flex items-center justify-center pointer-events-none"
        >
          <span
            className="absolute w-5 h-5 rounded-full animate-ping opacity-25"
            style={{ backgroundColor: bottomTransition?.strokeColor || "#38BDF8" }}
          />
          <span
            className="w-4 h-4 rounded-full border-2 bg-white dark:bg-[#0C0E15] shadow-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110"
            style={{
              borderColor: bottomTransition?.borderColor || "#38BDF8",
              boxShadow: `0 0 10px ${bottomTransition?.glowColor || "rgba(56,189,248,0.6)"}`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: bottomTransition?.strokeColor || "#38BDF8" }}
            />
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Editorial Column:
 * Contains the chapter index, title, problem statement, key metrics, and CTA.
 */
function FeatureEditorial({ feature, index, isLeftOnDesktop }) {
  const chapterNumber = String(index + 1).padStart(2, "0");
  const theme = SECTION_EDITORIAL_THEMES[index % SECTION_EDITORIAL_THEMES.length];
  const gradientClass = isLeftOnDesktop ? "editorial-gradient-tr" : "editorial-gradient-tl";

  return (
    <div
      className={`editorial-card relative rounded-2xl border border-slate-200/90 dark:border-workbench-border/80 ring-1 ring-inset ring-slate-900/5 dark:ring-white/[0.05] bg-white dark:bg-[#0C0E15] shadow-xl ${theme.cardBorderHover} overflow-hidden p-6 sm:p-8 flex flex-col justify-center space-y-4 w-full`}
      style={{
        "--theme-rgb": theme.rgb,
      }}
    >
      {/* Directional Conduit Solid Gradient Overlay (Occludes Canvas Dot Grid) */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${gradientClass}`}
        aria-hidden="true"
      />

      {/* Card Content (Relative z-10 for interactivity & sharp contrast) */}
      <div className="relative z-10 space-y-4">
        {/* Chapter Eyebrow & Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold ${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder}`}
          >
            CHAPTER {chapterNumber}
          </span>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-100 dark:bg-workbench-panel text-slate-700 dark:text-slate-300 light:text-slate-800 border border-slate-200 dark:border-workbench-border">
            {feature.badge}
          </span>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 dark:bg-[#161B26] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-workbench-border">
            Hotkey: [{feature.hotkey}]
          </span>
        </div>

        {/* Section Title */}
        <h3 className="text-2xl sm:text-3xl font-bold light:font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-snug">
          {feature.title}
        </h3>

        {/* Core Tagline / Value Proposition */}
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 light:text-slate-800 light:font-medium leading-relaxed">
          {feature.tagline}
        </p>

        {/* Specific Callout Highlights */}
        {feature.callouts && feature.callouts.length > 0 && (
          <ul className="space-y-2 pt-1 font-sans">
            {feature.callouts.slice(0, 3).map((callout) => (
              <li
                key={callout.pin}
                className="flex items-start space-x-2 text-[13px] text-slate-700 dark:text-slate-300 light:text-slate-700 light:font-medium leading-relaxed"
              >
                <span
                  className={`mt-0.5 w-4 h-4 rounded-full ${theme.pinBg} font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border`}
                >
                  {callout.pin}
                </span>
                <span>
                  <strong className="text-slate-900 dark:text-slate-100 font-bold">
                    {callout.title}:
                  </strong>{" "}
                  {callout.description}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* CTA Button */}
        <div className="pt-2">
          <Link
            href={`/features/${feature.slug}/`}
            className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg border border-slate-200 dark:border-workbench-border bg-slate-50 dark:bg-workbench-panel hover:bg-slate-100 dark:hover:bg-workbench-hover text-slate-800 dark:text-slate-200 ${theme.ctaHoverText} text-xs sm:text-sm font-semibold light:font-bold transition-all shadow-xs group`}
          >
            <span>Explore Chapter Specification</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Main FeatureFlowSection:
 * Replaces the static 3x2 card grid with an alternating, connected DAG pipeline flow.
 */
export default function FeatureFlowSection() {
  const pipelineRef = useRef(null);
  const [conduitPaths, setConduitPaths] = useState([]);
  const [isMounted, setIsMounted] = useState(false);

  const updatePaths = useCallback(() => {
    if (!pipelineRef.current) return;
    const containerRect = pipelineRef.current.getBoundingClientRect();

    const newPaths = [];
    for (let i = 0; i < FEATURES.length - 1; i++) {
      const fromEl = document.getElementById(`viewport-dock-bottom-${i}`);
      const toEl = document.getElementById(`viewport-dock-top-${i + 1}`);
      const badgeEl = document.getElementById(`transition-badge-${i}`);

      if (fromEl && toEl) {
        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();

        const startX = fromRect.left + fromRect.width / 2 - containerRect.left;
        const startY = fromRect.top + fromRect.height / 2 - containerRect.top;

        const endX = toRect.left + toRect.width / 2 - containerRect.left;
        const endY = toRect.top + toRect.height / 2 - containerRect.top;

        let midY;
        if (badgeEl) {
          const badgeRect = badgeEl.getBoundingClientRect();
          midY = badgeRect.top + badgeRect.height / 2 - containerRect.top;
        } else {
          midY = (startY + endY) / 2;
        }

        const isRightToLeft = startX > endX;
        const dx = Math.abs(endX - startX);

        // Radius for smooth elbows
        const r = Math.min(
          32,
          Math.max(12, dx / 4),
          Math.max(8, (midY - startY) * 0.7),
          Math.max(8, (endY - midY) * 0.7)
        );
        const dir = isRightToLeft ? -1 : 1;

        let d = "";
        if (dx < 30) {
          d = `M ${startX} ${startY} V ${endY}`;
        } else {
          d =
            `M ${startX} ${startY} ` +
            `V ${midY - r} ` +
            `C ${startX} ${midY - r * 0.45}, ${startX + dir * r * 0.45} ${midY}, ${startX + dir * r} ${midY} ` +
            `H ${endX - dir * r} ` +
            `C ${endX - dir * r * 0.45} ${midY}, ${endX} ${midY + r * 0.45}, ${endX} ${midY + r} ` +
            `V ${endY}`;
        }

        newPaths.push({
          index: i,
          transition: FLOW_TRANSITIONS[i],
          d,
          startX,
          startY,
          endX,
          endY,
          midY,
        });
      }
    }
    setConduitPaths(newPaths);
  }, []);

  useEffect(() => {
    setIsMounted(true);
    updatePaths();

    let ro = null;
    if (typeof ResizeObserver !== "undefined" && pipelineRef.current) {
      ro = new ResizeObserver(() => {
        updatePaths();
      });
      ro.observe(pipelineRef.current);
    }

    const handleResize = () => {
      updatePaths();
    };

    window.addEventListener("resize", handleResize);

    if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        updatePaths();
      });
    }

    const timer1 = setTimeout(updatePaths, 100);
    const timer2 = setTimeout(updatePaths, 500);

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [updatePaths]);

  return (
    <section className="pt-8 relative" id="features">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-sky-500/20 bg-sky-500/10 font-mono text-xs uppercase tracking-wider text-sky-500 dark:text-sky-400 light:text-sky-700 light:font-bold mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
          <span>Living Infrastructure Pipeline</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-bold light:font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Dedicated Architectural Deep-Dives
        </h2>
        <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 light:text-slate-800 light:font-medium leading-relaxed">
          Every core capability of plan-parse is documented with interactive visual viewports, real Terraform plan fixtures, and algorithmic graph contractions.
        </p>
      </div>

      {/* Connected Flow Pipeline */}
      <div className="relative" ref={pipelineRef}>
        {/* Dynamic Exact Pipeline SVG Layer (Desktop) */}
        {isMounted && conduitPaths.length > 0 && (
          <svg
            className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible"
            fill="none"
            aria-hidden="true"
          >
            {conduitPaths.map((item) => (
              <g key={item.index} fill="none">
                {/* Outer Casing Track */}
                <path
                  d={item.d}
                  fill="none"
                  className="stroke-[#1F2638] dark:stroke-[#1F2638] light:stroke-[#CBD5E1]"
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Intermediate Track Border Outline */}
                <path
                  d={item.d}
                  fill="none"
                  className="stroke-[#3B4861] dark:stroke-[#3B4861] light:stroke-[#94A3B8]"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.8"
                />
                {/* Inner Glowing Conduit Wire (Animated Dashed Pulse) */}
                <path
                  d={item.d}
                  fill="none"
                  stroke={item.transition.strokeColor}
                  strokeWidth="2.5"
                  strokeDasharray="8 8"
                  strokeLinecap="round"
                  className="animate-flow-pulse"
                />
              </g>
            ))}
          </svg>
        )}

        <div className="space-y-4">
          {FEATURES.map((feature, idx) => {
            // Alternating layout: even indices have Editorial on Left & Viewport on Right;
            // odd indices have Viewport on Left & Editorial on Right.
            const isEven = idx % 2 === 0;
            const transition = idx < FEATURES.length - 1 ? FLOW_TRANSITIONS[idx] : null;

            return (
              <div key={feature.id} className="relative">
                {/* Feature Row Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                  {isEven ? (
                    <>
                      {/* Left: Editorial (Cols 1-5) */}
                      <div className="lg:col-span-5 order-2 lg:order-1">
                        <FeatureEditorial feature={feature} index={idx} isLeftOnDesktop={true} />
                      </div>
                      {/* Right: Viewport Card (Cols 6-12) */}
                      <div className="lg:col-span-7 order-1 lg:order-2">
                        <WorkstationViewport
                          feature={feature}
                          index={idx}
                          isLeftOnDesktop={false}
                          showTopPort={idx > 0}
                          showBottomPort={idx < FEATURES.length - 1}
                          topTransition={idx > 0 ? FLOW_TRANSITIONS[idx - 1] : null}
                          bottomTransition={idx < FEATURES.length - 1 ? FLOW_TRANSITIONS[idx] : null}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Left: Viewport Card (Cols 1-7) */}
                      <div className="lg:col-span-7 order-1">
                        <WorkstationViewport
                          feature={feature}
                          index={idx}
                          isLeftOnDesktop={true}
                          showTopPort={idx > 0}
                          showBottomPort={idx < FEATURES.length - 1}
                          topTransition={idx > 0 ? FLOW_TRANSITIONS[idx - 1] : null}
                          bottomTransition={idx < FEATURES.length - 1 ? FLOW_TRANSITIONS[idx] : null}
                        />
                      </div>
                      {/* Right: Editorial (Cols 8-12) */}
                      <div className="lg:col-span-5 order-2">
                        <FeatureEditorial feature={feature} index={idx} isLeftOnDesktop={false} />
                      </div>
                    </>
                  )}
                </div>

                {/* Connecting Flow Conduit to Next Step */}
                {transition && (
                  <FlowConduit
                    transition={transition}
                    isEvenToOdd={isEven}
                    index={idx}
                    hasDynamicPath={isMounted && conduitPaths.length > 0}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
