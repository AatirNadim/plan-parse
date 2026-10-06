"use client";

import { useState, useEffect, useRef } from "react";

export default function CalloutImage({ svgSrc, title, callouts = [] }) {
  const [hoveredPin, setHoveredPin] = useState(null);
  const [selectedPin, setSelectedPin] = useState(null);
  const activePin = hoveredPin ?? selectedPin;
  const [svgContent, setSvgContent] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    fetch(svgSrc)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load SVG");
        return res.text();
      })
      .then((text) => {
        if (isMounted) setSvgContent(text);
      })
      .catch((e) => {
        console.warn("SVG inline fetch failed, falling back to img:", e);
      });
    return () => {
      isMounted = false;
    };
  }, [svgSrc]);

  // Synchronize activePin with vector DOM
  useEffect(() => {
    if (!containerRef.current) return;
    const pins = containerRef.current.querySelectorAll(".callout-pin");
    pins.forEach((pinEl) => {
      const textEl = pinEl.querySelector("text");
      const pinNum = textEl ? parseInt(textEl.textContent.trim(), 10) : null;

      let origTransform = pinEl.getAttribute("data-orig-transform");
      if (!origTransform) {
        origTransform = pinEl.getAttribute("transform") || "";
        pinEl.setAttribute("data-orig-transform", origTransform);
      }

      if (pinNum !== null && pinNum === activePin) {
        pinEl.classList.add("is-active");
        pinEl.setAttribute("transform", `${origTransform} scale(1.18)`);
      } else {
        pinEl.classList.remove("is-active");
        pinEl.setAttribute("transform", origTransform);
      }

      pinEl.onmouseenter = () => setHoveredPin(pinNum);
      pinEl.onmouseleave = () => setHoveredPin(null);
      pinEl.onclick = (e) => {
        e.stopPropagation();
        setSelectedPin((prev) => (prev === pinNum ? null : pinNum));
      };
    });
  }, [svgContent, activePin]);

  return (
    <div className="rounded-xl border border-workbench-border bg-workbench-panel overflow-hidden shadow-xl my-8">
      {/* Visual Window Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-workbench-border bg-workbench-subpanel text-xs">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
          <span className="ml-2 font-mono text-[11px] text-slate-700 dark:text-slate-300 font-medium">
            {title} — Interactive Diagram
          </span>
        </div>
        <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500 dark:text-slate-400">
          <span>16:9 Wide Vector</span>
          <span>•</span>
          <span className="text-sky-500 dark:text-sky-400">Bidirectional Pin Sync Active</span>
        </div>
      </div>

      {/* SVG Image Container */}
      <div
        className="relative p-2 sm:p-4 bg-[#090a0f] flex items-center justify-center overflow-hidden"
        onClick={() => setSelectedPin(null)}
      >
        <div
          ref={containerRef}
          className="w-full relative aspect-[16/9] rounded-lg border border-workbench-border/60 overflow-hidden bg-[#090a0f] flex items-center justify-center"
        >
          {svgContent ? (
            <div
              className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          ) : (
            <img
              src={svgSrc}
              alt={title}
              className="w-full h-full object-contain"
            />
          )}
        </div>
      </div>

      {/* Synchronized Callout Legend / Badges */}
      <div className="p-4 sm:p-6 border-t border-workbench-border bg-workbench-panel">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 font-semibold flex items-center justify-between">
          <span>Annotated Architectural Callouts (Hover card or pin to highlight)</span>
          {selectedPin !== null && (
            <button
              onClick={() => setSelectedPin(null)}
              className="text-[10px] text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 underline font-normal normal-case focus:outline-none focus:ring-1 focus:ring-sky-500 rounded px-1"
            >
              Clear pin
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {callouts.map((item) => {
            const isHighlighted = activePin === item.pin;
            const isSelected = selectedPin === item.pin;
            return (
              <div
                key={item.pin}
                role="button"
                tabIndex={0}
                onMouseEnter={() => setHoveredPin(item.pin)}
                onMouseLeave={() => setHoveredPin(null)}
                onClick={() => setSelectedPin((prev) => (prev === item.pin ? null : item.pin))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedPin((prev) => (prev === item.pin ? null : item.pin));
                  }
                }}
                className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500/50 ${
                  isHighlighted
                    ? "border-sky-500 bg-sky-500/10 shadow-md ring-1 ring-sky-500/30"
                    : "border-workbench-border/80 bg-workbench-subpanel/50 hover:bg-workbench-hover/80 hover:border-slate-400 dark:hover:border-slate-600"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs transition-all duration-200 ${
                      isHighlighted
                        ? "bg-sky-500 text-slate-950 ring-2 ring-sky-300 scale-110 shadow-md shadow-sky-500/40"
                        : "bg-sky-500/10 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400 border border-sky-500/30 dark:border-sky-500/40"
                    }`}
                  >
                    {item.pin}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {item.title}
                      </h4>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/15 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400 border border-sky-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 dark:bg-sky-400 animate-pulse" />
                          Pinned
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
