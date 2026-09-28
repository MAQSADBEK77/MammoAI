"use client";

import { useState } from "react";
import { emojiToTwemojiCode } from "@mammoai/shared";

/**
 * Tizim shrifti o'rniga bitta izchil (Twemoji) uslubdagi rasm — Android, iOS,
 * Windows va turli brauzerlarda bir xil ko'rinishi uchun (foydalanuvchi
 * so'roviga ko'ra: "hamma qurilmada bir xil chiqadigan qilish kerak").
 * `e` — asl emoji belgisi (masalan "😄") — `alt` sifatida ham xizmat qiladi.
 *
 * EMOJI-FALLBACK-01: `public/emoji` da atigi ~87 ta SVG bor (hammasi emas,
 * faqat ilovada ishlatilganlari). Ro'yxatda yo'q belgi ishlatilsa, brauzer
 * 404 oladi va o'rnida SINGAN RASM ikonkasi chiqadi — bu loyihada bir necha
 * marta takrorlangan xato: sindirilgan meva, sindirilgan salat.
 *
 * Endi fayl topilmasa belgining O'ZI (tizim shriftida) ko'rsatiladi. Uslub
 * bir zarra farq qiladi, lekin singan rasmdan ko'ra ancha yaxshi va hech
 * qachon "buzilgan" ko'rinmaydi.
 */
export function Emoji({ e, size = 20, className }: { e: string; size?: number; className?: string }) {
  const [missing, setMissing] = useState(false);

  if (missing) {
    return (
      <span
        className={className}
        role="img"
        aria-label={e}
        style={{ fontSize: size, lineHeight: 1, display: "inline-block", flexShrink: 0 }}
      >
        {e}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- statik emoji SVG, next/image optimizatsiyasi kerak emas
    <img
      src={`/emoji/${emojiToTwemojiCode(e)}.svg`}
      alt={e}
      className={className}
      onError={() => setMissing(true)}
      style={{ width: size, height: size, display: "inline-block", verticalAlign: "-0.15em", flexShrink: 0 }}
    />
  );
}
