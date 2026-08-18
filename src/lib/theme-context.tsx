"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";
const STORAGE_KEY = "mammoai:theme";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// The inline script in layout.tsx already stamps the correct `.dark` class
// on <html> before hydration (reading the same storage key), so the DOM is
// right from first paint. This provider only needs to mirror that into React
// state for the toggle icon — it must NOT reactively re-sync on every theme
// change, or the mount-time read (still "light" while it resolves) races
// with that effect and clobbers the stored preference back to "light" on
// every full page navigation. Only `toggleTheme` (an explicit user action)
// writes to the DOM/localStorage.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial =
      stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initial);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme ThemeProvider ichida ishlatilishi kerak.");
  return ctx;
}
