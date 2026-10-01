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
    overdueCheckups: 0,
    daysSinceCheckupNudge: null,
    daysSinceLastFlowLog: null,
    prediction: { daysUntilNextPeriod: 18, fertileWindowStart: "2026-10-05", fertileWindowEnd: "2026-10-11", isStale: false, cyclesAnalyzed: 3 },
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
    const state = resolveReminder(base({ hasOnboarding: false, prediction: { daysUntilNextPeriod: 0, fertileWindowStart: "2026-09-01", fertileWindowEnd: "2026-09-02", isStale: false, cyclesAnalyzed: 3 } }));
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
      base({ isPregnant: true, pregnancyWeek: 20, prediction: { daysUntilNextPeriod: 0, fertileWindowStart: "2026-09-20", fertileWindowEnd: "2026-09-30", isStale: false, cyclesAnalyzed: 3 } })
    );
    expect(state.kind).toBe("pregnancy-week");
  });
});

describe("resolveReminder — tekshiruvlar (SCREEN-01)", () => {
  it("muddati o'tgan tekshiruv sikl xabaridan ustun turadi", () => {
    // Kechikkan hayz haqidagi xabarni ayol ertaga ham oladi; o'tkazib
    // yuborilgan skrining esa yillab o'tkazib yuborilaveradi.
    const state = resolveReminder(
      base({ overdueCheckups: 2, prediction: { daysUntilNextPeriod: 0, fertileWindowStart: "2026-09-01", fertileWindowEnd: "2026-09-02", isStale: false, cyclesAnalyzed: 3 } })
    );
    expect(state).toEqual({ kind: "checkup-overdue", count: 2 });
  });

  it("har kuni takrorlanmaydi", () => {
    expect(resolveReminder(base({ overdueCheckups: 1, daysSinceCheckupNudge: 1 })).kind).not.toBe("checkup-overdue");
    expect(resolveReminder(base({ overdueCheckups: 1, daysSinceCheckupNudge: 6 })).kind).not.toBe("checkup-overdue");
    expect(resolveReminder(base({ overdueCheckups: 1, daysSinceCheckupNudge: 7 })).kind).toBe("checkup-overdue");
  });

  it("homilador ayolga va sozlashni tugatmaganga yuborilmaydi", () => {
    // Homiladorlikda tekshiruv rejasi boshqacha; sozlashni tugatmaganda esa
    // reja umuman ishonchli emas.
    expect(resolveReminder(base({ overdueCheckups: 3, isPregnant: true, pregnancyWeek: 20 })).kind).toBe("pregnancy-week");
    expect(resolveReminder(base({ overdueCheckups: 3, hasOnboarding: false })).kind).toBe("finish-setup");
  });

  it("muddati o'tgani bo'lmasa odatdagidek davom etadi", () => {
    // Bazada keyingi hayzgacha 18 kun — bu sikl hodisasi emas, shuning
    // uchun odatdagi "bugun belgilang" taklifiga tushadi.
    expect(resolveReminder(base({ overdueCheckups: 0 })).kind).toBe("log-today");
  });
});

describe("resolveReminder — sikl holatlari", () => {
  it.each([
    [0, "period-today"],
    [1, "period-tomorrow"],
    [2, "period-soon"],
  ])("keyingi hayzgacha %i kun -> %s", (days, kind) => {
    expect(resolveReminder(base({ prediction: { daysUntilNextPeriod: days, fertileWindowStart: "2026-10-05", fertileWindowEnd: "2026-10-11", isStale: false, cyclesAnalyzed: 3 } })).kind).toBe(kind);
  });

  it("kechikishni musbat son bilan beradi", () => {
    expect(resolveReminder(base({ prediction: { daysUntilNextPeriod: -3, fertileWindowStart: "2026-09-01", fertileWindowEnd: "2026-09-05", isStale: false, cyclesAnalyzed: 3 } })))
      .toEqual({ kind: "period-late", days: 3 });
  });

  it("uzoq kechikishda tinimsiz eslatmaydi", () => {
    // 8 kundan oshgach sabab ko'proq tartibsizlik yoki homiladorlik —
    // kunlik "kechikish o'sib bormoqda" xabari foydali emas.
    const state = resolveReminder(base({ prediction: { daysUntilNextPeriod: -8, fertileWindowStart: "2026-09-01", fertileWindowEnd: "2026-09-05", isStale: false, cyclesAnalyzed: 3 } }));
    expect(state.kind).toBe("log-today");
  });

  it("unumdor oyna ichida tegishli xabarni beradi", () => {
    const state = resolveReminder(base({ prediction: { daysUntilNextPeriod: 12, fertileWindowStart: "2026-09-24", fertileWindowEnd: "2026-09-28", isStale: false, cyclesAnalyzed: 3 } }));
    expect(state.kind).toBe("fertile-window");
  });

  it("bashorat yo'q va bugun belgilanmagan -> belgilashga taklif", () => {
    expect(resolveReminder(base({ prediction: null })).kind).toBe("log-today");
  });

  it("bugun belgilagan va sikl hodisasi yo'q -> hech narsa yuborilmaydi", () => {
    expect(resolveReminder(base({ loggedToday: true })).kind).toBe("none");
  });
});

describe("REMIND-03 — xabar ayolning o'z qaydiga zid chiqmasin", () => {
  it("yaqinda hayz qayd etilgan bo'lsa 'kechikmoqda' YUBORILMAYDI", () => {
    // Foydalanuvchi ko'rsatgan holat: hayzini belgilagan, ertasiga bot
    // "hayzingiz 1 kun kechikmoqda" deb yozgan.
    const input = base({ prediction: { daysUntilNextPeriod: -1, fertileWindowStart: "2026-10-05", fertileWindowEnd: "2026-10-11", isStale: false, cyclesAnalyzed: 3 } });
    expect(resolveReminder(input).kind).toBe("period-late");
    expect(resolveReminder({ ...input, daysSinceLastFlowLog: 2 }).kind).not.toBe("period-late");
  });

  it("dog'lanish ham qayd hisoblanadi", () => {
    // Dog'lanish ATAYLAB sikl boshlanishi sanalmaydi (tibbiy jihatdan
    // to'g'ri), lekin ayol uchun bu "men belgiladim" degani.
    const input = base({
      daysSinceLastFlowLog: 1,
      prediction: { daysUntilNextPeriod: -3, fertileWindowStart: "2026-10-05", fertileWindowEnd: "2026-10-11", isStale: false, cyclesAnalyzed: 3 },
    });
    expect(resolveReminder(input).kind).not.toBe("period-late");
  });

  it("uch kundan keyin xabar yana yuboriladi", () => {
    const input = base({
      daysSinceLastFlowLog: 4,
      prediction: { daysUntilNextPeriod: -2, fertileWindowStart: "2026-10-05", fertileWindowEnd: "2026-10-11", isStale: false, cyclesAnalyzed: 3 },
    });
    expect(resolveReminder(input).kind).toBe("period-late");
  });

  it("bashorat eskirgan bo'lsa sikl xabarlari umuman yuborilmaydi", () => {
    // Ekranda bunday holatda "ma'lumot eskirgan" deyiladi — bot ham
    // shu bilan bir xil gapirishi kerak.
    const input = base({
      prediction: { daysUntilNextPeriod: -120, fertileWindowStart: "2026-10-05", fertileWindowEnd: "2026-10-11", isStale: true, cyclesAnalyzed: 3 },
    });
    const r = resolveReminder(input);
    expect(["period-late", "period-today", "period-tomorrow", "period-soon", "fertile-window"]).not.toContain(r.kind);
  });

  it("yaqinda qayd bo'lsa 'ertaga boshlanadi' ham yuborilmaydi", () => {
    const input = base({
      daysSinceLastFlowLog: 1,
      prediction: { daysUntilNextPeriod: 1, fertileWindowStart: "2026-10-05", fertileWindowEnd: "2026-10-11", isStale: false, cyclesAnalyzed: 3 },
    });
    expect(resolveReminder(input).kind).not.toBe("period-tomorrow");
  });
});

describe("REMIND-03 — asossiz 'kechikmoqda' da'vosi", () => {
  it("hech qanday to'liq sikl kuzatilmagan bo'lsa, tasdiqlash so'raladi", () => {
    // O'lchandi: "kechikmoqda" oladigan 15 ayolning hammasida
    // cyclesAnalyzed = 0 edi, ya'ni kechikish BITTA onboarding javobidan
    // taxmin qilingan. Bunday da'vo asossiz va qo'rqitadi.
    const p = { daysUntilNextPeriod: -4, fertileWindowStart: "2026-10-05", fertileWindowEnd: "2026-10-11", isStale: false };
    expect(resolveReminder(base({ prediction: { ...p, cyclesAnalyzed: 0 } })).kind).toBe("period-confirm");
    expect(resolveReminder(base({ prediction: { ...p, cyclesAnalyzed: 2 } })).kind).toBe("period-late");
  });
});
