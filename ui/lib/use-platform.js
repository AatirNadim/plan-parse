"use client";

import { useState, useEffect } from "react";

/**
 * Pure helper function to detect whether userAgent or platform string indicates macOS or iOS.
 * Matches Mac|iPhone|iPod|iPad (case-insensitive).
 * Gracefully handles null, undefined, empty, and non-string inputs.
 *
 * @param {string|null|undefined} userAgentOrPlatform
 * @returns {boolean}
 */
export function detectIsMac(userAgentOrPlatform) {
  if (!userAgentOrPlatform || typeof userAgentOrPlatform !== "string") {
    return false;
  }
  return /Mac|iPhone|iPod|iPad/i.test(userAgentOrPlatform);
}

/**
 * Pure helper function returning the platform modifier configuration object.
 * Used for unit testing, non-React environments, and deterministic evaluation.
 *
 * @param {string|null|undefined} userAgentOrPlatform
 * @returns {{ isMac: boolean, modKey: '⌘' | 'Ctrl', paletteKey: '⌘K' | 'Ctrl+K' }}
 */
export function getPlatformModifier(userAgentOrPlatform) {
  const isMac = detectIsMac(userAgentOrPlatform);
  return {
    isMac,
    modKey: isMac ? "⌘" : "Ctrl",
    paletteKey: isMac ? "⌘K" : "Ctrl+K",
  };
}

/**
 * Dedicated React hook for dynamic platform modifier detection.
 *
 * SSR Safety:
 * Initial state defaults to macOS ('⌘K', '⌘') to match server rendering.
 * Platform detection runs strictly on client mount within useEffect, ensuring zero
 * hydration mismatch between SSR output and the initial client DOM tree.
 * Updates to Windows/Linux modifier ('Ctrl+K', 'Ctrl') after client mount.
 *
 * @returns {{ isMac: boolean, modKey: '⌘' | 'Ctrl', paletteKey: '⌘K' | 'Ctrl+K' }}
 */
export function usePlatformModifier() {
  const [platform, setPlatform] = useState({
    isMac: true,
    modKey: "⌘",
    paletteKey: "⌘K",
  });

  useEffect(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return;
    }

    const candidate = [
      typeof navigator.userAgentData?.platform === "string"
        ? navigator.userAgentData.platform
        : "",
      navigator.userAgent || "",
      navigator.platform || "",
    ].join(" ");

    const detected = getPlatformModifier(candidate);
    setPlatform(detected);
  }, []);

  return platform;
}
