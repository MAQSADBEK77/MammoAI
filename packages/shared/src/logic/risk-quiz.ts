// Xavf-testi (self-check) — App.pdf §19. Oddiy ball-asosidagi yo'naltiruvchi
// savolnoma — umumiy tan olingan xavf omillariga asoslangan, lekin bu TIBBIY
// TASHXIS EMAS. Natija foydalanuvchini shifokorga/klinikaga yo'naltirish uchun
// mo'ljallangan, kasallikni aniqlash uchun emas.

import type { RiskQuizAnswers, RiskQuizQuestionId, RiskLevel } from "../types";

export interface RiskQuizQuestion {
  id: RiskQuizQuestionId;
  weight: number;
}

// Har bir savolning "ha" javobi qancha ball qo'shishi — oddiy, tushunarli jadval.
export const RISK_QUIZ_QUESTIONS: RiskQuizQuestion[] = [
  { id: "age", weight: 2 }, // 40 yoshdan katta
  { id: "family_history", weight: 3 }, // oilada saraton tarixi
  { id: "personal_history", weight: 3 }, // shaxsiy ko'krak/ginekologik kasallik tarixi
  { id: "early_period", weight: 1 }, // birinchi hayz 12 yoshgacha
  { id: "no_children_or_late_pregnancy", weight: 1 }, // farzandsiz yoki 30 yoshdan keyin birinchi homiladorlik
  { id: "hormone_therapy", weight: 1 }, // uzoq muddatli gormonal davolanish
  { id: "smoking_alcohol", weight: 1 }, // chekish yoki muntazam alkogol
];

const MAX_SCORE = RISK_QUIZ_QUESTIONS.reduce((sum, q) => sum + q.weight, 0); // 12

export function computeRiskScore(answers: RiskQuizAnswers): number {
  return RISK_QUIZ_QUESTIONS.reduce((sum, q) => sum + (answers[q.id] ? q.weight : 0), 0);
}

export function riskLevelFromScore(score: number): RiskLevel {
  const pct = (score / MAX_SCORE) * 100;
  if (pct >= 50) return "high";
  if (pct >= 25) return "medium";
  return "low";
}
