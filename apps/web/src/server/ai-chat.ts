// AI Yordamchi — chat + "xotira" + pattern-aniqlash.
//
// Muhim arxitektura qarori: alohida "xotira" saqlash tizimi yo'q. Foydalanuvchi
// haqidagi hamma narsa (onboarding profili, sikl/simptom/kayfiyat tarixi,
// homiladorlik profili) allaqachon strukturaланган holda bazada bor —
// buildUserContext() har safar shu ma'lumotni o'qib, modelga system prompt
// ichida kontekst sifatida beradi. Shu tufayli AI "eslab qoladi": foydalanuvchi
// oldin nima yozgan bo'lsa (cycle_logs orqali), keyingi suhbatda ham ko'rinadi.
//
// Model: Google Gemini (bepul reja — foydalanuvchi so'rovi: Anthropic hisobida
// kredit tugagach, pullik emas, bepul limitli providerga o'tildi). Gemini'ning
// OpenAI-mos ("OpenAI compatibility") REST qatlami ishlatiladi
// (https://ai.google.dev/gemini-api/docs/openai) — shu tufayli so'rov/javob
// shakli standart OpenAI chat-completions bilan bir xil, providerni yana
// almashtirish kerak bo'lsa ham minimal o'zgarish bilan bo'ladi. Kalitni
// https://aistudio.google.com/apikey'dan bepul olish mumkin.

import { ApiError } from "./api-utils";
import {
  getCycleSettings,
  getOnboardingProfile,
  getPregnancyProfile,
  getSetting,
  listCycleLogs,
  setSetting,
} from "./repo";
import { dictionaries, getPregnancyStatus } from "@mammoai/shared";
import type { ChatMessage, Language, Symptom, SymptomPattern, User } from "@mammoai/shared";

const SETTING_KEY = "gemini_api_key";
const GEMINI_MODEL = "gemini-2.5-flash";
const CONTEXT_LOG_LIMIT = 6; // oxirgi N ta kunlik yozuv — system promptga to'liq tafsilot bilan
const PATTERN_WINDOW_DAYS = 90;
const PATTERN_MIN_OCCURRENCES = 3;

export async function getGeminiApiKey(): Promise<string | null> {
  return getSetting(SETTING_KEY);
}

export async function setGeminiApiKey(key: string): Promise<void> {
  await setSetting(SETTING_KEY, key);
}

/** Oxirgi ~90 kunlik cycle_logs'dan har bir simptom nechta alohida kunda
 * uchraganini sanaydi. 3+ marta uchragan simptom — "takrorlanuvchi pattern"
 * sifatida qaytariladi. Sof agregatsiya, ML yo'q — tashxis emas, faqat signal. */
export async function detectSymptomPatterns(userId: string): Promise<SymptomPattern[]> {
  const logs = await listCycleLogs(userId, 180);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - PATTERN_WINDOW_DAYS);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const counts = new Map<Symptom, number>();
  for (const log of logs) {
    if (log.date < cutoffStr) continue;
    for (const symptom of log.symptoms) {
      counts.set(symptom, (counts.get(symptom) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .filter(([, count]) => count >= PATTERN_MIN_OCCURRENCES)
    .sort((a, b) => b[1] - a[1])
    .map(([symptom, occurrences]) => ({ symptom, occurrences }));
}

/** Foydalanuvchining sog'liq tarixidan matnli kontekst blogi yig'adi —
 * bu AI'ning "xotirasi": onboarding profili, so'nggi kunlik yozuvlar,
 * homiladorlik holati (bo'lsa). */
async function buildUserContext(userId: string, language: Language): Promise<string> {
  const dict = dictionaries[language];
  const [onboarding, cycleSettings, logs, pregnancy] = await Promise.all([
    getOnboardingProfile(userId),
    getCycleSettings(userId),
    listCycleLogs(userId, CONTEXT_LOG_LIMIT),
    getPregnancyProfile(userId),
  ]);

  const lines: string[] = [];

  if (onboarding) {
    lines.push(`Yosh: ${onboarding.age}`);
    if (onboarding.typicalSymptoms.length) {
      lines.push(`Odatiy simptomlari: ${onboarding.typicalSymptoms.map((s) => dict.cycle.symptoms[s]).join(", ")}`);
    }
    if (onboarding.healthConditions.length) {
      lines.push(`Ma'lum sog'liq holatlari: ${onboarding.healthConditions.join(", ")}`);
    }
  }

  if (pregnancy) {
    const status = getPregnancyStatus(pregnancy);
    if (status) lines.push(`Hozir homilador — ${status.currentWeek}-hafta, ${status.trimester}-trimestr.`);
  } else if (cycleSettings.lastPeriodStart) {
    lines.push(`Oxirgi hayz boshlanishi: ${cycleSettings.lastPeriodStart} (o'rtacha sikl ${cycleSettings.averageCycleLength} kun).`);
  }

  if (logs.length) {
    lines.push("So'nggi kunlik yozuvlar (yangidan eskiga):");
    for (const log of logs) {
      const parts: string[] = [log.date];
      if (log.flow) parts.push(`oqim: ${dict.cycle.flowLevels[log.flow]}`);
      if (log.mood) parts.push(`kayfiyat: ${dict.cycle.moods[log.mood]}`);
      if (log.symptoms.length) parts.push(`simptomlar: ${log.symptoms.map((s) => dict.cycle.symptoms[s]).join(", ")}`);
      if (parts.length > 1) lines.push(`- ${parts.join(", ")}`);
    }
  }

  return lines.length ? lines.join("\n") : "Foydalanuvchi haqida hali kunlik ma'lumot yo'q.";
}

const SYSTEM_PROMPT_BY_LANGUAGE: Record<Language, string> = {
  uz: "Siz MammoAI ilovasidagi iliq, g'amxo'r AI yordamchisiz. Foydalanuvchi bilan o'zbek tilida, samimiy va qo'llab-quvvatlovchi ohangda gaplashing.",
  "uz-cyrl": "Сиз MammoAI иловасидаги илиқ, ғамхўр AI ёрдамчисиз. Фойдаланувчи билан ўзбек тилида, самимий ва қўллаб-қувватловчи оҳангда гаплашинг.",
  ru: "Вы тёплый, заботливый AI-помощник в приложении MammoAI. Общайтесь с пользователем на русском языке, искренне и с поддержкой.",
  en: "You are a warm, caring AI companion inside the MammoAI app. Talk to the user in English, with genuine warmth and support.",
};

const DIAGNOSIS_RULE_BY_LANGUAGE: Record<Language, string> = {
  uz: "HECH QACHON tashxis qo'ymang (masalan \"sizda endometrioz bor\" demang). Agar takrorlanuvchi pattern topilsa, buni shunchaki qayd eting va shifokorga murojaat qilishni tabiiy tarzda tavsiya qiling — qat'iy xulosa emas, ehtiyotkor signal sifatida.",
  "uz-cyrl": "ҲЕЧ ҚАЧОН ташхис қўйманг. Такрорланувчи паттерн топилса, буни қайд этиб, шифокорга мурожаат қилишни табиий тарзда тавсия қилинг.",
  ru: "НИКОГДА не ставьте диагноз (например, не говорите «у вас эндометриоз»). Если обнаружен повторяющийся паттерн, просто отметьте это и мягко порекомендуйте обратиться к врачу — как осторожный сигнал, а не однозначный вывод.",
  en: "NEVER diagnose (e.g. never say \"you have endometriosis\"). If a recurring pattern is found, simply note it and naturally suggest consulting a doctor — as a gentle signal, not a firm conclusion.",
};

const PATTERN_INTRO_BY_LANGUAGE: Record<Language, string> = {
  uz: "Foydalanuvchida quyidagi takrorlanuvchi simptomlar aniqlandi (oxirgi 90 kunda 3+ marta):",
  "uz-cyrl": "Фойдаланувчида қуйидаги такрорланувчи симптомлар аниқланди (охирги 90 кунда 3+ марта):",
  ru: "У пользователя обнаружены следующие повторяющиеся симптомы (3+ раза за последние 90 дней):",
  en: "The following recurring symptoms were detected for this user (3+ times in the last 90 days):",
};

async function getSystemPrompt(user: User, context: string, patterns: SymptomPattern[]): Promise<string> {
  const language = user.language;
  const dict = dictionaries[language];
  const parts = [
    SYSTEM_PROMPT_BY_LANGUAGE[language],
    DIAGNOSIS_RULE_BY_LANGUAGE[language],
    "Javoblaringiz o'rtacha uzunlikda bo'lsin — uzun matn devori emas, tabiiy suhbat uslubida.",
    `Foydalanuvchi haqida ma'lumot (uning "xotirasi"):\n${context}`,
  ];
  if (patterns.length) {
    const list = patterns.map((p) => `${dict.cycle.symptoms[p.symptom]} (${p.occurrences} marta)`).join(", ");
    parts.push(`${PATTERN_INTRO_BY_LANGUAGE[language]} ${list}`);
  }
  return parts.join("\n\n");
}

interface GeminiChatChoice {
  message?: { content?: string };
}

interface GeminiChatResponse {
  choices?: GeminiChatChoice[];
}

// Gemini'ning OpenAI-mos endpointi standart OpenAI chat-completions shaklida
// ishlaydi: alohida top-level `system` maydon o'rniga `messages` massivi
// ichida "system" rolli birinchi element beriladi, javob esa
// `choices[0].message.content`'da qaytadi (Anthropic'ning `content[].text`
// blok-massividan farqli).
// export qilingan — server/active-insights.ts (roadmap: "AI chatbotni to'liq
// faol tahlil qiladigan qilish") xuddi shu Gemini chaqiruv infratuzilmasini
// qayta ishlatadi, faqat boshqa system prompt/kontekst bilan (chat javobi
// emas — foydalanuvchi so'ramasdan proaktiv tahlil).
export async function callGemini(systemPrompt: string, history: { role: "user" | "assistant"; content: string }[]): Promise<string> {
  const apiKey = await getGeminiApiKey();
  if (!apiKey) throw new ApiError(500, "AI yordamchi hali sozlanmagan — admin panelda Gemini API kalitini qo'shing");

  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GEMINI_MODEL,
      max_tokens: 1024,
      messages: [{ role: "system", content: systemPrompt }, ...history],
    }),
  });

  const json = (await res.json().catch(() => null)) as (GeminiChatResponse & { error?: { message?: string } }) | null;
  if (!res.ok || !json) {
    throw new ApiError(502, json?.error?.message ?? "AI yordamchidan javob olishda xatolik yuz berdi");
  }
  const text = json.choices?.[0]?.message?.content;
  if (!text) throw new ApiError(502, "AI yordamchidan bo'sh javob keldi");
  return text;
}

/** Foydalanuvchi xabariga AI javobini tayyorlaydi: kontekst+pattern quradi,
 * Gemini'ni chaqiradi. Chaqiruvchi (route) xabarlarni saqlash bilan
 * shug'ullanadi — bu funksiya sof "javob hisoblash" qatlami. */
export async function generateAssistantReply(
  user: User,
  history: ChatMessage[]
): Promise<{ reply: string; patterns: SymptomPattern[] }> {
  const [context, patterns] = await Promise.all([
    buildUserContext(user.id, user.language),
    detectSymptomPatterns(user.id),
  ]);
  const systemPrompt = await getSystemPrompt(user, context, patterns);
  const reply = await callGemini(
    systemPrompt,
    history.map((m) => ({ role: m.role, content: m.content }))
  );
  return { reply, patterns };
}
