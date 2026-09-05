"use client";

import { useEffect, useState } from "react";

// Telegram Mini App SDK — `telegram-web-app.js` root layout'da <Script> orqali
// yuklanadi (app/layout.tsx) va `window.Telegram.WebApp` global obyektini beradi.
// Rasmiy hujjat: https://core.telegram.org/bots/webapps

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: { user?: TelegramUser };
  colorScheme: "light" | "dark";
  themeParams: Record<string, string>;
  ready: () => void;
  expand: () => void;
  close: () => void;
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  HapticFeedback?: {
    impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
  };
  onEvent: (event: string, cb: () => void) => void;
  offEvent: (event: string, cb: () => void) => void;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

/** SSR-xavfsiz — faqat brauzerda va faqat Telegram ichida ochilgan bo'lsa obyekt qaytaradi. */
export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp ?? null;
}

/**
 * Telegram Mini App kontekstini aniqlaydi va ilovani to'liq ekranga kengaytiradi
 * (`ready`/`expand`). Oddiy brauzerda (Telegramdan tashqarida) `isTelegram: false`
 * qaytadi — ilova odatdagidek ishlayveradi.
 */
export function useTelegram() {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);

  useEffect(() => {
    // Script <Script strategy="beforeInteractive"> bilan yuklanadi, lekin
    // baribir bir necha ms kechikishi mumkin — shuning uchun kichik poll.
    let cancelled = false;
    let attempts = 0;
    const tryInit = () => {
      if (cancelled) return;
      const app = getTelegramWebApp();
      if (app) {
        app.ready();
        app.expand();
        setWebApp(app);
        return;
      }
      if (attempts++ < 20) setTimeout(tryInit, 100);
    };
    tryInit();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    webApp,
    isTelegram: !!webApp,
    initData: webApp?.initData || null,
    tgUser: webApp?.initDataUnsafe?.user ?? null,
  };
}
