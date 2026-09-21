// TODAY-02 — kunlik "Check-in" kartalari: foydalanuvchi bosh ekrandagi
// Check-in tugmasini bosganda ketma-ket chiqadigan, bittadan savolli
// kartalar to'plami (referens dizayn: kategoriya yorlig'i + rasm + qisqa
// sarlavha + katta savol + "Yo'q"/"Ha").
//
// Savollar RO'YXATI shu yerda — ma'lumotlar bazasida emas. Sabab: bular
// mahsulot mazmuni (har biriga tarjima, rasm va rang kerak), admin panel
// orqali tahrirlanadigan foydalanuvchi ma'lumoti emas. Yangi savol qo'shish
// = shu massivga bitta qator + to'rt tilga matn.

/** Kartaning rang/ohang guruhi — referensdagi kategoriya yorlig'i. */
export type CheckinCategory = "wellbeing" | "reflection" | "body";

export interface CheckinQuestion {
  /** Bazaga yoziladigan BARQAROR kalit — matn o'zgarsa ham o'zgarmaydi. */
  key: string;
  category: CheckinCategory;
}

/**
 * Kunlik to'plam. Tartib ATAYLAB: yengil/jismoniy savoldan boshlanib,
 * ichki holatga o'tadi — ketma-ket bir xil ohangdagi ikkita savol
 * tushmasligi uchun kategoriyalar almashib keladi.
 */
export const CHECKIN_QUESTIONS: CheckinQuestion[] = [
  { key: "movement", category: "wellbeing" },
  { key: "friend", category: "reflection" },
  { key: "water", category: "body" },
  { key: "sleep", category: "wellbeing" },
  { key: "outdoors", category: "reflection" },
];

export interface CheckinAnswer {
  questionKey: string;
  /** `true` — "Ha", `false` — "Yo'q". */
  answer: boolean;
}

export interface CheckinResponse {
  date: string; // YYYY-MM-DD
  answers: CheckinAnswer[];
}

/** Shu kunga hali javob berilmagan savollar — kartalar shundan yig'iladi. */
export function pendingCheckinQuestions(answers: CheckinAnswer[]): CheckinQuestion[] {
  const answered = new Set(answers.map((a) => a.questionKey));
  return CHECKIN_QUESTIONS.filter((q) => !answered.has(q.key));
}

/** Savol kaliti haqiqiy ro'yxatdami — server tomonda tekshirish uchun. */
export function isKnownCheckinQuestion(key: string): boolean {
  return CHECKIN_QUESTIONS.some((q) => q.key === key);
}
