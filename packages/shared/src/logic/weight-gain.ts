/**
 * PREG-WEIGHT-01 — homiladorlikdagi vazn oshishi.
 *
 * Bizda vazn allaqachon yozilardi va "+6.2 kg" deb ko'rsatilardi. Lekin
 * bu raqamning O'ZI hech narsa demaydi: 6.2 kg 20-haftada normal,
 * 34-haftada esa kam. Ayol buni faqat me'yor bilan yonma-yon ko'rganda
 * tushunadi — Lalu va Flo'da shu shaklda.
 *
 * Me'yor IOM (2009) tavsiyalari bo'yicha va HOMILADORLIKDAN OLDINGI
 * tana massasi indeksiga bog'liq: bir xil "+10 kg" ozg'in ayol uchun
 * kam, semizlik bo'lganda esa ko'p bo'lishi mumkin.
 *
 * MUHIM: chegaradan chiqish "xato" degani emas va ekranda shunday
 * aytiladi. Vazn oshishi sekin ketishi ham, tez ketishi ham SUHBAT
 * uchun sabab, tashxis uchun emas.
 */

export type BmiCategory = "underweight" | "normal" | "overweight" | "obese";
export type WeightGainStatus = "below" | "within" | "above";

/** Birinchi trimestrda umumiy oshish (kg) — TMI dan deyarli mustaqil. */
const FIRST_TRIMESTER_GAIN: Record<BmiCategory, [number, number]> = {
  underweight: [0.5, 2],
  normal: [0.5, 2],
  overweight: [0.5, 2],
  obese: [0.2, 2],
};

/** 2- va 3-trimestrda haftalik oshish (kg/hafta). */
const WEEKLY_RATE: Record<BmiCategory, [number, number]> = {
  underweight: [0.44, 0.58],
  normal: [0.35, 0.5],
  overweight: [0.23, 0.33],
  obese: [0.17, 0.27],
};

/** Butun homiladorlik uchun tavsiya etilgan umumiy oshish (kg). */
export const TOTAL_GAIN: Record<BmiCategory, [number, number]> = {
  underweight: [12.5, 18],
  normal: [11.5, 16],
  overweight: [7, 11.5],
  obese: [5, 9],
};

const FIRST_TRIMESTER_END_WEEK = 13;

export function bmiCategory(heightCm: number, weightKg: number): BmiCategory | null {
  if (!(heightCm > 0) || !(weightKg > 0)) return null;
  // TMI bir o'nlikkacha yaxlitlanadi — tibbiyotda ham shunday
  // ko'rsatiladi. Yaxlitlashsiz 160 sm / 64 kg 24.999999999999996
  // bo'lib chiqadi va aynan chegaradagi ayol "normal" toifaga
  // tushib qolardi.
  const bmi = Math.round((weightKg / (heightCm / 100) ** 2) * 10) / 10;
  if (!Number.isFinite(bmi)) return null;
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";
  return "obese";
}

export interface WeightGainGuide {
  category: BmiCategory;
  /** Shu haftada kutiladigan oshish oralig'i (kg). */
  expected: [number, number];
  /** Butun muddat uchun tavsiya (kg). */
  total: [number, number];
  /** Haqiqiy oshish berilgan bo'lsa — baho. */
  status: WeightGainStatus | null;
}

/**
 * Berilgan haftadagi kutilayotgan oshish.
 *
 * 13-haftagacha faqat birinchi trimestr oralig'i; keyin unga haftalik
 * tezlik qo'shiladi. Oxirgi chegara umumiy tavsiyadan oshib ketmaydi —
 * aks holda 40-haftada me'yor haqiqiy tavsiyadan yuqori chiqardi.
 */
export function expectedGainAtWeek(week: number, category: BmiCategory): [number, number] {
  const w = Math.max(1, Math.min(42, Math.round(week)));
  const [firstLow, firstHigh] = FIRST_TRIMESTER_GAIN[category];
  if (w <= FIRST_TRIMESTER_END_WEEK) {
    const share = w / FIRST_TRIMESTER_END_WEEK;
    return [round1(firstLow * share), round1(firstHigh * share)];
  }
  const weeks = w - FIRST_TRIMESTER_END_WEEK;
  const [rateLow, rateHigh] = WEEKLY_RATE[category];
  const [totalLow, totalHigh] = TOTAL_GAIN[category];
  return [round1(Math.min(firstLow + weeks * rateLow, totalLow)), round1(Math.min(firstHigh + weeks * rateHigh, totalHigh))];
}

export function weightGainGuide(
  heightCm: number | null,
  prePregnancyWeightKg: number | null,
  week: number,
  actualGainKg: number | null
): WeightGainGuide | null {
  if (heightCm === null || prePregnancyWeightKg === null) return null;
  const category = bmiCategory(heightCm, prePregnancyWeightKg);
  if (!category) return null;
  const expected = expectedGainAtWeek(week, category);
  let status: WeightGainStatus | null = null;
  if (actualGainKg !== null && Number.isFinite(actualGainKg)) {
    // Chegaraga TENG bo'lgan qiymat me'yor ichida hisoblanadi: chegarani
    // "chiqib ketish" deb ko'rsatish bekorga tashvish tug'dirardi.
    if (actualGainKg < expected[0]) status = "below";
    else if (actualGainKg > expected[1]) status = "above";
    else status = "within";
  }
  return { category, expected, total: TOTAL_GAIN[category], status };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
