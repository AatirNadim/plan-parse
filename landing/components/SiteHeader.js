"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import ThemeToggle from "./ThemeToggle";
import { FEATURES } from "../lib/features-data";

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded-md bg-[#0f121a] border border-workbench-border flex items-center justify-center p-1 group-hover:border-sky-500/50 transition-colors">
              <img src="/icon.svg" alt="plan-parse icon" className="w-6 h-6" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-semibold tracking-tight text-sm text-slate-100 dark:text-slate-100 light:text-slate-900 group-hover:text-sky-400 transition-colors">
                PLAN-PARSE
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                v0.1.0
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-600">
          {/* Features Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              type="button"
              className="flex items-center space-x-1.5 py-1.5 px-2 rounded hover:text-slate-100 hover:bg-workbench-hover transition-colors"
            >
              <span>Features</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180 text-sky-400" : "text-slate-400"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-80 rounded-lg border border-workbench-border bg-workbench-panel p-2 shadow-2xl backdrop-blur-xl z-50">
                <div className="px-2 py-1.5 mb-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-workbench-border">
                  Core Architectural Features
                </div>
                <div className="space-y-1">
                  {FEATURES.map((feature) => (
                    <Link
                      key={feature.id}
                      href={`/features/${feature.slug}/`}
                      onClick={() => setDropdownOpen(false)}
                      className="group flex items-start justify-between p-2 rounded hover:bg-workbench-hover transition-colors"
                    >
                      <div>
                        <div className="text-xs font-medium text-slate-200 dark:text-slate-200 light:text-slate-800 group-hover:text-sky-400 transition-colors">
                          {feature.navTitle}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">
                          {feature.tagline}
                        </div>
                      </div>
                      <span className="ml-2 px-1.5 py-0.5 text-[9px] font-mono rounded bg-slate-800/80 text-slate-400 border border-slate-700/50">
                        {feature.hotkey}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link href="/#the-problem" className="hover:text-slate-100 transition-colors">
            The Problem
          </Link>
          <Link href="/#accomplishments" className="hover:text-slate-100 transition-colors">
            Accomplishments
          </Link>
          <Link href="/#workflow" className="hover:text-slate-100 transition-colors">
            Workflow Guide
          </Link>
          <Link href="/#releases" className="hover:text-slate-100 transition-colors">
            Releases
          </Link>
          <Link href="/#docker" className="hover:text-slate-100 transition-colors">
            Docker
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center space-x-3">
          <ThemeToggle />

          <a
            href="https://hub.docker.com/r/aatirnadim/plan-parse"
            target="_blank"
            rel="noopener noreferrer"
            title="Docker Hub Image"
            className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md border border-workbench-border bg-workbench-panel hover:bg-workbench-hover text-slate-300 text-xs font-mono transition-colors"
          >
            <svg className="w-3.5 h-3.5 text-sky-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.186.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.186.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.186.186.186m5.893 2.715h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.186.186 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186H8.1a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.185-.186H5.136a.186.186 0 00-.186.185v1.888c0 .102.084.185.186.185m-2.928 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.185-.186H2.208a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m21.688 1.258c-.312-.224-.872-.375-1.503-.375-.24 0-.49.022-.728.065-.367-1.127-1.428-1.93-2.678-1.93-.32 0-.628.055-.914.156-.37-.775-1.134-1.306-2.023-1.306-.47 0-.91.144-1.277.393V1.69a.186.186 0 00-.186-.186h-2.12a.185.185 0 00-.185.186v5.82a.185.185 0 00.185.185h4.63c.123 0 .235.047.32.124.084.076.136.184.136.305v.004c0 .24-.194.433-.434.433H1.472a.735.735 0 00-.736.736c0 1.278.337 2.502.977 3.542 1.34 2.18 3.654 3.633 6.36 3.992 1.05.139 2.12.139 3.17 0 2.548-.338 4.743-1.636 6.096-3.606.59-.858.983-1.83 1.145-2.857.48.09 1.02.046 1.487-.206.58-.314.93-.837.93-1.434 0-.458-.198-.823-.49-1.024"/>
            </svg>
            <span>Docker</span>
          </a>

          <a
            href="https://github.com/AatirNadim/plan-parse"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md border border-workbench-border bg-workbench-panel hover:bg-workbench-hover text-slate-200 text-xs font-medium transition-colors"
          >
            <svg className="w-4 h-4 text-slate-300" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span className="hidden sm:inline">GitHub</span>
          </a>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            type="button"
            className="md:hidden p-2 rounded-md border border-workbench-border bg-workbench-panel text-slate-300"
            aria-label="Toggle navigation menu"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <div className="md:hidden border-b border-workbench-border bg-workbench-panel px-4 pt-2 pb-6 space-y-3">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 py-1 border-b border-workbench-border">
            Feature Chapters
          </div>
          <div className="grid grid-cols-1 gap-1">
            {FEATURES.map((feature) => (
              <Link
                key={feature.id}
                href={`/features/${feature.slug}/`}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-1.5 px-2 text-xs text-slate-300 hover:text-sky-400"
              >
                <span>{feature.title}</span>
                <span className="text-[10px] font-mono text-slate-400">[{feature.hotkey}]</span>
              </Link>
            ))}
          </div>
          <div className="pt-2 border-t border-workbench-border flex flex-col space-y-2 text-xs text-slate-300">
            <Link href="/#the-problem" onClick={() => setMobileMenuOpen(false)}>The Problem</Link>
            <Link href="/#accomplishments" onClick={() => setMobileMenuOpen(false)}>Accomplishments</Link>
            <Link href="/#workflow" onClick={() => setMobileMenuOpen(false)}>Workflow Guide</Link>
            <Link href="/#releases" onClick={() => setMobileMenuOpen(false)}>Releases</Link>
            <Link href="/#docker" onClick={() => setMobileMenuOpen(false)}>Docker</Link>
          </div>
        </div>
      )}
    </header>
  );
}
