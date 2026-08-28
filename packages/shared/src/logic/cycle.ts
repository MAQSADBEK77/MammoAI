// Hayz tsikli bashorati — spec §2: "ilova keyingi tsiklni bashorat qiladi".
// Oddiy arifmetika, ML kerak emas.

import type { CycleSettings } from "../types";

export const DEFAULT_CYCLE_LENGTH = 28;
export const DEFAULT_PERIOD_LENGTH = 5;
/** 3+ oy tartibsizlik — checklist'ga ko'prik (spec §2). */
export const IRREGULARITY_MONTHS_THRESHOLD = 3;

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

export interface CyclePrediction {
  nextPeriodStart: string;
  nextPeriodEnd: string;
  fertileWindowStart: string;
  fertileWindowEnd: string;
  ovulationDay: string;
  daysUntilNextPeriod: number;
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
  const cyclesElapsed = Math.floor(daysSinceLast / cycleLength);
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
