"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { MeResponse, OnboardingProfile, User } from "@mammoai/shared";
import { ApiError } from "@mammoai/shared";
import { api } from "./api";
import { useI18n } from "./i18n";
import { isForcedLightPath } from "./theme-routes";

/**
 * SESSION-KEEP-01: `"error"` — sessiya holatini ANIQLAB BO'LMADI.
 *
 * Bu `"anonymous"`dan tubdan farq qiladi: `"anonymous"` = "bu odam
 * tizimga kirmagan" (ishonchli fakt), `"error"` = "bilmayapmiz, server
 * javob bermadi". Ikkisini aralashtirish foydalanuvchini o'z hisobidan
 * quvib chiqaradi.
 */
type SessionStatus = "loading" | "onboarded" | "anonymous" | "error";

type ResolvedTheme = "light" | "dark";

interface SessionContextValue {
  status: SessionStatus;
  user: User | null;
  onboardingProfile: OnboardingProfile | null;
  /** AI Yordamchi + chuqur Statistika — Premium. To'lov provayderi hali
   * ulanmagan, admin panel orqali qo'lda beriladi (server/repo.ts#grantPremium). */
  hasPremium: boolean;
  /** ATTN-01: muddati o'tgan tekshiruvlar soni (pastki menyudagi belgi). */
  overdueCheckups: number;
  /** `user.theme` "system" bo'lganda OS/brauzer afzalligiga qarab hal qilingan
   * aniq qiymat — MuiThemeProvider shundan o'qiydi (CSS o'zgaruvchilariga
   * bog'liq bo'lmagan MUI palette.mode uchun). */
  resolvedTheme: ResolvedTheme;
  refresh: () => Promise<void>;
  applyMeResponse: (res: MeResponse) => void;
}

const THEME_STORAGE_KEY = "mammoai_theme";

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [onboardingProfile, setOnboardingProfile] = useState<OnboardingProfile | null>(null);
  const [hasPremium, setHasPremium] = useState(false);
  const [overdueCheckups, setOverdueCheckups] = useState(0);
  // FIX-UX-02: boshlang'ich qiymat serverdagi bilan BIR XIL ("light") bo'lishi
  // shart — `systemPrefersDark()`ni to'g'ridan-to'g'ri shu yerda chaqirish
  // hydration mismatch'ga olib kelardi (server har doim "light" chiqaradi,
  // chunki `window` yo'q, lekin mijoz birinchi render'dayoq haqiqiy OS
  // qiymatini o'qirdi). Haqiqiy qiymat pastdagi useEffect (88-qator atrofi)
  // orqali, mount bo'lgandan KEYIN qo'llaniladi.
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const { setLanguage } = useI18n();

  const applyMeResponse = useCallback(
    (res: MeResponse) => {
      setUser(res.user);
      setOnboardingProfile(res.onboardingProfile);
      setHasPremium(res.hasPremium);
      setOverdueCheckups(res.overdueCheckups ?? 0);
      setLanguage(res.user.language);
      setStatus(res.onboardingProfile ? "onboarded" : "anonymous");
    },
    [setLanguage]
  );

  const refresh = useCallback(async () => {
    try {
      const res = await api.me.get();
      applyMeResponse(res);
    } catch (error) {
      // SESSION-KEEP-01: ilgari bu `catch` HAR QANDAY nosozlikni
      // "tizimga kirmagan" deb hisoblardi — 500, tarmoq uzilishi,
      // taymaut, hammasi. Keyin `(app)/layout.tsx` uni onboarding'ga
      // majburan yo'naltirardi.
      //
      // Natijada: baza bir zumga javob bermay qolsa, cookie'si MUTLAQO
      // yaroqli bo'lgan ayol o'z hisobidan chiqarib yuborilardi va ilova
      // "boshidan boshlanardi". Aynan shu bugun ro'y berdi — baza
      // ulanishlari tugaganda (CONN-LIMIT-01) foydalanuvchilar tizimdan
      // chiqib ketgan.
      //
      // Endi FAQAT 401 haqiqiy "kirmagan" degani. Qolgan hamma narsa —
      // "bilmayapmiz", va bunda mavjud sessiya SAQLANADI.
      if (error instanceof ApiError && error.status === 401) {
        setStatus("anonymous");
        setUser(null);
        setOnboardingProfile(null);
        setHasPremium(false);
        return;
      }
      // Allaqachon kirgan bo'lsa — holatni buzmaymiz. Hali yuklanayotgan
      // bo'lsa — "error", mijoz qayta urinish tugmasini ko'rsatadi.
      setStatus((prev) => (prev === "onboarded" ? prev : "error"));
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
    // THEME-01: sessiyadan oldingi sahifalarda (onboarding, Telegram kirish)
    // mavzu MAJBURAN yorug'. Tekshiruv SHU YERDA ham kerak: `/api/me` javob
    // bergach bu effekt qayta ishlaydi va tekshiruvsiz bo'lsa, bloklovchi
    // skript qo'ygan yorug' mavzuni qurilma afzalligiga qarab qorong'uga
    // almashtirib yuborardi.
    //
    // Foydalanuvchining HAQIQIY tanlovi (yuqorida localStorage'ga yozilgan)
    // o'zgarmaydi — majburlash faqat KO'RSATISHga tegishli.
    const forcedLight = isForcedLightPath(window.location.pathname);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const next: ResolvedTheme = forcedLight
        ? "light"
        : preference === "system"
          ? media.matches
            ? "dark"
            : "light"
          : preference;
      setResolvedTheme(next);
      document.documentElement.dataset.theme = next;
    };
    apply();
    // Qurilma afzalligini faqat "system" tanlovida va majburlanmagan
    // sahifalarda tinglaymiz.
    if (forcedLight || preference !== "system") return;
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [user?.theme]);

  // Rejim bo'yicha brend rangi — Profil'da "REJIMNI TANLANG" o'zgarganda butun
  // ilova rangi (primary tokeni) shunga mos o'zgaradi (Figma referens uslubi).
  useEffect(() => {
    document.documentElement.dataset.mode = onboardingProfile?.primaryGoal ?? "cycle";
  }, [onboardingProfile?.primaryGoal]);

  const value = useMemo<SessionContextValue>(
    () => ({ status, user, onboardingProfile, hasPremium, overdueCheckups, resolvedTheme, refresh, applyMeResponse }),
    [status, user, onboardingProfile, hasPremium, overdueCheckups, resolvedTheme, refresh, applyMeResponse]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession — SessionProvider ichida chaqirilishi kerak");
  return ctx;
}
