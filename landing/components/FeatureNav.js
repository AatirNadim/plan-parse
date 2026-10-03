import Link from "next/link";
import { FEATURES, getAdjacentFeatures } from "../lib/features-data";

export default function FeatureNav({ currentSlug }) {
  const currentIndex = FEATURES.findIndex((f) => f.slug === currentSlug);
  const current = FEATURES[currentIndex];

  return (
    <div className="space-y-4 mb-8">
      {/* Breadcrumb Stepper */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-workbench-border text-xs">
        <div className="flex items-center space-x-2 text-slate-400">
          <Link href="/" className="hover:text-sky-400 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-400">Features</span>
          <span>/</span>
          <span className="text-sky-400 font-medium">{current?.navTitle}</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-mono text-slate-400">
            Chapter {currentIndex + 1} of {FEATURES.length}
          </span>
          <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-workbench-panel text-slate-300 border border-workbench-border">
            Hotkey: {current?.hotkey}
          </span>
        </div>
      </div>

      {/* Horizontal Chapter Stepper Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
        {FEATURES.map((feature, idx) => {
          const isActive = feature.slug === currentSlug;
          return (
            <Link
              key={feature.id}
              href={`/features/${feature.slug}/`}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-mono text-[11px] whitespace-nowrap transition-colors duration-150 ${
                isActive
                  ? "bg-sky-500/10 text-sky-400 border border-sky-500/30 font-medium"
                  : "bg-workbench-panel/60 text-slate-400 hover:text-slate-200 hover:bg-workbench-hover border border-workbench-border/60"
              }`}
            >
              <span className="opacity-60">{idx + 1}.</span>
              <span>{feature.navTitle}</span>
            </Link>
          );
        })}
      </div>
    </div>
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
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider group-hover:text-sky-400">
            ← Previous Chapter
          </span>
          <span className="text-xs sm:text-sm font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 mt-1">
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
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider group-hover:text-sky-400">
            Next Chapter →
          </span>
          <span className="text-xs sm:text-sm font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 mt-1">
            {next.title}
          </span>
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}
