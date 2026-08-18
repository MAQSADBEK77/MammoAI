"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Yorug' rejimga o'tish" : "Qorong'i rejimga o'tish"}
      title={theme === "dark" ? "Yorug' rejim" : "Qorong'i rejim"}
      className={`relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer ${className}`}
    >
      <Sun
        size={17}
        className={`absolute transition-all duration-300 ${theme === "dark" ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}`}
      />
      <Moon
        size={17}
        className={`absolute transition-all duration-300 ${theme === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"}`}
      />
    </button>
  );
}
