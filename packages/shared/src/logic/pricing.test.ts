import { describe, expect, it } from "vitest";
import {
  PREMIUM_INTEREST_CHOICES,
  PREMIUM_INTEREST_SOURCES,
  PREMIUM_MONTHLY_UZS,
  PREMIUM_YEARLY_UZS,
  formatUzs,
  isPremiumInterestChoice,
  isPremiumInterestSource,
  yearlyPerMonthUzs,
  yearlySavingsPercent,
} from "./pricing";

describe("formatUzs", () => {
  it("uch xonali guruhlarga ajratadi", () => {
    expect(formatUzs(9900)).toBe("9 900");
    expect(formatUzs(79000)).toBe("79 000");
    expect(formatUzs(1234567)).toBe("1 234 567");
  });

  it("mingdan kichik son o'zgarmaydi", () => {
    expect(formatUzs(0)).toBe("0");
    expect(formatUzs(500)).toBe("500");
  });

  it("ajratuvchi uzunliksiz bo'shliq — raqam satrda bo'linmaydi", () => {
    expect(formatUzs(9900)).not.toContain(" ");
  });

  it("kasr son yaxlitlanadi", () => {
    expect(formatUzs(9899.6)).toBe("9 900");
  });

  it("manfiy son belgisini saqlaydi", () => {
    expect(formatUzs(-9900)).toBe("-9 900");
  });
});

describe("yearlySavingsPercent", () => {
  it("joriy narxlar uchun haqiqiy chegirmani beradi", () => {
    // 9900*12 = 118 800; 79 000 — ya'ni 39 800 so'm, 34% arzon.
    expect(yearlySavingsPercent()).toBe(34);
  });

  it("qo'lda yozilmaydi — narx o'zgarsa javob ham o'zgaradi", () => {
    expect(yearlySavingsPercent(1000, 6000)).toBe(50);
    expect(yearlySavingsPercent(1000, 12000)).toBe(0);
  });

  it("yillik qimmatroq bo'lsa manfiy emas, nol qaytaradi", () => {
    expect(yearlySavingsPercent(1000, 20000)).toBe(0);
  });

  it("oylik nol bo'lsa bo'linish xatosi bermaydi", () => {
    expect(yearlySavingsPercent(0, 79000)).toBe(0);
  });
});

describe("yearlyPerMonthUzs", () => {
  it("yillik narxni oyga bo'ladi", () => {
    expect(yearlyPerMonthUzs(79000)).toBe(6583);
  });

  it("yillik har doim oylikdan arzonroq tushishi kerak", () => {
    expect(yearlyPerMonthUzs(PREMIUM_YEARLY_UZS)).toBeLessThan(PREMIUM_MONTHLY_UZS);
  });
});

describe("tanlov va manba qo'riqchilari", () => {
  it("ro'yxatdagi qiymatlarni qabul qiladi", () => {
    for (const c of PREMIUM_INTEREST_CHOICES) expect(isPremiumInterestChoice(c)).toBe(true);
    for (const s of PREMIUM_INTEREST_SOURCES) expect(isPremiumInterestSource(s)).toBe(true);
  });

  it("begona qiymatni rad etadi", () => {
    expect(isPremiumInterestChoice("free")).toBe(false);
    expect(isPremiumInterestChoice(undefined)).toBe(false);
    expect(isPremiumInterestChoice(1)).toBe(false);
    expect(isPremiumInterestSource("chat")).toBe(false);
    expect(isPremiumInterestSource(null)).toBe(false);
  });

  it("'qimmat' javobi ham to'liq huquqli tanlov — o'lchovning maqsadi shu", () => {
    expect(isPremiumInterestChoice("too_expensive")).toBe(true);
  });
});
