"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { MeResponse, OnboardingProfile, User } from "@mammoai/shared";
import { api } from "./api";
import { useI18n } from "./i18n";

type SessionStatus = "loading" | "onboarded" | "anonymous";

type ResolvedTheme = "light" | "dark";

interface SessionContextValue {
  status: SessionStatus;
  user: User | null;
  onboardingProfile: OnboardingProfile | null;
  /** `user.theme` "system" bo'lganda OS/brauzer afzalligiga qarab hal qilingan
   * aniq qiymat — MuiThemeProvider shundan o'qiydi (CSS o'zgaruvchilariga
   * bog'liq bo'lmagan MUI palette.mode uchun). */
  resolvedTheme: ResolvedTheme;
  refresh: () => Promise<void>;
  applyMeResponse: (res: MeResponse) => void;
}

const THEME_STORAGE_KEY = "mammoai_theme";

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [onboardingProfile, setOnboardingProfile] = useState<OnboardingProfile | null>(null);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => (systemPrefersDark() ? "dark" : "light"));
  const { setLanguage } = useI18n();

  const applyMeResponse = useCallback(
    (res: MeResponse) => {
      setUser(res.user);
      setOnboardingProfile(res.onboardingProfile);
      setLanguage(res.user.language);
      setStatus(res.onboardingProfile ? "onboarded" : "anonymous");
    },
    [setLanguage]
  );

  const refresh = useCallback(async () => {
    try {
      const res = await api.me.get();
      applyMeResponse(res);
    } catch {
      setStatus("anonymous");
      setUser(null);
      setOnboardingProfile(null);
    }
  }, [applyMeResponse]);

  // `refresh` sahifa mount bo'lganda va boshqa componentlar (masalan Profil, save
  // qilgandan keyin) tomonidan qayta chaqiriladi — shuning uchun hoisted holicha qoldi,
  // faqat birinchi mount'da ishga tushishi kerak (dependency sifatida qo'shilmaydi).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ko'rish qulayligi sozlamasi (Profil §7: shrift kattalashtirish) — <html>
  // elementiga data-atribut orqali qo'llaniladi, globals.css shunga qarab o'qiydi.
  useEffect(() => {
    document.documentElement.dataset.fontScale = user?.fontScale ?? "normal";
  }, [user?.fontScale]);

  // Yorug'/Qorong'u/Tizim — "system" bo'lsa OS/brauzer afzalligiga (va uning
  // jonli o'zgarishiga) qarab hal qilinadi, aks holda foydalanuvchi tanlovi
  // to'g'ridan-to'g'ri ishlatiladi. Hal qilingan aniq qiymat <html>ga
  // yoziladi (globals.css'dagi `[data-theme="dark"]` shundan o'qiydi) va
  // localStorage'ga saqlanadi — keyingi yuklanishda `/api/me` javob berguncha
  // noto'g'ri mavzu bir lahza yaltirashining oldini olish uchun (app/layout.tsx'dagi
  // bloklovchi inline skript shu qiymatni o'qiydi).
  useEffect(() => {
    const preference = user?.theme ?? "system";
    try {
      localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch {
      // localStorage yopiq bo'lishi mumkin (maxfiylik rejimi) — jiddiy emas.
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const next: ResolvedTheme = preference === "system" ? (media.matches ? "dark" : "light") : preference;
      setResolvedTheme(next);
      document.documentElement.dataset.theme = next;
    };
    apply();
    if (preference !== "system") return;
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [user?.theme]);

  // Rejim bo'yicha brend rangi — Profil'da "REJIMNI TANLANG" o'zgarganda butun
  // ilova rangi (primary tokeni) shunga mos o'zgaradi (Figma referens uslubi).
  useEffect(() => {
    document.documentElement.dataset.mode = onboardingProfile?.primaryGoal ?? "cycle";
  }, [onboardingProfile?.primaryGoal]);

  const value = useMemo<SessionContextValue>(
    () => ({ status, user, onboardingProfile, resolvedTheme, refresh, applyMeResponse }),
    [status, user, onboardingProfile, resolvedTheme, refresh, applyMeResponse]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession — SessionProvider ichida chaqirilishi kerak");
  return ctx;
}
