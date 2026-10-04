import FeatureNav, { FeatureBreadcrumbs, FeaturePagination } from "./FeatureNav";
import CalloutImage from "./CalloutImage";

export default function FeaturePageTemplate({ feature }) {
  if (!feature) return null;

  return (
    <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
      {/* Top Breadcrumb Stepper */}
      <FeatureBreadcrumbs currentSlug={feature.slug} />

      {/* Two-Column Deep Dive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Left Column: Chapter Index Navigation (bounded within parent, natural height) */}
        <aside className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24 self-start">
          <FeatureNav currentSlug={feature.slug} />
        </aside>

        {/* Right Column: Actual Chapter Scrollable Content (Centered Reading Flow) */}
        <div className="lg:col-span-8 xl:col-span-9 min-w-0">
          {/* Feature Header */}
          <header className="mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 light:text-sky-700 border border-sky-500/20 font-bold light:shadow-xs">
                {feature.badge}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-workbench-panel text-slate-700 dark:text-slate-300 light:text-slate-900 border border-workbench-border font-semibold light:shadow-xs">
                Shortcut: [{feature.hotkey}]
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold light:font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
              {feature.title}
            </h1>

            <p className="mt-3 text-base text-slate-600 dark:text-slate-400 light:text-slate-800 light:font-medium leading-relaxed">
              {feature.tagline}
            </p>
          </header>

          {/* Dedicated Zoomed-In Interactive SVG Diagram */}
          <div id="overview" className="scroll-mt-24">
            <CalloutImage
              svgSrc={feature.svgFile}
              title={feature.title}
              callouts={feature.callouts}
            />
          </div>

          {/* Technical Deep Dive Sections */}
          <div className="space-y-10 mt-12 text-sm leading-relaxed">
            {/* The Problem */}
            {feature.theProblem && (
              <section
                id="the-problem"
                className="scroll-mt-24 p-6 rounded-xl border border-rose-500/20 bg-gradient-to-b from-rose-500/[0.04] to-rose-500/[0.01] dark:from-rose-500/[0.06] dark:to-rose-500/[0.02] backdrop-blur-[2px] shadow-sm light:shadow-md light:border-rose-400/30"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <h2 className="font-mono text-xs uppercase tracking-wider text-rose-500 dark:text-rose-400 font-bold light:text-rose-700">
                    The Problem
                  </h2>
                </div>
                <h3 className="text-base font-semibold light:font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {feature.theProblem.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 light:text-slate-900 light:font-medium leading-relaxed">
                  {feature.theProblem.description}
                </p>
              </section>
            )}

            {/* The Algorithm / Implementation */}
            {feature.theAlgorithm && (
              <section
                id="the-algorithm"
                className="scroll-mt-24 p-6 rounded-xl border border-sky-500/20 bg-gradient-to-b from-sky-500/[0.05] via-sky-500/[0.02] to-transparent dark:from-sky-500/[0.06] dark:via-sky-500/[0.02] dark:to-transparent backdrop-blur-[2px] shadow-sm light:shadow-md light:border-sky-400/30"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                  <h2 className="font-mono text-xs uppercase tracking-wider text-sky-500 dark:text-sky-400 font-bold light:text-sky-700">
                    Under the Hood: Engine &amp; Algorithm
                  </h2>
                </div>
                <h3 className="text-base font-semibold light:font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {feature.theAlgorithm.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 light:text-slate-900 light:font-medium leading-relaxed">
                  {feature.theAlgorithm.description}
                </p>
              </section>
            )}

            {/* How to Use */}
            {feature.howToUse && (
              <section
                id="how-to-use"
                className="scroll-mt-24 p-6 rounded-xl border border-workbench-border bg-gradient-to-b from-workbench-panel/90 via-workbench-panel/75 to-workbench-panel/50 dark:from-workbench-panel/80 dark:to-workbench-panel/40 backdrop-blur-[2px] shadow-sm light:shadow-md"
              >
                <h2 className="font-mono text-xs uppercase tracking-wider text-slate-700 dark:text-slate-400 light:text-slate-900 mb-4 font-bold">
                  Workstation Flow: How to Use
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {feature.howToUse.map((step) => (
                    <div
                      key={step.step}
                      className="p-4 rounded-lg bg-workbench-subpanel/80 dark:bg-workbench-subpanel/50 border border-workbench-border shadow-xs light:shadow-xs backdrop-blur-[2px]"
                    >
                      <div className="flex items-center space-x-2 mb-1.5">
                        <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-500 dark:text-sky-400 light:text-sky-700 font-mono text-[11px] font-bold flex items-center justify-center light:shadow-xs">
                          {step.step}
                        </span>
                        <span className="text-xs font-semibold light:font-bold text-slate-900 dark:text-slate-200">
                          {step.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 light:text-slate-800 light:font-medium leading-relaxed">
                        {step.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* SRE Scenario */}
            {feature.scenario && (
              <section
                id="scenario"
                className="scroll-mt-24 p-6 rounded-xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.05] via-emerald-500/[0.02] to-transparent dark:from-emerald-500/[0.06] dark:via-emerald-500/[0.02] dark:to-transparent backdrop-blur-[2px] shadow-sm light:shadow-md light:border-emerald-500/40"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <h2 className="font-mono text-xs uppercase tracking-wider text-emerald-500 dark:text-emerald-400 font-bold light:text-emerald-700">
                    Real-World SRE &amp; Platform Scenario
                  </h2>
                </div>
                <h3 className="text-base font-semibold light:font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {feature.scenario.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 light:text-slate-900 light:font-medium leading-relaxed">
                  {feature.scenario.description}
                </p>
              </section>
            )}
          </div>

          {/* Chapter Pagination at the bottom */}
          <FeaturePagination currentSlug={feature.slug} />
        </div>
      </div>
    </article>
  );
}
