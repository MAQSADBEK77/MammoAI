// Trendlar/statistika — AI Yordamchi ekranining "Statistika" segmenti uchun.
// Alohida "stats" jadvali yo'q: hammasi mavjud cycle_logs ustida sof JS
// agregatsiya (ML emas) — Flo uslubidagi "simptomlar qachon takrorlanadi",
// "sikl uzunligi qanday o'zgaryapti" kabi savollarga javob beradi.
//
// MUHIM CHEKLOV: kunlik jurnalda simptomning faqat BOR/YO'Qligi saqlanadi,
// og'riq INTENSIVLIGI (1-10 shkala) yo'q. Shuning uchun "og'riq kuchayib/
// kamayib boryapti" — har bir siklda cramps/back_pain/headache mavjud
// KUNLAR SONI orqali proksi sifatida hisoblanadi, haqiqiy shkala emas.

import { listCycleLogs } from "./repo";
import type { CycleLengthPoint, CycleLog, InsightsSummary, Mood, MoodDistributionPoint, PainDaysPoint, Symptom, SymptomFrequencyPoint } from "@mammoai/shared";

const CYCLE_GAP_DAYS = 2; // shuncha kun flow'siz o'tsa, keyingi flow kuni yangi sikl boshlanishi hisoblanadi
const FREQUENCY_WINDOW_MONTHS = 6;
const CYCLE_LENGTH_LIMIT = 12;
const MIN_CYCLES_FOR_DATA = 2;
const MIN_LOGS_FOR_DATA = 14;
const PAIN_SYMPTOMS: Symptom[] = ["cramps", "back_pain", "headache"];

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / 86400000);
}

function monthsAgoStr(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

/** Kunlik loglar ichida "sikl boshlanishi" kunlarini aniqlaydi: flow mavjud
 * kun, va undan oldingi flow kunidan CYCLE_GAP_DAYSdan ko'proq vaqt o'tgan
 * bo'lsa (yoki ro'yxatdagi birinchi flow kuni bo'lsa). Oddiy streak-detection. */
function detectCycleStarts(logs: CycleLog[]): string[] {
  const flowDates = [...new Set(logs.filter((l) => l.flow).map((l) => l.date))].sort();
  const starts: string[] = [];
  for (let i = 0; i < flowDates.length; i++) {
    if (i === 0 || daysBetween(flowDates[i - 1], flowDates[i]) > CYCLE_GAP_DAYS) {
      starts.push(flowDates[i]);
    }
  }
  return starts;
}

function computeCycleLengths(logs: CycleLog[], limit: number): CycleLengthPoint[] {
  const starts = detectCycleStarts(logs);
  const points: CycleLengthPoint[] = [];
  for (let i = 1; i < starts.length; i++) {
    points.push({ startDate: starts[i - 1], lengthDays: daysBetween(starts[i - 1], starts[i]) });
  }
  return points.slice(-limit);
}

function computeSymptomFrequency(logs: CycleLog[], months: number): SymptomFrequencyPoint[] {
  const cutoff = monthsAgoStr(months);
  const counts = new Map<Symptom, number>();
  for (const log of logs) {
    if (log.date < cutoff) continue;
    for (const symptom of log.symptoms) counts.set(symptom, (counts.get(symptom) ?? 0) + 1);
  }
  return [...counts.entries()].map(([symptom, count]) => ({ symptom, count })).sort((a, b) => b.count - a.count);
}

function computeMoodDistribution(logs: CycleLog[], months: number): MoodDistributionPoint[] {
  const cutoff = monthsAgoStr(months);
  const counts = new Map<Mood, number>();
  for (const log of logs) {
    if (log.date < cutoff || !log.mood) continue;
    counts.set(log.mood, (counts.get(log.mood) ?? 0) + 1);
  }
  return [...counts.entries()].map(([mood, count]) => ({ mood, count })).sort((a, b) => b.count - a.count);
}

function computePainDaysPerCycle(logs: CycleLog[], limit: number): PainDaysPoint[] {
  const starts = detectCycleStarts(logs);
  if (!starts.length) return [];
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const points: PainDaysPoint[] = starts.map((rangeStart, i) => {
    const rangeEnd = starts[i + 1] ?? null; // oxirgi (hali tugamagan) sikl — bugungacha ochiq
    const painDays = sorted.filter((log) => {
      if (log.date < rangeStart) return false;
      if (rangeEnd && log.date >= rangeEnd) return false;
      return log.symptoms.some((s) => PAIN_SYMPTOMS.includes(s));
    }).length;
    return { startDate: rangeStart, painDays };
  });
  return points.slice(-limit);
}

export async function getInsightsSummary(userId: string): Promise<InsightsSummary> {
  const logs = await listCycleLogs(userId, 365);
  const starts = detectCycleStarts(logs);
  const hasEnoughData = starts.length >= MIN_CYCLES_FOR_DATA || logs.length >= MIN_LOGS_FOR_DATA;

  return {
    hasEnoughData,
    cycleLengths: computeCycleLengths(logs, CYCLE_LENGTH_LIMIT),
    symptomFrequency: computeSymptomFrequency(logs, FREQUENCY_WINDOW_MONTHS),
    moodDistribution: computeMoodDistribution(logs, FREQUENCY_WINDOW_MONTHS),
    painDaysPerCycle: computePainDaysPerCycle(logs, CYCLE_LENGTH_LIMIT),
  };
}
