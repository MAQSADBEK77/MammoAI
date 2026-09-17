"use client";

import { useEffect, useState } from "react";
import { api } from "./api";

// Foydalanuvchi so'rovi (2026-09-17): "sinab ko'rishni bossa umuman
// webdan ishlatolmasin, faqat telegram bot ichidagi mini appdan foydalana
// olsin" — shuning uchun "sinab ko'rish" endi HECH QACHON veb
// onboarding'ga qaytmasligi kerak (avvalgi zaxira/fallback yo'q qilindi,
// buni WEB3-03'da qo'shilgan taймаут "ba'zida botga yo'naltirmayapti"
// muammosiga sabab bo'lgan edi — taймаут ishga tushsa, foydalanuvchi
// web onboarding'ga tushib qolardi).
//
// Yechim: /api/telegram/link'dan olinadigan DINAMIK havola (admin panelda
// bot almashtirilsa ham ishlashda davom etishi uchun) BILAN BIRGA, hozir
// ma'lum bo'lgan bot username'i QATTIQ YOZILGAN OXIRGI CHORA (last resort)
// sifatida saqlanadi — tarmoq so'rovi sekin/muvaffaqiyatsiz bo'lsa ham,
// qaytariladigan havola HECH QACHON `null`/`undefined` bo'lmaydi, shuning
// uchun chaqiruvchi tomon (page.tsx) endi "aks holda /onboarding" degan
// shart yozishga researchi umuman qolmaydi.
const FALLBACK_TELEGRAM_LINK = "https://t.me/Mammo_uz_bot";

/** Har doim haqiqiy (hech qachon bo'sh bo'lmaydigan) Telegram bot havolasini
 * qaytaradi — boshida qattiq yozilgan zaxira bilan, `/api/telegram/link`
 * javob bergach (agar boshqacha bo'lsa) yangilanadi. */
export function useTelegramStartLink(): string {
  const [link, setLink] = useState(FALLBACK_TELEGRAM_LINK);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    api.telegram
      .getStartLink({ signal: controller.signal })
      .then((res) => {
        if (!cancelled && res.url) setLink(res.url);
      })
      .catch(() => {
        // Jim yutiladi — qattiq yozilgan zaxira havola allaqachon ishlatilmoqda.
      })
      .finally(() => {
        clearTimeout(timeout);
      });
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  return link;
}
