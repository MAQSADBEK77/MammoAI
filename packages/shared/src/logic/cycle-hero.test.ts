import { describe, expect, it } from "vitest";
import { resolveCycleHero, type CycleHeroInput } from "./cycle-hero";

function base(over: Partial<CycleHeroInput> = {}): CycleHeroInput {
  return {
    today: "2026-09-26",
    prediction: {
      ovulationDay: "2026-09-30",
      fertileWindowStart: "2026-09-25",
      fertileWindowEnd: "2026-10-01",
      daysUntilNextPeriod: 18,
      isStale: false,
    },
    periodExpectedButUnlogged: false,
    isOnPeriod: false,
    periodDay: null,
    isIrregular: false,
    isLowInfoPrediction: false,
    suppressFertility: false,
    isTryingToConceive: false,
    ...over,
  };
}

describe("resolveCycleHero", () => {
  it("hayz kunlarida hayz kunini ko'rsatadi", () => {
    expect(resolveCycleHero(base({ isOnPeriod: true, periodDay: 3 }))).toEqual({ kind: "period", day: 3 });
  });

  it("odatiy rejimda keyingi hayzgacha bo'lgan kunni ko'rsatadi", () => {
    expect(resolveCycleHero(base())).toEqual({ kind: "next-period-in", days: 18 });
  });

  it("odatiy rejim unumdor oyna ichida ham ovulyatsiyaga o'tmaydi", () => {
    // Unumdor oyna ichidamiz, lekin ayol homiladorlikni REJALASHTIRMAYAPTI —
    // unga ovulyatsiya sarlavhasi emas, hayz sanasi kerak.
    expect(resolveCycleHero(base()).kind).toBe("next-period-in");
  });

  it("tayyorgarlik rejimida unumdor oyna ichida 'bugun' holatini beradi", () => {
    expect(resolveCycleHero(base({ isTryingToConceive: true }))).toEqual({ kind: "fertile-today" });
  });

  it("tayyorgarlik rejimida oynagacha ovulyatsiyani sanaydi", () => {
    const state = resolveCycleHero(
      base({
        isTryingToConceive: true,
        today: "2026-09-20",
        prediction: {
          ovulationDay: "2026-09-30",
          fertileWindowStart: "2026-09-25",
          fertileWindowEnd: "2026-10-01",
          daysUntilNextPeriod: 24,
          isStale: false,
        },
      })
    );
    expect(state).toEqual({ kind: "ovulation-in", days: 10 });
  });

  it("ovulyatsiya o'tib ketgan bo'lsa yana hayz hisobiga qaytadi", () => {
    const state = resolveCycleHero(
      base({
        isTryingToConceive: true,
        today: "2026-10-05",
        prediction: {
          ovulationDay: "2026-09-30",
          fertileWindowStart: "2026-09-25",
          fertileWindowEnd: "2026-10-01",
          daysUntilNextPeriod: 9,
          isStale: false,
        },
      })
    );
    expect(state).toEqual({ kind: "next-period-in", days: 9 });
  });

  it("gormonal kontratseptsiyada unumdorlik ko'rsatilmaydi", () => {
    // Bu holatda unumdorlik hisobimiz ma'noli emas — uni ko'rsatish
    // ayolni chalg'itardi, shuning uchun odatiy matnga qaytamiz.
    const state = resolveCycleHero(base({ isTryingToConceive: true, suppressFertility: true }));
    expect(state).toEqual({ kind: "next-period-in", days: 18 });
  });

  it("kechikkan hayzni musbat son bilan beradi", () => {
    const state = resolveCycleHero(
      base({ prediction: { ...base().prediction!, daysUntilNextPeriod: -3, ovulationDay: "2026-09-05", fertileWindowStart: "2026-09-01", fertileWindowEnd: "2026-09-07" } })
    );
    expect(state).toEqual({ kind: "delayed", days: 3 });
  });

  it("tartibsiz sikl va past ishonchda ikki qatorli blok ko'rsatilmaydi", () => {
    expect(resolveCycleHero(base({ isIrregular: true })).kind).toBe("none");
    expect(resolveCycleHero(base({ isLowInfoPrediction: true })).kind).toBe("none");
    // Tayyorgarlik rejimi ham bu qoidadan istisno emas: ishonchsiz
    // ma'lumotdan "ovulyatsiyagacha 4 kun" deb aniq son aytish soxta aniqlik.
    expect(resolveCycleHero(base({ isTryingToConceive: true, isIrregular: true })).kind).toBe("none");
  });

  it("bashorat yo'q, eskirgan yoki hayz belgilanmagan holatlarda bo'sh qaytaradi", () => {
    expect(resolveCycleHero(base({ prediction: null })).kind).toBe("none");
    expect(resolveCycleHero(base({ prediction: { ...base().prediction!, isStale: true } })).kind).toBe("none");
    expect(resolveCycleHero(base({ periodExpectedButUnlogged: true })).kind).toBe("none");
  });
});
