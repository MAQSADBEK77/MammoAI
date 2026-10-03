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
  /** Muddati o'tgan tekshiruv bor. */
  | { kind: "checkup-overdue"; count: number }
  /** Homilador: hafta bilan. */
  | { kind: "pregnancy-week"; week: number }
  /** Homilador, lekin hafta hisoblanmadi (sana yo'q). */
  | { kind: "pregnancy-log" }
  | { kind: "period-today" }
  | { kind: "period-tomorrow" }
  | { kind: "period-soon"; days: number }
  | { kind: "period-late"; days: number }
  | { kind: "period-confirm" }
  /** Hayz boshlangan, bugun belgilanmagan — davom etyaptimi? */
  | { kind: "period-ongoing"; day: number }
  // PERIOD-TRACK-04: seriyada faqat dog'lanish bo'lsa — "hayzingizning
  // N-kuni" deb DA'VO qilib bo'lmaydi, shuning uchun alohida tur.
  | { kind: "spotting-ongoing" }
  /** Kutilgan davomiylik tugadi, lekin "tugadi" deb belgilanmagan. */
  | { kind: "period-ended-ask" }
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
  /** Muddati o'tgan, hali bajarilmagan tekshiruvlar soni. */
  overdueCheckups: number;
  /** Tekshiruv haqida oxirgi marta necha kun oldin eslatilgan. Hech qachon
   * eslatilmagan bo'lsa `null`. */
  daysSinceCheckupNudge: number | null;
  /**
   * REMIND-03: oxirgi hayz qaydidan beri necha kun o'tgan (dog'lanish ham
   * hisoblanadi). Hech qachon qayd qilmagan bo'lsa `null`.
   *
   * Nega kerak: ayol hayzini belgilaganda ham bot "hayzingiz kechikmoqda"
   * deb yozardi. O'lchandi (production, 2026-10-01): "kechikmoqda" xabarini
   * oladigan 20 ayolning uchtasida oxirgi 10 kun ichida hayz qaydi bor edi.
   * Ulardan biri 2 kun oldin dog'lanish belgilagan — va ertasiga
   * "kechikmoqda" xabarini olgan.
   *
   * Sabab: dog'lanish ATAYLAB sikl boshlanishi hisoblanmaydi (tibbiy
   * jihatdan to'g'ri), lekin xabar ayolning o'z qaydiga ZID chiqadi va
   * ilovaga ishonchni yo'qotadi.
   */
  daysSinceLastFlowLog: number | null;
  /**
   * PERIOD-TRACK-01: hozir davom etayotgan hayz.
   *
   * Nega kerak: ayol odatda faqat BIRINCHI kunni belgilaydi, keyin
   * unutadi. Natijada kalendarda bitta kun to'liq bo'yalgan, qolgani
   * chiziqcha-chiziqcha (bashorat) bo'lib qoladi — foydalanuvchi aynan
   * shuni so'radi: "boshlangan bo'lsa nega hali ham bashoratdek?".
   *
   * Ikkinchi oqibati jiddiyroq: hayz DAVOMIYLIGI hech qachon
   * o'rganilmaydi, ya'ni bashorat yaxshilanmaydi.
   *
   * `dayIndex` — hayzning nechanchi kuni (1 dan).
   */
  periodInProgress: {
    dayIndex: number;
    expectedLength: number;
    loggedToday: boolean;
    /** PERIOD-TRACK-04: seriyada faqat dog'lanish bormi (logic/flow-streak.ts). */
    spottingOnly: boolean;
  } | null;
  prediction: {
    daysUntilNextPeriod: number;
    fertileWindowStart: string;
    fertileWindowEnd: string;
    /**
     * Bashorat eskirganmi (STALE_PREDICTION_DAYS dan ko'p kechikish).
     * Ekranda bunday holatda "ma'lumot eskirgan, oxirgi hayzni yangilang"
     * deyiladi — bot esa shu paytgacha "kechikmoqda" deb yozaverardi.
     * Ikki joyda ikki xil gap.
     */
    isStale: boolean;
    /**
     * Ilova kamida bitta TO'LIQ siklni ko'rganmi.
     *
     * O'lchandi (production, 2026-10-01): "kechikmoqda" xabarini oladigan
     * 15 ayolning HAMMASIDA bu nol edi — ya'ni kechikish bitta onboarding
     * javobidan va standart 28 kundan taxmin qilingan. Bunday holatda
     * "hayzingiz 5 kun kechikmoqda" deyish asossiz va qo'rqitadi
     * (kechikish — ko'pchilik uchun avvalo homiladorlik savoli).
     */
    cyclesAnalyzed: number;
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
 * REMIND-03: hayz qaydidan keyin necha kun davomida sikl vaqti haqidagi
 * xabarlar YUBORILMAYDI.
 *
 * Uch kun: hayz qayd etilgan bo'lsa, keyingi uch kun ichida "kechikmoqda"
 * ham, "ertaga boshlanadi" ham ayolning o'z qaydiga zid bo'ladi. Bu
 * davrda kundalik belgilashga chaqirish mazmunliroq.
 */
export const RECENT_FLOW_QUIET_DAYS = 3;

/**
 * PERIOD-TRACK-04: dog'lanish haqida ko'pi bilan shuncha kun so'raymiz.
 *
 * Hayz uchun oyna "kutilgan davomiylik + 2 kun", chunki u qancha
 * davom etishini taxminan bilamiz. Dog'lanish uchun bunday kutilma
 * YO'Q — u bir kun ham, bir hafta ham bo'lishi mumkin. Shuning uchun
 * qisqa oyna: javob bermasa, qayta-qayta so'rab bezovta qilmaymiz.
 */
export const SPOTTING_ASK_MAX_DAYS = 3;

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

/**
 * Tekshiruv eslatmasi qancha vaqtda bir marta takrorlanadi.
 *
 * HAR KUNI EMAS, ataylab. Tekshiruvdan o'tish bir kunlik ish emas: ayol
 * navbat olishi, vaqt topishi, pul rejalashtirishi kerak. Kunlik eslatma
 * bu yerda faqat bir narsani beradi — botni ovozsiz qilish (REMIND-02
 * dagi 18 ta bir xil xabar buni ko'rsatdi).
 */
export const CHECKUP_NUDGE_INTERVAL_DAYS = 7;

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

  // SCREEN-01: muddati o'tgan tekshiruv sikl xabaridan USTUN turadi.
  //
  // O'lchandi (2026-09-26, production): muddati kelgan 40 ta tekshiruvdan
  // atigi 1 tasi bajarilgan, reja tuzilgan 111 ayoldan faqat 3 tasi
  // umrida bironta bandni belgilagan. Shu bilan birga kunlik eslatma
  // tekshiruv haqida UMUMAN gapirmasdi — ilovaning asosiy va'dasi
  // ayolga yetadigan yagona kanalda mavjud emas edi.
  //
  // Nega hayz xabaridan ustun: kechikkan hayz haqidagi xabarni ayol
  // ertaga ham oladi, o'tkazib yuborilgan skrining esa yillar davomida
  // o'tkazib yuborilaveradi.
  if (
    input.overdueCheckups > 0 &&
    (input.daysSinceCheckupNudge === null || input.daysSinceCheckupNudge >= CHECKUP_NUDGE_INTERVAL_DAYS)
  ) {
    return { kind: "checkup-overdue", count: input.overdueCheckups };
  }

  // PERIOD-TRACK-01: davom etayotgan hayz haqidagi savol sikl VAQTI
  // haqidagi xabarlardan OLDIN turadi — u bashorat emas, ayolning o'z
  // qaydini davom ettirish taklifi, ya'ni hech qanday ziddiyat yo'q.
  const inProgress = input.periodInProgress;
  if (inProgress && !inProgress.loggedToday) {
    // PERIOD-TRACK-04: faqat dog'lanish belgilangan bo'lsa, hayz haqida
    // GAPIRMAYMIZ. Dog'lanish hayz boshlanishi sanalmaydi, shuning uchun
    // "Hayzingizning 2-kuni" ham, "Hayzingiz tugadimi?" ham noto'g'ri
    // da'vo bo'lardi. So'rash esa o'rinli — javob ilovaga haqiqatan nima
    // bo'layotganini o'rgatadi.
    if (inProgress.spottingOnly) {
      if (inProgress.dayIndex <= SPOTTING_ASK_MAX_DAYS) return { kind: "spotting-ongoing" };
      // Undan keyin jim qolmaymiz — pastdagi odatiy mantiq ishlaydi.
    } else if (inProgress.dayIndex <= inProgress.expectedLength) {
      return { kind: "period-ongoing", day: inProgress.dayIndex };
    } else {
      return { kind: "period-ended-ask" };
    }
  }

  const p = input.prediction;
  // REMIND-03: ikkita holatda sikl VAQTI haqidagi xabarlar umuman
  // yuborilmaydi — ular ayolning o'z qaydiga yoki ilovaning o'z
  // ekraniga zid chiqardi:
  //   1) bashorat eskirgan (ekranda "ma'lumot eskirgan" deyiladi);
  //   2) ayol yaqinda hayz qaydini kiritgan.
  const recentlyLoggedFlow =
    input.daysSinceLastFlowLog !== null && input.daysSinceLastFlowLog <= RECENT_FLOW_QUIET_DAYS;
  if (p && !p.isStale && !recentlyLoggedFlow) {
    if (p.daysUntilNextPeriod === 0) return { kind: "period-today" };
    if (p.daysUntilNextPeriod === 1) return { kind: "period-tomorrow" };
    if (p.daysUntilNextPeriod > 1 && p.daysUntilNextPeriod <= PERIOD_SOON_DAYS_AHEAD) {
      return { kind: "period-soon", days: p.daysUntilNextPeriod };
    }
    if (p.daysUntilNextPeriod < 0 && p.daysUntilNextPeriod >= -PERIOD_LATE_MAX_DAYS_TO_NOTIFY) {
      // Hech qanday to'liq sikl kuzatilmagan bo'lsa, "kechikmoqda" deb
      // DA'VO qilmaymiz — buni bilmaymiz. O'rniga tasdiqlashni so'raymiz:
      // bu ham foydali (bashoratni aniqlashtiradi), ham halol.
      return p.cyclesAnalyzed > 0 ? { kind: "period-late", days: -p.daysUntilNextPeriod } : { kind: "period-confirm" };
    }
    if (input.today >= p.fertileWindowStart && input.today <= p.fertileWindowEnd) {
      return { kind: "fertile-window" };
    }
  }

  return input.loggedToday ? { kind: "none" } : { kind: "log-today" };
}
