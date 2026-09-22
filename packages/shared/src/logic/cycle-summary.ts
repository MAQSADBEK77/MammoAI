import type { CycleLog } from "../types";
import { computeCycleLengths, computePeriodLength, detectPeriodStarts, isCycleIrregular } from "./cycle";

/**
 * SUMMARY-01 — "Mening sikllarim" bo'limi uchun xulosa.
 *
 * Referensda (Flo) bosh ekranning pastki qismi deyarli butunlay bitta
 * tamoyilga qurilgan: "qayd qilsang — buni qaytarib beraman". Bizda esa
 * foydalanuvchilarning 81% i hech qachon hayz qayd etmagan, ya'ni qayd
 * qilishdan nima foyda ko'rishi HECH QAYERDA ko'rsatilmaydi. Bu bo'lim
 * shu bo'shliqni to'ldiradi.
 *
 * MUHIM: bu yerda bashorat YO'Q — faqat allaqachon QAYD ETILGAN narsa
 * o'lchanadi. Shuning uchun u kam ma'lumotli foydalanuvchida ham yolg'on
 * gapirmaydi: o'lchash uchun yetarli ma'lumot bo'lmasa, maydon `null`
 * bo'ladi va UI o'rniga taklif ko'rsatadi.
 */

/** Tibbiyotda odatiy deb qabul qilingan oraliqlar. Bular MIN/MAX_SANE_*
 * bilan ADASHTIRILMASIN: u yerdagilar "mantiqan bo'lishi mumkin" chegarasi
 * (15-60 kun), bu yerdagilar esa "odatiy" oraliq. Ayolga "qisqa" yoki
 * "uzun" deyish uchun aynan shu ikkinchisi kerak. */
export const NORMAL_CYCLE_MIN = 21;
export const NORMAL_CYCLE_MAX = 35;
export const NORMAL_PERIOD_MIN = 2;
export const NORMAL_PERIOD_MAX = 7;

/** Sikl uzunliklari orasidagi farq shundan oshsa — tartibsiz deb belgilanadi.
 * `isCycleIrregular` bilan bir xil manba bo'lishi uchun o'sha funksiya
 * ishlatiladi, bu yerda faqat diapazonni ko'rsatamiz. */
export type LengthStatus = "normal" | "short" | "long";

export interface CycleSummary {
  /** Oxirgi TUGAGAN sikl uzunligi. Joriy (hali tugamagan) sikl hisobga
   * olinmaydi — u haqida "21 kun" deyish noto'g'ri bo'lardi. */
  previousCycleLength: { days: number; status: LengthStatus } | null;
  /** Oxirgi TUGAGAN hayz davomiyligi. */
  previousPeriodLength: { days: number; status: LengthStatus } | null;
  /** Sikl uzunliklarining eng qisqa-eng uzun oralig'i. Kamida 2 ta tugagan
   * sikl bo'lsagina ma'noli. */
  variation: { min: number; max: number; regular: boolean } | null;
  /** Nechta tugagan sikl o'lchangani — UI "yana N ta sikl kerak" kabi
   * halol matn ko'rsatishi uchun. */
  completedCycles: number;
}

function classify(days: number, min: number, max: number): LengthStatus {
  if (days < min) return "short";
  if (days > max) return "long";
  return "normal";
}

export function summarizeCycles(logs: Pick<CycleLog, "date" | "flow">[], today: string): CycleSummary {
  const starts = detectPeriodStarts(logs);
  // `computeCycleLengths` faqat TUGAGAN sikllarni beradi (ikki boshlanish
  // orasidagi farq), ya'ni joriy sikl bu yerda yo'q — bizga aynan shu kerak.
  const lengths = computeCycleLengths(logs, 12);

  const previousCycleLength =
    lengths.length > 0
      ? { days: lengths[lengths.length - 1], status: classify(lengths[lengths.length - 1], NORMAL_CYCLE_MIN, NORMAL_CYCLE_MAX) }
      : null;

  // Oxirgi TUGAGAN hayz: eng so'nggi boshlanish hali davom etayotgan
  // bo'lishi mumkin, shuning uchun undan oldingisi olinadi. Bitta boshlanish
  // bo'lsa — tugaganini bilmaymiz, `null`.
  let previousPeriodLength: CycleSummary["previousPeriodLength"] = null;
  if (starts.length >= 2) {
    const days = computePeriodLength(logs, starts[starts.length - 2], today);
    if (days !== null) previousPeriodLength = { days, status: classify(days, NORMAL_PERIOD_MIN, NORMAL_PERIOD_MAX) };
  }

  const variation =
    lengths.length >= 2
      ? { min: Math.min(...lengths), max: Math.max(...lengths), regular: !isCycleIrregular(lengths) }
      : null;

  return { previousCycleLength, previousPeriodLength, variation, completedCycles: lengths.length };
}
