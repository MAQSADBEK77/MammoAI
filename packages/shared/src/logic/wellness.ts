// "Sog'liqni nazorat qilish" (wellbeing) rejimi — suv ichish va kaloriya
// hisobi uchun sof (backend/DB'siz) yordamchi qiymatlar. Aniq shaxsiy
// maqsad so'ralmaydi (ilova hali ovqatlanish rejasi tuzmaydi) — o'rniga
// umumiy tavsiya etilgan kunlik me'yor ko'rsatkich sifatida ishlatiladi.

/** Kattalar uchun umumiy tavsiya etilgan kunlik suv me'yori (ml) — aniq shaxsiy
 * hisob-kitob emas, faqat progress-bar uchun mo'ljal nuqtasi. */
export const WATER_TARGET_ML = 2000;

/** Tezkor qo'shish tugmasi — "1 stakan" ≈ 250 ml. */
export const WATER_GLASS_ML = 250;

export function waterProgressPercent(waterMl: number): number {
  return Math.max(0, Math.min(100, Math.round((waterMl / WATER_TARGET_ML) * 100)));
}
