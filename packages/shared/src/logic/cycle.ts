// Hayz tsikli bashorati — spec §2: "ilova keyingi tsiklni bashorat qiladi".
// Oddiy arifmetika, ML kerak emas.

import type { CycleLog, CycleSettings, FlowLevel } from "../types";
import { tashkentDateStr } from "../date";

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

// CYCLE-ALGO-01: eksport qilingan — cycle-backtest.ts (backtest harness) shu
// ikkalasini qayta ishlatadi, sana matematikasini uchinchi marta yozmaslik uchun.
export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round(
    (new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / msPerDay
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// CYCLE-ALGO-02: RECENCY_DECAY — eksponensial pasayuvchi og'irlik bazasi.
// 0.7 tanlangan sabab: N=6 (ADAPTIVE_MAX_CYCLES) oynada eng eski sikl
// (weight=0.7^5≈0.168) eng yangisiga (weight=1) nisbatan ~1/6 ta'sirga ega
// bo'ladi — foydali "yaqinroq tarix ko'proq ahamiyatli" xatti-harakatni
// beradi, lekin haddan tashqari tor emas (masalan 0.5 bo'lganda eng eski
// sikl deyarli hech qanday og'irlikka ega bo'lmas edi).
const RECENCY_DECAY = 0.7;

/**
 * CYCLE-ALGO-02: eksponensial pasayuvchi og'irlikli o'rtacha — oddiy (tekis)
 * o'rtacha o'rniga, eng so'nggi qiymat eng ko'p ta'sir qiladi (tana holati,
 * yosh, stress darajasi vaqt bilan o'zgaradi — 6 oy oldingi sikl bugungi
 * bashoratga bugungiga teng darajada ta'sir qilmasligi kerak).
 * `values[0]` ENG ESKI, `values[N-1]` ENG YANGI deb qabul qilinadi (chaqiruvchi
 * shu tartibda uzatishi SHART — cycle.ts'dagi barcha massivlar allaqachon
 * shu tartibda: `starts`/`lengths` doim xronologik o'sish tartibida).
 * `weight_i = decay^(N-1-i)`, `weightedAvg = Σ(value_i·weight_i) / Σ(weight_i)`.
 * Bitta yordamchi funksiya — averageCycleLength VA averagePeriodLength
 * ikkalasida ham ishlatiladi.
 */
export function computeWeightedAverage(values: number[], decay = RECENCY_DECAY): number {
  if (values.length === 0) return 0;
  const n = values.length;
  let weightedSum = 0;
  let weightTotal = 0;
  for (let i = 0; i < n; i++) {
    const weight = decay ** (n - 1 - i);
    weightedSum += values[i] * weight;
    weightTotal += weight;
  }
  return weightedSum / weightTotal;
}

/** CYCLE-ALGO-03: medianani hisoblaydi (mean bilan parallel, outlier-filtrlash
 * chegaralari uchun ishlatiladi). */
export function computeMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** Standart Tukey kvartil usuli (median-orqali-bo'lish): pastki/yuqori
 * yarmilarning medianasi — mediana o'zi hech qaysi yarimga kirmaydi (N toq
 * bo'lsa). N juda kichik (<4) bo'lganda kvartillar tabiiy ravishda keng
 * bo'ladi — bu to'g'ri, chunki kam ma'lumotda hech narsani ishonchli
 * "outlier" deb bo'lmaydi. */
function computeQuartiles(values: number[]): { q1: number; q3: number } {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const lowerHalf = sorted.slice(0, mid);
  const upperHalf = sorted.length % 2 === 0 ? sorted.slice(mid) : sorted.slice(mid + 1);
  return { q1: computeMedian(lowerHalf), q3: computeMedian(upperHalf) };
}

// CYCLE-ALGO-03: "median'dan ±1.5×IQR" so'zma-so'z emas, standart Tukey
// "fence" formulasi ishlatiladi — [Q1 - k·IQR, Q3 + k·IQR] — chunki bu
// statistik jihatda to'g'ri/qabul qilingan usul (mediana atrofida simmetrik
// chegara chayqoq taqsimotlarda noto'g'ri natija berardi). `isIrregular`
// bo'lsa chegara kengroq (2.5×) — PCOS kabi tabiiy katta tarqalishni
// noto'g'ri "xato" deb chiqarib tashlamaslik uchun.
const OUTLIER_IQR_MULTIPLIER = 1.5;
const OUTLIER_IQR_MULTIPLIER_IRREGULAR = 2.5;

export interface OutlierFilterResult {
  filtered: number[];
  outliers: number[];
  median: number;
}

/** CYCLE-ALGO-03: bitta g'ayrioddiy sikl (kasallik, stress, dori o'zgarishi,
 * homiladorlikni yo'qotish) butun o'rtachani og'ishtirib yubormasligi uchun —
 * IQR-chegaradan tashqaridagi qiymatlar ASOSIY o'rtachadan chiqarib
 * tashlanadi (lekin alohida `outliers`da qaytariladi — UI'da "bir marta
 * g'ayrioddiy sikl kuzatildi" kabi shaffof tushuntirish uchun foydali,
 * CYCLE-ALGO-08). Filtrlash BARCHA nuqtalarni chiqarib tashlasa (juda
 * ekstremal holat, deyarli imkonsiz lekin nazariy), xavfsizlik uchun asl
 * massiv qaytariladi — bo'sh massivdan o'rtacha olib bo'lmaydi. */
export function filterOutliers(values: number[], isIrregular: boolean): OutlierFilterResult {
  const median = computeMedian(values);
  if (values.length < 4) return { filtered: values, outliers: [], median }; // N<4'da kvartil ishonchsiz — filtrlanmaydi
  const { q1, q3 } = computeQuartiles(values);
  const iqr = q3 - q1;
  const k = isIrregular ? OUTLIER_IQR_MULTIPLIER_IRREGULAR : OUTLIER_IQR_MULTIPLIER;
  const lowerBound = q1 - k * iqr;
  const upperBound = q3 + k * iqr;
  const filtered = values.filter((v) => v >= lowerBound && v <= upperBound);
  const outliers = values.filter((v) => v < lowerBound || v > upperBound);
  if (filtered.length === 0) return { filtered: values, outliers: [], median };
  return { filtered, outliers, median };
}

/** Saralangan sanalarni ketma-ket (CYCLE_GAP_DAYS ichida) "streak"larga
 * guruhlaydi — bitta kunlik bo'shliq (unutilgan yozuv) butun hayzni ikkiga
 * bo'lib yubormasligi uchun. `detectPeriodStarts` VA `computePeriodLength`
 * bir xil bo'shliq-toqat mantig'iga tayanishi uchun BITTA joyda yozilgan
 * (FIX2-17: ilgari ikkalasi mos kelmaydigan mantiqqa ega edi). */
function groupIntoStreaks(sortedDates: string[]): string[][] {
  const streaks: string[][] = [];
  for (const date of sortedDates) {
    const current = streaks[streaks.length - 1];
    if (current && daysBetween(current[current.length - 1], date) <= CYCLE_GAP_DAYS) {
      current.push(date);
    } else {
      streaks.push([date]);
    }
  }
  return streaks;
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
  const streaks = groupIntoStreaks(flowDates);

  return streaks.filter((streak) => streak.some((d) => flowByDate.get(d) !== "spotting")).map((streak) => streak[0]);
}

/** Aniqlangan sikl boshlanishlari orasidagi kunlar farqi (oxirgi `limit` tasi). */
export function computeCycleLengths(logs: Pick<CycleLog, "date" | "flow">[], limit = ADAPTIVE_MAX_CYCLES): number[] {
  const starts = detectPeriodStarts(logs);
  const lengths: number[] = [];
  for (let i = 1; i < starts.length; i++) lengths.push(daysBetween(starts[i - 1], starts[i]));
  return lengths.slice(-limit);
}

/** Berilgan sana bilan boshlangan hayzning uzunligi — `detectPeriodStarts`
 * bilan BIR XIL bo'shliq-toqat (CYCLE_GAP_DAYS) mantig'i orqali guruhlanadi,
 * shuning uchun bitta kunlik unutilgan yozuv haqiqiy uzunlikni kamaytirib
 * yubormaydi (FIX2-17: ilgari BIR KUNLIK bo'shliqqa ham toqat qilmasdi,
 * garchi `detectPeriodStarts` xuddi shu davrni "bitta hayz" deb hisoblasa
 * ham). Davom etayotgan (hali tugamagan) hayz uchun `null` qaytaradi. */
export function computePeriodLength(logs: Pick<CycleLog, "date" | "flow">[], periodStart: string, today: string): number | null {
  const flowDates = [...new Set(logs.filter((l) => l.flow).map((l) => l.date))].sort().filter((d) => d >= periodStart);
  const streak = groupIntoStreaks(flowDates).find((s) => s[0] === periodStart);
  if (!streak) return null;

  const lastDate = streak[streak.length - 1];
  // Agar oxirgi qayd etilgan kundan "bugun"gacha bo'lgan farq hali
  // CYCLE_GAP_DAYS ichida bo'lsa — keyingi kunlarda yana davom etishi
  // mumkin (detectPeriodStarts ham xuddi shunday tolerantlik bilan
  // guruhlagan bo'lardi), shuning uchun hali yakunlangan emas.
  if (daysBetween(lastDate, today) <= CYCLE_GAP_DAYS) return null;
  return daysBetween(periodStart, lastDate) + 1;
}

/** Bashorat qanchalik ishonchli ekanligini ko'rsatadi — foydalanuvchiga aniq
 * sanani tibbiy haqiqat sifatida emas, turli aniqlikdagi taxmin sifatida
 * ko'rsatish uchun (CYCLE-002). `insufficient` — hali haqiqiy sikl tarixi yo'q,
 * faqat foydalanuvchi kiritgan/standart taxminga tayanilgan. */
export type PredictionConfidence = "high" | "medium" | "low" | "insufficient";

/** `isCycleIrregular`dagi bilan bir xil "eng katta va eng kichik farqi" mezoni —
 * lekin tartibsizlik ogohlantirishidan farqli o'laroq, bu doim (kamida 1 ta
 * aniqlangan sikl bo'lsagina) qandaydir ishonch darajasini qaytaradi. */
export function getPredictionConfidence(cyclesAnalyzed: number, recentCycleLengths: number[]): PredictionConfidence {
  if (cyclesAnalyzed === 0) return "insufficient";
  if (cyclesAnalyzed < 3) return "low";
  const relevant = recentCycleLengths.slice(-cyclesAnalyzed);
  const spread = Math.max(...relevant) - Math.min(...relevant);
  if (spread <= 4) return "high";
  if (spread <= 9) return "medium";
  return "low";
}

export interface AdaptiveCycleSettings {
  lastPeriodStart: string;
  averageCycleLength: number;
  averagePeriodLength: number;
  /** Necha ta haqiqiy (loglardan aniqlangan) sikl asosida hisoblangani —
   * 0 bo'lsa, foydalanuvchining bir martalik sozlamasiga tayanilgan. */
  cyclesAnalyzed: number;
  /** getPredictionConfidence(cyclesAnalyzed, lengths) — shu yerda hisoblab
   * qo'yiladi, chunki `lengths` faqat shu funksiya ichida mavjud. */
  confidence: PredictionConfidence;
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
  today: string = tashkentDateStr()
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
      confidence: "insufficient",
    };
  }

  // CYCLE-ALGO-03: o'rtachani hisoblashdan OLDIN g'ayrioddiy (outlier) sikllarni
  // chiqarib tashlaymiz (bitta kasallik/stress/dori o'zgarishi/homiladorlikni
  // yo'qotish tufayli bo'lgan sikl butun o'rtachani og'ishtirib yubormasin) —
  // `isCycleIrregular` true bo'lsa chegara kengroq (haqiqiy PCOS naqshini
  // "xato" deb hisoblamaslik uchun). MUHIM: `getPredictionConfidence` pastda
  // hali ham XOM (filtrlanmagan) `lengths`ni ishlatadi — outlier chiqarib
  // tashlangani ISHONCH darajasini sun'iy oshirmasligi kerak, chunki outlier
  // borligining o'zi haqiqiy noaniqlik signali.
  const { filtered: cycleLengthsForAvg } = filterOutliers(lengths, isCycleIrregular(lengths));
  // CYCLE-ALGO-02: oddiy (tekis) o'rtacha o'rniga og'irlik-asoslangan —
  // barcha 6 ta sikl bir xil og'irlikda bo'lgan ilgarigi mantiq eng so'nggi
  // (haqiqatan foydali) o'zgarishlarni eski ma'lumot bilan "suyultirib"
  // yuborardi.
  const avgCycleLength = clamp(Math.round(computeWeightedAverage(cycleLengthsForAvg)), MIN_SANE_CYCLE_LENGTH, MAX_SANE_CYCLE_LENGTH);
  const lastStart = starts[starts.length - 1];
  // FIX2-19: nomi va hujjati "oxirgi bir necha davrdan o'rtacha" deydi (xuddi
  // averageCycleLength kabi), lekin ilgari faqat ENG SO'NGGI davr uzunligi
  // olinardi — agar oxirgi hayz odatiydan qisqaroq/uzunroq (masalan spotting
  // bilan tugagan) bo'lsa, bashorat noto'g'ri xato uzunlikka tayanardi. Endi
  // averageCycleLength bilan bir xil oynadan (oxirgi ADAPTIVE_MAX_CYCLES ta
  // aniqlangan davr) o'rtacha olinadi; hali tugamagan (null) davrlar
  // e'tiborga olinmaydi.
  const recentPeriodLengths = starts
    .slice(-ADAPTIVE_MAX_CYCLES)
    .map((start) => computePeriodLength(logs, start, today))
    .filter((n): n is number => n !== null);
  // CYCLE-ALGO-02: xuddi avgCycleLength kabi — og'irlik-asoslangan o'rtacha.
  const periodLength =
    recentPeriodLengths.length > 0
      ? Math.round(computeWeightedAverage(recentPeriodLengths))
      : (fallback.averagePeriodLength ?? DEFAULT_PERIOD_LENGTH);

  return {
    lastPeriodStart: lastStart,
    averageCycleLength: avgCycleLength,
    averagePeriodLength: clamp(periodLength, MIN_SANE_PERIOD_LENGTH, MAX_SANE_PERIOD_LENGTH),
    cyclesAnalyzed: lengths.length,
    confidence: getPredictionConfidence(lengths.length, lengths),
  };
}

// Kechikish shundan ko'p kun davom etsa, "N kun kechikmoqda" degan o'sib
// boruvchi son endi foydali emas — bu holatda ko'proq ehtimol foydalanuvchi
// uzoq vaqt (bir necha oy) hech narsa qayd etmagan (oxirgi hayz sanasi
// eskirgan) yoki haqiqatan boshqa holat (homiladorlik, uzoq tartibsizlik) yuz
// bergan. Real qurilmada ko'rilgan haqiqiy holat: "226 kun kechikmoqda" —
// bu raqamning o'zi to'g'ri hisoblangan (predictCycle mantiqi buzilmagan),
// lekin FOYDALANUVCHIGA bu holda ko'rsatilishi kerak bo'lgan narsa boshqa:
// "ma'lumot eskirgan, yangilang" — cheksiz o'sib boruvchi kechikish soni emas.
export const STALE_PREDICTION_DAYS = 90; // ~3 ta o'rtacha sikl

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
  /** `daysUntilNextPeriod` STALE_PREDICTION_DAYS'dan ko'proq manfiy bo'lsa —
   * UI o'sib boruvchi kechikish soni o'rniga "ma'lumot eskirgan, oxirgi
   * hayz sanasini yangilang" holatini ko'rsatishi kerak. */
  isStale: boolean;
  /** UI'da aniq sanani tibbiy haqiqat sifatida emas, shaffof taxmin sifatida
   * ko'rsatish uchun (CYCLE-002). Chaqiruvchi (buildCycleResponse) adaptiv
   * qiymat bilan qayta belgilaydi — xuddi cyclesAnalyzed kabi. */
  confidence: PredictionConfidence;
}

export function predictCycle(
  settings: Pick<CycleSettings, "lastPeriodStart" | "averageCycleLength" | "averagePeriodLength">,
  today: string = tashkentDateStr()
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

  const daysUntilNextPeriod = daysBetween(today, nextPeriodStart);

  return {
    nextPeriodStart,
    nextPeriodEnd,
    fertileWindowStart,
    fertileWindowEnd,
    ovulationDay,
    daysUntilNextPeriod,
    cyclesAnalyzed: 0, // chaqiruvchi (buildCycleResponse) adaptiv qiymat bilan qayta belgilaydi
    isStale: daysUntilNextPeriod < -STALE_PREDICTION_DAYS,
    confidence: "insufficient", // chaqiruvchi adaptiv qiymat bilan qayta belgilaydi
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
