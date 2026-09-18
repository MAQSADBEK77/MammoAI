// DATA-ACCURACY-01: Trendlar/statistika hisob-kitoblari — ilgari
// `apps/web/src/server/insights.ts`da (DB-ga bog'liq `./repo` importi bilan
// bir faylda) yashagan, shuning uchun HECH QACHON DB'siz (tez, deterministik)
// vitest bilan sinalmagan edi. Bu yerga, `checklist-rules.ts` bilan bir xil
// "sof mantiq — bazasiz" konvensiyaga ko'ra ko'chirildi: endi har bir funksiya
// oddiy `logs: CycleLog[]` + parametr qabul qiladi, DB haqida hech narsa
// bilmaydi, va `insights.test.ts`da qo'lda tekshirilgan raqamlar bilan
// sinaladi. `apps/web/src/server/insights.ts` endi faqat `listCycleLogs`ni
// chaqirib, natijani shu yerdagi `computeInsightsSummary`ga uzatadigan
// yupqa qatlam.
//
// MUHIM CHEKLOV (o'zgarishsiz): kunlik jurnalda simptomning faqat BOR/YO'Qligi
// saqlanadi, og'riq INTENSIVLIGI (1-10 shkala) yo'q — "og'riq kuchayib/
// kamayib boryapti" har bir siklda cramps/back_pain/headache mavjud KUNLAR
// SONI orqali proksi sifatida hisoblanadi, haqiqiy shkala emas.

import { addDays, computeCycleLengths, computePeriodLength, daysBetween, detectPeriodStarts } from "./cycle";
import { tashkentDateStr } from "../date";
import type {
  CycleLengthPoint,
  CycleLog,
  InsightsSummary,
  Mood,
  MoodDistributionPoint,
  MoodPhaseBreakdown,
  PainDaysPoint,
  PeriodLengthPoint,
  PredictionAccuracy,
  RegularityScore,
  Symptom,
  SymptomFrequencyPoint,
  SymptomPhaseBreakdown,
} from "../types";

const FREQUENCY_WINDOW_MONTHS = 6;
const CYCLE_LENGTH_LIMIT = 12;
const MIN_CYCLES_FOR_DATA = 2;
const MIN_LOGS_FOR_DATA = 14;
const REGULARITY_TREND_MIN_CYCLES = 4; // shundan kam bo'lsa yo'nalish haqida gapirish shoshqaloqlik bo'lardi
const REGULARITY_TREND_THRESHOLD_DAYS = 2; // yarim-yarim o'rtachalar farqi shuncha kundan katta bo'lsagina yo'nalish e'lon qilinadi
const PAIN_SYMPTOMS: Symptom[] = ["cramps", "back_pain", "headache"];
const PREDICTION_BACKTEST_WINDOW = 6; // predictCycle/deriveAdaptiveCycleSettings'dagi ADAPTIVE_MAX_CYCLES bilan bir xil
const PREDICTION_MIN_CYCLES = 4; // shundan kam o'tgan sikl bo'lsa, backtest ishonchli emas

// DATA-ACCURACY-01: avvalgi versiya (`new Date(); d.setMonth(...);
// .toISOString()`) ikkita mustaqil xato qilardi: (1) `toISOString()` UTC
// sanani beradi — Toshkent mahalliy 00:00-04:59 oralig'ida bu "kecha"gi kun
// (FIX2-23 bilan bir xil sinf xato); (2) `Date#setMonth` OYNING KUNI SONINI
// hisobga olmaydi — masalan 31-avgustdan 6 oy oldingi sana "28-fevral"
// o'rniga "3-mart" bo'lib chiqadi (fevralda 31-kun yo'q, JS avtomatik
// keyingi oyga "toshib" ketadi). Qo'lda tekshirilgan holatlar (`insights.
// test.ts`da qotirilgan): 31-avgust->28-fevral, 31-oktabr->30-aprel,
// 31-dekabr->30-iyun, 31-mart->30-sentabr, 31-may->30-noyabr, kabisa yili
// 2024: 31-avgust->29-fevral. Bular FREQUENCY_WINDOW_MONTHS=6 bilan yiliga
// ~6 marta (har oyning 30/31-kunida) simptom/kayfiyat statistikasidagi
// "so'nggi 6 oy" oynasini 1-3 kunga TORAYTIRIB, chegaradagi haqiqiy
// yozuvlarni jimgina tashlab yuborardi. `today` parametri — sinov uchun
// (production'da har doim haqiqiy `tashkentDateStr()`).
export function monthsAgoStr(months: number, today: string = tashkentDateStr()): string {
  const [year, month, day] = today.split("-").map(Number);
  const firstOfTargetMonth = new Date(Date.UTC(year, month - 1 - months, 1));
  const targetYear = firstOfTargetMonth.getUTCFullYear();
  const targetMonth = firstOfTargetMonth.getUTCMonth();
  const daysInTargetMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const clampedDay = Math.min(day, daysInTargetMonth);
  return new Date(Date.UTC(targetYear, targetMonth, clampedDay)).toISOString().slice(0, 10);
}

/** Sikl boshlanishi kunlarini aniqlaydi — `./cycle.ts`dagi `detectPeriodStarts`
 * bilan BIR XIL mantiq (bashorat algoritmi ham shuni ishlatadi — ikkalasi
 * hech qachon bir-biridan farqli natija bermasligi uchun shu bitta joyda
 * yozilgan). */
export function computeCycleLengthPoints(logs: CycleLog[], limit: number): CycleLengthPoint[] {
  const starts = detectPeriodStarts(logs);
  const points: CycleLengthPoint[] = [];
  for (let i = 1; i < starts.length; i++) {
    points.push({ startDate: starts[i - 1], lengthDays: daysBetween(starts[i - 1], starts[i]) });
  }
  return points.slice(-limit);
}

/** Har bir aniqlangan siklning HAYZ qismi qancha davom etgani (bashorat
 * algoritmidagi `computePeriodLength` bilan bir xil funksiya) — hali
 * tugamagan (davom etayotgan) hayz shu ro'yxatga kirmaydi. */
export function computePeriodLengthPoints(
  logs: CycleLog[],
  limit: number,
  today: string = tashkentDateStr()
): PeriodLengthPoint[] {
  const starts = detectPeriodStarts(logs);
  const points: PeriodLengthPoint[] = [];
  for (const start of starts) {
    const length = computePeriodLength(logs, start, today);
    if (length !== null) points.push({ startDate: start, lengthDays: length });
  }
  return points.slice(-limit);
}

/** Sikl uzunligining o'rtachasi, o'zgaruvchanligi va yo'nalishi — Cycle
 * ekranidagi ikkilik "tartibsiz/emas" belgisidan chuqurroq ko'rsatkich. */
export function computeRegularityScore(logs: CycleLog[]): RegularityScore | null {
  const lengths = computeCycleLengths(logs, CYCLE_LENGTH_LIMIT);
  if (lengths.length === 0) return null;

  const averageCycleLength = Math.round(lengths.reduce((sum, l) => sum + l, 0) / lengths.length);
  const variabilityDays = Math.max(...lengths) - Math.min(...lengths);

  let trend: RegularityScore["trend"] = "stable";
  if (lengths.length >= REGULARITY_TREND_MIN_CYCLES) {
    const mid = Math.floor(lengths.length / 2);
    const firstHalfAvg = lengths.slice(0, mid).reduce((sum, l) => sum + l, 0) / mid;
    const secondHalfAvg = lengths.slice(mid).reduce((sum, l) => sum + l, 0) / (lengths.length - mid);
    const diff = secondHalfAvg - firstHalfAvg;
    if (diff > REGULARITY_TREND_THRESHOLD_DAYS) trend = "lengthening";
    else if (diff < -REGULARITY_TREND_THRESHOLD_DAYS) trend = "shortening";
  }

  return { averageCycleLength, variabilityDays, cyclesAnalyzed: lengths.length, trend };
}

export function computeSymptomFrequency(
  logs: CycleLog[],
  months: number,
  today: string = tashkentDateStr()
): SymptomFrequencyPoint[] {
  const cutoff = monthsAgoStr(months, today);
  const counts = new Map<Symptom, number>();
  for (const log of logs) {
    if (log.date < cutoff) continue;
    for (const symptom of log.symptoms) counts.set(symptom, (counts.get(symptom) ?? 0) + 1);
  }
  return [...counts.entries()].map(([symptom, count]) => ({ symptom, count })).sort((a, b) => b.count - a.count);
}

/** Har bir simptom hayz kunlarida ko'proq uchraydimi, yoki sikl davomida
 * boshqa kunlarda ham bab-baravar — "faqat hayz paytida" va "doim" o'rtasidagi
 * foydali farqni ko'rsatadi (aniq 4-fazali tahlil BBT/LH'siz ishonchsiz bo'lardi). */
export function computeSymptomPhaseBreakdown(
  logs: CycleLog[],
  months: number,
  today: string = tashkentDateStr()
): SymptomPhaseBreakdown[] {
  const cutoff = monthsAgoStr(months, today);
  const counts = new Map<Symptom, { periodDaysCount: number; otherDaysCount: number }>();
  for (const log of logs) {
    if (log.date < cutoff || log.symptoms.length === 0) continue;
    for (const symptom of log.symptoms) {
      const entry = counts.get(symptom) ?? { periodDaysCount: 0, otherDaysCount: 0 };
      if (log.flow) entry.periodDaysCount++;
      else entry.otherDaysCount++;
      counts.set(symptom, entry);
    }
  }
  return [...counts.entries()]
    .map(([symptom, c]) => ({ symptom, ...c }))
    .sort((a, b) => b.periodDaysCount + b.otherDaysCount - (a.periodDaysCount + a.otherDaysCount));
}

/** symptomPhaseBreakdown bilan bir xil g'oya, kayfiyat uchun — "chuqurroq
 * Statistika" so'roviga ko'ra qo'shildi. */
export function computeMoodPhaseBreakdown(
  logs: CycleLog[],
  months: number,
  today: string = tashkentDateStr()
): MoodPhaseBreakdown[] {
  const cutoff = monthsAgoStr(months, today);
  const counts = new Map<Mood, { periodDaysCount: number; otherDaysCount: number }>();
  for (const log of logs) {
    if (log.date < cutoff || !log.mood) continue;
    const entry = counts.get(log.mood) ?? { periodDaysCount: 0, otherDaysCount: 0 };
    if (log.flow) entry.periodDaysCount++;
    else entry.otherDaysCount++;
    counts.set(log.mood, entry);
  }
  return [...counts.entries()]
    .map(([mood, c]) => ({ mood, ...c }))
    .sort((a, b) => b.periodDaysCount + b.otherDaysCount - (a.periodDaysCount + a.otherDaysCount));
}

/** Bashorat algoritmini ORQAGA QARAB sinaydi ("backtest") — har bir o'tgan
 * sikl uchun, FAQAT o'sha paytda mavjud bo'lgan tarixdan (keyingi ma'lumot
 * "kelajakdan qarab aldab" ishlatilmaydi) qancha kun deb bashorat qilingan
 * bo'lardi, haqiqiy boshlanish sanasi bilan solishtiriladi. */
export function computePredictionAccuracy(logs: CycleLog[]): PredictionAccuracy | null {
  const starts = detectPeriodStarts(logs);
  if (starts.length < PREDICTION_MIN_CYCLES) return null;

  const errors: number[] = [];
  for (let i = PREDICTION_MIN_CYCLES - 1; i < starts.length; i++) {
    // MUHIM: faqat i'DAN OLDINGI gap'lar (j < i) — starts[i]ni bashorat qilish
    // uchun starts[i]ning o'ziga olib keladigan gap ISHLATILMASLIGI kerak,
    // aks holda "kelajakdan qarab aldash" (data leakage) bo'lardi.
    const priorGaps: number[] = [];
    for (let j = 1; j < i; j++) priorGaps.push(daysBetween(starts[j - 1], starts[j]));
    if (priorGaps.length === 0) continue;
    const recentGaps = priorGaps.slice(-PREDICTION_BACKTEST_WINDOW);
    const avgGap = recentGaps.reduce((sum, g) => sum + g, 0) / recentGaps.length;
    const predictedDate = addDays(starts[i - 1], Math.round(avgGap));
    errors.push(Math.abs(daysBetween(predictedDate, starts[i])));
  }
  if (errors.length === 0) return null;

  const avgErrorDays = Math.round((errors.reduce((sum, e) => sum + e, 0) / errors.length) * 10) / 10;
  const within2Days = errors.filter((e) => e <= 2).length;
  return { avgErrorDays, within2DaysPct: Math.round((within2Days / errors.length) * 100), cyclesEvaluated: errors.length };
}

export function computeMoodDistribution(
  logs: CycleLog[],
  months: number,
  today: string = tashkentDateStr()
): MoodDistributionPoint[] {
  const cutoff = monthsAgoStr(months, today);
  const counts = new Map<Mood, number>();
  for (const log of logs) {
    if (log.date < cutoff || !log.mood) continue;
    counts.set(log.mood, (counts.get(log.mood) ?? 0) + 1);
  }
  return [...counts.entries()].map(([mood, count]) => ({ mood, count })).sort((a, b) => b.count - a.count);
}

export function computePainDaysPerCycle(logs: CycleLog[], limit: number): PainDaysPoint[] {
  const starts = detectPeriodStarts(logs);
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

/** `getInsightsSummary`ning DB'siz, sof qismi — `apps/web/src/server/
 * insights.ts` faqat `listCycleLogs`ni chaqirib, natijani shu yerga uzatadi. */
export function computeInsightsSummary(logs: CycleLog[], today: string = tashkentDateStr()): InsightsSummary {
  const starts = detectPeriodStarts(logs);
  const hasEnoughData = starts.length >= MIN_CYCLES_FOR_DATA || logs.length >= MIN_LOGS_FOR_DATA;

  return {
    hasEnoughData,
    cycleLengths: computeCycleLengthPoints(logs, CYCLE_LENGTH_LIMIT),
    periodLengths: computePeriodLengthPoints(logs, CYCLE_LENGTH_LIMIT, today),
    regularity: computeRegularityScore(logs),
    symptomFrequency: computeSymptomFrequency(logs, FREQUENCY_WINDOW_MONTHS, today),
    symptomPhaseBreakdown: computeSymptomPhaseBreakdown(logs, FREQUENCY_WINDOW_MONTHS, today),
    moodPhaseBreakdown: computeMoodPhaseBreakdown(logs, FREQUENCY_WINDOW_MONTHS, today),
    moodDistribution: computeMoodDistribution(logs, FREQUENCY_WINDOW_MONTHS, today),
    painDaysPerCycle: computePainDaysPerCycle(logs, CYCLE_LENGTH_LIMIT),
    predictionAccuracy: computePredictionAccuracy(logs),
  };
}
