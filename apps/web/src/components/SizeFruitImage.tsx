"use client";

import { useState } from "react";
import { Emoji } from "@/components/Emoji";

/**
 * SIZE-IMG-01 — haftalik o'lcham taqqoslash rasmi ("qovun kattaligida").
 *
 * Ilgari bu yerda EMOJI turardi. Emoji to'plami esa atigi 10 ta mevani
 * qoplaydi, bazada esa har hafta uchun alohida nom bor (41 ta): "moshdona",
 * "romaine salat", "pichan" kabi nomlarga mos belgi yo'q va ular uchun
 * bir xil limon ikonkasi chiqardi.
 *
 * Rasmlar `scripts/generate-size-images.ts` bilan yaratiladi va
 * `public/size/week<N>.png` da yotadi. Rasm hali yaratilmagan bo'lsa
 * (yoki yuklanmasa) EMOJI qaytadi — ya'ni bu komponentni rasmlar
 * tayyor bo'lishidan OLDIN ham xavfsiz joylashtirish mumkin.
 */
export function SizeFruitImage({
  week,
  emoji,
  size = 30,
  fallback = "emoji",
}: {
  week: number;
  emoji: string;
  size?: number;
  /**
   * Rasm topilmaganda nima bo'ladi.
   *
   * "none" — hech narsa. Bosh ekranda shu kerak: u yerdagi nom BAZADAN
   * keladi (hafta aniqligida, masalan "qovun"), emoji esa 4 haftalik
   * jadvaldan (masalan ananas). Ikkalasi yonma-yon turganda ular
   * bir-biriga zid ko'rinadi — "qovun kattaligida" deb yozilib,
   * yonida ananas turadi.
   */
  fallback?: "emoji" | "none";
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return fallback === "emoji" ? <Emoji e={emoji} size={size} /> : null;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- statik hafta rasmi, next/image optimizatsiyasi kerak emas
    <img
      src={`/size/week${Math.min(42, Math.max(1, Math.round(week)))}.png`}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="object-contain"
      onError={() => setFailed(true)}
    />
  );
}
