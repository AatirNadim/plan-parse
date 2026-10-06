"use client";

import React from "react";

/**
 * HeroConduits: Precision architectural data conduits connecting the
 * Hero DAG Engine Core logo with the outer dotted canvas grid.
 *
 * Architecture:
 * - 2 Incoming streams on the left (AST Code & State Schema) flowing INWARD to the logo gutter.
 * - 3 Outgoing streams on the right (Update, Create, Replace) flowing OUTWARD from the DAG engine.
 * - Compact balanced lengths with smooth SVG luminance gradient masks dissolving into the dot grid.
 * - 3-tier conduit structure: 12px obsidian casing, 6px track outline, 2px animated pulse wire.
 */
export default function HeroConduits({ className = "" }) {
  // --- INCOMING CONDUIT PATHS (Left: Canvas -> Logo Pedestal x=158) ---
  // Drawn from left to right so animate-flow-pulse moves inward toward the logo
  // 1. In-1: AST Code Stream (Indigo)
  const inAstD = "M -50 130 C 10 142, 70 160, 158 176";
  // 2. In-2: State Schema Stream (Sky)
  const inSchemaD = "M -55 275 C 10 265, 70 252, 158 240";

  // --- OUTGOING CONDUIT PATHS (Right: Logo Pedestal x=302 -> Canvas) ---
  // Drawn from logo to outer canvas (compact length: ~65-75px past card x=460)
  // 1. Out-1: Sky trace (Update ~)
  const outSkyD = "M 302 176 C 362 176, 420 132, 460 110 C 484 98, 502 96, 525 96";
  // 2. Out-2: Emerald trace (Create +)
  const outEmeraldD = "M 302 218 C 362 218, 420 218, 460 218 H 535";
  // 3. Out-3: Amber trace (Replace ±)
  const outAmberD = "M 302 260 C 362 260, 420 295, 460 315 C 484 326, 504 332, 525 335";

  return (
    <svg
      viewBox="0 0 460 440"
      fill="none"
      aria-hidden="true"
      className={`absolute inset-0 w-full h-full pointer-events-none select-none overflow-visible z-20 ${className}`}
    >
      <defs>
        {/* --- INCOMING FADE MASKS (Fade in from canvas: transparent -> white at logo) --- */}
        <linearGradient
          id="hero-conduit-fade-in-ast"
          x1="-50"
          y1="130"
          x2="158"
          y2="176"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#000000" stopOpacity="0" />
          <stop offset="38%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="65%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
        </linearGradient>

        <linearGradient
          id="hero-conduit-fade-in-schema"
          x1="-55"
          y1="275"
          x2="158"
          y2="240"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#000000" stopOpacity="0" />
          <stop offset="38%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="65%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
        </linearGradient>

        {/* --- OUTGOING FADE MASKS (Fade out to canvas: white at logo -> transparent at canvas) --- */}
        <linearGradient
          id="hero-conduit-fade-out-sky"
          x1="302"
          y1="176"
          x2="525"
          y2="96"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="82%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </linearGradient>

        <linearGradient
          id="hero-conduit-fade-out-emerald"
          x1="302"
          y1="218"
          x2="535"
          y2="218"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="58%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="84%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </linearGradient>

        <linearGradient
          id="hero-conduit-fade-out-amber"
          x1="302"
          y1="260"
          x2="525"
          y2="335"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="82%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </linearGradient>

        {/* --- MASKS WITH EXTENDED BOUNDS (x=-100 to 750) --- */}
        <mask id="hero-mask-in-ast" maskUnits="userSpaceOnUse" x="-100" y="0" width="850" height="500">
          <path d={inAstD} stroke="url(#hero-conduit-fade-in-ast)" strokeWidth="28" strokeLinecap="round" fill="none" />
        </mask>

        <mask id="hero-mask-in-schema" maskUnits="userSpaceOnUse" x="-100" y="0" width="850" height="500">
          <path d={inSchemaD} stroke="url(#hero-conduit-fade-in-schema)" strokeWidth="28" strokeLinecap="round" fill="none" />
        </mask>

        <mask id="hero-mask-out-sky" maskUnits="userSpaceOnUse" x="-100" y="0" width="850" height="500">
          <path d={outSkyD} stroke="url(#hero-conduit-fade-out-sky)" strokeWidth="28" strokeLinecap="round" fill="none" />
        </mask>

        <mask id="hero-mask-out-emerald" maskUnits="userSpaceOnUse" x="-100" y="0" width="850" height="500">
          <path d={outEmeraldD} stroke="url(#hero-conduit-fade-out-emerald)" strokeWidth="28" strokeLinecap="round" fill="none" />
        </mask>

        <mask id="hero-mask-out-amber" maskUnits="userSpaceOnUse" x="-100" y="0" width="850" height="500">
          <path d={outAmberD} stroke="url(#hero-conduit-fade-out-amber)" strokeWidth="28" strokeLinecap="round" fill="none" />
        </mask>
      </defs>

      {/* ======================================================== */}
      {/* 1. INCOMING CONDUITS (LEFT: FEEDING INTO CODE GUTTER)    */}
      {/* ======================================================== */}

      {/* IN-1: AST CODE STREAM (INDIGO) */}
      <g mask="url(#hero-mask-in-ast)">
        <path
          d={inAstD}
          fill="none"
          className="stroke-[#1F2638] dark:stroke-[#1F2638] light:stroke-[#CBD5E1]"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={inAstD}
          fill="none"
          className="stroke-[#3B4861] dark:stroke-[#3B4861] light:stroke-[#94A3B8]"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />
        <path
          d={inAstD}
          fill="none"
          strokeWidth="2"
          strokeDasharray="8 8"
          strokeLinecap="round"
          className="stroke-[#6366F1] light:stroke-[#4F46E5] animate-flow-pulse motion-reduce:animate-none"
        />
      </g>

      {/* IN-2: PLAN STATE SCHEMA STREAM (SKY) */}
      <g mask="url(#hero-mask-in-schema)">
        <path
          d={inSchemaD}
          fill="none"
          className="stroke-[#1F2638] dark:stroke-[#1F2638] light:stroke-[#CBD5E1]"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={inSchemaD}
          fill="none"
          className="stroke-[#3B4861] dark:stroke-[#3B4861] light:stroke-[#94A3B8]"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />
        <path
          d={inSchemaD}
          fill="none"
          strokeWidth="2"
          strokeDasharray="8 8"
          strokeLinecap="round"
          className="stroke-[#38BDF8] light:stroke-[#0284C7] animate-flow-pulse motion-reduce:animate-none"
        />
      </g>

      {/* ======================================================== */}
      {/* 2. OUTGOING CONDUITS (RIGHT: RADIATING FROM DAG ENGINE)  */}
      {/* ======================================================== */}

      {/* OUT-1: SKY TRACE (UPDATE ~ ACTION) */}
      <g mask="url(#hero-mask-out-sky)">
        <path
          d={outSkyD}
          fill="none"
          className="stroke-[#1F2638] dark:stroke-[#1F2638] light:stroke-[#CBD5E1]"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={outSkyD}
          fill="none"
          className="stroke-[#3B4861] dark:stroke-[#3B4861] light:stroke-[#94A3B8]"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />
        <path
          d={outSkyD}
          fill="none"
          strokeWidth="2"
          strokeDasharray="8 8"
          strokeLinecap="round"
          className="stroke-[#38BDF8] light:stroke-[#0284C7] animate-flow-pulse motion-reduce:animate-none"
        />
      </g>

      {/* OUT-2: EMERALD TRACE (CREATE + ACTION) */}
      <g mask="url(#hero-mask-out-emerald)">
        <path
          d={outEmeraldD}
          fill="none"
          className="stroke-[#1F2638] dark:stroke-[#1F2638] light:stroke-[#CBD5E1]"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={outEmeraldD}
          fill="none"
          className="stroke-[#3B4861] dark:stroke-[#3B4861] light:stroke-[#94A3B8]"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />
        <path
          d={outEmeraldD}
          fill="none"
          strokeWidth="2"
          strokeDasharray="8 8"
          strokeLinecap="round"
          className="stroke-[#10B981] light:stroke-[#059669] animate-flow-pulse motion-reduce:animate-none"
        />
      </g>

      {/* OUT-3: AMBER TRACE (REPLACE ± ACTION) */}
      <g mask="url(#hero-mask-out-amber)">
        <path
          d={outAmberD}
          fill="none"
          className="stroke-[#1F2638] dark:stroke-[#1F2638] light:stroke-[#CBD5E1]"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={outAmberD}
          fill="none"
          className="stroke-[#3B4861] dark:stroke-[#3B4861] light:stroke-[#94A3B8]"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />
        <path
          d={outAmberD}
          fill="none"
          strokeWidth="2"
          strokeDasharray="8 8"
          strokeLinecap="round"
          className="stroke-[#F59E0B] light:stroke-[#D97706] animate-flow-pulse motion-reduce:animate-none"
        />
      </g>

      {/* ======================================================== */}
      {/* 3. DOCKING BUS SOCKET PORTS AT LOGO PEDESTAL MARGINS     */}
      {/* ======================================================== */}
      <g className="opacity-90 group-hover:opacity-100 transition-opacity duration-300">
        {/* --- INCOMING PORTS (LEFT MARGIN: x=158) --- */}
        {/* AST Ingestion Port (Indigo) */}
        <circle
          cx="158"
          cy="176"
          r="5"
          className="fill-[#090A0F] dark:fill-[#090A0F] light:fill-white stroke-[#6366F1] light:stroke-[#4F46E5]"
          strokeWidth="1.75"
        />
        <circle
          cx="158"
          cy="176"
          r="2"
          className="fill-[#6366F1] light:fill-[#4F46E5] animate-pulse motion-reduce:animate-none"
        />

        {/* Schema Ingestion Port (Sky) */}
        <circle
          cx="158"
          cy="240"
          r="5"
          className="fill-[#090A0F] dark:fill-[#090A0F] light:fill-white stroke-[#38BDF8] light:stroke-[#0284C7]"
          strokeWidth="1.75"
        />
        <circle
          cx="158"
          cy="240"
          r="2"
          className="fill-[#38BDF8] light:fill-[#0284C7] animate-pulse motion-reduce:animate-none"
        />

        {/* --- OUTGOING PORTS (RIGHT MARGIN: x=302) --- */}
        {/* Sky Emitter Port */}
        <circle
          cx="302"
          cy="176"
          r="5"
          className="fill-[#090A0F] dark:fill-[#090A0F] light:fill-white stroke-[#38BDF8] light:stroke-[#0284C7]"
          strokeWidth="1.75"
        />
        <circle
          cx="302"
          cy="176"
          r="2"
          className="fill-[#38BDF8] light:fill-[#0284C7] animate-pulse motion-reduce:animate-none"
        />

        {/* Emerald Emitter Port */}
        <circle
          cx="302"
          cy="218"
          r="5.5"
          className="fill-[#090A0F] dark:fill-[#090A0F] light:fill-white stroke-[#10B981] light:stroke-[#059669]"
          strokeWidth="2"
        />
        <circle
          cx="302"
          cy="218"
          r="2.2"
          className="fill-[#10B981] light:fill-[#059669] animate-pulse motion-reduce:animate-none"
        />

        {/* Amber Emitter Port */}
        <circle
          cx="302"
          cy="260"
          r="5"
          className="fill-[#090A0F] dark:fill-[#090A0F] light:fill-white stroke-[#F59E0B] light:stroke-[#D97706]"
          strokeWidth="1.75"
        />
        <circle
          cx="302"
          cy="260"
          r="2"
          className="fill-[#F59E0B] light:fill-[#D97706] animate-pulse motion-reduce:animate-none"
        />
      </g>
    </svg>
  );
}
