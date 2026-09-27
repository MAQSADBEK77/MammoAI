import { describe, expect, it } from "vitest";
import { fetalSizeForWeek } from "./fetal-size";

describe("fetalSizeForWeek", () => {
  it("jadvaldagi qiymatlarni qaytaradi", () => {
    expect(fetalSizeForWeek(12)).toEqual({ week: 12, lengthCm: 5.4, weightG: 58, measure: "crown_rump" });
    expect(fetalSizeForWeek(40)).toEqual({ week: 40, lengthCm: 51.0, weightG: 3338, measure: "crown_heel" });
  });

  it("o'lchash usuli 20-haftada o'zgaradi", () => {
    // 8-19: boshdan dumg'azagacha, 20+: boshdan tovongacha.
    // Bu farq aytilmasa, ayol 13->14 haftadagi sakrashni
    // "nimadir noto'g'ri" deb tushunishi mumkin.
    expect(fetalSizeForWeek(19)?.measure).toBe("crown_rump");
    expect(fetalSizeForWeek(20)?.measure).toBe("crown_heel");
  });

  it("jadval doimiy o'suvchi", () => {
    // 13->14 dagi sakrashdan tashqari (o'lchash usuli o'zgaradi),
    // uzunlik ham, vazn ham kamaymasligi kerak.
    let prevLen = 0;
    let prevW = 0;
    for (let w = 8; w <= 40; w++) {
      const s = fetalSizeForWeek(w);
      expect(s, `hafta ${w}`).not.toBeNull();
      expect(s!.lengthCm, `uzunlik ${w}`).toBeGreaterThanOrEqual(prevLen);
      expect(s!.weightG, `vazn ${w}`).toBeGreaterThanOrEqual(prevW);
      prevLen = s!.lengthCm;
      prevW = s!.weightG;
    }
  });

  it("jadvaldan tashqari haftalar uchun hech narsa qaytarmaydi", () => {
    // 8-haftagacha raqam ma'noli emas, 40 dan keyin jadval tugaydi.
    expect(fetalSizeForWeek(7)).toBeNull();
    expect(fetalSizeForWeek(41)).toBeNull();
  });
});
