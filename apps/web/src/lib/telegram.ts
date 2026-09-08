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

interface TelegramSafeAreaInset {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: { user?: TelegramUser };
  colorScheme: "light" | "dark";
  themeParams: Record<string, string>;
  ready: () => void;
  expand: () => void;
  close: () => void;
  /** Bot API 6.9+ — native popup, foydalanuvchidan telefon raqamini so'raydi.
   * Callback FAQAT boolean qaytaradi (rozi bo'ldimi) — haqiqiy raqam BOTGA
   * webhook (`message.contact`) orqali keladi, JS'ga emas (rasmiy hujjat). */
  requestContact: (callback?: (shared: boolean) => void) => void;
  /** Bot API 8.0+ — chat oynasining tepasidagi sarlavha panelini (bot nomi,
   * yopish/pastga qaytarish/uch nuqta menyusi) shaffof qilib, ilovani
   * qurilma ekranining yuqori qismigacha kengaytiradi. MUHIM: rasmiy
   * hujjatga ko'ra bu panel BUTUNLAY yashirilmaydi — Telegram foydalanuvchi
   * xavfsizligi uchun uni doim ko'rsatib turadi (qaysi ilova ekanini va
   * uni qanday yopishni har doim bilishi kerak), faqat shaffof bo'lib,
   * sahifaning o'z foni orqasidan ko'rinadi. */
  isVersionAtLeast?: (version: string) => boolean;
  requestFullscreen?: () => void;
  exitFullscreen?: () => void;
  isFullscreen?: boolean;
  setHeaderColor?: (color: string) => void;
  /** Qurilmaning o'z xavfsiz zonasi (notch/status bar). */
  safeAreaInset?: TelegramSafeAreaInset;
  /** Fullscreen rejimida shaffof bo'lib qolgan sarlavha panelidan
   * (yopish/menyu tugmalari) qo'shimcha kerakli bo'sh joy. */
  contentSafeAreaInset?: TelegramSafeAreaInset;
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

const SAFE_AREA_TOP_VAR = "--tg-safe-area-top";
const SAFE_AREA_BOTTOM_VAR = "--tg-safe-area-bottom";

/**
 * Sarlavha panelini shaffof qiladi (foydalanuvchi so'rovi — ekrandagi "Mammo uz"
 * qora paneli sahifa mazmuniga xalaqit berardi) va shu bilan bo'shab qolgan
 * joyni CSS o'zgaruvchisi orqali e'lon qiladi, shunda sahifalar o'z eng
 * yuqoridagi elementini (masalan burger-menyu tugmasi) shaffof panel
 * tugmalari (yopish/menyu) ostida qolib ketmasligi uchun mos padding qo'sha
 * oladi. `app/layout.tsx`da BIR MARTA, butun ilova uchun o'rnatiladi — Telegram
 * WebApp holati sahifalar orasida (client-side navigatsiya) saqlanib qoladi,
 * shuning uchun har bir sahifada qayta chaqirish shart emas.
 *
 * MUHIM: rasmiy Telegram hujjatiga ko'ra sarlavha panelining o'zi (yopish/
 * pastga qaytarish/uch nuqta tugmalari) BUTUNLAY olib tashlanmaydi — faqat
 * shaffof bo'ladi. To'liq yo'q qilishning rasmiy usuli yo'q.
 */
export function useTelegramFullscreen() {
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let webApp: TelegramWebApp | null = null;

    const updateSafeArea = () => {
      if (!webApp) return;
      const top = (webApp.safeAreaInset?.top ?? 0) + (webApp.contentSafeAreaInset?.top ?? 0);
      const bottom = (webApp.safeAreaInset?.bottom ?? 0) + (webApp.contentSafeAreaInset?.bottom ?? 0);
      document.documentElement.style.setProperty(SAFE_AREA_TOP_VAR, `${top}px`);
      document.documentElement.style.setProperty(SAFE_AREA_BOTTOM_VAR, `${bottom}px`);
    };

    const tryInit = () => {
      if (cancelled) return;
      const app = getTelegramWebApp();
      if (!app) {
        if (attempts++ < 20) setTimeout(tryInit, 100);
        return;
      }
      webApp = app;
      if (app.isVersionAtLeast?.("8.0")) {
        app.setHeaderColor?.("bg_color");
        try {
          app.requestFullscreen?.();
        } catch {
          // Eski klient yoki qo'llab-quvvatlanmaydi — oddiy (kengaytirilgan,
          // lekin fullscreen bo'lmagan) rejimda qolaveramiz.
        }
      }
      updateSafeArea();
      app.onEvent("safeAreaChanged", updateSafeArea);
      app.onEvent("contentSafeAreaChanged", updateSafeArea);
    };
    tryInit();

    return () => {
      cancelled = true;
      if (webApp) {
        webApp.offEvent("safeAreaChanged", updateSafeArea);
        webApp.offEvent("contentSafeAreaChanged", updateSafeArea);
      }
    };
  }, []);
}

/** `useTelegramFullscreen`ning komponent shakli — `app/layout.tsx`ga
 * to'g'ridan-to'g'ri, boshqa hech narsa render qilmasdan qo'shiladi. */
export function TelegramFullscreenSetup() {
  useTelegramFullscreen();
  return null;
}
