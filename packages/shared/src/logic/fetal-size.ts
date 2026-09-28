// PREG-DETAIL-01 — homila o'lchamlari hafta bo'yicha.
//
// Manba: JSST standartlari asosidagi jadval
// https://www.vinmec.com/eng/blog/table-of-fetal-weight-and-length-according-to-who-standards-en
//
// MUHIM ikkita eslatma:
//
//   1. O'LCHASH USULI 20-HAFTADA O'ZGARADI. 8-19 haftalarda uzunlik
//      boshdan dumg'azagacha (crown-rump), 20-haftadan boshlab esa
//      boshdan tovongacha (crown-heel) o'lchanadi. Shuning uchun
//      13-haftadan 14-haftaga o'tishda son keskin oshgandek
//      ko'rinadi — bu o'sish emas, o'lchash usulining farqi. Ayolga
//      shuni aytmasak, u "nimadir noto'g'ri" deb o'ylashi mumkin.
//
//   2. Bu O'RTACHA qiymatlar. Sog'lom homila ulardan sezilarli farq
//      qilishi mumkin va bu me'yorda. Ekranda shu ham yoziladi.

export interface FetalSize {
  week: number;
  lengthCm: number;
  weightG: number;
  /** `crown_rump` (8-19 hafta) yoki `crown_heel` (20+). */
  measure: "crown_rump" | "crown_heel";
}

/** 8-haftagacha o'lcham berilmaydi — u yerda raqam ma'noli emas. */
export const FETAL_SIZE_FROM_WEEK = 8;

const TABLE: Record<number, [number, number]> = {
  8: [1.6, 1], 9: [2.3, 2], 10: [3.1, 4], 11: [4.1, 45], 12: [5.4, 58], 13: [6.7, 73],
  14: [14.7, 93], 15: [16.7, 117], 16: [18.6, 146], 17: [20.4, 181], 18: [22.2, 222], 19: [24.0, 272],
  20: [25.7, 330], 21: [27.4, 400], 22: [29.0, 476], 23: [30.6, 565], 24: [32.2, 665],
  25: [33.7, 756], 26: [35.1, 900], 27: [36.6, 1000], 28: [37.6, 1100], 29: [39.3, 1239],
  30: [40.5, 1396], 31: [41.8, 1568], 32: [43.0, 1755], 33: [44.1, 2000], 34: [45.3, 2200],
  35: [46.3, 2378], 36: [47.3, 2600], 37: [48.3, 2800], 38: [49.3, 3000], 39: [50.1, 3186],
  40: [51.0, 3338],
};

/** Berilgan hafta uchun o'rtacha o'lcham. Jadvalda yo'q bo'lsa `null`. */
export function fetalSizeForWeek(week: number): FetalSize | null {
  const row = TABLE[week];
  if (!row) return null;
  return {
    week,
    lengthCm: row[0],
    weightG: row[1],
    measure: week < 20 ? "crown_rump" : "crown_heel",
  };
}
