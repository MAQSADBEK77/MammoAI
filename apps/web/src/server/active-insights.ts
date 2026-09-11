// AI'ning PROAKTIV ("faol") tahlili — roadmap: "AI chatbotni to'liq faol
// tahlil qiladigan qilish". Ilgari AI faqat REAKTIV edi: foydalanuvchi
// so'ragandagina javob berardi, hisoblangan statistika (insights.ts) esa
// xom raqam/grafik sifatida ko'rsatilardi — o'zi hech narsani TALQIN
// qilmasdi. Endi Statistika ochilganda Gemini shu raqamlarni o'qib, tabiiy
// tilda qisqa tahlil yozadi (masalan "so'nggi 3 oyda sikllaringiz 2 kunga
// uzayib bormoqda, bu odatda me'yorda, lekin kuzatib boring").
//
// API XARAJATINI TEJASH: har safar QAYTA generatsiya qilinmaydi —
// `ai_active_insights` jadvalida keshlanadi, faqat (a) hali umuman
// yo'q, (b) yangi log qo'shilgan (logsCount o'zgargan), yoki (c) 7 kundan
// ko'p vaqt o'tgan bo'lsa qayta chaqiriladi.

import { callGemini } from "./ai-chat";
import { getInsightsSummary } from "./insights";
import { countCycleLogs, getActiveInsight, saveActiveInsight } from "./repo";
import { dictionaries } from "@mammoai/shared";
import type { InsightsSummary, Language, SymptomPattern } from "@mammoai/shared";

const REGEN_MAX_AGE_DAYS = 7;

const SYSTEM_PROMPT_BY_LANGUAGE: Record<Language, string> = {
  uz: "Siz MammoAI ilovasining tahlil yordamchisisiz. Foydalanuvchining sikl statistikasi berilgan — shu raqamlarga asoslanib 2-4 gapdan iborat QISQA, iliq, shaxsiylashtirilgan tahlil yozing: eng muhim naqsh/tendentsiyani ajratib ko'rsating, agar tegishli bo'lsa bitta yumshoq tavsiya bering. HECH QACHON tashxis qo'ymang, faqat berilgan raqamlarga asoslaning — o'ylab topmang. Faqat matn, sarlavha/markdown belgilarisiz.",
  "uz-cyrl": "Сиз MammoAI иловасининг таҳлил ёрдамчисисиз. Фойдаланувчининг сикл статистикаси берилган — шу рақамларга асосланиб 2-4 гапдан иборат ҚИСҚА, илиқ, шахсийлаштирилган таҳлил ёзинг. ҲЕЧ ҚАЧОН ташхис қўйманг.",
  ru: "Вы аналитический помощник приложения MammoAI. Даны статистические данные о цикле пользователя — напишите КРАТКИЙ (2-4 предложения), тёплый, персонализированный анализ на основе этих цифр: выделите самую важную закономерность/тенденцию, при необходимости дайте один мягкий совет. НИКОГДА не ставьте диагноз, опирайтесь только на данные цифры. Только текст, без заголовков/markdown.",
  en: "You are the analysis assistant inside the MammoAI app. Given the user's cycle statistics, write a SHORT (2-4 sentence) warm, personalized analysis based on these numbers: highlight the most important pattern/trend, and give one gentle suggestion if relevant. NEVER diagnose, rely only on the given numbers — don't make things up. Plain text only, no headings/markdown.",
};

function formatSummaryForPrompt(summary: InsightsSummary, patterns: SymptomPattern[], language: Language): string {
  const dict = dictionaries[language];
  const lines: string[] = [];

  if (summary.regularity) {
    lines.push(
      `O'rtacha sikl uzunligi: ${summary.regularity.averageCycleLength} kun (±${summary.regularity.variabilityDays} kun farq), yo'nalish: ${summary.regularity.trend}.`
    );
  }
  if (summary.predictionAccuracy) {
    lines.push(
      `Bashorat aniqligi: o'rtacha ${summary.predictionAccuracy.avgErrorDays} kun xato, ${summary.predictionAccuracy.within2DaysPct}% holatda ±2 kun ichida to'g'ri.`
    );
  }
  if (summary.symptomFrequency.length) {
    const top = summary.symptomFrequency
      .slice(0, 5)
      .map((s) => `${dict.cycle.symptoms[s.symptom]} (${s.count})`)
      .join(", ");
    lines.push(`Eng ko'p qayd etilgan simptomlar (so'nggi 6 oy): ${top}.`);
  }
  if (summary.moodDistribution.length) {
    const top = summary.moodDistribution
      .slice(0, 3)
      .map((m) => `${dict.cycle.moods[m.mood]} (${m.count})`)
      .join(", ");
    lines.push(`Eng ko'p qayd etilgan kayfiyatlar: ${top}.`);
  }
  if (patterns.length) {
    const list = patterns.map((p) => `${dict.cycle.symptoms[p.symptom]} (${p.occurrences} marta)`).join(", ");
    lines.push(`Takrorlanuvchi simptomlar (90 kunda 3+): ${list}.`);
  }
  if (summary.cycleLengths.length >= 2) {
    const last = summary.cycleLengths[summary.cycleLengths.length - 1];
    const prev = summary.cycleLengths[summary.cycleLengths.length - 2];
    lines.push(`Oxirgi sikl ${last.lengthDays} kun, undan oldingisi ${prev.lengthDays} kun edi.`);
  }

  return lines.length ? lines.join("\n") : "Hali yetarli ma'lumot yo'q.";
}

/** Kerak bo'lsagina (kesh eskirgan/yangi log qo'shilgan bo'lsa) qayta
 * generatsiya qiladi, aks holda keshlangan matnni qaytaradi. `null` — hali
 * tahlil qilish uchun yetarli ma'lumot yo'q (hasEnoughData false). */
export async function getOrGenerateActiveInsight(
  userId: string,
  language: Language,
  summary: InsightsSummary,
  patterns: SymptomPattern[]
): Promise<string | null> {
  if (!summary.hasEnoughData) return null;

  const [cached, logsCount] = await Promise.all([getActiveInsight(userId), countCycleLogs(userId)]);
  const cacheAgeDays = cached ? (Date.now() - new Date(cached.generatedAt).getTime()) / 86400000 : Infinity;
  const needsRegen = !cached || cached.logsCountAtGeneration !== logsCount || cacheAgeDays > REGEN_MAX_AGE_DAYS;

  if (!needsRegen && cached) return cached.content;

  try {
    const systemPrompt = SYSTEM_PROMPT_BY_LANGUAGE[language];
    const dataText = formatSummaryForPrompt(summary, patterns, language);
    const content = await callGemini(systemPrompt, [{ role: "user", content: dataText }]);
    await saveActiveInsight(userId, { content, logsCountAtGeneration: logsCount });
    return content;
  } catch {
    // Gemini vaqtincha ishlamasa — eski kesh bo'lsa o'shani, bo'lmasa null
    // qaytariladi (Statistika'ning qolgan qismi baribir ko'rsatiladi).
    return cached?.content ?? null;
  }
}
