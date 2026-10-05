"use client";

import React from "react";
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
 * Connecting conduit component between two deep dive rows.
 * Implements the brand logo's signature curved tube track:
 * - Outer casing: Dark workbench casing track
 * - Inner core: Dashed animated pulse conduit
 * - Midpoint action node badge with semantic symbol (+, -, ~, ±, ⇲)
 * - Responsive: S-curve across columns on desktop, straight spine on mobile
 */
function FlowConduit({ transition, isEvenToOdd }) {
  // isEvenToOdd: true = from right column (~71%) to left column (~29%)
  // false = from left column (~29%) to right column (~71%)
  const startX = isEvenToOdd ? 710 : 290;
  const endX = isEvenToOdd ? 290 : 710;

  // SVG curved path: vertical drop -> smooth horizontal elbow -> crossbar -> smooth vertical elbow -> exit drop
  const pathD = isEvenToOdd
    ? "M 710 0 V 30 C 710 54, 690 60, 665 60 H 335 C 310 60, 290 66, 290 90 V 120"
    : "M 290 0 V 30 C 290 54, 310 60, 335 60 H 665 C 690 60, 710 66, 710 90 V 120";

  return (
    <div className="relative w-full h-24 sm:h-28 lg:h-32 my-1 flex items-center justify-center select-none">
      {/* Desktop Curved Flow (lg and above) */}
      <div className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none">
        <svg
          viewBox="0 0 1000 120"
          fill="none"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Outer Casing Track (Dark obsidian / slate casing from BrandLogo) */}
          <path
            d={pathD}
            className="stroke-[#1F2638] dark:stroke-[#1F2638] light:stroke-[#CBD5E1]"
            strokeWidth="16"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Intermediate Track Border Outline */}
          <path
            d={pathD}
            className="stroke-[#3B4861] dark:stroke-[#3B4861] light:stroke-[#94A3B8]"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.8"
          />
          {/* Inner Glowing Conduit Wire (Animated Dashed Pulse) */}
          <path
            d={pathD}
            stroke={transition.strokeColor}
            strokeWidth="2.5"
            strokeDasharray="8 8"
            strokeLinecap="round"
            className="animate-flow-pulse"
          />
        </svg>
      </div>

      {/* Mobile & Tablet Vertical Center Spine (< lg) */}
      <div className="lg:hidden absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="h-full w-4 bg-[#1F2638] dark:bg-[#1F2638] light:bg-[#CBD5E1] rounded-full flex items-center justify-center">
          <div
            className="h-full w-0.5 border-l-2 border-dashed animate-flow-pulse"
            style={{ borderColor: transition.strokeColor }}
          />
        </div>
      </div>

      {/* Center Action Node Badge (Embedded on the Conduit) */}
      <div className="relative z-10 flex flex-col items-center">
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
 */
function WorkstationViewport({ feature, isLeftOnDesktop }) {
  return (
    <div
      className={`relative group rounded-2xl border border-workbench-border bg-workbench-panel dark:bg-[#0C0E15] light:bg-white shadow-xl hover:shadow-2xl hover:border-sky-500/40 transition-all duration-300 overflow-hidden w-full max-w-[90%] mx-auto ${
        isLeftOnDesktop ? "lg:mr-auto lg:ml-0" : "lg:ml-auto lg:mr-0"
      }`}
    >
      {/* Viewport macOS/IDE Window Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-workbench-border/70 bg-workbench-subpanel dark:bg-[#161B26] light:bg-[#F1F5F9] text-xs font-mono select-none">
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
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-workbench-bg border border-slate-300 dark:border-workbench-border text-slate-900 dark:text-slate-200">
            [{feature.hotkey}]
          </span>
        </div>
      </div>

      {/* Viewport Canvas Body with Dot Grid & Embedded Vector Graphic */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#090A0F] dark:bg-[#090A0F] light:bg-[#F8FAFC] flex items-center justify-center">
        {/* Precise Dot Grid Matrix */}
        <div
          className="absolute inset-0 opacity-40 dark:opacity-30 light:opacity-40 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #3B4861 1.2px, transparent 1.2px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* Clean, Focused Visual Aid (Zero Numbered Pins, Minimal Overwhelm) */}
        <div className="relative z-10 w-full h-full p-2 sm:p-4 transition-transform duration-500 group-hover:scale-[1.01] flex items-center justify-center">
          <FeatureCleanVisual featureId={feature.id} />
        </div>

        {/* Floating Canvas Controls (Zoom In, Zoom Out, Fit) in corner */}
        <div className="absolute bottom-3 right-3 z-20 flex flex-col rounded-lg border border-workbench-border/80 bg-workbench-panel dark:bg-[#0C0E14] light:bg-white shadow-md text-slate-400 dark:text-slate-400 light:text-slate-600 text-xs font-mono overflow-hidden">
          <button
            type="button"
            title="Zoom In"
            className="w-7 h-7 flex items-center justify-center hover:bg-workbench-hover hover:text-sky-600 dark:hover:text-sky-400 transition-colors border-b border-workbench-border/60"
          >
            +
          </button>
          <button
            type="button"
            title="Zoom Out"
            className="w-7 h-7 flex items-center justify-center hover:bg-workbench-hover hover:text-sky-600 dark:hover:text-sky-400 transition-colors border-b border-workbench-border/60"
          >
            −
          </button>
          <button
            type="button"
            title="Fit Viewport"
            className="w-7 h-7 flex items-center justify-center hover:bg-workbench-hover hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
          >
            ⛶
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Editorial Column:
 * Contains the chapter index, title, problem statement, key metrics, and CTA.
 */
function FeatureEditorial({ feature, index }) {
  const chapterNumber = String(index + 1).padStart(2, "0");

  return (
    <div className="flex flex-col justify-center space-y-4">
      {/* Chapter Eyebrow & Badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 light:text-sky-700 border border-sky-500/20">
          CHAPTER {chapterNumber}
        </span>
        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-workbench-panel text-slate-700 dark:text-slate-300 light:text-slate-800 border border-workbench-border">
          {feature.badge}
        </span>
        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 dark:bg-[#161B26] text-slate-600 dark:text-slate-400 border border-workbench-border">
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
              className="flex items-start space-x-2 text-xs text-slate-700 dark:text-slate-300 light:text-slate-900 light:font-medium leading-relaxed"
            >
              <span className="mt-0.5 w-4 h-4 rounded-full bg-sky-500/15 text-sky-500 dark:text-sky-400 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border border-sky-500/30">
                {callout.pin}
              </span>
              <span>
                <strong className="text-slate-900 dark:text-slate-100 font-semibold">
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
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg border border-workbench-border bg-workbench-panel hover:bg-workbench-hover text-slate-800 dark:text-slate-200 hover:text-sky-500 dark:hover:text-sky-400 text-xs sm:text-sm font-semibold light:font-bold transition-all shadow-xs hover:border-sky-500/40 group"
        >
          <span>Explore Chapter Specification</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>
    </div>
  );
}

/**
 * Main FeatureFlowSection:
 * Replaces the static 3x2 card grid with an alternating, connected DAG pipeline flow.
 */
export default function FeatureFlowSection() {
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
                      <FeatureEditorial feature={feature} index={idx} />
                    </div>
                    {/* Right: Viewport Card (Cols 6-12) */}
                    <div className="lg:col-span-7 order-1 lg:order-2">
                      <WorkstationViewport feature={feature} isLeftOnDesktop={false} />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Left: Viewport Card (Cols 1-7) */}
                    <div className="lg:col-span-7 order-1">
                      <WorkstationViewport feature={feature} isLeftOnDesktop={true} />
                    </div>
                    {/* Right: Editorial (Cols 8-12) */}
                    <div className="lg:col-span-5 order-2">
                      <FeatureEditorial feature={feature} index={idx} />
                    </div>
                  </>
                )}
              </div>

              {/* Connecting Flow Conduit to Next Step */}
              {transition && (
                <FlowConduit
                  transition={transition}
                  isEvenToOdd={isEven}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
