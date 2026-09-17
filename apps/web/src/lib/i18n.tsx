"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { dictionaries, type Dictionary, type Language } from "@mammoai/shared";

const STORAGE_KEY = "mammoai_language";

// WEB3-18: apps/web/src/app/layout.tsx'da `<html lang="uz">` qattiq
// yozilgan — foydalanuvchi tilni ru/en'ga o'zgartirganda HECH QACHON
// yangilanmasdi. BCP-47 kanonik shakl (masalan "uz-Cyrl", katta harf bilan)
// — Language ichki kodi ("uz-cyrl") bilan bir xil emas.
const HTML_LANG: Record<Language, string> = { uz: "uz", "uz-cyrl": "uz-Cyrl", ru: "ru", en: "en" };

interface I18nContextValue {
  language: Language;
  dict: Dictionary;
  setLanguage: (lang: Language) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function readStoredLanguage(): Language {
  if (typeof window === "undefined") return "uz";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored && stored in dictionaries ? (stored as Language) : "uz";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => readStoredLanguage());

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, lang);
  }, []);

  // Boshlang'ich yuklashda ham (localStorage'dagi til layout.tsx'ning
  // qattiq yozilgan "uz"idan farq qilishi mumkin), til o'zgarganda ham —
  // `<html lang>` doim joriy tilga mos bo'lishi uchun.
  useEffect(() => {
    document.documentElement.lang = HTML_LANG[language];
  }, [language]);

  const value = useMemo<I18nContextValue>(
    () => ({ language, dict: dictionaries[language], setLanguage }),
    [language, setLanguage]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n — I18nProvider ichida chaqirilishi kerak");
  return ctx;
}
