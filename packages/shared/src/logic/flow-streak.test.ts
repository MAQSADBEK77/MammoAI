import { describe, expect, it } from "vitest";
import { lastFlowStreak, lastFlowStreakStart } from "./flow-streak";

describe("lastFlowStreakStart", () => {
  it("qayd bo'lmasa null", () => {
    expect(lastFlowStreakStart([])).toBeNull();
    expect(lastFlowStreakStart([{ date: "2026-09-01", flow: null }])).toBeNull();
  });

  it("ketma-ket kunlarni bitta seriya deb oladi", () => {
    const logs = [
      { date: "2026-09-29", flow: "medium" },
      { date: "2026-09-30", flow: "light" },
      { date: "2026-10-01", flow: "light" },
    ];
    expect(lastFlowStreakStart(logs)).toBe("2026-09-29");
  });

  it("eski seriyani yangisiga qo'shib yubormaydi", () => {
    const logs = [
      { date: "2026-09-01", flow: "medium" },
      { date: "2026-09-02", flow: "medium" },
      { date: "2026-09-29", flow: "medium" },
    ];
    expect(lastFlowStreakStart(logs)).toBe("2026-09-29");
  });

  it("DOG'LANISH ham hisoblanadi", () => {
    // Butun tuzatishning sababi shu: dog'lanish sikl boshlanishi emas,
    // lekin ayol uni belgilagan — va shundan keyin ilova jim qolardi.
    expect(lastFlowStreakStart([{ date: "2026-09-29", flow: "spotting" }])).toBe("2026-09-29");
  });

  it("tartibsiz kelgan qaydlarda ham to'g'ri ishlaydi", () => {
    const logs = [
      { date: "2026-10-01", flow: "light" },
      { date: "2026-09-29", flow: "medium" },
      { date: "2026-09-30", flow: "medium" },
    ];
    expect(lastFlowStreakStart(logs)).toBe("2026-09-29");
  });
});

// PERIOD-TRACK-04 — production'da topilgan xato: bitta dog'lanish kuni
// "Hayzingizning 2-kuni" degan xabarga olib keldi.
describe("spottingOnly — dog'lanish hayz deb e'lon qilinmasligi kerak", () => {
  it("faqat dog'lanish belgilangan seriya spottingOnly bo'ladi", () => {
    const streak = lastFlowStreak([{ date: "2026-10-02", flow: "spotting" }]);
    expect(streak).toEqual({ start: "2026-10-02", spottingOnly: true });
  });

  it("seriyada bitta kun haqiqiy hayz bo'lsa — spottingOnly EMAS", () => {
    const streak = lastFlowStreak([
      { date: "2026-10-01", flow: "spotting" },
      { date: "2026-10-02", flow: "medium" },
    ]);
    expect(streak).toEqual({ start: "2026-10-01", spottingOnly: false });
  });

  it("eski dog'lanish yangi seriyaga qo'shilmaydi (kunlar uzilgan)", () => {
    const streak = lastFlowStreak([
      { date: "2026-09-29", flow: "spotting" },
      { date: "2026-10-02", flow: "spotting" },
    ]);
    expect(streak?.start).toBe("2026-10-02");
  });

  it("lastFlowStreakStart eski chaqiruvchilar uchun o'zgarmaydi", () => {
    const logs = [{ date: "2026-10-02", flow: "spotting" }];
    expect(lastFlowStreakStart(logs)).toBe("2026-10-02");
    expect(lastFlowStreakStart([])).toBeNull();
  });
});
