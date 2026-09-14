// Avtomatlashtirilgan test — roadmap 19-band. Bu fayl ayniqsa muhim: shu
// modulda 2026-09-11'da ikkita HAQIQIY, ishlab-chiqarishga ta'sir qilgan
// bug topilib tuzatildi (kechikish yashirilishi, spotting'ning noto'g'ri
// "hayz boshlanishi" deb hisoblanishi) — shu ikkalasi qayta paydo
// bo'lmasligi uchun regression test sifatida ham xizmat qiladi.

import { describe, expect, it } from "vitest";
import type { Symptom } from "../types";
import {
  addDays,
  computeCycleLengths,
  computeMedian,
  computePeriodLength,
  computeWeightedAverage,
  deriveAdaptiveCycleSettings,
  detectOvulationSignals,
  detectPeriodStarts,
  filterOutliers,
  getPredictionConfidence,
  isCycleIrregular,
  predictCycle,
} from "./cycle";
import {
  ALL_BACKTEST_SCENARIOS,
  backtestPredictor,
  currentPredictor,
  legacyPredictor,
  scenarioHighlyIrregularPCOS,
  scenarioLowData,
  scenarioModeratelyIrregular,
  scenarioPostpartum,
  scenarioVeryRegular,
} from "./cycle-backtest";

describe("detectPeriodStarts", () => {
  it("yakka (isolated) spotting kunini hayz boshlanishi deb hisoblamaydi", () => {
    // Regression: 2026-09-11'gacha bu haqiqiy bug edi.
    const logs = [
      { date: "2026-01-01", flow: "medium" as const },
      { date: "2026-01-02", flow: "light" as const },
      { date: "2026-01-15", flow: "spotting" as const }, // ovulyatsiya qon tomchilashi kabi
      { date: "2026-01-29", flow: "heavy" as const },
      { date: "2026-01-30", flow: "medium" as const },
    ];
    expect(detectPeriodStarts(logs)).toEqual(["2026-01-01", "2026-01-29"]);
  });

  it("spotting bilan boshlanib haqiqiy oqimga o'tgan streak'ni to'g'ri hisoblaydi", () => {
    const logs = [
      { date: "2026-01-01", flow: "spotting" as const },
      { date: "2026-01-02", flow: "medium" as const },
      { date: "2026-01-03", flow: "heavy" as const },
    ];
    expect(detectPeriodStarts(logs)).toEqual(["2026-01-01"]);
  });

  it("bo'sh ro'yxat uchun bo'sh massiv qaytaradi", () => {
    expect(detectPeriodStarts([])).toEqual([]);
  });

  it("2 kundan katta bo'shliqni yangi sikl deb hisoblaydi", () => {
    const logs = [
      { date: "2026-01-01", flow: "medium" as const },
      { date: "2026-01-29", flow: "medium" as const }, // 28 kun bo'shliq
    ];
    expect(detectPeriodStarts(logs)).toEqual(["2026-01-01", "2026-01-29"]);
  });
});

describe("computeCycleLengths", () => {
  it("ketma-ket boshlanishlar orasidagi kunlarni hisoblaydi", () => {
    const logs = [
      { date: "2026-01-01", flow: "medium" as const },
      { date: "2026-01-29", flow: "medium" as const },
      { date: "2026-02-26", flow: "medium" as const },
    ];
    expect(computeCycleLengths(logs)).toEqual([28, 28]);
  });
});

describe("computePeriodLength", () => {
  it("uzluksiz flow-streak uzunligini hisoblaydi", () => {
    const logs = [
      { date: "2026-01-01", flow: "medium" as const },
      { date: "2026-01-02", flow: "medium" as const },
      { date: "2026-01-03", flow: "light" as const },
    ];
    expect(computePeriodLength(logs, "2026-01-01", "2026-01-10")).toBe(3);
  });

  it("hali tugamagan (bugungacha davom etayotgan) hayz uchun null qaytaradi", () => {
    const logs = [
      { date: "2026-01-08", flow: "medium" as const },
      { date: "2026-01-09", flow: "medium" as const },
    ];
    expect(computePeriodLength(logs, "2026-01-08", "2026-01-09")).toBeNull();
  });

  // FIX2-17: 1 kunlik unutilgan yozuv (01.01, 01.03-04 belgilangan, 01.02 yo'q)
  // detectPeriodStarts ham xuddi shu davrni "bitta hayz" deb hisoblaydi
  // (CYCLE_GAP_DAYS=2) — computePeriodLength endi mos ravishda 4 kun
  // (bo'shliqni ham hisobga olgan holda) qaytarishi kerak, 1 emas.
  it("bir kunlik bo'shliqqa detectPeriodStarts bilan bir xil tarzda toqat qiladi", () => {
    const logs = [
      { date: "2026-01-01", flow: "medium" as const },
      // 2026-01-02 — unutilgan, yozuv yo'q
      { date: "2026-01-03", flow: "medium" as const },
      { date: "2026-01-04", flow: "light" as const },
    ];
    expect(computePeriodLength(logs, "2026-01-01", "2026-01-10")).toBe(4);
  });

  it("bo'shliq CYCLE_GAP_DAYS'dan katta bo'lsa, boshqa (keyingi) hayz sifatida hisoblanmaydi", () => {
    const logs = [
      { date: "2026-01-01", flow: "medium" as const },
      // 3 kunlik bo'shliq — CYCLE_GAP_DAYS (2)dan katta, alohida sikl.
      { date: "2026-01-05", flow: "medium" as const },
    ];
    expect(computePeriodLength(logs, "2026-01-01", "2026-01-10")).toBe(1);
  });
});

describe("deriveAdaptiveCycleSettings", () => {
  it("2 tadan kam aniqlangan sikl bo'lsa, fallback sozlamaga tushadi (cyclesAnalyzed: 0)", () => {
    const logs = [{ date: "2026-01-01", flow: "medium" as const }];
    const result = deriveAdaptiveCycleSettings(logs, { lastPeriodStart: "2026-01-01", averageCycleLength: 30, averagePeriodLength: 6 });
    expect(result).toEqual({
      lastPeriodStart: "2026-01-01",
      averageCycleLength: 30,
      averagePeriodLength: 6,
      cyclesAnalyzed: 0,
      confidence: "insufficient",
      personalLutealPhase: null, // CYCLE-ALGO-05
    });
  });

  it("lastPeriodStart umuman bo'lmasa null qaytaradi", () => {
    const result = deriveAdaptiveCycleSettings([], { lastPeriodStart: null, averageCycleLength: 28, averagePeriodLength: 5 });
    expect(result).toBeNull();
  });

  it("2+ aniqlangan sikldan o'rtachani hisoblaydi va ENG SO'NGGI boshlanishni ishlatadi", () => {
    const logs = [
      { date: "2026-01-01", flow: "medium" as const },
      { date: "2026-01-29", flow: "medium" as const }, // +28
      { date: "2026-02-28", flow: "medium" as const }, // +30
    ];
    const result = deriveAdaptiveCycleSettings(logs, { lastPeriodStart: "2025-01-01", averageCycleLength: 28, averagePeriodLength: 5 }, "2026-03-01");
    expect(result?.cyclesAnalyzed).toBe(2);
    expect(result?.lastPeriodStart).toBe("2026-02-28");
    // CYCLE-ALGO-04: og'irlik-asoslangan shaxsiy o'rtacha (~29.18) endi
    // Bayesian shrinkage bilan fallback.averageCycleLength (28)ga qarab
    // "tortiladi" — (2*29.18 + 3*28)/(2+3) ≈ 28.47 → 28ga yaxlitlanadi.
    // Ilgari (shrinkage'siz) 29 edi — bu REGRESSIYA emas, ATAYLAB: n=2'da
    // hali qattiq "to'liq shaxsiy" ishonch berish shoshqaloqlik (CYCLE-
    // ALGO-04ning butun maqsadi).
    expect(result?.averageCycleLength).toBe(28);
  });

  // FIX2-19: averagePeriodLength ilgari faqat ENG SO'NGGI davr uzunligini
  // olardi (nomi/hujjati "o'rtacha" desa ham) — agar oxirgi hayz odatiydan
  // qisqaroq (masalan spotting bilan tugagan) bo'lsa, bashorat noto'g'ri
  // qisqa uzunlikka tayanardi.
  it("averagePeriodLength bir nechta aniqlangan davrdan o'rtachani oladi, faqat oxirgisini emas", () => {
    const logs = [
      // Birinchi hayz — 5 kun (01.01-01.05)
      { date: "2026-01-01", flow: "medium" as const },
      { date: "2026-01-02", flow: "medium" as const },
      { date: "2026-01-03", flow: "medium" as const },
      { date: "2026-01-04", flow: "light" as const },
      { date: "2026-01-05", flow: "light" as const },
      // Ikkinchi hayz — atigi 1 kun (spotting bilan tugagan, odatiy emas)
      { date: "2026-01-29", flow: "medium" as const },
    ];
    const result = deriveAdaptiveCycleSettings(logs, { lastPeriodStart: "2025-01-01", averageCycleLength: 28, averagePeriodLength: 5 }, "2026-02-10");
    // Eski xato: faqat oxirgi (1 kunlik) davrga tayanib 1 qaytarardi.
    // To'g'ri: (5 + 1) / 2 = 3 — ikkalasining o'rtachasi.
    expect(result?.averagePeriodLength).toBe(3);
  });

  it("aqldan tashqari (sane bo'lmagan) uzunliklarni chegaralaydi", () => {
    const logs = [
      { date: "2026-01-01", flow: "medium" as const },
      { date: "2026-01-03", flow: "medium" as const }, // 2 kun — juda qisqa
      { date: "2026-01-05", flow: "medium" as const },
    ];
    const result = deriveAdaptiveCycleSettings(logs, { lastPeriodStart: "2025-01-01", averageCycleLength: 28, averagePeriodLength: 5 });
    expect(result?.averageCycleLength).toBeGreaterThanOrEqual(15); // MIN_SANE_CYCLE_LENGTH
  });

  // CYCLE-ALGO-04: Bayesian shrinkage — qattiq "2 tadan kam = to'liq
  // fallback, 2+ = to'liq shaxsiy" sakrashi endi yo'q, n o'sgan sari
  // fallback'dan (populationPrior) shaxsiy o'rtachaga YUMSHOQ o'tadi.
  it("kam ma'lumotda (n=2) natija fallback (prior) TOMON tortiladi, unga TENG bo'lib qolmaydi", () => {
    const logs = [
      { date: "2026-01-01", flow: "medium" as const },
      { date: "2026-02-02", flow: "medium" as const }, // +32 (shaxsiy o'rtachadan uzoq)
    ];
    const fallback = { lastPeriodStart: "2025-01-01", averageCycleLength: 28, averagePeriodLength: 5 };
    const result = deriveAdaptiveCycleSettings(logs, fallback);
    // Shaxsiy (32) bilan prior (28) orasida, ikkalasiga ham TENG EMAS —
    // shrinkage haqiqatan aralashtirayotganini tasdiqlaydi.
    expect(result?.averageCycleLength).toBeGreaterThan(28);
    expect(result?.averageCycleLength).toBeLessThan(32);
  });

  it("ko'proq sikl (n katta) bo'lgani sari shaxsiy o'rtacha priordan KO'PROQ ustunlik qiladi", () => {
    const fallback = { lastPeriodStart: "2025-01-01", averageCycleLength: 28, averagePeriodLength: 5 };
    // 2 ta sikl, ikkalasi ham 32 kun.
    const logsFew = [
      { date: "2026-01-01", flow: "medium" as const },
      { date: "2026-02-02", flow: "medium" as const }, // +32
      { date: "2026-03-06", flow: "medium" as const }, // +32
    ];
    // 6 ta sikl, hammasi 32 kun (ADAPTIVE_MAX_CYCLES chegarasi).
    const logsMany = [
      { date: "2025-09-01", flow: "medium" as const },
      { date: "2025-10-03", flow: "medium" as const }, // +32
      { date: "2025-11-04", flow: "medium" as const }, // +32
      { date: "2025-12-06", flow: "medium" as const }, // +32
      { date: "2026-01-07", flow: "medium" as const }, // +32
      { date: "2026-02-08", flow: "medium" as const }, // +32
      { date: "2026-03-12", flow: "medium" as const }, // +32
    ];
    const resultFew = deriveAdaptiveCycleSettings(logsFew, fallback);
    const resultMany = deriveAdaptiveCycleSettings(logsMany, fallback);
    // Ikkalasi ham 28 (prior) va 32 (shaxsiy) orasida, lekin ko'proq
    // ma'lumotli (resultMany) 32'ga YAQINROQ bo'lishi kerak.
    expect(resultMany!.averageCycleLength).toBeGreaterThan(resultFew!.averageCycleLength);
  });
});

describe("predictCycle", () => {
  it("hech qanday sozlama bo'lmasa null qaytaradi", () => {
    expect(predictCycle({ lastPeriodStart: null, averageCycleLength: 28, averagePeriodLength: 5 })).toBeNull();
  });

  it("aynan kutilgan kunda (day 0) daysUntilNextPeriod = 0 bo'ladi", () => {
    const pred = predictCycle({ lastPeriodStart: "2026-01-01", averageCycleLength: 28, averagePeriodLength: 5 }, "2026-01-29");
    expect(pred?.nextPeriodStart).toBe("2026-01-29");
    expect(pred?.daysUntilNextPeriod).toBe(0);
  });

  it("kechikkanda bashoratni bir butun sikl OLDINGA sakratib yubormaydi (regression)", () => {
    // 2026-09-11'gacha bu haqiqiy bug edi: 1 kun kechiksa ham ilova
    // "27 kun qoldi" deb noto'g'ri ko'rsatardi (keyingi-keyingi siklga sakrab).
    const pred = predictCycle({ lastPeriodStart: "2026-01-01", averageCycleLength: 28, averagePeriodLength: 5 }, "2026-01-30");
    expect(pred?.nextPeriodStart).toBe("2026-01-29"); // o'zgarmagan — hali eski kutilgan sana
    expect(pred?.daysUntilNextPeriod).toBe(-1); // 1 kun kechikkan, manfiy son
  });

  it("30 kun kechiksa ham (ekstremal holat) hali ham to'g'ri manfiy son qaytaradi", () => {
    const pred = predictCycle({ lastPeriodStart: "2026-01-01", averageCycleLength: 28, averagePeriodLength: 5 }, "2026-02-28");
    expect(pred?.daysUntilNextPeriod).toBe(-30);
    expect(pred?.isStale).toBe(false); // hali 90 kunlik chegaradan o'tmagan
  });

  it("90 kundan ko'p kechiksa 'isStale' true bo'ladi (regression: real qurilmada '226 kun kechikmoqda' ko'rsatilgan edi)", () => {
    // 2026-09-11'da qurilmada ko'rilgan haqiqiy holat: bir necha oy hech
    // narsa qayd etilmagan, kechikish cheksiz o'sib borgan.
    const pred = predictCycle({ lastPeriodStart: "2026-01-01", averageCycleLength: 28, averagePeriodLength: 5 }, "2026-10-01");
    expect(pred!.daysUntilNextPeriod).toBeLessThan(-90);
    expect(pred?.isStale).toBe(true);
  });

  it("unumdor oynani kutilgan sanadan 14 kun oldin (ovulyatsiya atrofida) hisoblaydi", () => {
    const pred = predictCycle({ lastPeriodStart: "2026-01-01", averageCycleLength: 28, averagePeriodLength: 5 }, "2026-01-01");
    expect(pred?.ovulationDay).toBe("2026-01-15"); // 2026-01-29 - 14 kun
    expect(pred?.fertileWindowStart).toBe("2026-01-10");
    expect(pred?.fertileWindowEnd).toBe("2026-01-16");
  });

  // CYCLE-ALGO-05: personalLutealPhase berilsa, standart 14 kun o'rniga
  // shundan foydalanadi.
  it("personalLutealPhase berilsa, ovulyatsiya kunini standart 14 emas, shaxsiy qiymatdan hisoblaydi", () => {
    const pred = predictCycle(
      { lastPeriodStart: "2026-01-01", averageCycleLength: 28, averagePeriodLength: 5, personalLutealPhase: 11 },
      "2026-01-01"
    );
    expect(pred?.ovulationDay).toBe("2026-01-18"); // 2026-01-29 - 11 kun (standart -14 bo'lsa 01-15 bo'lardi)
  });

  it("personalLutealPhase null bo'lsa, standart 14 kunga tushadi (o'zgarishsiz)", () => {
    const pred = predictCycle(
      { lastPeriodStart: "2026-01-01", averageCycleLength: 28, averagePeriodLength: 5, personalLutealPhase: null },
      "2026-01-01"
    );
    expect(pred?.ovulationDay).toBe("2026-01-15");
  });

  it("juda qisqa siklda ham lyuteal faza butun sikldan oshib ketmaydi (xavfsizlik)", () => {
    const pred = predictCycle(
      { lastPeriodStart: "2026-01-01", averageCycleLength: 16, averagePeriodLength: 5, personalLutealPhase: 17 },
      "2026-01-01"
    );
    // nextPeriodStart = 2026-01-17. lutealPhaseDays min(17, 16-1=15)=15 bilan chegaralanadi.
    expect(pred?.ovulationDay).toBe("2026-01-02");
  });
});

describe("detectOvulationSignals", () => {
  it("faqat 'ovulation_pain' simptomi bor kunlarni qaytaradi", () => {
    const logs = [
      { date: "2026-01-01", symptoms: ["cramps" as const] },
      { date: "2026-01-14", symptoms: ["ovulation_pain"] as Symptom[] },
      { date: "2026-01-15", symptoms: [] },
    ];
    expect(detectOvulationSignals(logs)).toEqual(["2026-01-14"]);
  });

  it("symptoms maydoni bo'lmasa (ixtiyoriy) xato bermaydi", () => {
    expect(detectOvulationSignals([{ date: "2026-01-01" }])).toEqual([]);
  });
});

// CYCLE-ALGO-05: to'liq integratsiya — ovulyatsiya belgisi bor tarixdan
// personalLutealPhase to'g'ri chiqarilishi va predictCycle'ga to'g'ri
// uzatilishini tasdiqlaydi.
describe("deriveAdaptiveCycleSettings + predictCycle (CYCLE-ALGO-05 ikki-fazali model)", () => {
  it("ovulyatsiya belgisi bor 3 ta sikldan shaxsiy lyuteal-faza median'ini chiqaradi", () => {
    // Har bir siklda lyuteal faza = 10 kun (ovulyatsiyadan keyingi sikl
    // boshlanishigacha), follikulyar faza esa o'zgaruvchan (18, 16, 20 kun) —
    // aynan talab tasvirlagan holat: "har bir ayolda lyuteal faza barqaror,
    // follikulyar faza o'zgaruvchan".
    const logs = [
      { date: "2026-01-01", flow: "medium" as const, symptoms: [] as Symptom[] },
      { date: "2026-01-19", flow: null, symptoms: ["ovulation_pain"] as Symptom[] }, // kun 19, lyuteal=10 (01-29gacha)
      { date: "2026-01-29", flow: "medium" as const, symptoms: [] as Symptom[] },
      { date: "2026-02-14", flow: null, symptoms: ["ovulation_pain"] as Symptom[] }, // kun +16, lyuteal=10 (02-24gacha)
      { date: "2026-02-24", flow: "medium" as const, symptoms: [] as Symptom[] },
      { date: "2026-03-16", flow: null, symptoms: ["ovulation_pain"] as Symptom[] }, // kun +20, lyuteal=10 (03-26gacha)
      { date: "2026-03-26", flow: "medium" as const, symptoms: [] as Symptom[] },
    ];
    const fallback = { lastPeriodStart: "2025-01-01", averageCycleLength: 28, averagePeriodLength: 5 };
    const adaptive = deriveAdaptiveCycleSettings(logs, fallback, "2026-03-27");
    expect(adaptive?.personalLutealPhase).toBe(10);

    // predictCycle endi standart 14 emas, shaxsiy 10 kunlik lyuteal fazani ishlatadi.
    const pred = adaptive && predictCycle(adaptive, "2026-03-27");
    const expectedOvulation = addDays(pred!.nextPeriodStart, -10);
    expect(pred?.ovulationDay).toBe(expectedOvulation);
  });

  it("ovulyatsiya belgisi YO'Q bo'lsa, personalLutealPhase null qoladi (standart 14ga tushadi)", () => {
    const logs = [
      { date: "2026-01-01", flow: "medium" as const, symptoms: [] as Symptom[] },
      { date: "2026-01-29", flow: "medium" as const, symptoms: [] as Symptom[] },
    ];
    const fallback = { lastPeriodStart: "2025-01-01", averageCycleLength: 28, averagePeriodLength: 5 };
    const adaptive = deriveAdaptiveCycleSettings(logs, fallback, "2026-01-30");
    expect(adaptive?.personalLutealPhase).toBeNull();
  });

  it("bitta sikldagina ovulyatsiya belgisi bo'lsa (MIN_LUTEAL_SIGNAL_CYCLES=2'dan kam), hali ham null qoladi", () => {
    const logs = [
      { date: "2026-01-01", flow: "medium" as const, symptoms: [] as Symptom[] },
      { date: "2026-01-19", flow: null, symptoms: ["ovulation_pain"] as Symptom[] },
      { date: "2026-01-29", flow: "medium" as const, symptoms: [] as Symptom[] },
    ];
    const fallback = { lastPeriodStart: "2025-01-01", averageCycleLength: 28, averagePeriodLength: 5 };
    const adaptive = deriveAdaptiveCycleSettings(logs, fallback, "2026-01-30");
    expect(adaptive?.personalLutealPhase).toBeNull();
  });
});

describe("isCycleIrregular", () => {
  it("3 tadan kam sikl uzunligi bo'lsa, tartibsiz deb hisoblamaydi", () => {
    expect(isCycleIrregular([28, 30])).toBe(false);
  });

  it("oxirgi 3 ta sikl orasidagi farq 7 kundan katta bo'lsa, tartibsiz", () => {
    expect(isCycleIrregular([28, 21, 35])).toBe(true); // farq 14
  });

  it("barqaror sikllarni tartibsiz deb hisoblamaydi", () => {
    expect(isCycleIrregular([28, 29, 27])).toBe(false); // farq 2
  });
});

describe("computeWeightedAverage", () => {
  it("bo'sh massiv uchun 0 qaytaradi", () => {
    expect(computeWeightedAverage([])).toBe(0);
  });

  it("barcha qiymatlar bir xil bo'lsa, natija ham shu qiymat (og'irlikdan qat'iy nazar)", () => {
    expect(computeWeightedAverage([28, 28, 28])).toBeCloseTo(28);
  });

  it("eng so'nggi (oxirgi) qiymat eng ko'p ta'sir qiladi", () => {
    // [20, 30] — agar tekis o'rtacha bo'lsa 25 bo'lardi. Og'irlik-asoslangan
    // (eng yangi=30 ko'proq ta'sirli) 25'dan KATTA bo'lishi kerak.
    const weighted = computeWeightedAverage([20, 30], 0.7);
    expect(weighted).toBeGreaterThan(25);
  });

  it("decay=1 bo'lsa, aynan tekis o'rtachaga teng", () => {
    expect(computeWeightedAverage([24, 28, 32], 1)).toBe(28);
  });
});

describe("computeMedian", () => {
  it("bo'sh massiv uchun 0 qaytaradi", () => {
    expect(computeMedian([])).toBe(0);
  });

  it("toq sondagi qiymatlar uchun o'rtadagisini qaytaradi", () => {
    expect(computeMedian([5, 1, 3])).toBe(3);
  });

  it("juft sondagi qiymatlar uchun o'rtadagi ikkitasining o'rtachasini qaytaradi", () => {
    expect(computeMedian([1, 2, 3, 4])).toBe(2.5);
  });
});

describe("filterOutliers (CYCLE-ALGO-03)", () => {
  it("4 tadan kam qiymatda hech narsani outlier deb belgilamaydi (kvartil ishonchsiz)", () => {
    const result = filterOutliers([28, 29, 90], false);
    expect(result.filtered).toEqual([28, 29, 90]);
    expect(result.outliers).toEqual([]);
  });

  it("aniq g'ayrioddiy qiymatni asosiy o'rtachadan chiqarib tashlaydi, lekin alohida saqlaydi", () => {
    // [27,28,28,29,28,90] (N=6, ADAPTIVE_MAX_CYCLES bilan bir xil) — 90 aniq
    // outlier (boshqa hammasi ~28 atrofida).
    const result = filterOutliers([27, 28, 28, 29, 28, 90], false);
    expect(result.filtered).toEqual([27, 28, 28, 29, 28]);
    expect(result.outliers).toEqual([90]);
  });

  it("isIrregular=true bo'lsa, chegara kengroq — o'rtacha PCOS-tarqalishni outlier deb hisoblamaydi", () => {
    // Xuddi shu tarqoq to'plam: irregular=false bo'lsa outlier topilishi
    // mumkin bo'lgan holatda, irregular=true (kengroq chegara) hech
    // narsani chiqarib tashlamasligi kerak.
    const values = [15, 22, 28, 35, 44];
    const strict = filterOutliers(values, false);
    const wide = filterOutliers(values, true);
    expect(wide.outliers.length).toBeLessThanOrEqual(strict.outliers.length);
  });

  it("barcha qiymatlar outlier chegarasidan tashqarida bo'lib qolsa (nazariy holat), asl massivni qaytaradi", () => {
    // Amalda deyarli imkonsiz (IQR chegaralari doim ba'zi qiymatlarni ichiga
    // oladi), lekin xavfsizlik to'sig'i sifatida tekshiramiz: hech bo'lmasa
    // natija hech qachon bo'sh `filtered` bilan qaytmaydi.
    const result = filterOutliers([10, 10, 10, 10], false);
    expect(result.filtered.length).toBeGreaterThan(0);
  });
});

// CYCLE-ALGO-01: backtest infratuzilmasi — bu blok "harness to'g'ri
// ishlayaptimi"ni tasdiqlaydi VA `legacyPredictor` (CYCLE-ALGO-01'dan
// OLDINGI, muzlatilgan algoritm)ning bazaviy ("baseline") aniqlik
// raqamlarini regressiya sifatida qotirib qo'yadi — bu raqamlar `./cycle.ts`
// qanchalik o'zgarmasin ABADIY shu holicha qoladi (legacyPredictor hech
// qachon o'zgarmaydi), shuning uchun `currentPredictor` emas, aynan
// `legacyPredictor` ishlatiladi. Har bir keyingi CYCLE-ALGO-0X bosqichi
// o'zining `currentPredictor`ga asoslangan "yangi natija eskisidan yaxshi
// yoki teng" testini shu bazaviy raqamlarga solishtirib qo'shadi.
describe("cycle-backtest harness (CYCLE-ALGO-01)", () => {
  it("kam ma'lumot stsenariysida (2-3 sikl) backtest null qaytaradi (baholash uchun yetarli emas)", () => {
    expect(backtestPredictor(scenarioLowData(), legacyPredictor)).toBeNull();
  });

  it("BASELINE (legacyPredictor, CYCLE-ALGO-01'dan oldingi muzlatilgan algoritm) — juda muntazam stsenariy", () => {
    const result = backtestPredictor(scenarioVeryRegular(), legacyPredictor);
    expect(result).toEqual({ avgErrorDays: 0.8, within2DaysPct: 100, cyclesEvaluated: 10 });
  });

  it("BASELINE — o'rtacha tartibsiz stsenariy", () => {
    const result = backtestPredictor(scenarioModeratelyIrregular(), legacyPredictor);
    expect(result).toEqual({ avgErrorDays: 2.9, within2DaysPct: 50, cyclesEvaluated: 10 });
  });

  it("BASELINE — yuqori tartibsiz/PCOS-o'xshash stsenariy", () => {
    const result = backtestPredictor(scenarioHighlyIrregularPCOS(), legacyPredictor);
    expect(result).toEqual({ avgErrorDays: 10.5, within2DaysPct: 10, cyclesEvaluated: 10 });
  });

  it("BASELINE — tug'ruqdan keyingi stsenariy", () => {
    const result = backtestPredictor(scenarioPostpartum(), legacyPredictor);
    expect(result).toEqual({ avgErrorDays: 9.1, within2DaysPct: 14, cyclesEvaluated: 7 });
  });
});

// CYCLE-ALGO-02: oddiy (tekis) o'rtacha o'rniga eksponensial pasayuvchi
// og'irlikli o'rtacha (computeWeightedAverage, decay=0.7). MUHIM TOPILMA:
// barqaror-shovqin (stationary noise) taqsimotida (masalan (a)/(b)) ixtiyoriy
// og'irlik-asoslash formulasi statistik jihatdan tekis o'rtachadan KO'PROQ
// dispersiyaga ega (chunki tekis o'rtacha — eng kam dispersiyali xolis
// baholovchi barqaror shovqin uchun) — shuning uchun "yaxshilanish" HAR
// DOIM kafolatlanmaydi, aniq tasodifiy chizishga bog'liq (taxminan 50/50).
// Bu MUAMMO emas: haqiqiy foyda REJIM O'ZGARISHI bo'lganda chiqadi (masalan
// tug'ruqdan keyingi stsenariy — pastda ko'rinadi, DRAMATIK yaxshilanadi).
// MUHIM: bu blokdagi ANIQ raqamlar ("JORIY natija" testlari) HAR BIR
// keyingi CYCLE-ALGO-0X bosqichida yangilanadi — `currentPredictor` JORIY
// (LIVE) ./cycle.ts'ni kuzatadi, shuning uchun algoritm evolyutsiyalangani
// sari bu raqamlar o'zgarishi TABIIY va kutilgan (bu — regressiya emas,
// rivojlanish jarayoni). Doimiy, hech qachon o'zgarmaydigan yagona kafolat —
// birinchi test: currentPredictor HECH QACHON muzlatilgan legacyPredictor'dan
// yomonroq natija bermaydi (frozen bazaviy chiziqqa nisbatan, bosqichma-
// bosqich oraliq taqqoslashga NISBATAN emas — CYCLE-ALGO-07 talabi shunday).
describe("cycle-backtest harness (joriy algoritm holati — har bosqichda yangilanadi)", () => {
  it("currentPredictor hech qaysi stsenariyda legacyPredictor'dan (muzlatilgan bazaviy chiziq) yomonlashmaydi", () => {
    for (const { label, logs } of ALL_BACKTEST_SCENARIOS) {
      const materializedLogs = logs();
      const cur = backtestPredictor(materializedLogs, currentPredictor);
      const leg = backtestPredictor(materializedLogs, legacyPredictor);
      if (!cur || !leg) continue; // (e) kam ma'lumot — ikkalasi ham null, solishtirish shart emas
      expect(cur.avgErrorDays, `${label}: avgErrorDays`).toBeLessThanOrEqual(leg.avgErrorDays);
      expect(cur.within2DaysPct, `${label}: within2DaysPct`).toBeGreaterThanOrEqual(leg.within2DaysPct);
    }
  });

  // CYCLE-ALGO-04 holati (+ Bayesian shrinkage, ADAPTIVE_MIN_CYCLES o'chirildi):
  it("JORIY natija — juda muntazam stsenariy", () => {
    expect(backtestPredictor(scenarioVeryRegular(), currentPredictor)).toEqual({ avgErrorDays: 0.6, within2DaysPct: 100, cyclesEvaluated: 10 });
  });

  it("JORIY natija — o'rtacha tartibsiz stsenariy", () => {
    expect(backtestPredictor(scenarioModeratelyIrregular(), currentPredictor)).toEqual({ avgErrorDays: 2.8, within2DaysPct: 50, cyclesEvaluated: 10 });
  });

  it("JORIY natija — yuqori tartibsiz/PCOS stsenariy", () => {
    expect(backtestPredictor(scenarioHighlyIrregularPCOS(), currentPredictor)).toEqual({ avgErrorDays: 9.7, within2DaysPct: 10, cyclesEvaluated: 10 });
  });

  it("JORIY natija — tug'ruqdan keyingi stsenariy (shrinkage'ning ENG KATTA yutug'i)", () => {
    expect(backtestPredictor(scenarioPostpartum(), currentPredictor)).toEqual({ avgErrorDays: 2.6, within2DaysPct: 57, cyclesEvaluated: 7 });
  });
});

describe("getPredictionConfidence", () => {
  it("0 ta aniqlangan sikl bo'lsa — 'insufficient' (CYCLE-002)", () => {
    expect(getPredictionConfidence(0, [])).toBe("insufficient");
  });

  it("1-2 ta aniqlangan sikl bo'lsa — 'low' (hali tendensiya aniq emas)", () => {
    expect(getPredictionConfidence(1, [28])).toBe("low");
    expect(getPredictionConfidence(2, [28, 30])).toBe("low");
  });

  it("3+ sikl va barqaror uzunlik bo'lsa — 'high'", () => {
    expect(getPredictionConfidence(4, [28, 29, 27, 28])).toBe("high"); // farq 2
  });

  it("3+ sikl va o'rtacha tarqoqlik bo'lsa — 'medium'", () => {
    expect(getPredictionConfidence(3, [24, 28, 32])).toBe("medium"); // farq 8
  });

  it("3+ sikl bo'lsa-da katta tarqoqlik bo'lsa — 'low'", () => {
    expect(getPredictionConfidence(3, [20, 28, 40])).toBe("low"); // farq 20
  });
});
