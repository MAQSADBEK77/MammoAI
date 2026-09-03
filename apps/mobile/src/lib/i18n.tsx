import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { dictionaries, type Dictionary, type Language } from "@mammoai/shared";

const STORAGE_KEY = "mammoai_language";

interface I18nContextValue {
  language: Language;
  dict: Dictionary;
  setLanguage: (lang: Language) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("uz");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored && stored in dictionaries) setLanguageState(stored as Language);
    });
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem(STORAGE_KEY, lang);
  }, []);

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
