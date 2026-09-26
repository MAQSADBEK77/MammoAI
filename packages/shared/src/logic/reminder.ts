// REMIND-02 — kunlik eslatmada QAYSI xabar yuborilishini hal qiluvchi
// SOF funksiya.
//
// Nega alohida fayl: bu ilovaning ayolni qaytaradigan yagona kanali, ya'ni
// eng muhim mantiqlaridan biri. Shunga qaramay u server fayli ichida
// (apps/web) yashirin edi va uni faqat production'ga chiqarib, haqiqiy
// odamlarga xabar yuborib tekshirish mumkin edi. Endi qaror shu yerda
// qabul qilinadi va testlar bilan qoplangan; `daily-reminders.ts` esa
// faqat ma'lumot yig'ib, xabarni yuboradigan qobiq bo'lib qoladi.

/** Yuboriladigan xabarning TURI. Matnlar (tarjimalar) chaqiruvchida qo'shiladi. */
export type ReminderKind =
  /** Onboardingni tugatmagan — "sozlashni tugating". */
  | { kind: "finish-setup" }
  /** Homilador: hafta bilan. */
  | { kind: "pregnancy-week"; week: number }
  /** Homilador, lekin hafta hisoblanmadi (sana yo'q). */
  | { kind: "pregnancy-log" }
  | { kind: "period-today" }
  | { kind: "period-tomorrow" }
  | { kind: "period-soon"; days: number }
  | { kind: "period-late"; days: number }
  | { kind: "fertile-window" }
  /** Bugun hech narsa belgilanmagan. */
  | { kind: "log-today" }
  /** Hech narsa yuborilmaydi. */
  | { kind: "none" };

export interface ReminderInput {
  today: string;
  /** Onboarding profili bormi. Yo'q bo'lsa ayol sozlashni tugatmagan. */
  hasOnboarding: boolean;
  /** Shu ayolga shu paytgacha yuborilgan kunlik eslatmalar soni. */
  remindersSentSoFar: number;
  isPregnant: boolean;
  /** Homiladorlik haftasi — hisoblab bo'lmasa `null`. */
  pregnancyWeek: number | null;
  loggedToday: boolean;
  prediction: {
    daysUntilNextPeriod: number;
    fertileWindowStart: string;
    fertileWindowEnd: string;
  } | null;
}

/** Shuncha kun (yoki kamroq) qolganda "yaqinlashmoqda" xabari beriladi. */
export const PERIOD_SOON_DAYS_AHEAD = 2;

/**
 * Kechikish shundan ko'p kun davom etsa, endi "kechikayapti" deb tinimsiz
 * eslatmaymiz — bu holatda ko'proq ehtimol tartibsizlik, homiladorlik yoki
 * yozishni to'xtatgan; kunlik "kechikish o'sib bormoqda" xabari foydali
 * emas, zerikarli.
 */
export const PERIOD_LATE_MAX_DAYS_TO_NOTIFY = 7;

/**
 * Onboardingni tugatmaganlarga yuboriladigan eng ko'p xabar soni.
 *
 * O'lchandi (2026-09-26, production): kunlik eslatma olayotgan 48 ayoldan
 * 39 tasi onboardingni UMUMAN tugatmagan va bironta ham qayd kiritmagan.
 * Ular o'rtacha 11.7 marta (eng ko'pi 18 marta) "sikl kuzatuvini DAVOM
 * ETTIRING" xabarini olishgan — hech qachon boshlamagan bo'lsalar ham.
 *
 * O'n sakkizta bir xil xabar — bu eslatma emas, spam; uning yagona
 * natijasi botni ovozsiz qilish yoki bloklash.
 */
export const SETUP_REMINDER_MAX = 3;

export function resolveReminder(input: ReminderInput): ReminderKind {
  // Sozlashni tugatmagan ayolga "kuzatuvni DAVOM ETTIRING" deyish noto'g'ri —
  // u hech qachon boshlamagan. Va uchtadan keyin to'xtaymiz.
  if (!input.hasOnboarding) {
    return input.remindersSentSoFar >= SETUP_REMINDER_MAX ? { kind: "none" } : { kind: "finish-setup" };
  }

  // Homilador ayolga sikl xabarlari to'g'ri kelmaydi. Ilgari shu sababli
  // unga UMUMAN xabar yuborilmasdi — "sikl xabari noto'g'ri" degani esa
  // "hech qanday xabar kerak emas" degani emas.
  if (input.isPregnant) {
    if (input.loggedToday) return { kind: "none" };
    return input.pregnancyWeek !== null
      ? { kind: "pregnancy-week", week: input.pregnancyWeek }
      : { kind: "pregnancy-log" };
  }

  const p = input.prediction;
  if (p) {
    if (p.daysUntilNextPeriod === 0) return { kind: "period-today" };
    if (p.daysUntilNextPeriod === 1) return { kind: "period-tomorrow" };
    if (p.daysUntilNextPeriod > 1 && p.daysUntilNextPeriod <= PERIOD_SOON_DAYS_AHEAD) {
      return { kind: "period-soon", days: p.daysUntilNextPeriod };
    }
    if (p.daysUntilNextPeriod < 0 && p.daysUntilNextPeriod >= -PERIOD_LATE_MAX_DAYS_TO_NOTIFY) {
      return { kind: "period-late", days: -p.daysUntilNextPeriod };
    }
    if (input.today >= p.fertileWindowStart && input.today <= p.fertileWindowEnd) {
      return { kind: "fertile-window" };
    }
  }

  return input.loggedToday ? { kind: "none" } : { kind: "log-today" };
}
