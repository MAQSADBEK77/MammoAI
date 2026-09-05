"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { MeResponse, OnboardingProfile, User } from "@mammoai/shared";
import { api } from "./api";
import { useI18n } from "./i18n";
import { getTelegramWebApp } from "./telegram";

type SessionStatus = "loading" | "onboarded" | "anonymous";

interface SessionContextValue {
  status: SessionStatus;
  user: User | null;
  onboardingProfile: OnboardingProfile | null;
  refresh: () => Promise<void>;
  applyMeResponse: (res: MeResponse) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [onboardingProfile, setOnboardingProfile] = useState<OnboardingProfile | null>(null);
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
      // Mavjud sessiya (cookie) topilmadi — Telegram Mini App ichida ochilgan
      // bo'lsa, `initData` orqali avtomatik akkaunt yaratamiz/kiramiz (telefon
      // raqam so'ralmaydi, onboarding'da account_choice/account_identifier
      // bosqichlari o'tkazib yuboriladi — apps/web/src/app/onboarding/page.tsx).
      const webApp = getTelegramWebApp();
      webApp?.ready();
      webApp?.expand();
      if (webApp?.initData) {
        try {
          const tgRes = await api.auth.telegram({ initData: webApp.initData });
          applyMeResponse(tgRes);
          return;
        } catch {
          // Tasdiqlash muvaffaqiyatsiz — oddiy anonim holatga qaytamiz.
        }
      }
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

  // Ko'rish qulayligi sozlamalari (Profil §7: shrift kattalashtirish, yuqori kontrast)
  // — <html> elementiga data-atributlar orqali qo'llaniladi, globals.css shunga qarab o'qiydi.
  useEffect(() => {
    document.documentElement.dataset.fontScale = user?.fontScale ?? "normal";
    document.documentElement.dataset.highContrast = user?.highContrast ? "true" : "false";
  }, [user?.fontScale, user?.highContrast]);

  // Rejim bo'yicha brend rangi — Profil'da "REJIMNI TANLANG" o'zgarganda butun
  // ilova rangi (primary tokeni) shunga mos o'zgaradi (Figma referens uslubi).
  useEffect(() => {
    document.documentElement.dataset.mode = onboardingProfile?.primaryGoal ?? "cycle";
  }, [onboardingProfile?.primaryGoal]);

  const value = useMemo<SessionContextValue>(
    () => ({ status, user, onboardingProfile, refresh, applyMeResponse }),
    [status, user, onboardingProfile, refresh, applyMeResponse]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession — SessionProvider ichida chaqirilishi kerak");
  return ctx;
}
