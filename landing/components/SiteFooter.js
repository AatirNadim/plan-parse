import Link from "next/link";
import { FEATURES } from "../lib/features-data";

export default function SiteFooter() {
  return (
    <footer className="border-t border-workbench-border bg-workbench-panel/60 backdrop-blur-md text-xs text-slate-400 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <img src="/icon.svg" alt="plan-parse icon" className="w-5 h-5" />
              <span className="font-mono font-semibold tracking-tight text-slate-200 light:text-slate-800">
                PLAN-PARSE
              </span>
              <span className="px-1.5 py-0.2 text-[10px] font-mono rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                v0.1.0
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Visual Infrastructure Assurance for Terraform & OpenTofu. Transforming dense JSON execution plans into interactive, hierarchical DAGs with blast radius isolation.
            </p>
            <div className="pt-2 flex items-center space-x-3 text-[11px] font-mono text-slate-400">
              <span className="inline-flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Zero Telemetry</span>
              </span>
              <span>•</span>
              <span>100% Client-Side</span>
              <span>•</span>
              <span>MIT License</span>
            </div>
          </div>

          {/* Features Navigation */}
          <div className="space-y-2">
            <div className="font-mono text-[11px] uppercase tracking-wider text-slate-300 light:text-slate-700 font-semibold">
              Deep-Dive Chapters
            </div>
            <ul className="space-y-1.5">
              {FEATURES.slice(0, 4).map((f) => (
                <li key={f.id}>
                  <Link
                    href={`/features/${f.slug}/`}
                    className="hover:text-sky-400 transition-colors"
                  >
                    {f.navTitle}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Features Navigation Part 2 */}
          <div className="space-y-2">
            <div className="font-mono text-[11px] uppercase tracking-wider text-slate-300 light:text-slate-700 font-semibold">
              More Chapters
            </div>
            <ul className="space-y-1.5">
              {FEATURES.slice(4).map((f) => (
                <li key={f.id}>
                  <Link
                    href={`/features/${f.slug}/`}
                    className="hover:text-sky-400 transition-colors"
                  >
                    {f.navTitle}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/#workflow" className="hover:text-sky-400 transition-colors">
                  Workflow Guide
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources & Distribution */}
          <div className="space-y-2">
            <div className="font-mono text-[11px] uppercase tracking-wider text-slate-300 light:text-slate-700 font-semibold">
              Distribution & Links
            </div>
            <ul className="space-y-1.5">
              <li>
                <a
                  href="https://github.com/AatirNadim/plan-parse/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sky-400 transition-colors flex items-center space-x-1"
                >
                  <span>GitHub Releases (Binaries)</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </li>
              <li>
                <a
                  href="https://hub.docker.com/r/aatirnadim/plan-parse"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sky-400 transition-colors flex items-center space-x-1"
                >
                  <span>Docker Hub Image</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/AatirNadim/plan-parse"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sky-400 transition-colors flex items-center space-x-1"
                >
                  <span>GitHub Repository</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/AatirNadim/plan-parse/blob/main/LICENSE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sky-400 transition-colors"
                >
                  MIT License
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-workbench-border flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400">
          <div>
            Built with Next.js & Tailwind CSS. Designed for Terraform & OpenTofu engineers.
          </div>
          <div className="mt-2 sm:mt-0 font-mono">
            plan-parse © 2026 Aatir Nadim. Open Source Software.
          </div>
        </div>
      </div>
    </footer>
  );
}
