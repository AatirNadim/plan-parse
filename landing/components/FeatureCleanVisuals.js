"use client";

import React from "react";

/**
 * Clean, focused, non-overwhelming visual aids for the landing page deep-dive viewports.
 * Dual-theme high-contrast support:
 * - Dark mode: Glowing neon accents on deep obsidian cards
 * - Light mode: Crisp, bold high-contrast text and deep saturated tokens on white/slate cards
 */

// 1. Collapsed Nodes (Mutations Only)
export function VisualCollapsedNodes() {
  return (
    <svg viewBox="0 0 640 360" fill="none" className="w-full h-full select-none">
      <defs>
        <pattern id="cn-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" className="fill-[#1E2638] dark:fill-[#1E2638] light:fill-[#CBD5E1]" />
        </pattern>
        <marker id="cn-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#0EA5E9" className="vis-sky" />
        </marker>
        <marker id="cn-arr-subtle" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748B" className="vis-text-muted" />
        </marker>
      </defs>
      <rect width="640" height="360" className="fill-[#090A0F] dark:fill-[#090A0F] light:fill-[#F8FAFC]" />
      <rect width="640" height="360" fill="url(#cn-dots)" />

      {/* Top Status Pill */}
      <g transform="translate(150, 24)">
        <rect width="340" height="34" rx="17" className="vis-node-bg stroke-[#0EA5E9]/50" strokeWidth="1.5" />
        <circle cx="20" cy="17" r="4.5" className="fill-[#0EA5E9] animate-pulse" />
        <text x="34" y="21" className="vis-sky-text font-mono text-xs font-bold">
          [C] Mutations Only: Active
        </text>
        <rect x="244" y="7" width="82" height="20" rx="5" className="vis-node-header stroke-[#232936] dark:stroke-[#232936] light:stroke-[#CBD5E1]" strokeWidth="1" />
        <text x="254" y="21" className="vis-text-secondary font-mono text-[10px] font-bold">
          18 Hidden
        </text>
      </g>

      {/* Left Mutating Node: Security Group (UPDATE) */}
      <g transform="translate(25, 126)">
        <rect width="170" height="92" rx="10" className="vis-node-bg stroke-[#0EA5E9]" strokeWidth="2" />
        <rect width="170" height="28" rx="10" className="vis-node-header" />
        <rect x="10" y="6" width="66" height="16" rx="4" className="vis-badge-sky-bg" />
        <text x="16" y="18" className="vis-sky-text font-mono text-[10px] font-bold">~ UPDATE</text>
        <text x="12" y="50" className="vis-text-primary font-mono text-xs font-bold">aws_security_group</text>
        <text x="12" y="68" className="vis-text-secondary font-mono text-[11px] font-semibold">.ingress_rules</text>
        <text x="12" y="83" className="vis-text-muted font-sans text-[10px] font-medium">2 ports modified</text>
      </g>

      {/* Center Collapsed Cluster Pill */}
      <g transform="translate(225, 138)">
        <rect width="190" height="68" rx="34" className="vis-node-header stroke-[#64748B]" strokeWidth="1.5" strokeDasharray="4 4" />
        <circle cx="32" cy="34" r="16" className="vis-node-bg stroke-[#94A3B8]" strokeWidth="1.5" />
        <text x="25" y="38" className="vis-text-primary font-mono text-xs font-bold">12</text>
        <text x="56" y="31" className="vis-text-primary font-sans text-xs font-bold">Unchanged Nodes</text>
        <text x="56" y="48" className="vis-text-muted font-mono text-[10px] font-medium">module.vpc.* (no-op)</text>
      </g>

      {/* Right Mutating Node: RDS Cluster (REPLACE) */}
      <g transform="translate(440, 126)">
        <rect width="170" height="92" rx="10" className="vis-node-bg stroke-[#F59E0B]" strokeWidth="2" />
        <rect width="170" height="28" rx="10" className="vis-node-header" />
        <rect x="10" y="6" width="70" height="16" rx="4" className="vis-badge-amber-bg" />
        <text x="16" y="18" className="vis-amber-text font-mono text-[10px] font-bold">± REPLACE</text>
        <text x="12" y="50" className="vis-text-primary font-mono text-xs font-bold">aws_rds_cluster</text>
        <text x="12" y="68" className="vis-text-secondary font-mono text-[11px] font-semibold">.primary_db</text>
        <text x="12" y="83" className="vis-amber-text font-sans text-[10px] font-bold">Forces recreation</text>
      </g>

      {/* Synthetic Transitive Bridging Edge (Over the cluster) */}
      <path
        d="M 195 146 Q 320 84 435 146"
        stroke="#0EA5E9"
        strokeWidth="2.5"
        strokeDasharray="6 4"
        fill="none"
        markerEnd="url(#cn-arr)"
      />
      <g transform="translate(250, 74)">
        <rect width="140" height="22" rx="5" className="vis-node-bg stroke-[#0EA5E9]" strokeWidth="1.2" />
        <text x="70" y="15" textAnchor="middle" className="vis-sky-text font-mono text-[9px] font-bold tracking-wider">
          SYNTHETIC BRIDGE
        </text>
      </g>

      {/* Subtle dashed dependencies entering collapsed cluster */}
      <path d="M 195 172 L 225 172" stroke="#64748B" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#cn-arr-subtle)" />
      <path d="M 415 172 L 440 172" stroke="#64748B" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#cn-arr-subtle)" />
    </svg>
  );
}

// 2. Blast Radius Analysis
export function VisualBlastRadius() {
  return (
    <svg viewBox="0 0 640 360" fill="none" className="w-full h-full select-none">
      <defs>
        <pattern id="br-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" className="fill-[#1E2638] dark:fill-[#1E2638] light:fill-[#CBD5E1]" />
        </pattern>
        <marker id="br-arr-amber" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#F59E0B" className="vis-amber" />
        </marker>
        <marker id="br-arr-rose" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#F43F5E" className="vis-rose" />
        </marker>
      </defs>
      <rect width="640" height="360" className="fill-[#090A0F] dark:fill-[#090A0F] light:fill-[#F8FAFC]" />
      <rect width="640" height="360" fill="url(#br-dots)" />

      {/* Clean Floating HUD (Single focused bar, no pins) */}
      <g transform="translate(110, 22)">
        <rect width="420" height="44" rx="12" className="vis-node-bg stroke-[#F59E0B]/50" strokeWidth="1.5" />
        <circle cx="24" cy="22" r="5" fill="#F59E0B" className="animate-pulse" />
        <text x="38" y="20" className="vis-amber-text font-mono text-xs font-bold">
          BLAST RADIUS AUDIT
        </text>
        <text x="38" y="34" className="vis-text-secondary font-sans text-[11px] font-medium">
          Target: aws_subnet.db_primary
        </text>
        <line x1="220" y1="8" x2="220" y2="36" stroke="#94A3B8" strokeWidth="1" opacity="0.4" />
        <text x="234" y="27" className="vis-amber-text font-mono text-xs font-bold">
          2 Direct <tspan className="vis-text-muted font-normal">•</tspan> <tspan className="vis-sky-text">5 Transitive</tspan>
        </text>
      </g>

      {/* Selected Root Trigger Node (Left) */}
      <g transform="translate(45, 132)">
        {/* Pulsing Selection Halo */}
        <rect x="-4" y="-4" width="194" height="98" rx="14" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.8" />
        <rect width="186" height="90" rx="10" className="vis-node-bg stroke-[#F59E0B]" strokeWidth="2.5" />
        <rect width="186" height="28" rx="10" className="vis-node-header" />
        <rect x="10" y="6" width="70" height="16" rx="4" className="vis-badge-amber-bg" />
        <text x="16" y="18" className="vis-amber-text font-mono text-[10px] font-bold">± TRIGGER</text>
        <circle cx="168" cy="14" r="4.5" fill="#F59E0B" />
        <text x="12" y="49" className="vis-text-primary font-mono text-xs font-bold">aws_subnet</text>
        <text x="12" y="68" className="vis-amber-text font-mono text-[11px] font-bold">.db_primary</text>
        <text x="12" y="83" className="vis-rose-text font-sans text-[10px] font-bold">Forces recreation: cidr_block</text>
      </g>

      {/* Radiant High-Voltage Cascade Impact Paths */}
      <path d="M 231 156 Q 315 125 395 125" stroke="#F59E0B" strokeWidth="2.5" fill="none" markerEnd="url(#br-arr-amber)" />
      <path d="M 231 198 Q 315 240 395 240" stroke="#F43F5E" strokeWidth="2.5" fill="none" markerEnd="url(#br-arr-rose)" />

      {/* Downstream Casualty 1: Database Subnet Group (Top Right) */}
      <g transform="translate(400, 90)">
        <rect width="195" height="78" rx="10" className="vis-node-bg stroke-[#F59E0B]" strokeWidth="2" />
        <rect width="195" height="26" rx="10" className="vis-node-header" />
        <rect x="10" y="5" width="72" height="16" rx="4" className="vis-badge-amber-bg" />
        <text x="16" y="17" className="vis-amber-text font-mono text-[10px] font-bold">± CASCADE</text>
        <text x="12" y="46" className="vis-text-primary font-mono text-xs font-bold">aws_db_subnet_group</text>
        <text x="12" y="65" className="vis-text-secondary font-mono text-[11px] font-semibold">.aurora_subnets</text>
      </g>

      {/* Downstream Casualty 2: Primary RDS Cluster (Bottom Right) */}
      <g transform="translate(400, 202)">
        <rect width="195" height="78" rx="10" className="vis-node-bg stroke-[#F43F5E]" strokeWidth="2" />
        <rect width="195" height="26" rx="10" className="vis-node-header" />
        <rect x="10" y="5" width="92" height="16" rx="4" className="vis-badge-rose-bg" />
        <text x="16" y="17" className="vis-rose-text font-mono text-[10px] font-bold">− DESTRUCTION</text>
        <text x="12" y="46" className="vis-text-primary font-mono text-xs font-bold">aws_rds_cluster</text>
        <text x="12" y="65" className="vis-rose-text font-mono text-[11px] font-bold">.production_db</text>
      </g>
    </svg>
  );
}

// 3. 2-Tier Progressive Diff
export function VisualResourceDiff() {
  return (
    <div className="w-full h-full p-4 sm:p-5 flex flex-col justify-between font-mono text-xs select-none bg-[#090A0F] dark:bg-[#090A0F] light:bg-[#F8FAFC]">
      {/* Code Window Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-300 dark:border-workbench-border/80 text-[11px]">
        <div className="flex items-center space-x-2">
          <span className="text-slate-800 dark:text-slate-200 font-bold">main.tf:42</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-900 dark:text-slate-100 font-bold">aws_subnet.db_primary</span>
        </div>
        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-500/30">
          Forces Replacement
        </span>
      </div>

      {/* Split Diff Body */}
      <div className="my-auto space-y-2.5 py-2 text-[11px] leading-relaxed">
        <div className="px-3.5 py-2 rounded-lg bg-rose-500/10 dark:bg-rose-500/15 border-l-3 border-rose-500 text-rose-800 dark:text-rose-300 flex items-center justify-between font-mono">
          <span className="font-bold">- cidr_block = &quot;10.0.1.0/24&quot;</span>
          <span className="text-[10px] text-rose-700 dark:text-rose-400 font-sans font-semibold">Current State</span>
        </div>
        <div className="px-3.5 py-2 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15 border-l-3 border-emerald-500 text-emerald-800 dark:text-emerald-300 flex items-center justify-between font-mono">
          <span className="font-bold">+ cidr_block = &quot;10.0.2.0/24&quot;</span>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-sans font-semibold">Planned State</span>
        </div>
        <div className="px-3.5 py-2 rounded-lg bg-sky-500/10 dark:bg-sky-500/15 border-l-3 border-sky-500 text-sky-800 dark:text-sky-300 flex items-center justify-between font-mono">
          <span className="font-bold">~ availability_zone = &quot;us-east-1a&quot;</span>
          <span className="text-[10px] text-sky-700 dark:text-sky-400 font-sans font-semibold">In-place Update</span>
        </div>
      </div>

      {/* Footer Provenance Info */}
      <div className="pt-2.5 border-t border-slate-300 dark:border-workbench-border/60 flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-400 font-medium">
        <span>AST Provenance: Local Workspace</span>
        <span className="text-emerald-700 dark:text-emerald-400 font-bold">1 Added • 1 Removed</span>
      </div>
    </div>
  );
}

// 4. Color Grading & Visual Grammar
export function VisualColorGrading() {
  return (
    <svg viewBox="0 0 640 360" fill="none" className="w-full h-full select-none">
      <defs>
        <pattern id="cg-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" className="fill-[#1E2638] dark:fill-[#1E2638] light:fill-[#CBD5E1]" />
        </pattern>
      </defs>
      <rect width="640" height="360" className="fill-[#090A0F] dark:fill-[#090A0F] light:fill-[#F8FAFC]" />
      <rect width="640" height="360" fill="url(#cg-dots)" />

      {/* Title Pill */}
      <g transform="translate(180, 24)">
        <rect width="280" height="32" rx="16" className="vis-node-bg stroke-workbench-border" strokeWidth="1.5" />
        <text x="140" y="21" textAnchor="middle" className="vis-text-primary font-mono text-[11px] font-bold">
          60-30-10 SEMANTIC ACTIONS
        </text>
      </g>

      {/* 4 Crisp Action Tokens arranged symmetrically */}
      {/* 1. CREATE (Emerald) */}
      <g transform="translate(60, 86)">
        <rect width="230" height="84" rx="10" className="vis-node-bg stroke-[#10B981]" strokeWidth="2" />
        <rect width="230" height="26" rx="10" className="vis-node-header" />
        <rect x="10" y="5" width="66" height="16" rx="4" className="vis-badge-emerald-bg" />
        <text x="16" y="17" className="vis-emerald-text font-mono text-[10px] font-bold">+ CREATE</text>
        <text x="12" y="48" className="vis-text-primary font-mono text-xs font-bold">aws_subnet</text>
        <text x="12" y="66" className="vis-text-secondary font-mono text-[11px] font-semibold">.new_private_tier</text>
      </g>

      {/* 2. UPDATE (Sky) */}
      <g transform="translate(350, 86)">
        <rect width="230" height="84" rx="10" className="vis-node-bg stroke-[#0EA5E9]" strokeWidth="2" />
        <rect width="230" height="26" rx="10" className="vis-node-header" />
        <rect x="10" y="5" width="66" height="16" rx="4" className="vis-badge-sky-bg" />
        <text x="16" y="17" className="vis-sky-text font-mono text-[10px] font-bold">~ UPDATE</text>
        <text x="12" y="48" className="vis-text-primary font-mono text-xs font-bold">aws_route_table</text>
        <text x="12" y="66" className="vis-text-secondary font-mono text-[11px] font-semibold">.nat_gateway_route</text>
      </g>

      {/* 3. REPLACE (Amber) */}
      <g transform="translate(60, 198)">
        <rect width="230" height="84" rx="10" className="vis-node-bg stroke-[#F59E0B]" strokeWidth="2" />
        <rect width="230" height="26" rx="10" className="vis-node-header" />
        <rect x="10" y="5" width="72" height="16" rx="4" className="vis-badge-amber-bg" />
        <text x="16" y="17" className="vis-amber-text font-mono text-[10px] font-bold">± REPLACE</text>
        <text x="12" y="48" className="vis-text-primary font-mono text-xs font-bold">aws_db_subnet_group</text>
        <text x="12" y="66" className="vis-amber-text font-mono text-[11px] font-bold">.primary_cluster</text>
      </g>

      {/* 4. DESTROY (Rose) */}
      <g transform="translate(350, 198)">
        <rect width="230" height="84" rx="10" className="vis-node-bg stroke-[#F43F5E]" strokeWidth="2" />
        <rect width="230" height="26" rx="10" className="vis-node-header" />
        <rect x="10" y="5" width="70" height="16" rx="4" className="vis-badge-rose-bg" />
        <text x="16" y="17" className="vis-rose-text font-mono text-[10px] font-bold">− DESTROY</text>
        <text x="12" y="48" className="vis-text-primary font-mono text-xs font-bold">aws_nat_gateway</text>
        <text x="12" y="66" className="vis-rose-text font-mono text-[11px] font-bold">.legacy_egress</text>
      </g>
    </svg>
  );
}

// 5. Dedicated Resource Panel (Inspector)
export function VisualResourcePanel() {
  return (
    <div className="w-full h-full p-4 sm:p-5 flex flex-col justify-between font-mono text-xs select-none bg-[#090A0F] dark:bg-[#090A0F] light:bg-[#F8FAFC]">
      {/* Inspector Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-300 dark:border-workbench-border/80">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
          <span className="text-slate-900 dark:text-slate-100 font-bold truncate">aws_route_table.public</span>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-workbench-bg border border-slate-300 dark:border-workbench-border text-slate-800 dark:text-slate-300">
          CLI: target copy
        </span>
      </div>

      {/* Attribute Diff Section */}
      <div className="my-auto space-y-1.5 py-2 text-[11px]">
        <div className="text-[10px] uppercase font-bold text-slate-700 dark:text-slate-400">Attributes Delta</div>
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-workbench-bg/90 border border-slate-300 dark:border-workbench-border font-mono text-[11px] space-y-1">
          <div className="text-slate-600 dark:text-slate-400">id = &quot;rtb-04f8b2c&quot;</div>
          <div className="text-emerald-700 dark:text-emerald-400 font-bold">+ route [cidr: &quot;0.0.0.0/0&quot;, gateway: &quot;igw-912&quot;]</div>
          <div className="text-slate-600 dark:text-slate-400">vpc_id = &quot;vpc-89a1&quot;</div>
        </div>
      </div>

      {/* Lineage Navigation Chips */}
      <div className="pt-2.5 border-t border-slate-300 dark:border-workbench-border/60">
        <div className="text-[10px] uppercase font-bold text-slate-700 dark:text-slate-400 mb-1.5">Lineage Arcs</div>
        <div className="flex flex-wrap gap-2">
          <span className="px-2.5 py-1 rounded-md bg-sky-500/15 text-sky-800 dark:text-sky-300 border border-sky-500/30 text-[10px] font-bold">
            ↑ depends_on: [aws_vpc.main]
          </span>
          <span className="px-2.5 py-1 rounded-md bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/30 text-[10px] font-bold">
            ↓ referenced_by: [aws_subnet.pub_1]
          </span>
        </div>
      </div>
    </div>
  );
}

// 6. Workbench Sidebar & Dropzone
export function VisualWorkbenchSidebar() {
  return (
    <div className="w-full h-full p-4 sm:p-5 flex flex-col justify-between font-mono text-xs select-none bg-[#090A0F] dark:bg-[#090A0F] light:bg-[#F8FAFC]">
      {/* Dropzone Confirmation Banner */}
      <div className="p-3 rounded-lg border-2 border-dashed border-sky-500/50 bg-sky-500/10 text-center">
        <div className="text-sky-800 dark:text-sky-400 font-bold text-xs flex items-center justify-center space-x-1.5">
          <span>↓</span>
          <span>plan.json ingested successfully</span>
        </div>
        <div className="text-[10px] text-slate-600 dark:text-slate-300 font-medium mt-1">
          142 resources parsed in 18ms • 0 telemetry network egress
        </div>
      </div>

      {/* Clean Module Hierarchy Tree */}
      <div className="my-auto space-y-1.5 py-1.5 text-[11px]">
        <div className="flex items-center space-x-2 text-slate-900 dark:text-slate-100 font-bold">
          <span>▾</span>
          <span>module.vpc</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">(18 resources)</span>
        </div>
        <div className="pl-4 space-y-1 text-slate-800 dark:text-slate-300 text-[11px] font-medium">
          <div className="flex items-center justify-between">
            <span>├─ aws_subnet.public_1</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">+ create</span>
          </div>
          <div className="flex items-center justify-between">
            <span>├─ aws_security_group.ingress</span>
            <span className="text-sky-700 dark:text-sky-400 font-bold">~ update</span>
          </div>
          <div className="flex items-center justify-between">
            <span>└─ aws_rds_cluster.main</span>
            <span className="text-amber-800 dark:text-amber-400 font-bold">± replace</span>
          </div>
        </div>
      </div>

      {/* Footer Status */}
      <div className="pt-2.5 border-t border-slate-300 dark:border-workbench-border/60 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
        <span className="text-emerald-700 dark:text-emerald-400 font-bold">✓ In-Memory Client Parser</span>
        <span className="font-semibold">Localhost Only</span>
      </div>
    </div>
  );
}

// 7. Workstation Utilities (Command Palette)
export function VisualWorkstationUtilities() {
  return (
    <div className="w-full h-full p-4 sm:p-5 flex flex-col justify-between font-mono text-xs select-none bg-[#090A0F] dark:bg-[#090A0F] light:bg-[#F8FAFC]">
      {/* Command Palette Mock Dialog */}
      <div className="rounded-xl border border-sky-500/40 bg-white dark:bg-[#0C0E14] shadow-xl p-3 space-y-2.5">
        {/* Search Bar */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-workbench-panel border border-slate-300 dark:border-workbench-border text-slate-800 dark:text-slate-200">
          <span className="text-sky-700 dark:text-sky-400 font-bold">⌘</span>
          <span className="text-slate-900 dark:text-slate-100 font-bold">Toggle Mutations Only</span>
          <span className="w-1.5 h-3.5 bg-sky-500 animate-pulse ml-1" />
        </div>

        {/* Suggestion list */}
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between px-3 py-1.5 rounded-md bg-sky-500/15 text-sky-900 dark:text-sky-300 font-bold">
            <span>Toggle Mutations Only</span>
            <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-800 dark:text-sky-300 text-[10px] font-bold">[C]</span>
          </div>
          <div className="flex items-center justify-between px-3 py-1 rounded text-slate-700 dark:text-slate-300 font-medium">
            <span>Isolate Blast Radius Subgraph</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-workbench-panel border border-slate-300 dark:border-workbench-border text-[10px] font-bold">[B]</span>
          </div>
          <div className="flex items-center justify-between px-3 py-1 rounded text-slate-700 dark:text-slate-300 font-medium">
            <span>Export Retina 2.5x Vector SVG</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-workbench-panel border border-slate-300 dark:border-workbench-border text-[10px] font-bold">[⌘E]</span>
          </div>
        </div>
      </div>

      {/* Shortcuts Footer Bar */}
      <div className="pt-2.5 border-t border-slate-300 dark:border-workbench-border/60 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
        <span>Press [?] for Cheat Sheet</span>
        <span className="text-sky-700 dark:text-sky-400 font-bold">⌘K Anywhere</span>
      </div>
    </div>
  );
}

/**
 * Dispatcher component to render the clean visual for a given feature slug/id.
 */
export default function FeatureCleanVisual({ featureId }) {
  switch (featureId) {
    case "collapsed-nodes":
      return <VisualCollapsedNodes />;
    case "blast-radius":
      return <VisualBlastRadius />;
    case "resource-diff":
      return <VisualResourceDiff />;
    case "color-grading":
      return <VisualColorGrading />;
    case "resource-panel":
      return <VisualResourcePanel />;
    case "workbench-sidebar":
      return <VisualWorkbenchSidebar />;
    case "miscellaneous":
      return <VisualWorkstationUtilities />;
    default:
      return null;
  }
}
