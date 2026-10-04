import Link from "next/link";
import CodeBlock from "../components/CodeBlock";
import { FEATURES } from "../lib/features-data";

export default function HomePage() {
  return (
    <div className="space-y-24 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* 1. HERO SEGMENT */}
      <section className="relative text-center pt-8 pb-12 sm:pt-14 sm:pb-20">
        {/* Subtle static ambient glow behind Hero */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 -z-10 pointer-events-none overflow-hidden opacity-60 dark:opacity-20 select-none">
          <div className="w-[640px] h-[280px] mx-auto bg-gradient-to-b from-sky-400/25 via-sky-300/10 to-transparent blur-3xl rounded-full" />
        </div>

        {/* Subtle grid background highlight */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-workbench-border bg-workbench-panel text-xs text-slate-700 dark:text-slate-300 light:font-semibold light:text-slate-900 shadow-sm light:shadow-sm mb-6 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>v1.0.0 Released</span>
          <span className="text-slate-500 dark:text-slate-400">•</span>
          <span className="text-sky-500 dark:text-sky-400 light:text-sky-600 font-bold">Zero Telemetry Local Binary</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold light:font-extrabold tracking-tight sm:tracking-tighter text-slate-900 dark:text-slate-100 max-w-4xl mx-auto leading-tight sm:leading-none">
          Visual Infrastructure Assurance for{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-400">
            Terraform &amp; OpenTofu
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-400 light:text-slate-800 light:font-medium max-w-3xl mx-auto leading-relaxed">
          Transform dense, thousands-of-lines terminal plan outputs into an interactive, hierarchical DAG. Eliminate cascading destruction, audit transitive blast radius, and inspect 2-tier resource diffs before running apply.
        </p>

        {/* Hero CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href="https://github.com/AatirNadim/plan-parse/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-lg bg-sky-500 hover:bg-sky-400 active:bg-sky-600 active:translate-y-[0.5px] text-slate-950 font-bold text-sm transition-all shadow-lg shadow-sky-500/10 light:shadow-md light:shadow-sky-500/20 active:light:shadow-xs"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Download Release Binary</span>
          </a>

          <a
            href="https://github.com/AatirNadim/plan-parse"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-lg border border-workbench-border bg-workbench-panel hover:bg-workbench-hover text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-sm font-medium light:font-semibold light:text-slate-900 shadow-sm light:shadow-sm transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span>View on GitHub</span>
          </a>

          <a
            href="https://hub.docker.com/r/aatir0docking/plan-parse"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-5 py-3 rounded-lg border border-workbench-border bg-workbench-panel hover:bg-workbench-hover text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-sm font-medium light:font-semibold light:text-slate-900 font-mono shadow-sm light:shadow-sm transition-colors"
          >
            <span className="text-sky-500 dark:text-sky-400 light:text-sky-600 font-bold">docker pull</span>
            <span>aatir0docking/plan-parse</span>
          </a>
        </div>

        {/* Copyable Quickstart Docker Command */}
        <div className="max-w-xl mx-auto mt-6 text-left">
          <CodeBlock
            code="docker pull aatir0docking/plan-parse:latest"
            label="Quickstart Docker Pull"
          />
        </div>
      </section>

      {/* 2. THE PROBLEM & ACCOMPLISHMENTS (Contrast Grid) */}
      <section id="the-problem" className="pt-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="font-mono text-xs uppercase tracking-wider text-sky-500 dark:text-sky-400 light:text-sky-700 light:font-bold mb-2">
            Architectural Motivation
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold light:font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Why Traditional Plan Reviews Fail at Scale
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 light:text-slate-800 light:font-medium leading-relaxed">
            Terraform CLI outputs are linear and text-based. In contrast, cloud infrastructures are non-linear, deeply interdependent Directed Acyclic Graphs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="accomplishments">
          {/* Column 1: Traditional CLI Pain */}
          <div className="p-6 rounded-xl border border-rose-500/20 bg-gradient-to-b from-rose-500/[0.04] to-rose-500/[0.01] dark:from-[#130d12] dark:to-[#130d12] space-y-4 shadow-sm light:shadow-md light:border-rose-400/30">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <h3 className="font-mono text-sm uppercase tracking-wider text-rose-500 dark:text-rose-400 font-bold light:text-rose-700">
                Traditional Terminal Output
              </h3>
            </div>
            <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-300 light:text-slate-900 light:font-medium leading-relaxed">
              <li className="flex items-start space-x-2">
                <span className="text-rose-500 font-bold">✕</span>
                <span>
                  <strong className="text-slate-900 dark:text-slate-100 font-bold">Thousands of Lines of Dense Text:</strong> Critical resource replacements (<code className="text-rose-500 dark:text-rose-400 font-mono font-semibold">+/-</code>) are easily overlooked amidst 5,000 lines of scrolling JSON/terminal output.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-rose-500 font-bold">✕</span>
                <span>
                  <strong className="text-slate-900 dark:text-slate-100 font-bold">Invisible Blast Radius:</strong> Changing a base subnet or security group does not reveal which downstream databases or services will cascade into re-creation.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-rose-500 font-bold">✕</span>
                <span>
                  <strong className="text-slate-900 dark:text-slate-100 font-bold">Cognitive Overload:</strong> When only 3 out of 250 resources mutate, reviewing the full plan requires manual cognitive filtering of 247 unchanged lines.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-rose-500 font-bold">✕</span>
                <span>
                  <strong className="text-slate-900 dark:text-slate-100 font-bold">Outage Vulnerability:</strong> Forced resource replacements happen silently during apply, tearing down production databases unexpectedly.
                </span>
              </li>
            </ul>
          </div>

          {/* Column 2: plan-parse Visual Assurance */}
          <div className="p-6 rounded-xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.05] via-emerald-500/[0.02] to-transparent dark:from-[#0c1614] dark:to-[#0c1614] space-y-4 shadow-sm light:shadow-md light:border-emerald-500/40">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <h3 className="font-mono text-sm uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold light:text-emerald-700">
                plan-parse Visual Assurance
              </h3>
            </div>
            <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-300 light:text-slate-900 light:font-medium leading-relaxed">
              <li className="flex items-start space-x-2">
                <span className="text-emerald-500 dark:text-emerald-400 font-bold">✓</span>
                <span>
                  <strong className="text-slate-900 dark:text-slate-100 font-bold">Interactive Cytoscape DAG:</strong> Complete hierarchical visualization reflecting the exact dependency graph of your infrastructure.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-500 dark:text-emerald-400 font-bold">✓</span>
                <span>
                  <strong className="text-slate-900 dark:text-slate-100 font-bold">Transitive Blast Radius Traversal:</strong> Instant automated BFS traversal flagging direct and indirect casualties with severity metrics.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-500 dark:text-emerald-400 font-bold">✓</span>
                <span>
                  <strong className="text-slate-900 dark:text-slate-100 font-bold">Mutations-Only DAG Contraction:</strong> Prunes no-op nodes and synthesizes bridging edges so you focus 100% on actual mutations.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-500 dark:text-emerald-400 font-bold">✓</span>
                <span>
                  <strong className="text-slate-900 dark:text-slate-100 font-bold">100% Privacy &amp; Zero Dependencies:</strong> Single zero-dependency Go binary or Docker container; parsing runs entirely client-side in your browser.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3. FEATURE DIRECTORY GRID */}
      <section className="pt-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="font-mono text-xs uppercase tracking-wider text-sky-500 dark:text-sky-400 light:text-sky-700 light:font-bold mb-2">
            Comprehensive Documentation
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold light:font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Dedicated Architectural Deep-Dives
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 light:text-slate-800 light:font-medium leading-relaxed">
            Every core capability of plan-parse is documented with interactive diagrams, real Terraform fixtures, and algorithmic explanations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, idx) => (
            <Link
              key={feature.id}
              href={`/features/${feature.slug}/`}
              className="group p-5 rounded-xl border border-workbench-border bg-gradient-to-b from-workbench-panel to-workbench-panel/85 hover:from-workbench-hover/70 hover:to-workbench-panel hover:border-sky-500/40 transition-all duration-200 flex flex-col justify-between shadow-sm light:shadow-sm hover:light:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 light:text-sky-700 border border-sky-500/20 font-bold">
                    {feature.badge}
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-100 dark:bg-[#161b26] text-slate-700 dark:text-slate-400 light:text-slate-800 light:font-semibold border border-workbench-border">
                    {feature.hotkey}
                  </span>
                </div>
                <h3 className="text-sm font-semibold light:font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors">
                  {idx + 1}. {feature.title}
                </h3>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 light:text-slate-800 light:font-medium leading-relaxed">
                  {feature.tagline}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-workbench-border/60 flex items-center justify-between text-[11px] font-mono text-sky-600 dark:text-sky-400 light:text-sky-700 light:font-bold">
                <span>Explore Chapter</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. END-USER WORKFLOW GUIDE */}
      <section id="workflow" className="pt-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="font-mono text-xs uppercase tracking-wider text-sky-500 dark:text-sky-400 mb-2">
            Execution Flow
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold light:font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            How to Use plan-parse in 4 Steps
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 light:text-slate-800 light:font-medium leading-relaxed">
            Seamlessly integrate visual assurance into your daily terminal development workflow or CI/CD pipelines.
          </p>
        </div>

        <div className="space-y-6">
          {/* Step 1 */}
          <div className="p-6 rounded-xl border border-workbench-border bg-workbench-panel shadow-sm light:shadow-sm">
            <div className="flex items-center space-x-3 mb-3">
              <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-500 dark:text-sky-400 light:text-sky-700 border border-sky-500/40 font-mono text-xs font-bold flex items-center justify-center light:shadow-xs">
                1
              </span>
              <h3 className="text-sm font-semibold light:font-bold text-slate-900 dark:text-slate-100">
                Export Terraform or OpenTofu Plan JSON
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 light:text-slate-800 light:font-medium leading-relaxed mb-3">
              Generate the standard JSON representation of your execution plan using the standard CLI tools:
            </p>
            <CodeBlock
              code={`# Standard Terraform flow
terraform plan -out=tfplan
terraform show -json tfplan > plan.json

# OpenTofu equivalent
tofu plan -out=tofuplan
tofu show -json tofuplan > plan.json`}
              label="Terminal Export Snippet"
            />
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-xl border border-workbench-border bg-workbench-panel shadow-sm light:shadow-sm">
            <div className="flex items-center space-x-3 mb-3">
              <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-500 dark:text-sky-400 light:text-sky-700 border border-sky-500/40 font-mono text-xs font-bold flex items-center justify-center light:shadow-xs">
                2
              </span>
              <h3 className="text-sm font-semibold light:font-bold text-slate-900 dark:text-slate-100">
                Launch plan-parse via Binary or Docker
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 light:text-slate-800 light:font-medium leading-relaxed mb-3">
              Pass your plan file directly to the standalone binary, run via Docker, or drop the file into the web UI:
            </p>
            <CodeBlock
              code={`# Option A: Standalone Binary
./plan-parse plan.json

# Option B: Docker Container (read-only mount)
docker run -it --rm -p 8080:8080 -v $(pwd):/workspace:ro aatir0docking/plan-parse:latest plan.json

# The workbench will automatically open at http://localhost:8080`}
              label="Launch Options"
            />
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-xl border border-workbench-border bg-workbench-panel shadow-sm light:shadow-sm">
            <div className="flex items-center space-x-3 mb-3">
              <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-500 dark:text-sky-400 light:text-sky-700 border border-sky-500/40 font-mono text-xs font-bold flex items-center justify-center light:shadow-xs">
                3
              </span>
              <h3 className="text-sm font-semibold light:font-bold text-slate-900 dark:text-slate-100">
                Audit DAG, Isolate Blast Radius, and Review Diffs
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 light:text-slate-800 light:font-medium leading-relaxed">
              Use keyboard accelerators for rapid navigation: press <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#161b26] border border-workbench-border text-sky-600 dark:text-sky-400 light:text-sky-700 font-mono font-bold">C</code> to collapse unchanged clusters, click any mutating node and press <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#161b26] border border-workbench-border text-amber-600 dark:text-amber-400 light:text-amber-700 font-mono font-bold">B</code> to isolate the blast radius, and hit <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#161b26] border border-workbench-border text-emerald-600 dark:text-emerald-400 light:text-emerald-700 font-mono font-bold">D</code> to inspect line-by-line HCL diffs.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-6 rounded-xl border border-workbench-border bg-workbench-panel shadow-sm light:shadow-sm">
            <div className="flex items-center space-x-3 mb-3">
              <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-500 dark:text-sky-400 light:text-sky-700 border border-sky-500/40 font-mono text-xs font-bold flex items-center justify-center light:shadow-xs">
                4
              </span>
              <h3 className="text-sm font-semibold light:font-bold text-slate-900 dark:text-slate-100">
                Safely Apply or Generate Targeted Rollout Commands
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 light:text-slate-800 light:font-medium leading-relaxed mb-3">
              Once verified, execute your deployment with absolute confidence. If you need a canary rollout, copy the generated targeted apply syntax:
            </p>
            <CodeBlock
              code={`# Safely apply full verified plan
terraform apply tfplan

# Or apply only verified isolated sub-resources
terraform apply -target="module.vpc.aws_subnet.private[0]"`}
              label="Targeted Apply Generation"
            />
          </div>
        </div>
      </section>

      {/* 5. DOWNLOAD & DOCKER HUB REFERENCE CARD */}
      <section id="releases" className="pt-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="font-mono text-xs uppercase tracking-wider text-sky-500 dark:text-sky-400 light:text-sky-700 light:font-bold mb-2">
            Distribution Channels
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold light:font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Binary Downloads &amp; Docker Image
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 light:text-slate-800 light:font-medium leading-relaxed">
            Zero-dependency standalone executables compiled for all major operating systems, plus official Docker Hub images.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* OS Binary Downloads Grid */}
          <div className="p-6 rounded-xl border border-workbench-border bg-workbench-panel space-y-4 shadow-sm light:shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold light:font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <span>Standalone Pre-Compiled Binaries</span>
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 light:text-emerald-700 border border-emerald-500/20 font-bold">
                v1.0.0
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 light:text-slate-800 light:font-medium leading-relaxed">
              No Node.js, Go, or Python runtime required. Single binary with the visualizer UI pre-embedded:
            </p>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-workbench-subpanel border border-workbench-border text-xs shadow-xs light:shadow-xs">
                <div className="flex items-center space-x-2 font-mono">
                  <span className="text-slate-700 dark:text-slate-300 light:text-slate-950 font-bold">Linux</span>
                  <span className="text-slate-500 dark:text-slate-400 light:text-slate-600 font-medium">amd64 / arm64</span>
                </div>
                <a
                  href="https://github.com/AatirNadim/plan-parse/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-600 dark:text-sky-400 light:text-sky-700 hover:text-sky-500 dark:hover:text-sky-300 font-mono text-[11px] font-bold"
                >
                  Download .tar.gz →
                </a>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-workbench-subpanel border border-workbench-border text-xs shadow-xs light:shadow-xs">
                <div className="flex items-center space-x-2 font-mono">
                  <span className="text-slate-700 dark:text-slate-300 light:text-slate-950 font-bold">macOS</span>
                  <span className="text-slate-500 dark:text-slate-400 light:text-slate-600 font-medium">Apple Silicon (M1/M2/M3) &amp; Intel</span>
                </div>
                <a
                  href="https://github.com/AatirNadim/plan-parse/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-600 dark:text-sky-400 light:text-sky-700 hover:text-sky-500 dark:hover:text-sky-300 font-mono text-[11px] font-bold"
                >
                  Download .tar.gz →
                </a>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-workbench-subpanel border border-workbench-border text-xs shadow-xs light:shadow-xs">
                <div className="flex items-center space-x-2 font-mono">
                  <span className="text-slate-700 dark:text-slate-300 light:text-slate-950 font-bold">Windows</span>
                  <span className="text-slate-500 dark:text-slate-400 light:text-slate-600 font-medium">x64 (.exe)</span>
                </div>
                <a
                  href="https://github.com/AatirNadim/plan-parse/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-600 dark:text-sky-400 light:text-sky-700 hover:text-sky-500 dark:hover:text-sky-300 font-mono text-[11px] font-bold"
                >
                  Download .zip →
                </a>
              </div>
            </div>

            <div className="pt-2 text-center">
              <a
                href="https://github.com/AatirNadim/plan-parse/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-sky-600 dark:text-sky-400 light:text-sky-700 hover:text-sky-500 dark:hover:text-sky-300 font-bold"
              >
                View all release checksums and changelog on GitHub Releases →
              </a>
            </div>
          </div>

          {/* Docker Container Hub Reference */}
          <div id="docker" className="p-6 rounded-xl border border-workbench-border bg-workbench-panel space-y-4 shadow-sm light:shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold light:font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <span>Official Docker Hub Container</span>
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 light:text-sky-700 border border-sky-500/20 font-bold">
                Docker Hub
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 light:text-slate-800 light:font-medium leading-relaxed">
              Mount your working directory as read-only (<code className="text-sky-600 dark:text-sky-400 light:text-sky-700 font-mono font-bold">:ro</code>) for complete security isolation:
            </p>

            <CodeBlock
              code={`# Run with local plan file mounted read-only
docker run -it --rm \\
  -p 8080:8080 \\
  -v $(pwd):/workspace:ro \\
  aatir0docking/plan-parse:latest plan.json`}
              label="Docker Run Command"
            />

            <div className="p-3 rounded-lg bg-emerald-500/[0.04] border border-emerald-500/20 text-xs text-slate-700 dark:text-slate-300 light:text-slate-900 shadow-xs light:shadow-xs">
              <div className="font-bold text-emerald-600 dark:text-emerald-400 light:text-emerald-800 font-mono mb-1">
                Security &amp; Air-Gapped Assurance
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400 light:text-slate-800 light:font-medium">
                The container requires zero network egress. The read-only flag guarantees your local files and state cannot be modified.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
