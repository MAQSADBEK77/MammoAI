/**
 * DOC-01 — shifokor reytingi.
 *
 * Nega oddiy o'rtacha ARIFMETIK EMAS: bitta 5 ball olgan shifokor
 * ellikta 4.8 ball olgan shifokordan yuqori turib qolardi. Bu reytingni
 * ma'nosiz qiladi va eng yomoni — uni sotib olish mumkin bo'ladi
 * (bitta soxta sharh yetarli).
 *
 * Shuning uchun Bayes o'rtachasi: kam sharhli shifokor platformaning
 * umumiy o'rtachasiga TORTILADI va faqat haqiqiy sharhlar to'planganda
 * o'z o'rnini egallaydi.
 *
 * Ikkinchi himoya — bu modulda emas, serverda: baho faqat TASDIQLANGAN
 * tashrifdan keyin qabul qilinadi. Tadqiqot ko'rsatdiki, ishonchli
 * platformalar (ZocDoc, RealPatientRatings) aynan shu yo'ldan boradi.
 */

/** Platformaning boshlang'ich kutilmasi — yangi shifokor shu nuqtadan boshlaydi. */
export const RATING_PRIOR_MEAN = 4.3;
/** Prior necha sharhga teng vazn beradi. */
export const RATING_PRIOR_WEIGHT = 5;
/** Shuncha sharhdan kam bo'lsa, raqam ko'rsatilmaydi. */
export const RATING_MIN_TO_SHOW = 3;

export interface DoctorRatingSummary {
  /** Ko'rsatish uchun ball (0 — hali yo'q). */
  score: number;
  count: number;
  /** Raqamni ko'rsatish mumkinmi yoki "yangi" deb yozish kerakmi. */
  display: boolean;
}

export function summarizeDoctorRating(ratings: number[]): DoctorRatingSummary {
  const valid = ratings.filter((r) => Number.isFinite(r) && r >= 1 && r <= 5);
  const count = valid.length;
  if (count === 0) return { score: 0, count: 0, display: false };

  const sum = valid.reduce((a, b) => a + b, 0);
  const bayes = (RATING_PRIOR_MEAN * RATING_PRIOR_WEIGHT + sum) / (RATING_PRIOR_WEIGHT + count);
  return {
    score: Math.round(bayes * 10) / 10,
    count,
    display: count >= RATING_MIN_TO_SHOW,
  };
}

/**
 * Ro'yxatni tartiblash.
 *
 * Reytingi ko'rsatilmaydigan (yangi) shifokorlar PASTDA turadi, lekin
 * yo'qolmaydi — aks holda yangi shifokor hech qachon birinchi
 * sharhini ololmasdi.
 */
export function sortDoctorsByRating<T extends { rating: DoctorRatingSummary }>(doctors: T[]): T[] {
  return [...doctors].sort((a, b) => {
    if (a.rating.display !== b.rating.display) return a.rating.display ? -1 : 1;
    if (b.rating.score !== a.rating.score) return b.rating.score - a.rating.score;
    return b.rating.count - a.rating.count;
  });
}

/** Baho qoldirish mumkinmi. */
export function canRateDoctor(input: { visitConfirmed: boolean; alreadyRated: boolean }): boolean {
  return input.visitConfirmed && !input.alreadyRated;
}
