// "Kunlik maslahatlar" — Flo'ning "My daily insights" gorizontal skroll
// kartalari qatoridan ilhomlangan (foydalanuvchi screenshot ko'rsatib
// so'ragan funksiya). Alohida content-boshqaruv backend kerak emas: bitta
// doim ko'rsatiladigan FAZAGA MOS maslahat (mavjud getCyclePhase'dan) + har
// kuni almashinadigan bir nechta umumiy maslahat (sana bo'yicha aylanadigan
// indeks — haqiqiy "kunlik" tuyg'usi beradi, lekin backend/DB shart emas).
// Matn tarjimalari i18n dict'da (`dict.cycle.dailyInsights`), bu yerda faqat
// QAYSI kartalar ko'rsatilishi va ularning emoji-ikonkasi belgilanadi.

import type { CyclePhase } from "./cycle-phase";

export type DailyInsightId =
  | "phase_menstrual"
  | "phase_follicular"
  | "phase_ovulation"
  | "phase_luteal"
  | "hydration"
  | "sleep"
  | "nutrition"
  | "self_care"
  | "ai_assistant";

export const DAILY_INSIGHT_EMOJI: Record<DailyInsightId, string> = {
  phase_menstrual: "🩸",
  phase_follicular: "🌱",
  phase_ovulation: "🌸",
  phase_luteal: "🌙",
  hydration: "💧",
  sleep: "😴",
  nutrition: "🥗",
  self_care: "🧘",
  ai_assistant: "✨",
};

// Faqat "ai_assistant" bosilganda /yordamchi'ga o'tadi — qolganlari sof
// ma'lumot (bosilsa hech qayerga o'tmaydi).
export const DAILY_INSIGHT_LINK: Partial<Record<DailyInsightId, "assistant">> = {
  ai_assistant: "assistant",
};

const GENERIC_INSIGHT_POOL: DailyInsightId[] = ["hydration", "sleep", "nutrition", "self_care", "ai_assistant"];
const GENERIC_INSIGHTS_PER_DAY = 3;

function dayOfYear(dateStr: string): number {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  return Math.floor((d.getTime() - start) / 86400000);
}

/** @param phase joriy sikl fazasi — `null` bo'lsa (masalan homiladorlik/
 * perimenopauza rejimida yoki ma'lumot yo'qligida) faza-kartasi qo'shilmaydi. */
export function getDailyInsightIds(phase: CyclePhase | null, todayStr: string): DailyInsightId[] {
  const ids: DailyInsightId[] = [];
  if (phase) ids.push(`phase_${phase}` as DailyInsightId);

  const offset = dayOfYear(todayStr);
  const pool = GENERIC_INSIGHT_POOL.filter((id) => !ids.includes(id));
  for (let i = 0; i < Math.min(GENERIC_INSIGHTS_PER_DAY, pool.length); i++) {
    ids.push(pool[(offset + i) % pool.length]);
  }
  return ids;
}
