// AI Yordamchi — chat + "xotira" + pattern-aniqlash.
//
// Muhim arxitektura qarori: alohida "xotira" saqlash tizimi yo'q. Foydalanuvchi
// haqidagi hamma narsa (onboarding profili, sikl/simptom/kayfiyat tarixi,
// homiladorlik profili) allaqachon strukturaланган holda bazada bor —
// buildUserContext() har safar shu ma'lumotni o'qib, modelga system prompt
// ichida kontekst sifatida beradi. Shu tufayli AI "eslab qoladi": foydalanuvchi
// oldin nima yozgan bo'lsa (cycle_logs orqali), keyingi suhbatda ham ko'rinadi.
//
// Model: uchta provayder qo'llab-quvvatlanadi (admin panelda tanlanadi,
// `ai_provider` sozlamasi — "gemini" | "huawei_maas" | "anthropic"). Birinchi
// ikkitasi OpenAI-mos ("OpenAI compatibility") REST qatlamini ishlatadi — shu
// tufayli so'rov/javob shakli standart OpenAI chat-completions bilan bir xil.
//
// AI-RELIABILITY-01: tanlangan provayder yiqilsa, qolganlari avtomatik
// sinaladi (callActiveAiProvider). Sabab: production diagnostikasida UCHALA
// provayder ham bir vaqtda ishlamayotgani aniqlangan va AI yordamchi
// butunlay o'lik holatda edi — bitta provayderga bog'lanib qolish juda
// mo'rt ekan.
// - Gemini (https://ai.google.dev/gemini-api/docs/openai) — kalit bepul,
//   https://aistudio.google.com/apikey'dan.
// - Huawei Cloud MaaS (ModelArts Studio, https://api-ap-southeast-1.
//   modelarts-maas.com/openai/v1) — GLM/DeepSeek kabi modellarni beradi.
//   GLM modellari standart holda uzoq "ichki fikrlash" (reasoning_content)
//   qiladi — oddiy chat javobi uchun keraksiz token/vaqt sarflaydi, shuning
//   uchun so'rovga `thinking: {type: "disabled"}` qo'shiladi (sinovda:
//   buni yoqib-o'chirib solishtirilgan, o'chirilganda javob sifati bir xil,
//   token sarfi ~5x kam).
// - Anthropic (Claude, https://api.anthropic.com/v1/messages) — OpenAI-mos
//   EMAS, alohida so'rov/javob shakli. Kalit https://console.anthropic.com
//   orqali olinadi va hisobda balans bo'lishi shart (balans tugasa API
//   400 "credit balance is too low" qaytaradi).

import { ApiError } from "./api-utils";
import {
  getCycleSettings,
  getOnboardingProfile,
  getPregnancyProfile,
  getSetting,
  listCycleLogs,
  recordAiUsage,
  setSetting,
} from "./repo";
import { addDays, dictionaries, resolvePregnancyState, tashkentDateStr } from "@mammoai/shared";
import type { ChatMessage, Language, Symptom, SymptomPattern, User } from "@mammoai/shared";

const SETTING_KEY = "gemini_api_key";
// gemini-2.5-flash butunlay eskirdi (Google 404: "no longer available to
// new users") — "-latest" taxallusi doim joriy tavsiya etilgan modelga
// ishora qiladi, shu sabab bu muammo QAYTA takrorlanmasligi kerak.
// AI-QUOTA-01: Gemini bepul tarifida kvota HAR BIR MODEL UCHUN ALOHIDA
// hisoblanadi (`GenerateRequestsPerDayPerProjectPerModel-FreeTier`) va u
// juda kichik — o'lchandi: `gemini-3.8-flash` uchun KUNIGA 20 ta so'rov.
//
// Bitta modelga bog'lanib qolsak, yordamchi kuniga 20 ta xabardan keyin
// butun ilova uchun o'lik bo'ladi — production'da aynan shu ro'y berdi
// (foydalanuvchi "AI ishlamayapti" deb ko'rsatdi, kvota 429 bilan
// tugagan edi).
//
// Kvota modellarga bo'lingani uchun ro'yxat bo'ylab o'tish sig'imni bir
// necha barobar oshiradi. Tartib: eng yangi (sifatliroq) birinchi.
// `-latest` taxallusi birinchi — u doim joriy tavsiya etilganga ishora
// qiladi va model eskirganda ro'yxat o'z-o'zidan yangilanadi.
const GEMINI_MODELS = [
  "gemini-flash-latest",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
];
export type AiProvider = "gemini" | "huawei_maas" | "anthropic";
export const AI_PROVIDERS: AiProvider[] = ["gemini", "huawei_maas", "anthropic"];
const PROVIDER_SETTING_KEY = "ai_provider";
const HUAWEI_KEY_SETTING = "huawei_maas_api_key";
const HUAWEI_MODEL_SETTING = "huawei_maas_model";
const HUAWEI_DEFAULT_MODEL = "glm-5.2";
const HUAWEI_BASE_URL = "https://api-ap-southeast-1.modelarts-maas.com/openai/v1/chat/completions";
const ANTHROPIC_KEY_SETTING = "anthropic_api_key";
const ANTHROPIC_MODEL_SETTING = "anthropic_model";
// Haiku — chat uchun eng arzon va tez model; sifat farqi qisqa, suhbat
// uslubidagi javoblarda sezilmaydi, narx esa bir necha barobar past.
const ANTHROPIC_DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const ANTHROPIC_BASE_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
// AI-RELIABILITY-01: javob byudjeti. Ilgari 1024 edi — bu "o'ylaydigan"
// modellar (gemini-flash-latest, GLM) uchun YETARLI EMAS: model butun
// byudjetni ichki fikrlashga sarflab, `finish_reason: "length"` va
// `completion_tokens: 0` bilan BO'SH javob qaytarardi. Diagnostikada aynan
// shu holat kuzatilgan.
const MAX_TOKENS = 2048;
// O'LCHANGAN (production kalitida, 4 ta ketma-ket sinov): Gemini
// so'rovlarining ~25%i 503 qaytaradi — bu vaqtinchalik va TAKRORIY urinishda
// o'tadi. Bitta urinishda ~25% nosozlik, 3 tada ~1.5%. Nosoz javob tez
// keladi (~2s), ya'ni kutish qimmat emas.
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1200;
const CONTEXT_LOG_LIMIT = 6; // oxirgi N ta kunlik yozuv — system promptga to'liq tafsilot bilan
const PATTERN_WINDOW_DAYS = 90;
const PATTERN_MIN_OCCURRENCES = 3;

export async function getGeminiApiKey(): Promise<string | null> {
  return getSetting(SETTING_KEY);
}

export async function setGeminiApiKey(key: string): Promise<void> {
  await setSetting(SETTING_KEY, key);
}

export function isAiProvider(value: unknown): value is AiProvider {
  return typeof value === "string" && (AI_PROVIDERS as string[]).includes(value);
}

export async function getAiProvider(): Promise<AiProvider> {
  const value = await getSetting(PROVIDER_SETTING_KEY);
  return isAiProvider(value) ? value : "gemini"; // standart — ORQAGA MOSLIK: eski o'rnatishlarda bu sozlama umuman yo'q
}

export async function setAiProvider(provider: AiProvider): Promise<void> {
  await setSetting(PROVIDER_SETTING_KEY, provider);
}

export async function getHuaweiMaasApiKey(): Promise<string | null> {
  return getSetting(HUAWEI_KEY_SETTING);
}

export async function setHuaweiMaasApiKey(key: string): Promise<void> {
  await setSetting(HUAWEI_KEY_SETTING, key);
}

export async function getHuaweiMaasModel(): Promise<string> {
  return (await getSetting(HUAWEI_MODEL_SETTING)) || HUAWEI_DEFAULT_MODEL;
}

export async function setHuaweiMaasModel(model: string): Promise<void> {
  await setSetting(HUAWEI_MODEL_SETTING, model);
}

export async function getAnthropicApiKey(): Promise<string | null> {
  return getSetting(ANTHROPIC_KEY_SETTING);
}

export async function setAnthropicApiKey(key: string): Promise<void> {
  await setSetting(ANTHROPIC_KEY_SETTING, key);
}

export async function getAnthropicModel(): Promise<string> {
  return (await getSetting(ANTHROPIC_MODEL_SETTING)) || ANTHROPIC_DEFAULT_MODEL;
}

export async function setAnthropicModel(model: string): Promise<void> {
  await setSetting(ANTHROPIC_MODEL_SETTING, model);
}

/** Oxirgi ~90 kunlik cycle_logs'dan har bir simptom nechta alohida kunda
 * uchraganini sanaydi. 3+ marta uchragan simptom — "takrorlanuvchi pattern"
 * sifatida qaytariladi. Sof agregatsiya, ML yo'q — tashxis emas, faqat signal. */
export async function detectSymptomPatterns(userId: string): Promise<SymptomPattern[]> {
  const logs = await listCycleLogs(userId, 180);
  // OVERNIGHT-01: avval `new Date(); ...toISOString()` — server UTC vaqtidan
  // kesim sanasini olardi (FIX2-23/DATA-ACCURACY-01 bilan bir xil sinf xato,
  // shu faylda hali topilmagan edi). Toshkent mahalliy 00:00-04:59 oralig'ida
  // kesim sanasi bir kun oldinga siljib, chegaradagi simptom yozuvlarini
  // pattern hisobidan tashlab yuborishi mumkin edi.
  const cutoffStr = addDays(tashkentDateStr(), -PATTERN_WINDOW_DAYS);

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

  // PREG-STATE-01: ilgari shu yerda `pregnancy` qatorining MAVJUDLIGI
  // "homilador" deb qabul qilinardi. Lekin u — tug'ilish sanasi
  // kalkulyatorining kiritmasi, homiladorlik belgisi emas. Natijada AI
  // yordamchi homilador BO'LMAGAN ayollarga (jumladan homiladorlikni
  // rejalashtirayotganlarga) "siz homiladorsiz, 1-hafta" deb aytardi —
  // bu foydalanuvchi tomonidan ushlangan haqiqiy xato.
  const pregnancyState = resolvePregnancyState({
    declaredPregnant: onboarding?.isPregnant ?? false,
    profile: pregnancy,
  });
  if (pregnancyState.status) {
    const { currentWeek, trimester } = pregnancyState.status;
    lines.push(`Hozir homilador — ${currentWeek}-hafta, ${trimester}-trimestr.`);
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

interface OpenAiChatChoice {
  message?: { content?: string };
  finish_reason?: string;
}

interface OpenAiChatResponse {
  choices?: OpenAiChatChoice[];
  // AI-PROVIDER-02: kunlik token sarfini kuzatish uchun — OpenAI-mos
  // provayderlar (Gemini VA Huawei MaaS) shu maydonni qaytaradi.
  usage?: { total_tokens?: number };
  error?: { message?: string };
}

interface AnthropicResponse {
  content?: { type?: string; text?: string }[];
  stop_reason?: string;
  usage?: { input_tokens?: number; output_tokens?: number };
  error?: { message?: string };
}

export type AiHistory = { role: "user" | "assistant"; content: string }[];

/** AI-RELIABILITY-01: provayder O'ZI ishlamayapti (tarmoq uzilishi, 5xx,
 * tugagan kvota/balans, yaroqsiz kalit, bo'sh javob). Bu xato
 * `callActiveAiProvider` uchun signal: shu provayderni tashlab, KEYINGISIGA
 * o'tish kerak. Foydalanuvchining savoliga aloqasi yo'q — shuning uchun
 * hech qachon to'g'ridan-to'g'ri foydalanuvchiga ko'rsatilmaydi. */
class ProviderDownError extends Error {
  constructor(
    readonly provider: AiProvider,
    readonly detail: string
  ) {
    super(`${provider}: ${detail}`);
    this.name = "ProviderDownError";
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** HTTP so'rovini yuboradi va vaqtinchalik xatolarda (429 — kvota bo'yicha
 * cheklov, 5xx — provayder tarafidagi nosozlik) bir marta qayta uradi.
 * Diagnostikada Gemini aynan 503 qaytargan, ya'ni bu holat nazariy emas. */
async function postWithRetry(provider: AiProvider, url: string, init: RequestInit): Promise<Response> {
  let lastStatus = 0;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, init);
    } catch (error) {
      // Tarmoq darajasidagi uzilish — javob umuman kelmadi.
      if (attempt === MAX_ATTEMPTS) throw new ProviderDownError(provider, `tarmoq xatosi: ${String(error)}`);
      await sleep(RETRY_DELAY_MS);
      continue;
    }
    // AI-QUOTA-01: 429 endi QAYTA URINILMAYDI. Ilgari urinilardi, lekin
    // o'lchov ko'rsatdiki bu KUNLIK kvota — bir necha soniyadan keyin
    // qayta urinish befoyda, faqat foydalanuvchini kuttiradi. Chaqiruvchi
    // buni ko'rib boshqa modelga/provayderga o'tadi.
    if (res.status < 500) return res;
    lastStatus = res.status;
    if (attempt === MAX_ATTEMPTS) break;
    await sleep(RETRY_DELAY_MS);
  }
  throw new ProviderDownError(provider, `HTTP ${lastStatus} (${MAX_ATTEMPTS} urinishdan keyin ham)`);
}

/** OpenAI-mos javobni o'qiydi (Gemini va Huawei MaaS bir xil shaklda
 * qaytaradi). Bo'sh javobni ham NOSOZLIK deb hisoblaydi — chunki
 * `finish_reason: "length"` + `completion_tokens: 0` aynan shunday
 * ko'rinadi, va bunda boshqa provayderga o'tish kerak. */
async function readOpenAiCompatible(provider: AiProvider, res: Response): Promise<{ text: string; tokens: number }> {
  const json = (await res.json().catch(() => null)) as OpenAiChatResponse | null;
  if (!res.ok || !json) {
    throw new ProviderDownError(provider, json?.error?.message ?? `HTTP ${res.status}`);
  }
  const choice = json.choices?.[0];
  const text = choice?.message?.content?.trim();
  if (!text) {
    throw new ProviderDownError(provider, `bo'sh javob (finish_reason: ${choice?.finish_reason ?? "noma'lum"})`);
  }
  return { text, tokens: json.usage?.total_tokens ?? 0 };
}

// Gemini'ning OpenAI-mos endpointi standart OpenAI chat-completions shaklida
// ishlaydi: alohida top-level `system` maydon o'rniga `messages` massivi
// ichida "system" rolli birinchi element beriladi, javob esa
// `choices[0].message.content`'da qaytadi (Anthropic'ning `content[].text`
// blok-massividan farqli).
// export qilingan — server/active-insights.ts (roadmap: "AI chatbotni to'liq
// faol tahlil qiladigan qilish") xuddi shu chaqiruv infratuzilmasini
// qayta ishlatadi, faqat boshqa system prompt/kontekst bilan (chat javobi
// emas — foydalanuvchi so'ramasdan proaktiv tahlil).
export async function callGemini(systemPrompt: string, history: AiHistory): Promise<string> {
  const apiKey = await getGeminiApiKey();
  if (!apiKey) throw new ProviderDownError("gemini", "API kaliti sozlanmagan");

  const failures: string[] = [];
  for (const model of GEMINI_MODELS) {
    try {
      return await callGeminiModel(apiKey, model, systemPrompt, history);
    } catch (error) {
      if (!(error instanceof ProviderDownError)) throw error;
      failures.push(`${model}: ${error.detail}`);
    }
  }
  throw new ProviderDownError("gemini", `barcha modellar ishlamadi — ${failures.join(" | ")}`);
}

async function callGeminiModel(
  apiKey: string,
  model: string,
  systemPrompt: string,
  history: AiHistory
): Promise<string> {
  const res = await postWithRetry("gemini", "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      max_tokens: MAX_TOKENS,
      // AI-RELIABILITY-01: `gemini-flash-latest` — "o'ylaydigan" model.
      // Standart holda u javob byudjetining katta qismini ichki fikrlashga
      // sarflaydi va oddiy suhbat savolida BO'SH javob qaytarishi mumkin.
      // "none" — fikrlashni butunlay o'chiradi (Huawei'dagi
      // `thinking: {type: "disabled"}`ning Gemini'dagi muqobili).
      reasoning_effort: "none",
      messages: [{ role: "system", content: systemPrompt }, ...history],
    }),
  });

  const { text, tokens } = await readOpenAiCompatible("gemini", res);
  if (tokens) await recordAiUsage("gemini", tokens).catch(() => {}); // hisoblash muvaffaqiyatsiz bo'lsa ham asosiy javob buzilmasin
  return text;
}

/** Huawei Cloud MaaS (ModelArts Studio) — OpenAI-mos endpoint, xuddi
 * `callGemini` bilan bir xil so'rov/javob shakli. Javobda GLM modellarida
 * qo'shimcha `reasoning_content` maydoni bo'lishi mumkin — shuning uchun
 * ANIQ `content`ni o'qiymiz, `reasoning_content`ni emas. */
export async function callHuaweiMaas(systemPrompt: string, history: AiHistory): Promise<string> {
  const apiKey = await getHuaweiMaasApiKey();
  if (!apiKey) throw new ProviderDownError("huawei_maas", "API kaliti sozlanmagan");
  const model = await getHuaweiMaasModel();

  const res = await postWithRetry("huawei_maas", HUAWEI_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      max_tokens: MAX_TOKENS,
      // GLM modellari standart holda uzoq ichki fikrlash qiladi — chat
      // javobi uchun keraksiz, o'chiramiz (boshqa provayderlar bu maydonni
      // e'tiborsiz qoldiradi, xato bermaydi).
      thinking: { type: "disabled" },
      messages: [{ role: "system", content: systemPrompt }, ...history],
    }),
  });

  const { text, tokens } = await readOpenAiCompatible("huawei_maas", res);
  if (tokens) await recordAiUsage("huawei_maas", tokens).catch(() => {});
  return text;
}

/** Anthropic (Claude) — OpenAI-mos EMAS: system prompt alohida top-level
 * maydon, autentifikatsiya `x-api-key` sarlavhasi orqali (Bearer emas),
 * javob esa `content[]` blok-massivida keladi. Shu sabab yuqoridagi
 * umumiy o'quvchini ishlatolmaydi. */
export async function callAnthropic(systemPrompt: string, history: AiHistory): Promise<string> {
  const apiKey = await getAnthropicApiKey();
  if (!apiKey) throw new ProviderDownError("anthropic", "API kaliti sozlanmagan");
  const model = await getAnthropicModel();

  const res = await postWithRetry("anthropic", ANTHROPIC_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: history,
    }),
  });

  const json = (await res.json().catch(() => null)) as AnthropicResponse | null;
  if (!res.ok || !json) {
    throw new ProviderDownError("anthropic", json?.error?.message ?? `HTTP ${res.status}`);
  }
  const text = (json.content ?? [])
    .filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("")
    .trim();
  if (!text) throw new ProviderDownError("anthropic", `bo'sh javob (stop_reason: ${json.stop_reason ?? "noma'lum"})`);

  const tokens = (json.usage?.input_tokens ?? 0) + (json.usage?.output_tokens ?? 0);
  if (tokens) await recordAiUsage("anthropic", tokens).catch(() => {});
  return text;
}

const PROVIDER_CALLERS: Record<AiProvider, (systemPrompt: string, history: AiHistory) => Promise<string>> = {
  gemini: callGemini,
  huawei_maas: callHuaweiMaas,
  anthropic: callAnthropic,
};

/** Joriy tanlangan provayder (admin panelda sozlanadi) orqali chaqiradi —
 * `generateAssistantReply` VA `active-insights.ts` ikkalasi ham shu orqali
 * ishlaydi, provayder almashtirilganda ikkalasi ham birga o'zgaradi.
 *
 * AI-RELIABILITY-01: ilgari BITTA provayder chaqirilardi va u yiqilsa AI
 * butunlay ishlamay qolardi — production diagnostikasida aynan shu holat
 * topilgan (Gemini 503, Huawei 401, Anthropic balans tugagan). Endi tanlangan
 * provayder ishlamasa, kaliti bor QOLGAN provayderlar navbat bilan
 * sinaladi. Faqat HAMMASI yiqilgandagina xato qaytariladi. */
export async function callActiveAiProvider(systemPrompt: string, history: AiHistory): Promise<string> {
  const active = await getAiProvider();
  const order: AiProvider[] = [active, ...AI_PROVIDERS.filter((p) => p !== active)];

  const failures: string[] = [];
  for (const provider of order) {
    try {
      const text = await PROVIDER_CALLERS[provider](systemPrompt, history);
      if (provider !== active) {
        // Zaxira ishladi — bu vaqtinchalik holat, admin buni bilishi kerak.
        console.warn(`AI: "${active}" ishlamadi, zaxira "${provider}" javob berdi. Sabablar: ${failures.join(" | ")}`);
      }
      return text;
    } catch (error) {
      if (!(error instanceof ProviderDownError)) throw error; // kutilmagan xato — yashirmaymiz
      failures.push(error.message);
    }
  }

  console.error(`AI: HAMMA provayder ishlamadi. ${failures.join(" | ")}`);
  // AI-RELIABILITY-01: ilgari bu yerda "Savolingizni biroz boshqacha yozib
  // qayta urinib ko'ring" deyilardi — ya'ni BIZNING nosozligimiz uchun
  // foydalanuvchi o'z savolida aybdor qilib ko'rsatilardi. Endi halol:
  // muammo bizda, va uning xabari yo'qolmadi (saqlanib qoldi).
  throw new ApiError(
    503,
    "AI yordamchi hozir vaqtinchalik ishlamayapti — bu sizning savolingizda emas, bizning tarafimizdagi nosozlik. Biroz keyinroq qayta urinib ko'ring.",
    "ai_unavailable"
  );
}

/** Admin diagnostikasi uchun: har bir provayderni ALOHIDA sinab ko'radi va
 * natijani qaytaradi. Hech narsani o'zgartirmaydi — faqat o'qiydi. */
export async function probeAiProviders(): Promise<{ provider: AiProvider; ok: boolean; detail: string; ms: number }[]> {
  const results: { provider: AiProvider; ok: boolean; detail: string; ms: number }[] = [];
  for (const provider of AI_PROVIDERS) {
    const startedAt = Date.now();
    try {
      const text = await PROVIDER_CALLERS[provider]("Siz test rejimidasiz. Faqat bitta so'z bilan javob bering.", [
        { role: "user", content: "Salom" },
      ]);
      results.push({ provider, ok: true, detail: text.slice(0, 80), ms: Date.now() - startedAt });
    } catch (error) {
      const detail = error instanceof ProviderDownError ? error.detail : String(error);
      results.push({ provider, ok: false, detail, ms: Date.now() - startedAt });
    }
  }
  return results;
}

/** Foydalanuvchi xabariga AI javobini tayyorlaydi: kontekst+pattern quradi,
 * joriy provayderni chaqiradi. Chaqiruvchi (route) xabarlarni saqlash bilan
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
  const reply = await callActiveAiProvider(
    systemPrompt,
    history.map((m) => ({ role: m.role, content: m.content }))
  );
  return { reply, patterns };
}
