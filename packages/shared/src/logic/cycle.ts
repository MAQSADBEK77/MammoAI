// Hayz tsikli bashorati — spec §2: "ilova keyingi tsiklni bashorat qiladi".
// Oddiy arifmetika, ML kerak emas.

import type { CycleLog, CycleSettings } from "../types";

export const DEFAULT_CYCLE_LENGTH = 28;
export const DEFAULT_PERIOD_LENGTH = 5;
/** 3+ oy tartibsizlik — checklist'ga ko'prik (spec §2). */
export const IRREGULARITY_MONTHS_THRESHOLD = 3;

// Adaptiv hisoblash sozlamalari — haqiqiy `cycle_logs` tarixidan sikl
// uzunligini "o'rganish" uchun (bir marta onboarding'da kiritilgan statik
// qiymatga abadiy tayanish o'rniga — Flo/Clue kabi ilovalar shunday ishlaydi).
const CYCLE_GAP_DAYS = 2; // shuncha kun flow'siz o'tsa, keyingi flow kuni yangi sikl boshlanishi hisoblanadi
const ADAPTIVE_MIN_CYCLES = 2; // shundan kam aniqlangan sikl bo'lsa, hali ishonchli emas — sozlamalarga tayaniladi
const ADAPTIVE_MAX_CYCLES = 6; // o'rtacha shu oxirgi N ta sikldan hisoblanadi (juda eski ma'lumot og'irlik qilmasin)
const MIN_SANE_CYCLE_LENGTH = 15;
const MAX_SANE_CYCLE_LENGTH = 60;
const MIN_SANE_PERIOD_LENGTH = 1;
const MAX_SANE_PERIOD_LENGTH = 10;

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round(
    (new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / msPerDay
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Kunlik loglar ichida "sikl boshlanishi" kunlarini aniqlaydi: flow mavjud
 * kun, va undan oldingi flow kunidan CYCLE_GAP_DAYSdan ko'proq vaqt o'tgan
 * bo'lsa (yoki ro'yxatdagi birinchi flow kuni bo'lsa). Oddiy streak-detection —
 * server/insights.ts'dagi Statistika bilan BIR XIL mantiq (bir marta shu yerda
 * yozilib, ikkalasida ham shu funksiya ishlatiladi). */
export function detectPeriodStarts(logs: Pick<CycleLog, "date" | "flow">[]): string[] {
  const flowDates = [...new Set(logs.filter((l) => l.flow).map((l) => l.date))].sort();
  const starts: string[] = [];
  for (let i = 0; i < flowDates.length; i++) {
    if (i === 0 || daysBetween(flowDates[i - 1], flowDates[i]) > CYCLE_GAP_DAYS) {
      starts.push(flowDates[i]);
    }
  }
  return starts;
}

/** Aniqlangan sikl boshlanishlari orasidagi kunlar farqi (oxirgi `limit` tasi). */
export function computeCycleLengths(logs: Pick<CycleLog, "date" | "flow">[], limit = ADAPTIVE_MAX_CYCLES): number[] {
  const starts = detectPeriodStarts(logs);
  const lengths: number[] = [];
  for (let i = 1; i < starts.length; i++) lengths.push(daysBetween(starts[i - 1], starts[i]));
  return lengths.slice(-limit);
}

/** Berilgan sana bilan boshlangan flow-streak necha kun davom etgani (bo'shliq
 * uchramaguncha ketma-ket flow'li kunlarni sanaydi) — davom etayotgan (hali
 * tugamagan) hayz uchun `null` qaytaradi, chunki uzunligi hali noma'lum. */
export function computePeriodLength(logs: Pick<CycleLog, "date" | "flow">[], periodStart: string, today: string): number | null {
  const flowDates = new Set(logs.filter((l) => l.flow).map((l) => l.date));
  let length = 0;
  let cursor = periodStart;
  while (flowDates.has(cursor)) {
    length++;
    cursor = addDays(cursor, 1);
  }
  // Agar streak "bugun"gacha uzilmasdan davom etayotgan bo'lsa — hali tugamagan,
  // uzunligini hisoblash uchun erta (keyingi kunlarda yana davom etishi mumkin).
  if (length > 0 && addDays(periodStart, length - 1) >= today) return null;
  return length || null;
}

export interface AdaptiveCycleSettings {
  lastPeriodStart: string;
  averageCycleLength: number;
  averagePeriodLength: number;
  /** Necha ta haqiqiy (loglardan aniqlangan) sikl asosida hisoblangani —
   * 0 bo'lsa, foydalanuvchining bir martalik sozlamasiga tayanilgan. */
  cyclesAnalyzed: number;
}

/**
 * `cycle_settings`dagi statik qiymat o'rniga, imkon qadar haqiqiy `cycle_logs`
 * tarixidan (oxirgi ADAPTIVE_MAX_CYCLES ta aniqlangan sikldan) o'rtacha sikl/
 * hayz uzunligini va ENG SO'NGGI haqiqiy boshlanish sanasini hisoblaydi — shu
 * orqali bashorat vaqt o'tishi bilan foydalanuvchining haqiqiy holatiga
 * moslasha boradi. Yetarli tarix (2+ aniqlangan sikl) bo'lmasa, foydalanuvchi
 * qo'lda kiritgan/tanlagan `fallback` sozlamalariga tushadi (`cyclesAnalyzed: 0`).
 */
export function deriveAdaptiveCycleSettings(
  logs: Pick<CycleLog, "date" | "flow">[],
  fallback: Pick<CycleSettings, "lastPeriodStart" | "averageCycleLength" | "averagePeriodLength">,
  today: string = new Date().toISOString().slice(0, 10)
): AdaptiveCycleSettings | null {
  const starts = detectPeriodStarts(logs);
  const lengths = computeCycleLengths(logs);

  if (starts.length < ADAPTIVE_MIN_CYCLES || lengths.length === 0) {
    if (!fallback.lastPeriodStart) return null;
    return {
      lastPeriodStart: fallback.lastPeriodStart,
      averageCycleLength: fallback.averageCycleLength || DEFAULT_CYCLE_LENGTH,
      averagePeriodLength: fallback.averagePeriodLength || DEFAULT_PERIOD_LENGTH,
      cyclesAnalyzed: 0,
    };
  }

  const avgCycleLength = clamp(
    Math.round(lengths.reduce((sum, l) => sum + l, 0) / lengths.length),
    MIN_SANE_CYCLE_LENGTH,
    MAX_SANE_CYCLE_LENGTH
  );
  const lastStart = starts[starts.length - 1];
  const periodLength = computePeriodLength(logs, lastStart, today) ?? fallback.averagePeriodLength ?? DEFAULT_PERIOD_LENGTH;

  return {
    lastPeriodStart: lastStart,
    averageCycleLength: avgCycleLength,
    averagePeriodLength: clamp(periodLength, MIN_SANE_PERIOD_LENGTH, MAX_SANE_PERIOD_LENGTH),
    cyclesAnalyzed: lengths.length,
  };
}

export interface CyclePrediction {
  nextPeriodStart: string;
  nextPeriodEnd: string;
  fertileWindowStart: string;
  fertileWindowEnd: string;
  ovulationDay: string;
  daysUntilNextPeriod: number;
  /** Necha ta haqiqiy sikl asosida hisoblangani — 0 bo'lsa, taxminiy (sozlamaga
   * asoslangan) bashorat. UI'da "so'nggi N ta sikl asosida" kabi shaffoflik uchun. */
  cyclesAnalyzed: number;
}

export function predictCycle(
  settings: Pick<CycleSettings, "lastPeriodStart" | "averageCycleLength" | "averagePeriodLength">,
  today: string = new Date().toISOString().slice(0, 10)
): CyclePrediction | null {
  if (!settings.lastPeriodStart) return null;
  const cycleLength = settings.averageCycleLength || DEFAULT_CYCLE_LENGTH;
  const periodLength = settings.averagePeriodLength || DEFAULT_PERIOD_LENGTH;

  // Bugungi kungacha necha tsikl o'tganini hisoblab, keyingi bashoratni topamiz.
  const daysSinceLast = daysBetween(settings.lastPeriodStart, today);
  let cyclesElapsed = Math.floor(daysSinceLast / cycleLength);
  // Chekka holat: `daysSinceLast` aynan cycleLength'ga karrali bo'lsa (masalan
  // aynan 28 kun o'tgan, 28 kunlik sikl) — bugun AYNAN navbatdagi hayz kuni,
  // shuning uchun bitta ORTIQCHA sikl qo'shib yubormaslik kerak (aks holda
  // bashorat bir butun sikl uzoqqa "sakrab ketardi").
  if (daysSinceLast > 0 && daysSinceLast % cycleLength === 0) cyclesElapsed -= 1;
  const nextPeriodStart = addDays(settings.lastPeriodStart, (cyclesElapsed + 1) * cycleLength);
  const nextPeriodEnd = addDays(nextPeriodStart, periodLength - 1);

  // Unumdor oyna — ovulyatsiyadan ~5 kun oldin, 1 kun keyin (tsikl oxiridan 14 kun oldin taxminiy).
  const ovulationDay = addDays(nextPeriodStart, -14);
  const fertileWindowStart = addDays(ovulationDay, -5);
  const fertileWindowEnd = addDays(ovulationDay, 1);

  return {
    nextPeriodStart,
    nextPeriodEnd,
    fertileWindowStart,
    fertileWindowEnd,
    ovulationDay,
    daysUntilNextPeriod: daysBetween(today, nextPeriodStart),
    cyclesAnalyzed: 0, // chaqiruvchi (buildCycleResponse) adaptiv qiymat bilan qayta belgilaydi
  };
}

/** So'nggi tsikl uzunliklaridan tartibsizlik borligini aniqlaydi (standart og'ish katta bo'lsa). */
export function isCycleIrregular(recentCycleLengths: number[]): boolean {
  if (recentCycleLengths.length < IRREGULARITY_MONTHS_THRESHOLD) return false;
  const relevant = recentCycleLengths.slice(-IRREGULARITY_MONTHS_THRESHOLD);
  const max = Math.max(...relevant);
  const min = Math.min(...relevant);
  return max - min > 7; // 7 kundan katta farq — tartibsiz deb hisoblanadi
}
