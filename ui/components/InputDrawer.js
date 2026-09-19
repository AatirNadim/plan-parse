"use client";

import React, { useState, useRef, useCallback } from "react";

/**
 * Format bytes into human-readable string (KB, MB).
 */
function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * InputDrawer: A slide-out collapsible panel dedicated to Terraform plan JSON input.
 * Features real-time pre-flight client validations and Go server API pass-through.
 */
export default function InputDrawer({
  isOpen,
  onToggle,
  onClose,
  onPlanParsed,
  cliLoaded,
  disabled,
  currentSummary,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationState, setValidationState] = useState(null);
  // validationState: { valid: boolean, error?: string, warnings?: string[], meta?: { formatVersion, tfVersion, resourceCount } }
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [lastParsedSummary, setLastParsedSummary] = useState(null);

  const fileInputRef = useRef(null);

  // Validate file content on client-side before submission
  const validateFileContent = useCallback(async (file) => {
    if (!file) {
      setValidationState(null);
      return false;
    }

    // 1. Extension check
    if (!file.name.toLowerCase().endsWith(".json")) {
      setValidationState({
        valid: false,
        error: "Invalid file type. Please select a .json file.",
      });
      return false;
    }

    // 2. File size check (50MB server limit)
    if (file.size > 50 * 1024 * 1024) {
      setValidationState({
        valid: false,
        error: "File size exceeds 50MB limit.",
      });
      return false;
    }

    // 3. Read and parse JSON syntax
    try {
      const text = await file.text();
      if (!text.trim()) {
        setValidationState({
          valid: false,
          error: "Selected file is empty.",
        });
        return false;
      }

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (jsonErr) {
        setValidationState({
          valid: false,
          error: `JSON syntax error: ${jsonErr.message}`,
        });
        return false;
      }

      // 4. Schema validation for Terraform Plan
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        setValidationState({
          valid: false,
          error: "Invalid plan format: Expected root object.",
        });
        return false;
      }

      const formatVersion = parsed.format_version;
      const tfVersion = parsed.terraform_version;

      if (!formatVersion || typeof formatVersion !== "string" || !formatVersion.trim()) {
        setValidationState({
          valid: false,
          error: "Invalid Terraform plan: Missing or empty 'format_version'. Ensure you used 'terraform show -json <plan>'.",
        });
        return false;
      }

      if (!tfVersion || typeof tfVersion !== "string" || !tfVersion.trim()) {
        setValidationState({
          valid: false,
          error: "Invalid Terraform plan: Missing or empty 'terraform_version'. Ensure you used 'terraform show -json <plan>'.",
        });
        return false;
      }

      const resourceChanges = Array.isArray(parsed.resource_changes)
        ? parsed.resource_changes.length
        : 0;

      setValidationState({
        valid: true,
        meta: {
          formatVersion,
          tfVersion,
          resourceCount: resourceChanges,
        },
      });
      return true;
    } catch (err) {
      setValidationState({
        valid: false,
        error: `Failed to read file: ${err.message}`,
      });
      return false;
    }
  }, []);

  const handleFileSelect = async (file) => {
    if (!file) return;
    setSelectedFile(file);
    setApiError("");
    setLastParsedSummary(null);
    await validateFileContent(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await handleFileSelect(files[0]);
    }
  };

  // Submit file to Go server /api/parse
  const handleSubmit = async () => {
    if (!selectedFile || (validationState && !validationState.valid)) return;

    setLoading(true);
    setApiError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/parse", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}: Failed to parse plan`);
      }

      const graph = await res.json();
      setLastParsedSummary(graph.summary || null);
      if (onPlanParsed) {
        onPlanParsed(graph);
      }
    } catch (err) {
      setApiError(err.message || "Failed to communicate with Go server");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setValidationState(null);
    setApiError("");
    setLastParsedSummary(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      {/* Persistent Toggle Handle (Top-Left) */}
      <button
        onClick={onToggle}
        title={isOpen ? "Collapse Plan Input Panel" : "Open Plan Input Panel"}
        className={`fixed top-4 left-4 z-40 flex items-center gap-2.5 px-3.5 py-2 rounded-xl backdrop-blur-md border shadow-2xl transition-all duration-200 ${
          isOpen
            ? "bg-slate-900 border-indigo-500/50 text-indigo-400 shadow-indigo-950/40"
            : "bg-slate-900/95 border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800/90 shadow-slate-950/60"
        }`}
      >
        <svg
          className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-90 text-indigo-400" : "text-slate-400"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6h16M4 12h16M4 18h7"
          />
        </svg>
        <span className="text-xs font-semibold tracking-wide">Plan Input</span>
        {cliLoaded ? (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
            CLI
          </span>
        ) : currentSummary ? (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {currentSummary.total} res
          </span>
        ) : null}
      </button>

      {/* Slide-out Backdrop (click to close on mobile/compact) */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] transition-opacity md:hidden"
        />
      )}

      {/* Slide-out Drawer Panel */}
      <div
        className={`fixed top-0 left-0 h-full w-[420px] max-w-[92vw] z-30 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/80 shadow-2xl flex flex-col pt-16 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500" />
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Terraform Plan Input
              </h2>
              <p className="text-[11px] text-slate-400">
                Upload exported plan JSON to visualize DAG
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
            title="Collapse drawer (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {disabled && (
            <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs leading-relaxed">
              <div className="font-semibold mb-0.5">CLI Session Active</div>
              Input is currently locked to the CLI-loaded plan. Reload the page to load an arbitrary plan.
            </div>
          )}

          {/* Dedicated File Dropzone / Upload Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Plan JSON File
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !disabled && !loading && fileInputRef.current && fileInputRef.current.click()}
              className={`relative border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                disabled
                  ? "border-slate-800 bg-slate-950/40 opacity-50 cursor-not-allowed"
                  : isDragging
                  ? "border-indigo-400 bg-indigo-950/30 scale-[1.01]"
                  : selectedFile
                  ? "border-emerald-500/50 bg-slate-950/60 hover:border-emerald-500/70"
                  : "border-slate-700/80 bg-slate-950/50 hover:border-indigo-500/70 hover:bg-slate-950/80"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                disabled={disabled || loading}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                accept=".json,application/json"
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center gap-2 text-center">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    selectedFile
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    {selectedFile ? (
                      <span className="text-emerald-300 font-mono break-all">
                        {selectedFile.name}
                      </span>
                    ) : (
                      <>
                        <span className="text-indigo-400 underline underline-offset-2">
                          Click to upload
                        </span>{" "}
                        or drag & drop
                      </>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {selectedFile
                      ? `${formatBytes(selectedFile.size)} • Click to replace`
                      : "Terraform plan output (.json format)"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pre-Flight Validation State */}
          {validationState && (
            <div>
              {validationState.valid ? (
                <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-xs">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Valid Terraform Plan JSON</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300 mt-2 font-mono">
                    <div className="bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                      Format: <span className="text-emerald-300">{validationState.meta.formatVersion}</span>
                    </div>
                    <div className="bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                      TF Version: <span className="text-emerald-300">{validationState.meta.tfVersion}</span>
                    </div>
                  </div>
                  {validationState.meta.resourceCount > 0 && (
                    <div className="text-[11px] text-emerald-400/90 mt-1.5">
                      Detected {validationState.meta.resourceCount} resource changes in plan.
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/50 text-xs">
                  <div className="flex items-center gap-2 text-rose-400 font-semibold mb-1">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <span>Validation Failed</span>
                  </div>
                  <div className="text-rose-200 leading-relaxed">
                    {validationState.error}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* API Error Notification */}
          {apiError && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/50 text-xs text-rose-200">
              <div className="font-semibold text-rose-400 mb-0.5">Go Server Error</div>
              <div className="break-words">{apiError}</div>
            </div>
          )}

          {/* Submit Action Button */}
          {selectedFile && validationState && validationState.valid && (
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={loading || disabled}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Parsing on Go Server...</span>
                  </>
                ) : (
                  <>
                    <span>Parse & Load Graph</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>

              <button
                onClick={handleReset}
                disabled={loading}
                className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                title="Clear file"
              >
                Clear
              </button>
            </div>
          )}

          {/* Post-Parse Success Card */}
          {lastParsedSummary && (
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Graph Generated ({lastParsedSummary.total} resources)</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1 text-center text-xs">
                <div className="p-1 rounded bg-emerald-950/40 border border-emerald-900/40 text-emerald-400">
                  <div className="font-bold">+{lastParsedSummary.create}</div>
                  <div className="text-[9px] text-emerald-500/80">Create</div>
                </div>
                <div className="p-1 rounded bg-blue-950/40 border border-blue-900/40 text-blue-400">
                  <div className="font-bold">~{lastParsedSummary.update}</div>
                  <div className="text-[9px] text-blue-500/80">Update</div>
                </div>
                <div className="p-1 rounded bg-rose-950/40 border border-rose-900/40 text-rose-400">
                  <div className="font-bold">-{lastParsedSummary.delete}</div>
                  <div className="text-[9px] text-rose-500/80">Delete</div>
                </div>
                <div className="p-1 rounded bg-amber-950/40 border border-amber-900/40 text-amber-400">
                  <div className="font-bold">±{lastParsedSummary.replace}</div>
                  <div className="text-[9px] text-amber-500/80">Replace</div>
                </div>
                <div className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
                  <div className="font-bold">={lastParsedSummary["no-op"]}</div>
                  <div className="text-[9px] text-slate-500">No-op</div>
                </div>
                <div className="p-1 rounded bg-pink-950/40 border border-pink-900/40 text-pink-400">
                  <div className="font-bold">?{lastParsedSummary.read}</div>
                  <div className="text-[9px] text-pink-500/80">Read</div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950"
              >
                <span>View on Canvas</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* Guidance Info */}
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
            <div className="font-semibold text-slate-300">Exporting your Terraform Plan:</div>
            <pre className="p-2 rounded bg-slate-950 border border-slate-800 text-indigo-300 font-mono text-[10px] overflow-x-auto select-all">
              terraform plan -out=tfplan{"\n"}terraform show -json tfplan &gt; plan.json
            </pre>
          </div>
        </div>
      </div>
    </>
  );
}

