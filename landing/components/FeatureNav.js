"use client";

import Link from "next/link";
import { useState } from "react";
import { FEATURES, getAdjacentFeatures } from "../lib/features-data";

/**
 * Top breadcrumbs component displaying hierarchy and chapter progress.
 */
export function FeatureBreadcrumbs({ currentSlug }) {
  const currentIndex = FEATURES.findIndex((f) => f.slug === currentSlug);
  const current = FEATURES[currentIndex];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-workbench-border text-xs mb-8">
      <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
        <Link href="/" className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/#features" className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors">
          Features
        </Link>
        <span>/</span>
        <span className="text-sky-500 dark:text-sky-400 font-medium">{current?.navTitle}</span>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
          Chapter {currentIndex + 1} of {FEATURES.length}
        </span>
        <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-workbench-panel text-slate-700 dark:text-slate-300 border border-workbench-border">
          Hotkey: {current?.hotkey}
        </span>
      </div>
    </div>
  );
}

/**
 * Vertical Chapter Navigation Index (displayed on the left).
 * Bounded by its parent component, does not occupy full screen height.
 */
export default function FeatureNav({ currentSlug }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentIndex = FEATURES.findIndex((f) => f.slug === currentSlug);
  const currentFeature = FEATURES[currentIndex];

  const inPageSections = [
    { id: "overview", label: "Overview & Diagram" },
    { id: "the-problem", label: "The Problem" },
    { id: "the-algorithm", label: "Engine & Algorithm" },
    { id: "how-to-use", label: "Workstation Flow" },
    { id: "scenario", label: "SRE Scenario" },
  ];

  return (
    <nav aria-label="Chapter index navigation" className="w-full">
      {/* Mobile Accordion / Chapter Selector (< lg) */}
      <div className="lg:hidden mb-6">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-full flex items-center justify-between p-3.5 rounded-xl border border-workbench-border bg-workbench-panel/90 text-left transition-colors shadow-xs"
        >
          <div className="flex items-center space-x-2.5">
            <span className="w-6 h-6 rounded-md bg-sky-500/10 text-sky-500 border border-sky-500/20 font-mono text-xs font-bold flex items-center justify-center">
              {currentIndex + 1}
            </span>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Chapter {currentIndex + 1} of {FEATURES.length}
              </span>
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                {currentFeature?.navTitle}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-workbench-subpanel text-slate-500 border border-workbench-border">
              [{currentFeature?.hotkey}]
            </span>
            <svg
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                mobileMenuOpen ? "rotate-180 text-sky-500" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {mobileMenuOpen && (
          <div className="mt-2 p-2 rounded-xl border border-workbench-border bg-workbench-panel shadow-lg space-y-1 animate-in fade-in duration-150">
            {FEATURES.map((feature, idx) => {
              const isActive = feature.slug === currentSlug;
              return (
                <Link
                  key={feature.id}
                  href={`/features/${feature.slug}/`}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between p-2.5 rounded-lg text-xs transition-colors ${
                    isActive
                      ? "bg-sky-500/10 text-sky-500 dark:text-sky-400 font-semibold border border-sky-500/30"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-workbench-hover"
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <span className="font-mono text-[11px] opacity-60">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="truncate">{feature.navTitle}</span>
                  </div>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-workbench-subpanel text-slate-500 border border-workbench-border">
                    [{feature.hotkey}]
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop Vertical Chapter Index (lg+) */}
      <div className="hidden lg:block rounded-xl border border-workbench-border bg-workbench-panel/75 backdrop-blur-[2px] p-3 shadow-xs">
        {/* Index Header */}
        <div className="flex items-center justify-between px-2.5 py-2 mb-2 border-b border-workbench-border/60">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
            Chapters Index
          </span>
          <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded bg-workbench-subpanel border border-workbench-border/50">
            {FEATURES.length} chapters
          </span>
        </div>

        {/* Chapter List */}
        <div className="space-y-1 text-xs">
          {FEATURES.map((feature, idx) => {
            const isActive = feature.slug === currentSlug;
            return (
              <div key={feature.id} className="space-y-1">
                <Link
                  href={`/features/${feature.slug}/`}
                  className={`group flex items-center justify-between px-2.5 py-2 rounded-lg font-mono text-[11px] transition-all duration-150 ${
                    isActive
                      ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30 font-semibold shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-workbench-hover border border-transparent"
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span
                      className={`text-[10px] ${
                        isActive ? "text-sky-500 dark:text-sky-400 font-bold" : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="font-sans text-xs truncate group-hover:translate-x-0.5 transition-transform duration-150">
                      {feature.navTitle}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-1 py-0.5 rounded transition-colors ${
                      isActive
                        ? "bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30"
                        : "bg-workbench-subpanel/80 text-slate-500 dark:text-slate-400 border border-workbench-border/60"
                    }`}
                  >
                    [{feature.hotkey}]
                  </span>
                </Link>

                {/* In-Page Sections for Active Chapter (GitHub Docs / "In This Article" style) */}
                {isActive && (
                  <div className="pl-4 pr-1 py-1 ml-3 border-l border-sky-500/30 dark:border-sky-500/20 space-y-1 my-1">
                    {inPageSections.map((sec) => (
                      <a
                        key={sec.id}
                        href={`#${sec.id}`}
                        className="block py-1 px-2 rounded text-[11px] font-sans text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-300 hover:bg-sky-500/[0.05] transition-colors"
                      >
                        {sec.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export function FeaturePagination({ currentSlug }) {
  const { prev, next } = getAdjacentFeatures(currentSlug);

  return (
    <div className="flex items-center justify-between pt-8 border-t border-workbench-border mt-14">
      {prev ? (
        <Link
          href={`/features/${prev.slug}/`}
          className="group flex flex-col items-start p-4 rounded-xl border border-workbench-border bg-workbench-panel hover:bg-workbench-hover hover:border-sky-500/40 transition-colors max-w-[48%]"
        >
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-sky-500 dark:group-hover:text-sky-400">
            ← Previous Chapter
          </span>
          <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
            {prev.title}
          </span>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link
          href={`/features/${next.slug}/`}
          className="group flex flex-col items-end p-4 rounded-xl border border-workbench-border bg-workbench-panel hover:bg-workbench-hover hover:border-sky-500/40 transition-colors text-right max-w-[48%]"
        >
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-sky-500 dark:group-hover:text-sky-400">
            Next Chapter →
          </span>
          <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
            {next.title}
          </span>
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}
