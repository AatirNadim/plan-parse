"use client";

import { useState, useEffect, useCallback } from "react";

export const THEME_STORAGE_KEY = "plan-parse-theme";

/**
 * Apply the specified theme class ("dark" or "light") to document.documentElement
 * and set document.documentElement.style.colorScheme.
 * @param {"dark" | "light"} theme
 */
export function applyThemeToDOM(theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "light") {
    root.classList.remove("dark");
    root.classList.add("light");
    root.style.colorScheme = "light";
  } else {
    root.classList.remove("light");
    root.classList.add("dark");
    root.style.colorScheme = "dark";
  }
}

/**
 * Hook to manage theme state, synchronization with localStorage, and DOM classes.
 */
export function useTheme() {
  const [theme, setThemeState] = useState("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      const initialTheme = stored === "light" ? "light" : "dark";
      setThemeState(initialTheme);
      applyThemeToDOM(initialTheme);
    } catch {
      applyThemeToDOM("dark");
    }
    setMounted(true);
  }, []);

  const setTheme = useCallback((nextTheme) => {
    const validTheme = nextTheme === "light" ? "light" : "dark";
    setThemeState(validTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, validTheme);
    } catch {
      // Storage access may fail in restricted sandboxes / private browsing
    }
    applyThemeToDOM(validTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const nextTheme = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      } catch {
        // Ignored
      }
      applyThemeToDOM(nextTheme);
      return nextTheme;
    });
  }, []);

  return {
    theme,
    isDark: theme === "dark",
    setTheme,
    toggleTheme,
    mounted,
  };
}
