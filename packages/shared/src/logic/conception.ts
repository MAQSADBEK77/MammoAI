// TTC-02 — homiladorlikka tayyorgarlik rejimining o'zagi.
//
// Bu yerda ikkita qaror bor va ikkalasi ham TIBBIY, ya'ni ularni
// komponent ichida "shunchaki ko'rsatish mantig'i" sifatida qoldirib
// bo'lmaydi:
//
//   1. Ayol qachon shifokorga murojaat qilishi kerak (`resolveConceptionStage`);
//   2. Unumdor oynani qanchalik "qoplagani" (`fertileWindowCoverage`).
//
// Manbalar (2026-09-27 da tekshirildi):
//   • ACOG: tekshiruv 35 yoshgacha 12 oydan keyin, 35-40 yoshda 6 oydan
//     keyin, 40 dan katta yoki xavf omillari bo'lsa DARHOL boshlanadi.
//     https://www.acog.org/womens-health/faqs/evaluating-infertility
//   • NICE: bir yil davomida homiladorlik bo'lmasa, ayol HAM, hamkori HAM
//     tekshiruvdan o'tishi kerak; 36 yoshdan katta bo'lsa ertaroq.
//
// MUHIM: bu funksiya tashxis qo'ymaydi. U faqat "shu vaqtdan keyin
// shifokorga borish maqbul" degan CHEGARANI hisoblaydi.

/** Shifokorga murojaat chegarasi — oylarda. `0` = darhol. */
export const REFERRAL_MONTHS_UNDER_35 = 12;
export const REFERRAL_MONTHS_35_TO_40 = 6;

export type ConceptionStage =
  /** Hali erta — chegaragacha `monthsLeft` oy bor. */
  | { kind: "on-track"; monthsTrying: number; monthsLeft: number }
  /** Chegara o'tdi — ayol va HAMKORI tekshiruvdan o'tishi kerak. */
  | { kind: "evaluate-now"; monthsTrying: number; reason: "duration" | "age" | "risk" }
  /** "Necha oydan beri" ma'lum emas — avval shuni so'raymiz. */
  | { kind: "unknown-duration" };

export interface ConceptionInput {
  age: number;
  /** Necha oydan beri urinilmoqda. Noma'lum bo'lsa `null`. */
  monthsTrying: number | null;
  /**
   * Ma'lum xavf omili bormi — tartibsiz/yo'q hayz, endometrioz, PCOS,
   * kimyoterapiya tarixi, chanoq a'zolari operatsiyasi va h.k.
   * ACOG: bunday holatda 12 oy kutilmaydi.
   */
  hasKnownRiskFactor: boolean;
}

export function resolveConceptionStage(input: ConceptionInput): ConceptionStage {
  // 40 dan katta va xavf omili — muddatdan QAT'I NAZAR darhol.
  // Buni `monthsTrying` noma'lumligidan ham oldin tekshiramiz: javobni
  // kutib turish shu ikki holatda vaqt yo'qotish demak.
  if (input.age > 40) return { kind: "evaluate-now", monthsTrying: input.monthsTrying ?? 0, reason: "age" };
  if (input.hasKnownRiskFactor) return { kind: "evaluate-now", monthsTrying: input.monthsTrying ?? 0, reason: "risk" };

  if (input.monthsTrying === null) return { kind: "unknown-duration" };

  const threshold = input.age >= 35 ? REFERRAL_MONTHS_35_TO_40 : REFERRAL_MONTHS_UNDER_35;
  if (input.monthsTrying >= threshold) {
    return { kind: "evaluate-now", monthsTrying: input.monthsTrying, reason: "duration" };
  }
  return { kind: "on-track", monthsTrying: input.monthsTrying, monthsLeft: threshold - input.monthsTrying };
}

/**
 * Unumdor oynaning qanchalik qoplangani.
 *
 * Nega kerak: "unumdor kunlaringiz keldi" degan xabarning o'zi yetarli
 * emas — ayol o'sha kunlarda nima bo'lganini eslay olmaydi va keyingi
 * siklga o'tganda ham xuddi shu noaniqlikda qoladi. Qoplanish esa aniq
 * javob beradi: oyna o'tdi, nechta kuni belgilandi.
 *
 * ATAYLAB soddaligicha: har bir belgilangan kun bir "qoplangan kun".
 * Ehtimollik hisoblamaymiz — u soxta aniqlik bo'lardi.
 */
export function fertileWindowCoverage(
  windowStart: string,
  windowEnd: string,
  intercourseDates: readonly string[]
): { total: number; covered: number } {
  const total = daysBetweenInclusive(windowStart, windowEnd);
  const seen = new Set<string>();
  for (const d of intercourseDates) {
    if (d >= windowStart && d <= windowEnd) seen.add(d);
  }
  return { total, covered: seen.size };
}

function daysBetweenInclusive(a: string, b: string): number {
  const ms = Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`);
  return Math.max(0, Math.round(ms / 86_400_000) + 1);
}

/**
 * "Urinish oyi" — birinchi urinishdan beri o'tgan to'liq oylar.
 * `tryingSince` "YYYY-MM-DD" yoki `null`.
 */
export function monthsTryingSince(tryingSince: string | null, today: string): number | null {
  if (!tryingSince) return null;
  const from = new Date(`${tryingSince}T00:00:00Z`);
  const to = new Date(`${today}T00:00:00Z`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) return null;
  let months = (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth());
  if (to.getUTCDate() < from.getUTCDate()) months -= 1;
  return Math.max(0, months);
}
