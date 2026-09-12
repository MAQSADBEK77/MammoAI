import { describe, expect, it } from "vitest";
import { getDailyInsightIds, DAILY_INSIGHT_EMOJI } from "./daily-insights";

describe("getDailyInsightIds", () => {
  it("faza berilsa, birinchi element hamisha o'sha faza kartasi bo'ladi", () => {
    const ids = getDailyInsightIds("menstrual", "2026-06-15");
    expect(ids[0]).toBe("phase_menstrual");
  });

  it("faza null bo'lsa, faza kartasi qo'shilmaydi", () => {
    const ids = getDailyInsightIds(null, "2026-06-15");
    expect(ids.every((id) => !id.startsWith("phase_"))).toBe(true);
  });

  it("bir xil sana uchun har doim bir xil natija beradi (barqaror, tasodifiy emas)", () => {
    expect(getDailyInsightIds("luteal", "2026-06-15")).toEqual(getDailyInsightIds("luteal", "2026-06-15"));
  });

  it("boshqa kunlar uchun umumiy maslahatlar to'plami aylanadi (har doim bir xil emas)", () => {
    const day1 = getDailyInsightIds(null, "2026-01-01").slice();
    const day2 = getDailyInsightIds(null, "2026-01-02").slice();
    expect(day1).not.toEqual(day2);
  });

  it("har bir mumkin bo'lgan id uchun emoji belgilangan", () => {
    for (const id of getDailyInsightIds("ovulation", "2026-03-10")) {
      expect(DAILY_INSIGHT_EMOJI[id]).toBeTruthy();
    }
  });

  it("takrorlanuvchi id qaytarmaydi", () => {
    const ids = getDailyInsightIds("follicular", "2026-05-05");
    expect(new Set(ids).size).toBe(ids.length);
  });
});
