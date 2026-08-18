"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Globe } from "lucide-react";
import { LANGUAGE_LABELS, useLanguage, type Language } from "@/lib/i18n/context";

const ORDER: Language[] = ["uz", "ru", "en"];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Til / Язык / Language"
        title={LANGUAGE_LABELS[language]}
        className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
      >
        <Globe size={16} />
        <span className="hidden sm:inline">{language.toUpperCase()}</span>
      </button>

      {open && (
        <div className="animate-fade-in-up absolute right-0 top-full z-50 mt-1.5 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          {ORDER.map((lang) => (
            <button
              key={lang}
              onClick={() => {
                setLanguage(lang);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 cursor-pointer dark:text-slate-200 dark:hover:bg-slate-700/60"
            >
              {LANGUAGE_LABELS[lang]}
              {language === lang && <Check size={14} className="text-pink-600 dark:text-pink-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
