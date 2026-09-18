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

  // DATA-ACCURACY-03: yil chegarasi (31-dekabr -> 1-yanvar) alohida
  // qo'lda tekshirildi — epoch-millisekund asosidagi `daysBetween`
  // buni tabiiy ravishda to'g'ri hisoblaydi (kalendar-maydon arifmetikasi
  // ishlatilmaydi), lekin bu aynan shu holat uchun aniq tasdiqlanishi kerak.
  it("yil chegarasidan (31-dekabr->1-yanvar) o'tgan streak uzilmaydi", () => {
    const dates = ["2025-12-30", "2025-12-31", "2026-01-01", "2026-01-02"];
    expect(computeStreaks(dates, "2026-01-02")).toEqual({
      currentStreakDays: 4,
      longestStreakDays: 4,
      totalLogsCount: 4,
    });
  });

  // Kabisa yili: 2024 fevral 29-kunga ega, 2025 emas — daysBetween buni
  // to'g'ri (Feb28->Feb29 = 1 kun) hisoblashi kerak.
  it("kabisa yilidagi 29-fevral orqali o'tgan streak to'g'ri hisoblanadi", () => {
    const dates = ["2024-02-27", "2024-02-28", "2024-02-29", "2024-03-01"];
    expect(computeStreaks(dates, "2024-03-01")).toEqual({
      currentStreakDays: 4,
      longestStreakDays: 4,
      totalLogsCount: 4,
    });
  });

  it("kabisa YILI EMAS yilda 28-fevraldan keyin to'g'ridan-to'g'ri 1-mart keladi (streak baribir uzilmaydi)", () => {
    const dates = ["2025-02-27", "2025-02-28", "2025-03-01"];
    expect(computeStreaks(dates, "2025-03-01").currentStreakDays).toBe(3);
  });

  // Himoya: `lastDate` "bugun"dan KEYINGI (kelajak) sana bo'lib qolsa —
  // server hech qachon shunday yubormasligi kerak, lekin funksiyaning o'zi
  // buni "streak uzilmagan" deb noto'g'ri qabul qilmasligi kerak (manfiy
  // gapFromToday `<= 1` shartini ham qanoatlantirar edi).
  it("kelajakdagi (bugundan keyingi) sanani 'joriy streak' sifatida noto'g'ri qabul qilmaydi", () => {
    const dates = ["2026-09-20"]; // "bugun" (2026-09-18)dan 2 kun keyin
    const stats = computeStreaks(dates, "2026-09-18");
    expect(stats.currentStreakDays).toBe(0);
    expect(stats.longestStreakDays).toBe(1); // tarixiy uzunlik hisobiga ta'sir qilmaydi
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
