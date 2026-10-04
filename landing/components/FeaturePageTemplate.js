import FeatureNav, { FeaturePagination } from "./FeatureNav";
import CalloutImage from "./CalloutImage";

export default function FeaturePageTemplate({ feature }) {
  if (!feature) return null;

  return (
    <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <FeatureNav currentSlug={feature.slug} />

      {/* Feature Header */}
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold">
            {feature.badge}
          </span>
          <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-workbench-panel text-slate-700 dark:text-slate-300 border border-workbench-border">
            Shortcut: [{feature.hotkey}]
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
          {feature.title}
        </h1>

        <p className="mt-3 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          {feature.tagline}
        </p>
      </header>

      {/* Dedicated Zoomed-In Interactive SVG Diagram */}
      <CalloutImage
        svgSrc={feature.svgFile}
        title={feature.title}
        callouts={feature.callouts}
      />

      {/* Technical Deep Dive Sections */}
      <div className="space-y-10 mt-12 text-sm leading-relaxed">
        {/* The Problem */}
        {feature.theProblem && (
          <section className="p-6 rounded-xl border border-rose-500/20 bg-rose-500/[0.02] dark:bg-[#120e14]">
            <div className="flex items-center space-x-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <h2 className="font-mono text-xs uppercase tracking-wider text-rose-400 font-bold">
                The Problem
              </h2>
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
              {feature.theProblem.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {feature.theProblem.description}
            </p>
          </section>
        )}

        {/* The Algorithm / Implementation */}
        {feature.theAlgorithm && (
          <section className="p-6 rounded-xl border border-sky-500/20 bg-sky-500/[0.02] dark:bg-[#0c131d]">
            <div className="flex items-center space-x-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              <h2 className="font-mono text-xs uppercase tracking-wider text-sky-400 font-bold">
                Under the Hood: Engine &amp; Algorithm
              </h2>
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
              {feature.theAlgorithm.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {feature.theAlgorithm.description}
            </p>
          </section>
        )}

        {/* How to Use */}
        {feature.howToUse && (
          <section className="p-6 rounded-xl border border-workbench-border bg-workbench-panel">
            <h2 className="font-mono text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 font-semibold">
              Workstation Flow: How to Use
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {feature.howToUse.map((step) => (
                <div key={step.step} className="p-4 rounded-lg bg-workbench-subpanel border border-workbench-border">
                  <div className="flex items-center space-x-2 mb-1.5">
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-mono text-[11px] font-bold flex items-center justify-center">
                      {step.step}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {step.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SRE Scenario */}
        {feature.scenario && (
          <section className="p-6 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] dark:bg-[#0c1613]">
            <div className="flex items-center space-x-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <h2 className="font-mono text-xs uppercase tracking-wider text-emerald-400 font-bold">
                Real-World SRE &amp; Platform Scenario
              </h2>
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
              {feature.scenario.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {feature.scenario.description}
            </p>
          </section>
        )}
      </div>

      {/* Chapter Pagination at the bottom */}
      <FeaturePagination currentSlug={feature.slug} />
    </article>
  );
}
