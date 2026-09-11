// Hayz tsikli bashorati — spec §2: "ilova keyingi tsiklni bashorat qiladi".
// Oddiy arifmetika, ML kerak emas.

import type { CycleLog, CycleSettings, FlowLevel } from "../types";

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

/** Kunlik loglar ichida "sikl boshlanishi" kunlarini aniqlaydi: ketma-ket
 * (CYCLE_GAP_DAYS ichida) flow kunlari bitta "streak"ka guruhlanadi, streak
 * ichidan birinchi kun — potentsial boshlanish. Oddiy streak-detection —
 * server/insights.ts'dagi Statistika bilan BIR XIL mantiq (bir marta shu yerda
 * yozilib, ikkalasida ham shu funksiya ishlatiladi).
 *
 * MUHIM: faqat KAMIDA BITTA haqiqiy (spotting BO'LMAGAN) oqim kuni bor
 * streaklar "hayz boshlanishi" deb hisoblanadi. Aks holda tarqoq, yakka
 * "spotting" kunlari (ovulyatsiya qon tomchilashi, implantatsiya, stress —
 * hammasi keng tarqalgan va hayz EMAS) yangi sikl deb noto'g'ri hisoblanib,
 * o'rtacha sikl uzunligini (demak — bashoratni) buzib yuborardi. Streak
 * spotting bilan boshlanib, keyin haqiqiy oqimga o'tsa (real holat) — baribir
 * hisoblanadi, boshlanish sanasi o'zgarmaydi. */
export function detectPeriodStarts(logs: Pick<CycleLog, "date" | "flow">[]): string[] {
  const flowByDate = new Map<string, FlowLevel>();
  for (const l of logs) if (l.flow) flowByDate.set(l.date, l.flow);
  const flowDates = [...flowByDate.keys()].sort();

  const streaks: string[][] = [];
  for (const date of flowDates) {
    const current = streaks[streaks.length - 1];
    if (current && daysBetween(current[current.length - 1], date) <= CYCLE_GAP_DAYS) {
      current.push(date);
    } else {
      streaks.push([date]);
    }
  }

  return streaks.filter((streak) => streak.some((d) => flowByDate.get(d) !== "spotting")).map((streak) => streak[0]);
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

  // Bashorat DOIM eng oxirgi tasdiqlangan boshlanishdan bitta cycleLength
  // keyingi sanani ko'rsatadi — necha kun o'tganidan qat'iy nazar. ILGARI: necha
  // "sikl o'tdi" deb hisoblab, kechikkanda bashoratni bir butun sikl OLDINGA
  // "sakratib" yuborardi (masalan 28 kunlik siklda 1 kun kechiksa ham, ilova
  // 27 kun qoldi deb ko'rsatardi — chunki keyingi-keyingi siklga sakrab
  // ketardi). Bu haqiqiy kechikishni yashirib, foydalanuvchiga noto'g'ri
  // xotirjamlik berardi — aslida "hayz kechikayapti" degan holat sikl
  // kuzatuvida eng muhim signallardan biri. Endi yangi haqiqiy hayz
  // `cycle_logs`ga kiritilmaguncha "kutilgan sana" o'zgarmaydi;
  // `daysUntilNextPeriod` shunchaki MANFIY bo'lib, kechikish sifatida
  // ko'rsatiladi (UI: dict.cycle.nextPeriodIn, dict.reminders.periodLate).
  const nextPeriodStart = addDays(settings.lastPeriodStart, cycleLength);
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
