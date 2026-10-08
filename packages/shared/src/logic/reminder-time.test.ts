import { describe, expect, it } from "vitest";
import { DEFAULT_REMINDER_SLOT, nearestReminderSlot, shouldSendAtHour } from "./reminder-time";

describe("nearestReminderSlot", () => {
  it("ertalabki faollik — ertalabki oyna", () => {
    expect(nearestReminderSlot(9)).toBe(9);
    expect(nearestReminderSlot(11)).toBe(9);
    expect(nearestReminderSlot(6)).toBe(9);
  });

  it("kechki faollik — kechki oyna", () => {
    expect(nearestReminderSlot(18)).toBe(20);
    expect(nearestReminderSlot(21)).toBe(20);
    expect(nearestReminderSlot(23)).toBe(20);
  });

  it("teng masofada kechki oyna tanlanadi", () => {
    // 14:30 -> 9 ga 5.5, 20 ga 5.5. Yaxlitlangach 15 -> 9 ga 6, 20 ga 5.
    expect(nearestReminderSlot(14.5)).toBe(20);
  });

  it("sutka aylanasi hisobga olinadi — 02:00 ertalabga yaqinroq", () => {
    // 02:00 dan 09:00 gacha 7 soat, 20:00 gacha esa 6 soat (orqaga).
    expect(nearestReminderSlot(2)).toBe(20);
    expect(nearestReminderSlot(4)).toBe(9);
  });

  it("ma'lumot yo'q — eski xatti-harakat (kechqurun)", () => {
    expect(nearestReminderSlot(null)).toBe(DEFAULT_REMINDER_SLOT);
    expect(nearestReminderSlot(undefined)).toBe(DEFAULT_REMINDER_SLOT);
    expect(nearestReminderSlot(Number.NaN)).toBe(DEFAULT_REMINDER_SLOT);
  });
});

describe("shouldSendAtHour", () => {
  it("o'z oynasida yuboriladi", () => {
    expect(shouldSendAtHour(10, 9)).toBe(true);
    expect(shouldSendAtHour(18, 20)).toBe(true);
  });

  it("boshqa soatda yuborilmaydi", () => {
    expect(shouldSendAtHour(10, 13)).toBe(false);
    expect(shouldSendAtHour(18, 9)).toBe(false);
  });

  it("ZAXIRA: kuniga bitta chaqiruv bo'lsa, hamma o'sha chaqiruvda oladi", () => {
    // Cron chastotasi oshirilmagan holat — xatti-harakat buzilmasligi kerak.
    expect(shouldSendAtHour(10, DEFAULT_REMINDER_SLOT)).toBe(true);
    expect(shouldSendAtHour(null, DEFAULT_REMINDER_SLOT)).toBe(true);
  });
});
