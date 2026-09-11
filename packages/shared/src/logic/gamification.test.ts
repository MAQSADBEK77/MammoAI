import { describe, expect, it } from "vitest";
import { computeStreaks, computeEarnedBadges, BADGE_DEFINITIONS } from "./gamification";

describe("computeStreaks", () => {
  it("bo'sh ro'yxat uchun hammasi 0", () => {
    expect(computeStreaks([], "2026-09-11")).toEqual({ currentStreakDays: 0, longestStreakDays: 0, totalLogsCount: 0 });
  });

  it("ketma-ket 5 kun, bugun oxirgisi bo'lsa — joriy va eng uzun streak bir xil (5)", () => {
    const dates = ["2026-09-07", "2026-09-08", "2026-09-09", "2026-09-10", "2026-09-11"];
    expect(computeStreaks(dates, "2026-09-11")).toEqual({ currentStreakDays: 5, longestStreakDays: 5, totalLogsCount: 5 });
  });

  it("kecha oxirgi yozuv bo'lsa ham, streak hali UZILMAGAN hisoblanadi (bugun hali tugamagan)", () => {
    const dates = ["2026-09-09", "2026-09-10"];
    expect(computeStreaks(dates, "2026-09-11").currentStreakDays).toBe(2);
  });

  it("2 kundan ko'p bo'shliq bo'lsa, joriy streak 0 ga tushadi, lekin eng uzun streak saqlanadi", () => {
    const dates = ["2026-08-01", "2026-08-02", "2026-08-03", "2026-08-04", "2026-08-05"]; // 5 kunlik eski streak
    const stats = computeStreaks(dates, "2026-09-11"); // ko'p vaqt o'tgan
    expect(stats.currentStreakDays).toBe(0);
    expect(stats.longestStreakDays).toBe(5);
  });

  it("bir nechta alohida streak orasidan ENG UZUNINI tanlaydi", () => {
    const dates = [
      "2026-01-01",
      "2026-01-02", // 2 kunlik streak
      "2026-02-01",
      "2026-02-02",
      "2026-02-03",
      "2026-02-04", // 4 kunlik streak — bu eng uzuni
    ];
    expect(computeStreaks(dates, "2026-09-11").longestStreakDays).toBe(4);
  });

  it("takrorlangan sanalarni bitta deb hisoblaydi (dublikat emas)", () => {
    const dates = ["2026-09-10", "2026-09-10", "2026-09-11"];
    expect(computeStreaks(dates, "2026-09-11").totalLogsCount).toBe(2);
  });

  it("tartibsiz (sorted bo'lmagan) kirish ma'lumoti bilan ham to'g'ri ishlaydi", () => {
    const dates = ["2026-09-11", "2026-09-09", "2026-09-10"];
    expect(computeStreaks(dates, "2026-09-11").currentStreakDays).toBe(3);
  });
});

describe("computeEarnedBadges", () => {
  it("hech qanday statistika bo'lmasa, hech qanday nishon yo'q", () => {
    expect(computeEarnedBadges({ currentStreakDays: 0, longestStreakDays: 0, totalLogsCount: 0 })).toEqual([]);
  });

  it("birinchi yozuv bilan 'first_log' nishoni ochiladi", () => {
    const badges = computeEarnedBadges({ currentStreakDays: 1, longestStreakDays: 1, totalLogsCount: 1 });
    expect(badges).toContain("first_log");
    expect(badges).not.toContain("week_streak");
  });

  it("7 kunlik eng uzun streak bilan 'week_streak' ham ochiladi ('first_log' bilan birga)", () => {
    const badges = computeEarnedBadges({ currentStreakDays: 0, longestStreakDays: 7, totalLogsCount: 7 });
    expect(badges).toContain("first_log");
    expect(badges).toContain("week_streak");
    expect(badges).not.toContain("month_streak");
  });

  it("joriy streak UZILGAN bo'lsa ham, eng uzun streak asosidagi nishon YO'QOLMAYDI", () => {
    // Bu ATAYLAB shu tarzda ishlaydi — izohga qarang (gamification.ts).
    const badges = computeEarnedBadges({ currentStreakDays: 0, longestStreakDays: 30, totalLogsCount: 30 });
    expect(badges).toContain("month_streak");
  });

  it("har bir nishon ta'rifi uchun aniq metric/threshold bor", () => {
    for (const def of BADGE_DEFINITIONS) {
      expect(def.threshold).toBeGreaterThan(0);
      expect(["totalLogsCount", "longestStreakDays"]).toContain(def.metric);
    }
  });
});
