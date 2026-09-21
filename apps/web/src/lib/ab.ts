"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";

/**
 * AB-01 — eng yengil A/B tajriba vositasi.
 *
 * Nega kutubxona emas: bizga faqat ikkita narsa kerak — (1) foydalanuvchini
 * bitta variantga BARQAROR biriktirish, (2) variantni analitikaga yozish.
 * Tashqi A/B xizmati (LaunchDarkly, GrowthBook) bu ikkisi uchun ortiqcha
 * og'irlik va yana bir tashqi bog'liqlik bo'lardi.
 *
 * BARQARORLIK: variant `sessionStorage`da saqlanadi. Ya'ni foydalanuvchi
 * so'rovnoma o'rtasida boshqa variantga "sakrab" o'tmaydi — bu o'lchovni
 * butunlay buzardi. Seans tugagach yangi tanlov bo'lishi mumkin, lekin
 * o'lchov birligi ham SEANS (`analytics_events.session_id`), shuning uchun
 * bu muammo emas.
 *
 * O'LCHOV: variant bir marta `ab:<tajriba>=<variant>` hodisasi sifatida
 * yoziladi. Voronka skripti (`scripts/onboarding-funnel.ts`) shu hodisa
 * bo'yicha seanslarni guruhlab, har bir variantning tugatish foizini
 * hisoblaydi.
 *
 * HYDRATION: birinchi renderda DOIM `null` qaytadi (server `sessionStorage`ni
 * ko'rmaydi). Chaqiruvchi shuni hisobga olishi kerak — odatda `null` "nazorat
 * varianti" kabi qaraladi.
 */
export function useAbVariant(experiment: string, variants: readonly string[] = ["off", "on"]): string | null {
  const [variant, setVariant] = useState<string | null>(null);

  useEffect(() => {
    const key = `mammoai:ab:${experiment}`;
    // `setTimeout(..., 0)` — lib/i18n.tsx'dagi bilan bir xil naqsh: holatni
    // effekt tanasida to'g'ridan-to'g'ri o'rnatish kaskad renderlarga olib
    // keladi (react-hooks/set-state-in-effect).
    const timeout = setTimeout(() => {
      let chosen: string;
      try {
        const stored = window.sessionStorage.getItem(key);
        if (stored && variants.includes(stored)) {
          chosen = stored;
        } else {
          chosen = variants[Math.floor(Math.random() * variants.length)];
          window.sessionStorage.setItem(key, chosen);
          // Yangi biriktirish — faqat SHU paytda yoziladi, har renderda emas.
          trackEvent(`ab:${experiment}=${chosen}`);
        }
      } catch {
        // `sessionStorage` bloklangan (maxfiylik rejimi) — barqaror biriktirish
        // imkoni yo'q, shuning uchun nazorat variantida qoldiramiz. Aks holda
        // har renderda boshqa variant chiqib, o'lchov ham, tajriba ham buzilardi.
        chosen = variants[0];
      }
      setVariant(chosen);
    }, 0);
    return () => clearTimeout(timeout);
  }, [experiment, variants]);

  return variant;
}
