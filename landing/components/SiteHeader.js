"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import ThemeToggle from "./ThemeToggle";
import { FEATURES } from "../lib/features-data";
import GithubIcon from "./icons/github";
import DockerIcon from "./icons/docker";

export default function SiteHeader() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-workbench-border bg-workbench-bg/90 backdrop-blur-md transition-colors duration-150">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-lg bg-[#0f121a] border border-workbench-border flex items-center justify-center p-1.5 group-hover:border-sky-500/50 transition-colors shadow-sm light:shadow-sm">
              <img src="/icon.svg" alt="plan-parse icon" className="w-6 h-6" />
            </div>
            <div className="flex items-center space-x-2.5">
              <span className="font-bold font-mono tracking-tight text-base sm:text-lg text-slate-900 dark:text-slate-100 group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors">
                PLAN-PARSE
              </span>
              <span className="px-2 py-0.5 text-xs font-mono rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 light:text-sky-700 border border-sky-500/20 font-bold light:shadow-xs">
                v1.0.0
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 xl:gap-2 text-[13px] lg:text-sm font-medium light:font-semibold text-slate-700 dark:text-slate-300 light:text-slate-800">
          {/* Features Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              type="button"
              className="flex items-center space-x-1.5 px-3 lg:px-3.5 py-2 rounded-lg hover:text-slate-950 dark:hover:text-white hover:bg-workbench-hover light:hover:bg-slate-200/60 transition-colors font-medium light:font-semibold"
            >
              <span>Features</span>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180 text-sky-500 dark:text-sky-400" : "text-slate-500 dark:text-slate-400"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-96 rounded-xl border border-workbench-border bg-workbench-panel p-2.5 shadow-2xl light:shadow-xl light:border-slate-300/80 backdrop-blur-xl z-50">
                <div className="px-3 py-2 mb-1.5 text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 light:text-slate-700 font-bold border-b border-workbench-border">
                  Core Architectural Features
                </div>
                <div className="space-y-1">
                  {FEATURES.map((feature) => (
                    <Link
                      key={feature.id}
                      href={`/features/${feature.slug}/`}
                      onClick={() => setDropdownOpen(false)}
                      className="group flex items-start justify-between p-2.5 rounded-lg hover:bg-workbench-hover transition-colors"
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-200 group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors">
                          {feature.navTitle}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 light:text-slate-700 light:font-medium line-clamp-1 mt-0.5">
                          {feature.tagline}
                        </div>
                      </div>
                      <span className="ml-3 px-2 py-0.5 text-[10px] font-mono rounded bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-400 light:text-slate-900 font-bold border border-slate-200 dark:border-slate-700/50">
                        {feature.hotkey}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link
            href="/#the-problem"
            className="px-3 lg:px-3.5 py-2 rounded-lg hover:text-slate-950 dark:hover:text-white hover:bg-workbench-hover light:hover:bg-slate-200/60 transition-colors"
          >
            The Problem
          </Link>
          <Link
            href="/#accomplishments"
            className="px-3 lg:px-3.5 py-2 rounded-lg hover:text-slate-950 dark:hover:text-white hover:bg-workbench-hover light:hover:bg-slate-200/60 transition-colors"
          >
            Accomplishments
          </Link>
          <Link
            href="/#workflow"
            className="px-3 lg:px-3.5 py-2 rounded-lg hover:text-slate-950 dark:hover:text-white hover:bg-workbench-hover light:hover:bg-slate-200/60 transition-colors"
          >
            Workflow Guide
          </Link>
          <Link
            href="/#releases"
            className="px-3 lg:px-3.5 py-2 rounded-lg hover:text-slate-950 dark:hover:text-white hover:bg-workbench-hover light:hover:bg-slate-200/60 transition-colors"
          >
            Releases
          </Link>
          <Link
            href="/#docker"
            className="px-3 lg:px-3.5 py-2 rounded-lg hover:text-slate-950 dark:hover:text-white hover:bg-workbench-hover light:hover:bg-slate-200/60 transition-colors"
          >
            Docker
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <ThemeToggle />

          <a
            href="https://hub.docker.com/r/aatir0docking/plan-parse"
            target="_blank"
            rel="noopener noreferrer"
            title="Docker Hub Image"
            className="hidden sm:flex items-center space-x-2 px-3.5 py-2 rounded-lg border border-workbench-border bg-workbench-panel hover:bg-workbench-hover text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs sm:text-sm font-mono font-medium light:font-bold light:text-slate-900 shadow-sm light:shadow-xs transition-colors"
          >
            <DockerIcon className="w-4 h-4" />
            <span>Docker</span>
          </a>

          <a
            href="https://github.com/AatirNadim/plan-parse"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg border border-workbench-border bg-workbench-panel hover:bg-workbench-hover text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs sm:text-sm font-medium light:font-bold light:text-slate-900 shadow-sm light:shadow-xs transition-colors"
          >
            <GithubIcon className="w-4 h-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            type="button"
            className="md:hidden p-2.5 rounded-lg border border-workbench-border bg-workbench-panel text-slate-700 dark:text-slate-300 hover:bg-workbench-hover transition-colors"
            aria-label="Toggle navigation menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-workbench-border bg-workbench-panel px-4 pt-3 pb-6 space-y-4">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 py-1.5 border-b border-workbench-border font-bold">
            Feature Chapters
          </div>
          <div className="grid grid-cols-1 gap-1">
            {FEATURES.map((feature) => (
              <Link
                key={feature.id}
                href={`/features/${feature.slug}/`}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2 px-2.5 rounded-md text-sm text-slate-700 dark:text-slate-300 hover:bg-workbench-hover hover:text-sky-500 dark:hover:text-sky-400 font-medium"
              >
                <span>{feature.title}</span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">[{feature.hotkey}]</span>
              </Link>
            ))}
          </div>
          <div className="pt-3 border-t border-workbench-border flex flex-col space-y-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
            <Link href="/#the-problem" onClick={() => setMobileMenuOpen(false)} className="py-1.5 px-2.5 rounded-md hover:bg-workbench-hover">The Problem</Link>
            <Link href="/#accomplishments" onClick={() => setMobileMenuOpen(false)} className="py-1.5 px-2.5 rounded-md hover:bg-workbench-hover">Accomplishments</Link>
            <Link href="/#workflow" onClick={() => setMobileMenuOpen(false)} className="py-1.5 px-2.5 rounded-md hover:bg-workbench-hover">Workflow Guide</Link>
            <Link href="/#releases" onClick={() => setMobileMenuOpen(false)} className="py-1.5 px-2.5 rounded-md hover:bg-workbench-hover">Releases</Link>
            <Link href="/#docker" onClick={() => setMobileMenuOpen(false)} className="py-1.5 px-2.5 rounded-md hover:bg-workbench-hover">Docker</Link>
          </div>
        </div>
      )}
    </header>
  );
}
