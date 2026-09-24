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

/** SSR-xavfsiz — SDK obyekti. DIQQAT: bu obyekt ODDIY BRAUZERDA HAM mavjud
 * bo'ladi (skript yuklanishining o'zi kifoya), ya'ni uning borligi "Telegram
 * ichidamiz" degani EMAS. Buning uchun `isTelegramContext()`ga qarang. */
export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp ?? null;
}

/**
 * TG-DETECT-01 — HAQIQATAN Telegram Mini App ichidamizmi.
 *
 * Ilgari bu shunchaki `!!window.Telegram?.WebApp` edi va bu XATO: Telegram
 * SDK skripti (`telegram-web-app.js`) har qanday sahifada yuklanadi va o'sha
 * obyektni HAR DOIM yaratadi. Ya'ni oddiy brauzerda ham `isTelegram` true
 * bo'lib chiqardi, natijada:
 *   • kirish ekranida "Davom etish" chiqib, ayolni `/tg` ga yuborardi;
 *   • `/tg` esa `initData`siz hech narsa qila olmay, MANGU aylanaverardi —
 *     na xato, na tushuntirish (skrinshot bilan xabar qilindi).
 * Ya'ni brauzerdan kelgan ayol umuman kira olmasdi va buning sababini
 * hech qachon bilmasdi.
 *
 * To'g'ri belgi — imzolangan `initData`ning O'ZI: Telegram uni faqat haqiqiy
 * Mini App kontekstida beradi, brauzerda u bo'sh satr. `initDataUnsafe.user`
 * va Telegram WebView ko'prigi (`TelegramWebviewProxy`) qo'shimcha zaxira
 * signal — biri bo'lmagan nodir holatlarda ham to'g'ri javob beradi.
 */
export function isTelegramContext(app: TelegramWebApp | null): boolean {
  if (!app) return false;
  if (app.initData) return true;
  if (app.initDataUnsafe?.user) return true;
  return typeof window !== "undefined" && "TelegramWebviewProxy" in window;
}

// WEB2-02: bu poll qancha urinishdan keyin "topilmadi" deb topshirishini
// belgilaydi — chaqiruvchilar (masalan tg/page.tsx) shu bilan bir xil
// bo'lishi uchun `status` ham qaytariladi (pastga qarang), o'zining alohida
// mustaqil taймаутini yozmasin. 55×100ms = 5.5s — sekin mobil tarmoqda
// Telegram skripti yuklanishi uchun oldingi 2s'dan ancha kengroq zaxira.
const WEBAPP_POLL_INTERVAL_MS = 100;
const WEBAPP_MAX_ATTEMPTS = 55;

export type TelegramDetectionStatus = "checking" | "found" | "not-found";

/**
 * Telegram Mini App kontekstini aniqlaydi va ilovani to'liq ekranga kengaytiradi
 * (`ready`/`expand`). Oddiy brauzerda (Telegramdan tashqarida) `isTelegram: false`
 * qaytadi — ilova odatdagidek ishlayveradi.
 *
 * `status` — "checking" (hali qidirilmoqda) / "found" / "not-found" (barcha
 * urinishlardan keyin topilmadi) — chaqiruvchi tomon (masalan tg/page.tsx)
 * "haqiqatan Telegram emas" xulosasini FAQAT "not-found"da chiqarishi kerak,
 * o'zining mustaqil taймаути bilan emas (WEB2-02: ikkita mos kelmaydigan
 * taймаут — 2000ms bu yerda, 2500ms chaqiruvchida — sekin tarmoqda haqiqiy
 * Telegram foydalanuvchisiga noto'g'ri xato ko'rsatardi).
 */
export function useTelegram() {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [status, setStatus] = useState<TelegramDetectionStatus>("checking");

  useEffect(() => {
    // Script <Script strategy="beforeInteractive"> bilan yuklanadi, lekin
    // baribir bir necha ms kechikishi mumkin — shuning uchun kichik poll.
    let cancelled = false;
    let attempts = 0;
    const tryInit = () => {
      if (cancelled) return;
      const app = getTelegramWebApp();
      // TG-DETECT-01: obyektning borligi yetarli EMAS — haqiqiy Mini App
      // konteksti kerak. Aks holda poll birinchi urinishdayoq "found" deb
      // to'xtardi va `not-found` holati hech qachon yuzaga kelmasdi.
      if (app) {
        if (isTelegramContext(app)) {
          app.ready();
          app.expand();
          setWebApp(app);
          setStatus("found");
          return;
        }
        // SDK yuklandi, lekin kontekst yo'q — bu ANIQ javob, kutishning
        // ma'nosi yo'q. `initData`ni SDK yuklanish payti, manzil hash'idan
        // o'qib oladi; keyinroq "paydo bo'lmaydi". Poll esa faqat SKRIPT
        // hali yetib kelmagan holat uchun.
        //
        // Buni kutish zararsiz emas edi: oddiy brauzerda kirish tugmasi
        // 5.5 soniya o'chiq (oqargan) turib qolardi, ya'ni ayol ochilgan
        // sahifada bosib bo'lmaydigan tugmani ko'rardi.
        setStatus("not-found");
        return;
      }
      if (attempts++ < WEBAPP_MAX_ATTEMPTS) {
        setTimeout(tryInit, WEBAPP_POLL_INTERVAL_MS);
      } else {
        setStatus("not-found");
      }
    };
    tryInit();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    webApp,
    isTelegram: !!webApp,
    status,
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
