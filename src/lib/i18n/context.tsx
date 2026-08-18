"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import uz from "./uz";
import ru from "./ru";
import en from "./en";
import type { Dictionary, Language } from "./types";
import { deepTransliterate } from "@/lib/transliterate";

export type { Language, Dictionary };

const STORAGE_KEY = "mammoai:lang";
// "uz-cyrl" isn't a separate translation — it's the same Uzbek text as "uz",
// mechanically converted to Cyrillic script (see lib/transliterate.ts), computed
// once at module load rather than hand-maintaining a fourth parallel file.
const DICTIONARIES: Record<Language, Dictionary> = { uz, "uz-cyrl": deepTransliterate(uz), ru, en };

export const LANGUAGE_LABELS: Record<Language, string> = {
  uz: "O'zbek",
  "uz-cyrl": "Ўзбек (кирилл)",
  ru: "Русский",
  en: "English",
};

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function isLanguage(value: string | null): value is Language {
  return value === "uz" || value === "uz-cyrl" || value === "ru" || value === "en";
}

// Server-rendered HTML and the client's first render both start on "uz" —
// deliberately, so hydration never has to reconcile mismatched text across
// the whole tree. The real saved preference (if any) is applied a moment
// later from a mount effect, same shape as the theme provider's fix: no
// reactive "sync on every change" effect, so there's nothing for two
// racing effects to clobber.
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("uz");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLanguage(stored)) setLanguageState(stored);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    window.localStorage.setItem(STORAGE_KEY, lang);
    setLanguageState(lang);
  }, []);

  const value = useMemo(
    () => ({ language, setLanguage, t: DICTIONARIES[language] }),
    [language, setLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage LanguageProvider ichida ishlatilishi kerak.");
  return ctx;
}

/** Shorthand for the common case of just needing the translated strings. */
export function useT(): Dictionary {
  return useLanguage().t;
}
