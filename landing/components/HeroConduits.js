"use client";

import React from "react";

/**
 * HeroConduits: Precision architectural outgoing conduits connecting the
 * Hero DAG Engine Core logo to the outer dotted canvas grid.
 *
 * Reuses the 3-tier conduit design language from the deep dive pipeline:
 * 1. Dark obsidian / slate outer casing
 * 2. Intermediate track border outline
 * 3. Neon animated pulse wire (Sky, Emerald, Amber)
 *
 * Uses SVG luminance gradient masks with generous coordinate bounds so
 * outgoing connection lines seamlessly dissolve into the dotted background canvas
 * without terminating at any node.
 */
export default function HeroConduits({ className = "" }) {
  // Path trajectories originating at the logo pedestal right edge (x=302)
  // and radiating outward past the card boundary (x=460) into the dotted canvas grid:

  // 1. Sky trace (Update ~): curves up & right into the canvas grid
  const skyD = "M 302 176 C 352 176, 388 128, 436 100 C 476 76, 524 64, 610 52";

  // 2. Emerald trace (Create +): sweeps horizontally right across the card chassis
  const emeraldD = "M 302 218 C 362 218, 410 218, 452 222 C 488 226, 532 232, 640 232";

  // 3. Amber trace (Replace ±): curves down & right toward the lower canvas margin
  const amberD = "M 302 260 C 352 260, 396 304, 438 334 C 476 360, 520 380, 596 394";

  return (
    <svg
      viewBox="0 0 460 440"
      fill="none"
      aria-hidden="true"
      className={`absolute inset-0 w-full h-full pointer-events-none select-none overflow-visible z-20 ${className}`}
    >
      <defs>
        {/* Sky fade mask gradient: starts at x=302, y=176 -> dissolves towards x=610, y=52 */}
        <linearGradient
          id="hero-banner-conduit-fade-sky"
          x1="302"
          y1="176"
          x2="610"
          y2="52"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="42%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="76%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </linearGradient>

        {/* Emerald fade mask gradient: starts at x=302, y=218 -> dissolves towards x=640, y=232 */}
        <linearGradient
          id="hero-banner-conduit-fade-emerald"
          x1="302"
          y1="218"
          x2="640"
          y2="232"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="78%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </linearGradient>

        {/* Amber fade mask gradient: starts at x=302, y=260 -> dissolves towards x=596, y=394 */}
        <linearGradient
          id="hero-banner-conduit-fade-amber"
          x1="302"
          y1="260"
          x2="596"
          y2="394"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="42%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="76%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </linearGradient>

        {/* Masks with explicit viewport bounds to prevent userSpaceOnUse clipping past x=506 */}
        <mask
          id="hero-conduit-mask-sky"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="800"
          height="500"
        >
          <path
            d={skyD}
            stroke="url(#hero-banner-conduit-fade-sky)"
            strokeWidth="28"
            strokeLinecap="round"
            fill="none"
          />
        </mask>

        <mask
          id="hero-conduit-mask-emerald"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="800"
          height="500"
        >
          <path
            d={emeraldD}
            stroke="url(#hero-banner-conduit-fade-emerald)"
            strokeWidth="28"
            strokeLinecap="round"
            fill="none"
          />
        </mask>

        <mask
          id="hero-conduit-mask-amber"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="800"
          height="500"
        >
          <path
            d={amberD}
            stroke="url(#hero-banner-conduit-fade-amber)"
            strokeWidth="28"
            strokeLinecap="round"
            fill="none"
          />
        </mask>
      </defs>

      {/* 1. SKY TRACE (UPDATE ~ ACTION) */}
      <g mask="url(#hero-conduit-mask-sky)">
        {/* Outer Casing */}
        <path
          d={skyD}
          fill="none"
          className="stroke-[#1F2638] dark:stroke-[#1F2638] light:stroke-[#CBD5E1]"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Track Outline */}
        <path
          d={skyD}
          fill="none"
          className="stroke-[#3B4861] dark:stroke-[#3B4861] light:stroke-[#94A3B8]"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />
        {/* Animated Pulse Wire with high-contrast light mode parity */}
        <path
          d={skyD}
          fill="none"
          strokeWidth="2"
          strokeDasharray="8 8"
          strokeLinecap="round"
          className="stroke-[#38BDF8] light:stroke-[#0284C7] animate-flow-pulse motion-reduce:animate-none"
        />
      </g>

      {/* 2. EMERALD TRACE (CREATE + ACTION) */}
      <g mask="url(#hero-conduit-mask-emerald)">
        {/* Outer Casing */}
        <path
          d={emeraldD}
          fill="none"
          className="stroke-[#1F2638] dark:stroke-[#1F2638] light:stroke-[#CBD5E1]"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Track Outline */}
        <path
          d={emeraldD}
          fill="none"
          className="stroke-[#3B4861] dark:stroke-[#3B4861] light:stroke-[#94A3B8]"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />
        {/* Animated Pulse Wire with high-contrast light mode parity */}
        <path
          d={emeraldD}
          fill="none"
          strokeWidth="2"
          strokeDasharray="8 8"
          strokeLinecap="round"
          className="stroke-[#10B981] light:stroke-[#059669] animate-flow-pulse motion-reduce:animate-none"
        />
      </g>

      {/* 3. AMBER TRACE (REPLACE ± ACTION) */}
      <g mask="url(#hero-conduit-mask-amber)">
        {/* Outer Casing */}
        <path
          d={amberD}
          fill="none"
          className="stroke-[#1F2638] dark:stroke-[#1F2638] light:stroke-[#CBD5E1]"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Track Outline */}
        <path
          d={amberD}
          fill="none"
          className="stroke-[#3B4861] dark:stroke-[#3B4861] light:stroke-[#94A3B8]"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />
        {/* Animated Pulse Wire with high-contrast light mode parity */}
        <path
          d={amberD}
          fill="none"
          strokeWidth="2"
          strokeDasharray="8 8"
          strokeLinecap="round"
          className="stroke-[#F59E0B] light:stroke-[#D97706] animate-flow-pulse motion-reduce:animate-none"
        />
      </g>

      {/* Emitter Bus Port Rings at Logo Pedestal Margin */}
      <g className="transition-opacity duration-300">
        {/* Sky Port */}
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

        {/* Emerald Port */}
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

        {/* Amber Port */}
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
