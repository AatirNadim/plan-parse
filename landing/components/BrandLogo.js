"use client";

import React from "react";

/**
 * BrandLogo: Adaptive SVG vector icon representing the plan-parse DAG engine.
 * Automatically adapts between dark mode (deep obsidian & vivid neon) and light mode (crisp blueprint slate & punchy tones).
 * Responsive to both system color scheme and runtime theme toggle (html.light / html.dark).
 */
export default function BrandLogo({
  className = "w-6 h-6",
  title = "plan-parse: Code Gutter to Dependency DAG Engine",
  ...props
}) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`brand-logo-svg select-none shrink-0 ${className}`}
      role="img"
      aria-label={title}
      {...props}
    >
      <title>{title}</title>
      <defs>
        <style>{`
          .logo-bg { fill: var(--logo-bg, #090A0F); }
          .logo-border { stroke: var(--logo-border, #232936); }
          .logo-gutter-bg { fill: var(--logo-gutter-bg, #0F121A); }
          .logo-gutter-border { stroke: var(--logo-gutter-border, #232936); }
          .logo-gutter-rule { stroke: var(--logo-gutter-rule, #232936); }
          .logo-track-border { stroke: var(--logo-track-border, #3B4861); }
          .logo-track-casing { stroke: var(--logo-track-casing, #1F2638); }
          .logo-chord { stroke: var(--logo-chord, #94A3B8); }
          .logo-node-bg { fill: var(--logo-node-bg, #0C0E14); }
          .logo-node-halo { fill-opacity: var(--logo-node-halo-opacity, 0.25); }
          .logo-token-indigo { fill: var(--logo-token-indigo, #6366F1); }
          .logo-token-sky { fill: var(--logo-token-sky, #38BDF8); }
          .logo-token-slate-1 { fill: var(--logo-token-slate-1, #94A3B8); }
          .logo-token-slate-2 { fill: var(--logo-token-slate-2, #717D96); }
          .logo-token-slate-3 { fill: var(--logo-token-slate-3, #475569); }
          .logo-token-emerald { fill: var(--logo-token-emerald, #10B981); }
          .logo-token-mint { fill: var(--logo-token-mint, #34D399); }
          .logo-token-amber { fill: var(--logo-token-amber, #F59E0B); }
          .logo-token-fuchsia { fill: var(--logo-token-fuchsia, #D946EF); }
          .logo-token-dark-slate { fill: var(--logo-token-dark-slate, #334155); }
          .logo-tube-blue { stroke: var(--logo-tube-blue, #38BDF8); }
          .logo-tube-green { stroke: var(--logo-tube-green, #34D399); }
          .logo-tube-yellow { stroke: var(--logo-tube-yellow, #FBBF24); }
          .logo-badge-blue-stroke { stroke: var(--logo-tube-blue, #38BDF8); }
          .logo-badge-blue-fill { fill: var(--logo-tube-blue, #38BDF8); }
          .logo-badge-green-stroke { stroke: var(--logo-tube-green, #34D399); }
          .logo-badge-green-fill { fill: var(--logo-tube-green, #34D399); }
          .logo-badge-yellow-stroke { stroke: var(--logo-tube-yellow, #FBBF24); }
          .logo-badge-yellow-fill { fill: var(--logo-tube-yellow, #FBBF24); }
        `}</style>
      </defs>

      {/* Rounded Square Squircle Canvas */}
      <rect width="512" height="512" rx="112" className="logo-bg" />
      <rect x="6" y="6" width="500" height="500" rx="106" className="logo-border" strokeWidth="2" />

      {/* Left: Wide Code Gutter Column (Workbench Panel Style) */}
      <rect x="100" y="96" width="116" height="320" rx="20" className="logo-gutter-bg logo-gutter-border" strokeWidth="2" />

      {/* Editor Gutter Margin / Rule Line */}
      <line x1="122" y1="112" x2="122" y2="400" className="logo-gutter-rule" strokeWidth="1.5" strokeDasharray="3 3" />

      {/* Syntax-Highlighted Horizontal Code Tubes (Terraform HCL AST) */}
      {/* Block 1: Resource keyword + name (Module Indigo & Sky tokens) */}
      <rect x="132" y="122" width="68" height="14" rx="7" className="logo-token-indigo" />
      <rect x="144" y="146" width="52" height="12" rx="6" className="logo-token-sky" />
      <rect x="144" y="168" width="60" height="12" rx="6" className="logo-token-slate-1" opacity="0.8" />
      <rect x="144" y="190" width="38" height="12" rx="6" className="logo-token-slate-2" opacity="0.6" />
      <rect x="132" y="212" width="22" height="12" rx="6" className="logo-token-slate-3" opacity="0.7" />

      {/* Block 2: Plan Diff Block (Added Emerald & Changed Amber tokens) */}
      <rect x="132" y="244" width="64" height="14" rx="7" className="logo-token-emerald" />
      <rect x="144" y="268" width="56" height="12" rx="6" className="logo-token-mint" opacity="0.9" />
      <rect x="144" y="290" width="44" height="12" rx="6" className="logo-token-amber" opacity="0.9" />
      <rect x="132" y="312" width="24" height="12" rx="6" className="logo-token-slate-3" opacity="0.7" />

      {/* Block 3: Stem Descender / Execution Output (Fuchsia & Slate) */}
      <rect x="132" y="344" width="60" height="14" rx="7" className="logo-token-fuchsia" opacity="0.85" />
      <rect x="144" y="368" width="48" height="12" rx="6" className="logo-token-slate-2" opacity="0.6" />
      <rect x="132" y="390" width="26" height="10" rx="5" className="logo-token-dark-slate" opacity="0.5" />

      {/* Right: Perfect Semicircular Half-Tube Track (The Parsed DAG) */}
      {/* Track Outer Border Outline */}
      <path
        d="M 210 148 H 296 A 76 76 0 0 1 296 300 H 210"
        className="logo-track-border"
        strokeWidth="50"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Track Outer Casing */}
      <path
        d="M 210 148 H 296 A 76 76 0 0 1 296 300 H 210"
        className="logo-track-casing"
        strokeWidth="44"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Conduit Core (Vivid Action Phasing) */}
      {/* 1. BLUE Segment: From Gutter entry (216, 148) to cut point (361.8, 186.0) */}
      <path
        d="M 216 148 H 296 A 76 76 0 0 1 361.8 186.0"
        className="logo-tube-blue"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 2. GREEN Segment: Arc apex through (361.8, 262.0) */}
      <path
        d="M 361.8 186.0 A 76 76 0 0 1 361.8 262.0"
        className="logo-tube-green"
        strokeWidth="12"
        strokeLinecap="butt"
      />

      {/* 3. YELLOW Segment: Lower curve to return gutter (216, 300) */}
      <path
        d="M 361.8 262.0 A 76 76 0 0 1 296 300 H 216"
        className="logo-tube-yellow"
        strokeWidth="12"
        strokeLinecap="butt"
        strokeLinejoin="round"
      />

      {/* Internal DAG Dependency Chord */}
      <path
        d="M 252 148 L 336 270"
        className="logo-chord"
        strokeWidth="2.5"
        strokeDasharray="5 5"
        opacity="0.8"
      />

      {/* DAG Action Nodes */}
      {/* Node 1: UPDATE Node (Upper Blue Arm at x=252, y=148) */}
      <g transform="translate(252, 148)">
        <circle cx="0" cy="0" r="19" className="logo-node-bg logo-badge-blue-stroke" strokeWidth="3" />
        <circle cx="0" cy="0" r="13" className="logo-badge-blue-fill logo-node-halo" />
        <path d="M-6 0C-4 -3 -2 -3 0 0C2 3 4 3 6 0" className="logo-badge-blue-stroke" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* Node 2: CREATE Node (Apex Green Crest at x=372, y=224) */}
      <g transform="translate(372, 224)">
        <circle cx="0" cy="0" r="22" className="logo-node-bg logo-badge-green-stroke" strokeWidth="3.5" />
        <circle cx="0" cy="0" r="15" className="logo-badge-green-fill logo-node-halo" />
        <path d="M-7 0H7M0 -7V7" className="logo-badge-green-stroke" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* Node 3: REPLACE Node (Lower Yellow Return Arm at x=268, y=300) */}
      <g transform="translate(268, 300)">
        <circle cx="0" cy="0" r="19" className="logo-node-bg logo-badge-yellow-stroke" strokeWidth="3" />
        <circle cx="0" cy="0" r="13" className="logo-badge-yellow-fill logo-node-halo" />
        <path d="M-5 -2H5M0 -7V3M-5 6H5" className="logo-badge-yellow-stroke" strokeWidth="2.2" strokeLinecap="round" />
      </g>

      {/* Return Flow Indicator into Gutter */}
      <path
        d="M 228 294 L 218 300 L 228 306"
        className="logo-badge-yellow-stroke"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
