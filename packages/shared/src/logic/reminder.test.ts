import { describe, expect, it } from "vitest";
import { resolveReminder, SETUP_REMINDER_MAX, type ReminderInput } from "./reminder";

function base(over: Partial<ReminderInput> = {}): ReminderInput {
  return {
    today: "2026-09-26",
    hasOnboarding: true,
    remindersSentSoFar: 0,
    isPregnant: false,
    pregnancyWeek: null,
    loggedToday: false,
    prediction: { daysUntilNextPeriod: 18, fertileWindowStart: "2026-10-05", fertileWindowEnd: "2026-10-11" },
    ...over,
  };
}

describe("resolveReminder — sozlashni tugatmaganlar", () => {
  it("'davom ettiring' emas, 'tugating' xabarini oladi", () => {
    // Production'da 39 ayol aynan shu holatda edi va ularga hech qachon
    // boshlamagan narsani "davom ettiring" deb yozilardi.
    expect(resolveReminder(base({ hasOnboarding: false }))).toEqual({ kind: "finish-setup" });
  });

  it("uchtadan keyin butunlay to'xtaydi", () => {
    for (let n = 0; n < SETUP_REMINDER_MAX; n++) {
      expect(resolveReminder(base({ hasOnboarding: false, remindersSentSoFar: n })).kind).toBe("finish-setup");
    }
    expect(resolveReminder(base({ hasOnboarding: false, remindersSentSoFar: SETUP_REMINDER_MAX })).kind).toBe("none");
    // Eng yomon kuzatilgan holat — 18 ta xabar — endi takrorlanmaydi.
    expect(resolveReminder(base({ hasOnboarding: false, remindersSentSoFar: 18 })).kind).toBe("none");
  });

  it("sikl bashorati bo'lsa ham sozlash xabari ustun turadi", () => {
    const state = resolveReminder(base({ hasOnboarding: false, prediction: { daysUntilNextPeriod: 0, fertileWindowStart: "2026-09-01", fertileWindowEnd: "2026-09-02" } }));
    expect(state.kind).toBe("finish-setup");
  });
});

describe("resolveReminder — homiladorlik", () => {
  it("ilgari HECH NARSA yubormasdi; endi hafta bilan xabar oladi", () => {
    expect(resolveReminder(base({ isPregnant: true, pregnancyWeek: 14 }))).toEqual({ kind: "pregnancy-week", week: 14 });
  });

  it("hafta hisoblanmasa ham jim qolmaydi", () => {
    expect(resolveReminder(base({ isPregnant: true, pregnancyWeek: null }))).toEqual({ kind: "pregnancy-log" });
  });

  it("bugun belgilagan bo'lsa bezovta qilinmaydi", () => {
    expect(resolveReminder(base({ isPregnant: true, pregnancyWeek: 14, loggedToday: true })).kind).toBe("none");
  });

  it("homilador ayolga hayz xabari HECH QACHON ketmaydi", () => {
    const state = resolveReminder(
      base({ isPregnant: true, pregnancyWeek: 20, prediction: { daysUntilNextPeriod: 0, fertileWindowStart: "2026-09-20", fertileWindowEnd: "2026-09-30" } })
    );
    expect(state.kind).toBe("pregnancy-week");
  });
});

describe("resolveReminder — sikl holatlari", () => {
  it.each([
    [0, "period-today"],
    [1, "period-tomorrow"],
    [2, "period-soon"],
  ])("keyingi hayzgacha %i kun -> %s", (days, kind) => {
    expect(resolveReminder(base({ prediction: { daysUntilNextPeriod: days, fertileWindowStart: "2026-10-05", fertileWindowEnd: "2026-10-11" } })).kind).toBe(kind);
  });

  it("kechikishni musbat son bilan beradi", () => {
    expect(resolveReminder(base({ prediction: { daysUntilNextPeriod: -3, fertileWindowStart: "2026-09-01", fertileWindowEnd: "2026-09-05" } })))
      .toEqual({ kind: "period-late", days: 3 });
  });

  it("uzoq kechikishda tinimsiz eslatmaydi", () => {
    // 8 kundan oshgach sabab ko'proq tartibsizlik yoki homiladorlik —
    // kunlik "kechikish o'sib bormoqda" xabari foydali emas.
    const state = resolveReminder(base({ prediction: { daysUntilNextPeriod: -8, fertileWindowStart: "2026-09-01", fertileWindowEnd: "2026-09-05" } }));
    expect(state.kind).toBe("log-today");
  });

  it("unumdor oyna ichida tegishli xabarni beradi", () => {
    const state = resolveReminder(base({ prediction: { daysUntilNextPeriod: 12, fertileWindowStart: "2026-09-24", fertileWindowEnd: "2026-09-28" } }));
    expect(state.kind).toBe("fertile-window");
  });

  it("bashorat yo'q va bugun belgilanmagan -> belgilashga taklif", () => {
    expect(resolveReminder(base({ prediction: null })).kind).toBe("log-today");
  });

  it("bugun belgilagan va sikl hodisasi yo'q -> hech narsa yuborilmaydi", () => {
    expect(resolveReminder(base({ loggedToday: true })).kind).toBe("none");
  });
});
