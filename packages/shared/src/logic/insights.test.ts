import { describe, expect, it } from "vitest";
import {
  computeCycleLengthPoints,
  computeInsightsSummary,
  computeMoodDistribution,
  computeMoodPhaseBreakdown,
  computePainDaysPerCycle,
  computePredictionAccuracy,
  computeRegularityScore,
  computeSymptomFrequency,
  computeSymptomPhaseBreakdown,
  monthsAgoStr,
} from "./insights";
import type { CycleLog, FlowLevel, Mood, Symptom } from "../types";

let nextId = 0;
function mkLog(date: string, overrides: Partial<CycleLog> = {}): CycleLog {
  return {
    id: `log-${nextId++}`,
    userId: "u1",
    date,
    flow: null,
    mood: null,
    symptoms: [],
    createdAt: `${date}T00:00:00.000Z`,
    basalBodyTemp: null,
    ...overrides,
  };
}

/** Bir necha kunlik hayz blokini (bitta "streak") hosil qiladi — CYCLE_GAP_DAYS=2
 * kunlik toqatdan ancha uzoq (kamida 23 kun) oraliqlar bilan chaqirilsa, har biri
 * `detectPeriodStarts` tomonidan mustaqil sikl boshlanishi sifatida aniqlanadi. */
function period(startDate: string, days = 5): CycleLog[] {
  const logs: CycleLog[] = [];
  let cursor = startDate;
  for (let i = 0; i < days; i++) {
    const flow: FlowLevel = i === 0 ? "heavy" : "medium";
    logs.push(mkLog(cursor, { flow }));
    const d = new Date(cursor + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + 1);
    cursor = d.toISOString().slice(0, 10);
  }
  return logs;
}

describe("monthsAgoStr — DATA-ACCURACY-01 (oy toshib ketishi + kabisa yili)", () => {
  // Har biri qo'lda (kalendarga qarab) tekshirilgan: `Date#setMonth` mavjud
  // bo'lmagan kunga ("31-fevral") tushganda JS avtomatik KEYINGI oyga
  // "toshib" ketardi — bu funksiya oyning haqiqiy kunlar soniga qisqartiradi.
  it.each([
    ["2026-08-31", "2026-02-28"], // fevral 31-kun emas -> 28-kunga qisqaradi
    ["2026-10-31", "2026-04-30"], // aprel 31-kun emas -> 30
    ["2026-12-31", "2026-06-30"], // iyun 31-kun emas -> 30
    ["2026-08-30", "2026-02-28"], // fevral 30-kun ham emas -> 28
    ["2026-03-31", "2025-09-30"], // yil chegarasidan orqaga o'tish + sentabr 31 emas
    ["2026-05-31", "2025-11-30"], // noyabr 31 emas -> 30
    ["2024-08-31", "2024-02-29"], // KABISA yili: fevral 29-kungacha bor
    ["2025-08-31", "2025-02-28"], // kabisa EMAS yil: fevral faqat 28
    ["2026-09-18", "2026-03-18"], // toshib ketish yo'q oddiy holat
  ])("%s dan 6 oy oldin = %s", (today, expected) => {
    expect(monthsAgoStr(6, today)).toBe(expected);
  });
});

describe("computeCycleLengthPoints", () => {
  it("ketma-ket sikl boshlanishlari orasidagi kunlarni to'g'ri hisoblaydi va `limit`ga qisqaradi", () => {
    const logs = [
      ...period("2025-01-01"),
      ...period("2025-01-29"), // +28
      ...period("2025-02-26"), // +28
      ...period("2025-03-26"), // +28
    ];
    const all = computeCycleLengthPoints(logs, 12);
    expect(all).toEqual([
      { startDate: "2025-01-01", lengthDays: 28 },
      { startDate: "2025-01-29", lengthDays: 28 },
      { startDate: "2025-02-26", lengthDays: 28 },
    ]);
    // limit=2 -> faqat oxirgi ikkitasi qolishi kerak
    expect(computeCycleLengthPoints(logs, 2)).toEqual([
      { startDate: "2025-01-29", lengthDays: 28 },
      { startDate: "2025-02-26", lengthDays: 28 },
    ]);
  });
});

describe("computeRegularityScore", () => {
  it("barqaror (o'zgarmas) sikllar uchun stable/variability=0 beradi", () => {
    const logs = [
      ...period("2025-01-01"),
      ...period("2025-01-29"),
      ...period("2025-02-26"),
      ...period("2025-03-26"),
      ...period("2025-04-23"),
      ...period("2025-05-21"),
    ];
    const score = computeRegularityScore(logs);
    // 5 ta uzunlik: 28,28,28,28,28
    expect(score).toEqual({ averageCycleLength: 28, variabilityDays: 0, cyclesAnalyzed: 5, trend: "stable" });
  });

  it("aniq CHEGARADA (diff===threshold=2) 'lengthening' DEB E'LON QILINMAYDI — qat'iy '>' kerak", () => {
    // 6 ta uzunlik: [28,28,28,30,30,30] -> birinchi yarim o'rtacha 28, ikkinchi 30, farq roppa-rosa 2
    const starts = ["2025-01-01", "2025-01-29", "2025-02-26", "2025-03-26", "2025-04-25", "2025-05-25", "2025-06-24"];
    const logs = starts.flatMap((s) => period(s));
    const score = computeRegularityScore(logs);
    expect(score?.cyclesAnalyzed).toBe(6);
    expect(score?.trend).toBe("stable"); // diff=2 aniq chegara, ">2" emas
  });

  it("yarim o'rtachalar farqi chegaradan (2 kun) katta bo'lsa 'lengthening' beradi", () => {
    // uzunliklar: 26,27,29,31,33,35 -> 1-yarim o'rtacha 27.33, 2-yarim 33, farq 5.67 > 2
    const starts = ["2025-01-01", "2025-01-27", "2025-02-23", "2025-03-24", "2025-04-24", "2025-05-27", "2025-07-01"];
    const logs = starts.flatMap((s) => period(s));
    const score = computeRegularityScore(logs);
    expect(score?.variabilityDays).toBe(9); // 35-26
    expect(score?.trend).toBe("lengthening");
  });
});

describe("computeSymptomFrequency — sana chegarasi (cutoff)", () => {
  const today = "2026-09-18"; // 6 oy oldin = 2026-03-18 (toshib ketishsiz holat)

  it("cutoff KUNINING O'ZI kiritiladi, undan 1 kun oldingisi chiqarib tashlanadi", () => {
    const logs = [
      mkLog("2026-03-18", { symptoms: ["headache" as Symptom] }), // aynan chegarada -> KIRADI
      mkLog("2026-03-17", { symptoms: ["headache" as Symptom] }), // 1 kun oldin -> CHIQARIB TASHLANADI
    ];
    const result = computeSymptomFrequency(logs, 6, today);
    expect(result).toEqual([{ symptom: "headache", count: 1 }]);
  });

  it("ko'p marta uchragan simptomlar ko'proq sanaladi va kamayish tartibida saralanadi", () => {
    const logs = [
      mkLog("2026-05-01", { symptoms: ["cramps" as Symptom] }),
      mkLog("2026-05-02", { symptoms: ["cramps" as Symptom, "bloating" as Symptom] }),
      mkLog("2026-05-03", { symptoms: ["bloating" as Symptom] }),
    ];
    expect(computeSymptomFrequency(logs, 6, today)).toEqual([
      { symptom: "cramps", count: 2 },
      { symptom: "bloating", count: 2 },
    ]);
  });
});

describe("computeSymptomPhaseBreakdown", () => {
  const today = "2026-09-18";

  it("bitta kundagi bir necha simptom har biri UCHUN ALOHIDA hisoblanadi (bir kun ikki marta emas, tushib ham qolmaydi)", () => {
    const logs = [
      mkLog("2026-05-01", { flow: "heavy", symptoms: ["cramps" as Symptom, "headache" as Symptom] }),
      mkLog("2026-05-10", { flow: null, symptoms: ["cramps" as Symptom] }),
    ];
    const result = computeSymptomPhaseBreakdown(logs, 6, today);
    const cramps = result.find((r) => r.symptom === "cramps");
    const headache = result.find((r) => r.symptom === "headache");
    expect(cramps).toEqual({ symptom: "cramps", periodDaysCount: 1, otherDaysCount: 1 });
    expect(headache).toEqual({ symptom: "headache", periodDaysCount: 1, otherDaysCount: 0 });
  });

  it("simptomsiz kunlar (bo'sh massiv) hisobga qo'shilmaydi", () => {
    const logs = [mkLog("2026-05-01", { flow: "heavy", symptoms: [] })];
    expect(computeSymptomPhaseBreakdown(logs, 6, today)).toEqual([]);
  });
});

describe("computeMoodPhaseBreakdown", () => {
  const today = "2026-09-18";

  it("hayz kunlari va boshqa kunlarni to'g'ri ajratadi, mood=null tushib qoladi", () => {
    const logs = [
      mkLog("2026-05-01", { flow: "heavy", mood: "irritable" as Mood }),
      mkLog("2026-05-02", { flow: "medium", mood: "irritable" as Mood }),
      mkLog("2026-05-15", { flow: null, mood: "calm" as Mood }),
      mkLog("2026-05-16", { flow: null, mood: null }), // mood yo'q -> tushib qolishi kerak
    ];
    const result = computeMoodPhaseBreakdown(logs, 6, today);
    expect(result.find((r) => r.mood === "irritable")).toEqual({ mood: "irritable", periodDaysCount: 2, otherDaysCount: 0 });
    expect(result.find((r) => r.mood === "calm")).toEqual({ mood: "calm", periodDaysCount: 0, otherDaysCount: 1 });
    expect(result.length).toBe(2); // null mood uchun yozuv yaratilmagan
  });
});

describe("computeMoodDistribution", () => {
  it("cutoff'dan oldingi yozuvlarni chiqarib tashlaydi va sonlar bo'yicha saralaydi", () => {
    const today = "2026-09-18";
    const logs = [
      mkLog("2026-03-17", { mood: "happy" as Mood }), // cutoff'dan 1 kun oldin -> chiqarib tashlanadi
      mkLog("2026-05-01", { mood: "happy" as Mood }),
      mkLog("2026-05-02", { mood: "happy" as Mood }),
      mkLog("2026-05-03", { mood: "sad" as Mood }),
    ];
    expect(computeMoodDistribution(logs, 6, today)).toEqual([
      { mood: "happy", count: 2 },
      { mood: "sad", count: 1 },
    ]);
  });
});

describe("computePainDaysPerCycle", () => {
  it("chegara kuni (keyingi sikl boshlanishi) OLDINGI siklga emas, KEYINGI siklga hisoblanadi", () => {
    // Real ma'lumot modelida bitta foydalanuvchi-sana uchun bitta qator
    // bo'ladi (upsert), shuning uchun sinov ham HAR SANAGA BITTA yozuv
    // bilan quriladi — chegara kunidagi simptom period2ning BOSHLANISH
    // kunining o'ziga (flow+symptom bitta qatorda) qo'yiladi.
    const logs = [
      mkLog("2025-01-01", { flow: "heavy" }),
      mkLog("2025-01-02", { flow: "medium" }),
      mkLog("2025-01-03", { flow: "medium" }),
      mkLog("2025-01-05", { symptoms: ["cramps" as Symptom] }), // 1-sikl ichida
      mkLog("2025-01-28", { symptoms: ["back_pain" as Symptom] }), // 1-sikl ning oxirgi kuni
      mkLog("2025-01-29", { flow: "heavy", symptoms: ["headache" as Symptom] }), // 2-sikl ANIQ shu kunda boshlanadi
      mkLog("2025-01-30", { flow: "medium" }),
      mkLog("2025-02-10", { symptoms: ["cramps" as Symptom] }), // 2-sikl (ochiq oxirigacha)
    ];
    const points = computePainDaysPerCycle(logs, 12);
    expect(points).toEqual([
      { startDate: "2025-01-01", painDays: 2 }, // 01-05 va 01-28
      { startDate: "2025-01-29", painDays: 2 }, // 01-29 (chegara kuni) va 02-10
    ]);
  });
});

describe("computePredictionAccuracy — data-leakage'siz backtest", () => {
  it("mutlaqo barqaror (28 kunlik) tarixda xato 0 va aniqlik 100% bo'lishi kerak", () => {
    // Qo'lda hisoblangan 6 ta boshlanish, har biri 28 kun farq bilan:
    // 01-01 -> 01-29 -> 02-26 -> 03-26 -> 04-23 -> 05-21
    const starts = ["2025-01-01", "2025-01-29", "2025-02-26", "2025-03-26", "2025-04-23", "2025-05-21"];
    const logs = starts.flatMap((s) => period(s));
    const result = computePredictionAccuracy(logs);
    // PREDICTION_MIN_CYCLES=4 -> i=3,4,5 (3 ta baho), har birida bashorat aniq to'g'ri keladi
    expect(result).toEqual({ avgErrorDays: 0, within2DaysPct: 100, cyclesEvaluated: 3 });
  });

  it("PREDICTION_MIN_CYCLES(4)dan kam aniqlangan sikl bo'lsa, null qaytaradi", () => {
    const starts = ["2025-01-01", "2025-01-29", "2025-02-26"]; // faqat 3 ta
    const logs = starts.flatMap((s) => period(s));
    expect(computePredictionAccuracy(logs)).toBeNull();
  });
});

describe("computeInsightsSummary — hasEnoughData chegaralari", () => {
  it("2 ta aniqlangan sikl (MIN_CYCLES_FOR_DATA) yetarli deb topiladi, hatto yozuvlar kam bo'lsa ham", () => {
    const logs = [mkLog("2025-01-01", { flow: "medium" }), mkLog("2025-01-29", { flow: "medium" })];
    expect(computeInsightsSummary(logs, "2025-06-01").hasEnoughData).toBe(true);
  });

  it("1 ta sikl + 13 ta yozuv (MIN_LOGS_FOR_DATA=14 dan bitta kam) YETARLI EMAS deb topiladi", () => {
    const logs = [mkLog("2025-01-01", { flow: "medium" }), ...Array.from({ length: 12 }, (_, i) => mkLog(`2025-02-${String(i + 1).padStart(2, "0")}`))];
    expect(logs.length).toBe(13);
    expect(computeInsightsSummary(logs, "2025-06-01").hasEnoughData).toBe(false);
  });

  it("aniq 14 ta yozuv (siklsiz) MIN_LOGS_FOR_DATA chegarasida YETARLI deb topiladi", () => {
    const logs = Array.from({ length: 14 }, (_, i) => mkLog(`2025-02-${String(i + 1).padStart(2, "0")}`));
    expect(computeInsightsSummary(logs, "2025-06-01").hasEnoughData).toBe(true);
  });
});
