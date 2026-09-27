import { describe, expect, it } from "vitest";
import { TOTAL_GAIN, bmiCategory, expectedGainAtWeek, weightGainGuide } from "./weight-gain";

describe("bmiCategory", () => {
  it("to'rt toifani ajratadi", () => {
    expect(bmiCategory(165, 45)).toBe("underweight"); // TMI 16.5
    expect(bmiCategory(165, 60)).toBe("normal"); // 22.0
    expect(bmiCategory(165, 75)).toBe("overweight"); // 27.5
    expect(bmiCategory(165, 90)).toBe("obese"); // 33.1
  });

  it("chegaralar to'g'ri tomonga tushadi", () => {
    // TMI aynan 25 — "ortiqcha vazn" (normal emas).
    expect(bmiCategory(160, 64)).toBe("overweight");
    // TMI aynan 18.5 — "normal" (kam vazn 18.5 DAN PAST).
    expect(bmiCategory(160, 47.4)).toBe("normal");
    expect(bmiCategory(160, 47)).toBe("underweight"); // 18.4
  });

  it("noto'g'ri qiymatlarda null", () => {
    expect(bmiCategory(0, 60)).toBeNull();
    expect(bmiCategory(165, 0)).toBeNull();
  });
});

describe("expectedGainAtWeek", () => {
  it("birinchi trimestrda kichik va o'sib boradi", () => {
    const [low8, high8] = expectedGainAtWeek(8, "normal");
    const [low13, high13] = expectedGainAtWeek(13, "normal");
    expect(low8).toBeLessThan(low13);
    expect(high13).toBe(2);
  });

  it("20-haftada normal TMI uchun taxminan 3-5.5 kg", () => {
    const [low, high] = expectedGainAtWeek(20, "normal");
    expect(low).toBeGreaterThan(2.5);
    expect(high).toBeLessThan(6);
  });

  it("umumiy tavsiyadan oshmaydi", () => {
    for (const cat of ["underweight", "normal", "overweight", "obese"] as const) {
      const [low, high] = expectedGainAtWeek(40, cat);
      expect(low).toBeLessThanOrEqual(TOTAL_GAIN[cat][0]);
      expect(high).toBeLessThanOrEqual(TOTAL_GAIN[cat][1]);
    }
  });

  it("semizlikda me'yor normadan past", () => {
    expect(expectedGainAtWeek(30, "obese")[1]).toBeLessThan(expectedGainAtWeek(30, "normal")[1]);
  });
});

describe("weightGainGuide", () => {
  it("ma'lumot yetmasa null", () => {
    expect(weightGainGuide(null, 60, 20, 4)).toBeNull();
    expect(weightGainGuide(165, null, 20, 4)).toBeNull();
  });

  it("haqiqiy oshish berilmasa baho ham berilmaydi", () => {
    const g = weightGainGuide(165, 60, 20, null);
    expect(g?.status).toBeNull();
    expect(g?.category).toBe("normal");
  });

  it("kam, me'yorda va ko'p holatlarini ajratadi", () => {
    expect(weightGainGuide(165, 60, 30, 3)?.status).toBe("below");
    expect(weightGainGuide(165, 60, 30, 8)?.status).toBe("within");
    expect(weightGainGuide(165, 60, 30, 20)?.status).toBe("above");
  });

  it("chegaradagi qiymat me'yor ichida", () => {
    const g = weightGainGuide(165, 60, 24, null)!;
    expect(weightGainGuide(165, 60, 24, g.expected[0])?.status).toBe("within");
    expect(weightGainGuide(165, 60, 24, g.expected[1])?.status).toBe("within");
  });
});
