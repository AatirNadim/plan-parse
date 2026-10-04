"use client";

import { useState } from "react";

export default function CodeBlock({ code, language = "bash", label = "Terminal" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy:", e);
    }
  };

  return (
    <div className="relative rounded-lg border border-workbench-border bg-slate-100 dark:bg-[#0b0e16] overflow-hidden text-sm my-4 font-mono shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 border-b border-workbench-border bg-slate-200/60 dark:bg-[#0e121d] text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
          <span className="ml-2 font-medium text-slate-600 dark:text-slate-400 tracking-wider uppercase text-[10px]">
            {label}
          </span>
        </div>
        <button
          onClick={handleCopy}
          type="button"
          aria-label="Copy code command"
          className="flex items-center space-x-1.5 px-2 py-1 rounded bg-workbench-subpanel hover:bg-workbench-hover active:bg-workbench-active text-slate-700 dark:text-slate-300 border border-workbench-border transition-colors duration-150 text-xs"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-slate-800 dark:text-slate-200 leading-relaxed font-mono text-xs md:text-sm selection:bg-sky-500/30">
        <pre className="m-0 p-0 whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
