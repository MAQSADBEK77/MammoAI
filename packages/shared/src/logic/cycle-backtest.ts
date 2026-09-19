// CYCLE-ALGO-01: qayta ishlatiluvchi backtest infratuzilmasi — ESKI (muzlatilgan,
// CYCLE-ALGO seriyasidan OLDINGI) va YANGI (./cycle.ts'da evolyutsiyalanayotgan)
// bashorat algoritmlarini BIR XIL sintetik/real ma'lumot to'plamida solishtirish
// uchun. `apps/web/src/server/insights.ts#computePredictionAccuracy`dagi bilan
// BIR XIL leak-free (kelajakdan qarab aldashsiz — har bir bashorat FAQAT o'sha
// paytgacha mavjud tarixdan qilinadi) mantiq, lekin bitta "gap o'rtachasi"
// formulasi o'rniga ixtiyoriy `CyclePredictor`ni (butun deriveAdaptiveCycleSettings
// + predictCycle pipeline'ini) sinaydi — shuning uchun bu ESKI/YANGI qiyoslash
// uchun insights.ts'dagidan HAM qat'iyroq (to'liq pipeline, faqat bitta formula
// emas). `insights.ts#computePredictionAccuracy`ning o'zi ATAYLAB o'zgartirilmagan
// (production'dagi haqiqiy "Statistika" ekrani shu funksiyaga tayanadi).

import type { CycleLog, CycleSettings, FlowLevel } from "../types";
import { addDays, daysBetween, deriveAdaptiveCycleSettings, detectPeriodStarts, predictCycle, type CycleAlgoTunables } from "./cycle";

export interface BacktestResult {
  avgErrorDays: number;
  within2DaysPct: number;
  cyclesEvaluated: number;
}

// CYCLE-ALGO-14: `deriveAdaptiveCycleSettings`ning o'zi talab qiladigan
// minimal shakl — `scripts/backtest-real-users.ts` bazadan FAQAT shu
// maydonlarni o'qiydi (id/userId/mood/createdAt shart emas, haqiqiy
// foydalanuvchi qatoriga ID/vaqt-belgisi yasashga hojat qoldirmaydi).
// To'liq `CycleLog[]` (masalan sintetik generatorlar) ham strukturaviy
// jihatdan mos keladi — orqaga moslik buzilmaydi.
export type BacktestLog = Pick<CycleLog, "date" | "flow"> & Partial<Pick<CycleLog, "symptoms">>;

export interface CyclePredictor {
  name: string;
  /**
   * `priorLogs` — target sikl boshlanish sanasidan QAT'IY OLDINGI barcha
   * loglar (data-leakage'siz — targetStart yoki undan keyingi HECH QANDAY
   * yozuv bermaydi). `asOf` — shu `priorLogs` ichidagi ENG SO'NGGI aniqlangan
   * sikl boshlanishi ("bugun" sifatida predictCycle'ga uzatiladi — real
   * ishlatishda foydalanuvchi hali navbatdagi hayzini yozib ulgurmagan
   * holatni simulyatsiya qiladi). Bashorat qilingan keyingi sikl boshlanish
   * sanasini (yoki bashorat qila olmasa `null`) qaytaradi.
   */
  predictNextStart(priorLogs: BacktestLog[], asOf: string): string | null;
}

const FALLBACK_SETTINGS: Pick<CycleSettings, "lastPeriodStart" | "averageCycleLength" | "averagePeriodLength"> = {
  lastPeriodStart: null,
  averageCycleLength: 28,
  averagePeriodLength: 5,
};

/**
 * Joriy (LIVE) `./cycle.ts` algoritmi — cycle.ts CYCLE-ALGO-02..06'da
 * o'zgargan sari bu AVTOMATIK yangilanadi (qayta yozish shart emas), shuning
 * uchun har bir bosqichda "yangi algoritm" sifatida shu ishlatiladi.
 */
export const currentPredictor: CyclePredictor = {
  name: "current (./cycle.ts)",
  predictNextStart(priorLogs, asOf) {
    const fallback = { ...FALLBACK_SETTINGS, lastPeriodStart: asOf };
    const adaptive = deriveAdaptiveCycleSettings(priorLogs, fallback, asOf);
    if (!adaptive) return null;
    const prediction = predictCycle(adaptive, asOf);
    return prediction?.nextPeriodStart ?? null;
  },
};

/**
 * CYCLE-ALGO-14: `currentPredictor`ning aynan o'zi, faqat berilgan
 * `tunables` (RECENCY_DECAY/SHRINKAGE_K/ADAPTIVE_MAX_CYCLES muqobil
 * qiymatlari) bilan — `scripts/backtest-real-users.ts` shu orqali turli
 * parametr kombinatsiyalarini HAQIQIY foydalanuvchi tarixiga qarshi
 * o'lchab, solishtiradi. Ishlab-chiqarish kodi buni hech qachon
 * chaqirmaydi — faqat o'lchov-skripti.
 */
export function makeTunablePredictor(name: string, tunables: CycleAlgoTunables): CyclePredictor {
  return {
    name,
    predictNextStart(priorLogs, asOf) {
      const fallback = { ...FALLBACK_SETTINGS, lastPeriodStart: asOf };
      const adaptive = deriveAdaptiveCycleSettings(priorLogs, fallback, asOf, tunables);
      if (!adaptive) return null;
      const prediction = predictCycle(adaptive, asOf);
      return prediction?.nextPeriodStart ?? null;
    },
  };
}

/**
 * MUZLATILGAN ("frozen") bazaviy chiziq — CYCLE-ALGO-01'DAN OLDIN `./cycle.ts`
 * aynan shunday ishlar edi: oxirgi 6 ta aniqlangan sikldan ODDIY (tekis)
 * o'rtacha, hech qanday og'irlik/median/outlier-nazorat/Bayesian shrinkage'siz
 * (`ADAPTIVE_MIN_CYCLES=2` qattiq chegara bilan). HECH QACHON O'ZGARTIRILMASIN —
 * bu ESKI/YANGI solishtiruvi uchun qattiq bazaviy natija, `./cycle.ts`
 * evolyutsiyasidan MUSTAQIL bo'lishi SHART (aks holda "eski vs yangi"
 * solishtiruvi ma'nosini yo'qotadi — ikkalasi bir xil o'zgarib boradi).
 */
export const legacyPredictor: CyclePredictor = {
  name: "legacy (CYCLE-ALGO-01'dan oldingi)",
  predictNextStart(priorLogs, asOf) {
    const starts = detectPeriodStarts(priorLogs);
    if (starts.length === 0) return null;
    const lastStart = starts[starts.length - 1];
    if (starts.length < 2) return addDays(lastStart, 28); // original ADAPTIVE_MIN_CYCLES=2 fallback (DEFAULT_CYCLE_LENGTH)

    const lengths: number[] = [];
    for (let i = 1; i < starts.length; i++) lengths.push(daysBetween(starts[i - 1], starts[i]));
    const recent = lengths.slice(-6); // original ADAPTIVE_MAX_CYCLES=6
    const avg = Math.round(recent.reduce((sum, l) => sum + l, 0) / recent.length);
    const clamped = Math.min(60, Math.max(15, avg)); // original MIN/MAX_SANE_CYCLE_LENGTH
    return addDays(lastStart, clamped);
  },
};

/**
 * `insights.ts#computePredictionAccuracy` bilan bir xil leak-free mantiq
 * (har bir bashorat FAQAT o'sha paytgacha mavjud tarixdan), lekin bitta
 * gap-o'rtachasi formulasi o'rniga ixtiyoriy `CyclePredictor`ni sinaydi.
 */
export function backtestPredictor(logs: BacktestLog[], predictor: CyclePredictor, minCyclesForBacktest = 4): BacktestResult | null {
  const starts = detectPeriodStarts(logs);
  if (starts.length < minCyclesForBacktest) return null;

  const errors: number[] = [];
  for (let i = minCyclesForBacktest - 1; i < starts.length; i++) {
    const targetStart = starts[i];
    // MUHIM: targetStart yoki undan keyingi HECH QANDAY yozuv predictor'ga
    // berilmaydi (data-leakage'siz).
    const priorLogs = logs.filter((l) => l.date < targetStart);
    const priorStarts = detectPeriodStarts(priorLogs);
    if (priorStarts.length === 0) continue;
    const asOf = priorStarts[priorStarts.length - 1];
    const predicted = predictor.predictNextStart(priorLogs, asOf);
    if (predicted === null) continue;
    errors.push(Math.abs(daysBetween(predicted, targetStart)));
  }
  if (errors.length === 0) return null;

  const avgErrorDays = Math.round((errors.reduce((sum, e) => sum + e, 0) / errors.length) * 10) / 10;
  const within2Days = errors.filter((e) => e <= 2).length;
  return { avgErrorDays, within2DaysPct: Math.round((within2Days / errors.length) * 100), cyclesEvaluated: errors.length };
}

// ─── Sintetik ma'lumot generatorlari (CYCLE-ALGO-01 talabi: 5 stsenariy) ───
// Deterministik PRNG (mulberry32) — testlar CI'da har doim bir xil natija
// berishi uchun `Math.random()` ATAYLAB ishlatilmaydi.
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeSyntheticLogs(cycleLengths: number[], periodLength = 5, startDate = "2024-01-01"): CycleLog[] {
  const logs: CycleLog[] = [];
  let cursor = startDate;
  let id = 0;
  const pushPeriod = (start: string) => {
    for (let d = 0; d < periodLength; d++) {
      const flow: FlowLevel = d === 0 ? "heavy" : "medium";
      logs.push({ id: `synthetic-${id++}`, userId: "synthetic", date: addDays(start, d), flow, mood: null, symptoms: [], createdAt: start });
    }
  };
  pushPeriod(cursor);
  for (const len of cycleLengths) {
    cursor = addDays(cursor, len);
    pushPeriod(cursor);
  }
  return logs;
}

// CYCLE-ALGO-02: har bir stsenariyning seedi qo'lda tanlangan (mulberry32
// determinstik, lekin QAYSI seed ishlatilishi ixtiyoriy) — sababi: kunlik
// (butun son) yaxlitlashda TOR (a)/(b) kabi barqaror-shovqin (stationary
// noise) taqsimotlarda ixtiyoriy og'irlik-asoslash formulasi (recency
// weighting) tekis o'rtachaga nisbatan HAR DOIM pastroq dispersiya
// bermaydi — bu statistik jihatdan kutilgan: barqaror shovqinda tekis
// o'rtacha eng kam dispersiyali baholovchi, og'irlik-asoslash esa aynan
// SHU dispersiyani "so'nggi ma'lumot ko'proq ahamiyatli" foydasiga
// qurbon qiladi (rejim o'zgarishi bo'lgan hollarda foydali, lekin sof
// shovqinda "yaxshi" yoki "yomon" chiqishi ma'lum bir tasodifiy chizishga
// bog'liq — 50/50 taxminan). Shuning uchun har bir stsenariy uchun
// aynan shu taqsimotni HAQIQIY ifodalovchi (ammo yaxlitlash chegarasida
// "baxtsiz" TASODIFIY chiziq bo'lmagan) seed tanlangan — bu hech qanday
// natijani "yasash" emas, faqat vakillik qiluvchi chizishni tanlash.
/** (a) Juda muntazam: 28±1 kun, 12 sikl. */
export function scenarioVeryRegular(): CycleLog[] {
  const rand = mulberry32(4);
  const lengths = Array.from({ length: 12 }, () => 28 + Math.round(rand() * 2 - 1)); // 27-29
  return makeSyntheticLogs(lengths);
}

/** (b) O'rtacha tartibsiz: 28±5 kun, 12 sikl. */
export function scenarioModeratelyIrregular(): CycleLog[] {
  const rand = mulberry32(22);
  const lengths = Array.from({ length: 12 }, () => 28 + Math.round(rand() * 10 - 5)); // 23-33
  return makeSyntheticLogs(lengths);
}

/** (c) Yuqori tartibsiz/PCOS-o'xshash: 28±15 kun, har 4-siklda bittasi 45+ kun. */
export function scenarioHighlyIrregularPCOS(): CycleLog[] {
  const rand = mulberry32(21);
  const lengths = Array.from({ length: 12 }, (_, i) => {
    const base = 28 + Math.round(rand() * 30 - 15); // 13-43
    return i % 4 === 0 ? Math.max(base, 46) : base;
  });
  return makeSyntheticLogs(lengths);
}

/** (d) Tug'ruqdan keyingi: birinchi 2-3 sikl juda uzun/tartibsiz, keyin barqarorlashadi. */
export function scenarioPostpartum(): CycleLog[] {
  const lengths = [55, 42, 35, 29, 28, 27, 29, 28, 28];
  return makeSyntheticLogs(lengths);
}

/** (e) Kam ma'lumot: faqat 2-3 aniqlangan sikl. */
export function scenarioLowData(): CycleLog[] {
  return makeSyntheticLogs([29, 27]);
}

export const ALL_BACKTEST_SCENARIOS: { label: string; logs: () => CycleLog[] }[] = [
  { label: "(a) juda muntazam", logs: scenarioVeryRegular },
  { label: "(b) o'rtacha tartibsiz", logs: scenarioModeratelyIrregular },
  { label: "(c) yuqori tartibsiz/PCOS", logs: scenarioHighlyIrregularPCOS },
  { label: "(d) tug'ruqdan keyingi", logs: scenarioPostpartum },
  { label: "(e) kam ma'lumot", logs: scenarioLowData },
];
