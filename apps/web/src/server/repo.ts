import { randomUUID } from "node:crypto";
import { sql, ensureSchema } from "./db";
import { ApiError } from "./api-utils";
import type { CheckinResponse } from "@mammoai/shared";
import { PET_IDS, type PetChoice } from "@mammoai/shared";
import type {
  ChronicCondition,
  CommunityFeedScope,
  AnalyticsEventInput,
  AnalyticsSummary,
  AnalyticsUserSummary,
  AppNotification,
  Article,
  ArticleCategory,
  BloodType,
  ChecklistItem,
  ChecklistItemType,
  Clinic,
  BlockedUserEntry,
  CommunityComment,
  CommunityPost,
  CommunityReportAdmin,
  CommunityReportReason,
  CommunityReportTargetType,
  ChatMessage,
  CommunityStats,
  CommunityTag,
  CycleLog,
  FeedbackResponse,
  FeedbackSubmission,
  FeedbackTrigger,
  CycleSettings,
  FlowLevel,
  HealthCondition,
  HeardAboutUs,
  IllustrationSlotKey,
  Language,
  Mood,
  OnboardingProfile,
  PartnerChatMessage,
  PartnerShareSettings,
  PartnerStatusResponse,
  PeriodAttitude,
  PregnancyProfile,
  PregnancyVisitLog,
  PregnancyVitalLog,
  PregnancyWeekContent,
  VitalType,
  ReferralAction,
  RiskQuizAnswers,
  RiskQuizResult,
  RiskLevel,
  Subscription,
  Symptom,
  TractionSummary,
  User,
  WellnessLog,
} from "@mammoai/shared";
import {
  CHECKLIST_ITEM_IS_FREE,
  DEFAULT_CYCLE_LENGTH,
  DEFAULT_PERIOD_LENGTH,
  DEFAULT_SLOT_ASSIGNMENTS,
  SLOT_KEYS,
  deriveAdaptiveCycleSettings,
  getPregnancyStatus,
  tashkentDateStr,
} from "@mammoai/shared";

const now = () => new Date().toISOString();
// DATA-ACCURACY-04: avval `now().slice(0, 10)` — bu server UTC vaqtidan
// kalendar sanasini olardi. Vercel funksiyalarida TZ o'rnatilmagani uchun
// (standart UTC) bu Toshkent mahalliy 00:00-04:59 oralig'ida (UTC 19:00-
// 23:59, oldingi kun) haqiqiy mahalliy kundan BIR KUN ORQADA qolardi — xuddi
// FIX2-23/CYCLE-ALGO'da allaqachon tuzatilgan sinf xato, lekin bu yerda
// (pregnancy_kicks, wellness_logs suv/kaloriya, chat_daily_usage, checklist
// "muddati o'tgan" belgisi va boshqa `today()` chaqiruvchilar) hech qachon
// tuzatilmagan edi. Amaliy ta'sir: shu oraliqda suv/kaloriya qo'shsa,
// KECHAGI kunga yozilardi (bugungi jami 0 ko'rsatilardi yoki kechagi
// qiymatga qo'shilib ketardi). `now()`ning o'zi (to'liq ISO vaqt belgisi,
// `created_at`/`updated_at` uchun) ATAYLAB o'zgartirilmagan — UTC saqlash
// bu yerda to'g'ri, faqat undan olingan "kalendar KUNI" noto'g'ri edi.
const today = () => tashkentDateStr();

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

interface UserRow {
  id: string;
  phone: string | null;
  email: string | null;
  name: string | null;
  region: string | null;
  language: Language;
  font_scale: "normal" | "large";
  theme: "light" | "dark" | "system";
  notifications_enabled: boolean;
  token_version: number;
  pet: string | null;
  created_at: string;
  avatar_url: string | null;
  is_blocked: boolean;
  last_location_lat: number | null;
  last_location_lng: number | null;
  last_location_at: string | null;
}

function userFromRow(row: UserRow): User {
  return {
    id: row.id,
    phone: row.phone,
    email: row.email,
    name: row.name,
    region: row.region,
    language: row.language,
    fontScale: row.font_scale,
    theme: row.theme,
    notificationsEnabled: !!row.notifications_enabled,
    createdAt: row.created_at,
    avatarUrl: row.avatar_url,
    isBlocked: !!row.is_blocked,
    lastLocationLat: row.last_location_lat,
    lastLocationLng: row.last_location_lng,
    lastLocationAt: row.last_location_at,
    // PET-02: bazadagi xom matnga ishonmaymiz (eski/qo'lda o'zgartirilgan
    // qiymatlar bo'lishi mumkin) — faqat tanilgan qiymat yoki "none" o'tadi.
    // `null` = hali tanlanmagan → mijoz tomonida standart mushukcha.
    pet: row.pet === "none" || PET_IDS.includes(row.pet as never) ? (row.pet as PetChoice) : null,
  };
}

export async function createAnonymousUser(language: Language): Promise<{ user: User; tokenVersion: number }> {
  await ensureSchema();
  const id = randomUUID();
  const createdAt = now();
  await sql`INSERT INTO users (id, language, created_at) VALUES (${id}, ${language}, ${createdAt})`;
  return {
    user: {
      id,
      phone: null,
      email: null,
      name: null,
      region: null,
      language,
      fontScale: "normal",
      theme: "system",
      notificationsEnabled: true,
      createdAt,
      avatarUrl: null,
      isBlocked: false,
      lastLocationLat: null,
      lastLocationLng: null,
      lastLocationAt: null,
      pet: null,
    },
    tokenVersion: 0,
  };
}

export async function findUserByIdentifier(identifier: string): Promise<(User & { tokenVersion: number }) | null> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM users WHERE phone = ${identifier}`) as unknown as UserRow[];
  const row = rows[0];
  return row ? { ...userFromRow(row), tokenVersion: row.token_version } : null;
}

/**
 * Yangi akkaunt — faqat telefon raqam bilan, SMS/parolsiz (App.pdf §2: "SMS
 * kelishi shart emas"). Xavfsizlik pasayadi (identifikator bilishning o'zi
 * kirish uchun yetarli), lekin bu ongli tanlangan tezkor-ro'yxatdan o'tish yechimi.
 */
export async function createUserWithIdentifier(
  identifier: string,
  language: Language
): Promise<{ user: User; tokenVersion: number }> {
  await ensureSchema();
  const id = randomUUID();
  const createdAt = now();
  const phone = identifier;
  await sql`INSERT INTO users (id, phone, language, created_at) VALUES (${id}, ${phone}, ${language}, ${createdAt})`;
  return {
    user: {
      id,
      phone,
      email: null,
      name: null,
      region: null,
      language,
      fontScale: "normal",
      theme: "system",
      notificationsEnabled: true,
      createdAt,
      avatarUrl: null,
      isBlocked: false,
      lastLocationLat: null,
      lastLocationLng: null,
      lastLocationAt: null,
      pet: null,
    },
    tokenVersion: 0,
  };
}

/**
 * DEV-LOGIN uchun: FAQAT `is_test_account` bayrog'i qo'yilgan akkauntni
 * qaytaradi. Ataylab alohida funksiya — `findUserByIdentifier` ni
 * ishlatib, keyin bayroqni tekshirish mumkin emas edi, chunki bayroq
 * ommaviy `User` turida yo'q (va uni faqat shu bitta dev-yo'l uchun
 * butun ilova bo'ylab ochish noto'g'ri bo'lardi).
 */
export async function findTestAccountByPhone(phone: string): Promise<{ id: string; tokenVersion: number } | null> {
  await ensureSchema();
  const rows = (await sql`
    SELECT id, token_version FROM users WHERE phone = ${phone} AND is_test_account = TRUE
  `) as unknown as { id: string; token_version: number }[];
  const row = rows[0];
  return row ? { id: row.id, tokenVersion: row.token_version } : null;
}

export async function getUserById(id: string): Promise<(User & { tokenVersion: number }) | null> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM users WHERE id = ${id}`) as unknown as UserRow[];
  const row = rows[0];
  if (!row) return null;
  return { ...userFromRow(row), tokenVersion: row.token_version };
}

const USER_PATCH_COLUMNS: Record<
  keyof Pick<
    User,
    | "name"
    | "phone"
    | "language"
    | "fontScale"
    | "theme"
    | "notificationsEnabled"
    | "avatarUrl"
    | "isBlocked"
    | "lastLocationLat"
    | "lastLocationLng"
    | "lastLocationAt"
    | "pet"
  >,
  string
> = {
  name: "name",
  phone: "phone",
  pet: "pet",
  language: "language",
  fontScale: "font_scale",
  theme: "theme",
  notificationsEnabled: "notifications_enabled",
  avatarUrl: "avatar_url",
  isBlocked: "is_blocked",
  lastLocationLat: "last_location_lat",
  lastLocationLng: "last_location_lng",
  lastLocationAt: "last_location_at",
};

export async function updateUser(
  id: string,
  patch: Partial<
    Pick<
      User,
      | "name"
      | "phone"
      | "language"
      | "fontScale"
      | "theme"
      | "notificationsEnabled"
      | "avatarUrl"
      | "isBlocked"
      | "lastLocationLat"
      | "lastLocationLng"
      | "lastLocationAt"
      | "pet"
    >
  >
): Promise<User> {
  await ensureSchema();

  // FIX-10: ilgari BUTUN qatorni o'qib, JS ichida merge qilib, keyin HAMMA
  // ustunni qayta yozardi — ikkita parallel PATCH (masalan bir vaqtda
  // ismni va tilni o'zgartirish) orasidan biri ikkinchisining o'zgarishini
  // "eskirgan" holat bilan ustidan bosib yozib yuborishi mumkin edi ("lost
  // update"). Endi faqat `patch`da HAQIQATAN kelgan ustunlar atomik SET
  // qilinadi — teginilmagan ustunlarga hech qanday yozuv yubormaymiz.
  const presentKeys = (Object.keys(patch) as (keyof typeof USER_PATCH_COLUMNS)[]).filter((key) => key in USER_PATCH_COLUMNS);
  if (presentKeys.length > 0) {
    const dbRow: Record<string, unknown> = {};
    const dbColumns = presentKeys.map((key) => {
      const column = USER_PATCH_COLUMNS[key];
      dbRow[column] = patch[key];
      return column;
    });
    await sql`UPDATE users SET ${sql(dbRow, ...dbColumns)} WHERE id = ${id}`;
  }

  const updated = await getUserById(id);
  if (!updated) throw new Error("Foydalanuvchi topilmadi");
  return updated;
}

/** Akkaunt va unga tegishli BARCHA ma'lumotlarni butunlay o'chiradi (Play Store
 * "hisobni o'chirish" talabi — App.pdf'dan tashqari). Barcha bog'liq jadvallar
 * `users(id)`ga `ON DELETE CASCADE` bilan bog'langan (db.ts), shuning uchun bitta
 * qatorni o'chirish tsikl yozuvlari, hamkorlik, jamiyat postlari va h.k.ni ham
 * avtomatik olib tashlaydi. Qaytarib bo'lmaydigan amal.
 */
/**
 * PRIV-02 — foydalanuvchining barcha ma'lumotini bitta obyektga yig'adi
 * (yuklab olish uchun). Faqat O'QIYDI, hech narsani o'zgartirmaydi.
 *
 * Nima KIRMAYDI va nega:
 *  • parol/token hash'lari va `token_version` — bular xavfsizlik siri, ularni
 *    eksportga qo'shish foydalanuvchiga hech narsa bermaydi, lekin fayl
 *    o'g'irlansa zarar yetkazadi;
 *  • rate-limit jadvallari — texnik ma'lumot, foydalanuvchiga tegishli emas;
 *  • jamiyatdagi BOSHQA odamlarning postlari/izohlari — ular boshqa
 *    foydalanuvchilarning ma'lumoti (o'zining postlari kiradi).
 *
 * Yangi jadval qo'shilganda shu funksiyani ham yangilash kerak — aks holda
 * eksport asta-sekin to'liqsiz bo'lib qoladi.
 */
export async function exportUserData(userId: string): Promise<Record<string, unknown>> {
  await ensureSchema();

  const q = async (label: string, rows: Promise<unknown>) => [label, await rows] as const;

  const parts = await Promise.all([
    q("profil", sql`SELECT id, phone, email, name, region, language, font_scale, theme,
                           notifications_enabled, created_at, avatar_url, pet
                    FROM users WHERE id = ${userId}`),
    q("onboarding", sql`SELECT * FROM onboarding_profiles WHERE user_id = ${userId}`),
    q("sikl_sozlamalari", sql`SELECT * FROM cycle_settings WHERE user_id = ${userId}`),
    q("sikl_yozuvlari", sql`SELECT * FROM cycle_logs WHERE user_id = ${userId} ORDER BY date`),
    q("kunlik_checkin", sql`SELECT * FROM checkin_answers WHERE user_id = ${userId} ORDER BY date`),
    q("farovonlik", sql`SELECT * FROM wellness_logs WHERE user_id = ${userId} ORDER BY date`),
    q("homiladorlik_profili", sql`SELECT * FROM pregnancy_profiles WHERE user_id = ${userId}`),
    q("homiladorlik_tashriflari", sql`SELECT * FROM pregnancy_visits WHERE user_id = ${userId}`),
    q("homiladorlik_olchovlari", sql`SELECT * FROM pregnancy_vitals WHERE user_id = ${userId}`),
    q("homiladorlik_tepishlari", sql`SELECT * FROM pregnancy_kicks WHERE user_id = ${userId}`),
    q("tekshiruv_royxati", sql`SELECT * FROM checklist_items WHERE user_id = ${userId}`),
    q("xavf_testi", sql`SELECT * FROM risk_quiz_results WHERE user_id = ${userId}`),
    q("mening_postlarim", sql`SELECT * FROM community_posts WHERE user_id = ${userId}`),
    q("mening_izohlarim", sql`SELECT * FROM community_comments WHERE user_id = ${userId}`),
    q("yordamchi_suhbati", sql`SELECT * FROM chat_messages WHERE user_id = ${userId} ORDER BY created_at`),
    q("bildirishnomalar", sql`SELECT * FROM notifications WHERE user_id = ${userId}`),
    q("obuna", sql`SELECT * FROM subscriptions WHERE user_id = ${userId}`),
    q("fikrlarim", sql`SELECT * FROM feedback_responses WHERE user_id = ${userId}`),
  ]);

  return {
    _haqida: {
      izoh: "MammoAI — sizning shaxsiy ma'lumotlaringiz. Bu fayl faqat sizga tegishli.",
      yaratilgan: now(),
      format: "JSON",
    },
    ...Object.fromEntries(parts),
  };
}

export async function deleteUser(id: string): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM users WHERE id = ${id}`;
}

// ---------------------------------------------------------------------------
// Umumiy sozlamalar (kalit-qiymat) — .env'ga bog'lanmasdan, admin panel orqali
// ishlab chiqarishda ham o'zgartirsa bo'ladigan sirlar uchun.
// ---------------------------------------------------------------------------

export async function getSetting(key: string): Promise<string | null> {
  await ensureSchema();
  const rows = (await sql`SELECT value FROM app_settings WHERE key = ${key}`) as unknown as { value: string | null }[];
  return rows[0]?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await ensureSchema();
  await sql`
    INSERT INTO app_settings (key, value, updated_at) VALUES (${key}, ${value}, ${now()})
    ON CONFLICT (key) DO UPDATE SET value = ${value}, updated_at = ${now()}
  `;
}

/** `getSetting` + qachon yozilgani — YANDEX-METRIKA-03: shu `updated_at`ni
 * TTL (eskirish) hisoblash uchun ishlatib, `app_settings`ning o'zi umumiy
 * kesh sifatida qayta ishlatiladi (alohida kesh jadvali qurilmaydi). */
export async function getSettingWithUpdatedAt(key: string): Promise<{ value: string; updatedAt: string } | null> {
  await ensureSchema();
  const rows = (await sql`SELECT value, updated_at FROM app_settings WHERE key = ${key}`) as unknown as {
    value: string | null;
    updated_at: string;
  }[];
  const row = rows[0];
  if (!row || row.value === null) return null;
  return { value: row.value, updatedAt: row.updated_at };
}

// ---------------------------------------------------------------------------
// AI-PROVIDER-02: kunlik token sarfini kuzatish (Gemini/Huawei MaaS) — FAQAT
// bizning o'z hisobimiz (har muvaffaqiyatli chaqiruvdan keyin qo'shiladi),
// provayderning haqiqiy jonli kvota-qoldig'i EMAS (ochiq API yo'q).
// ---------------------------------------------------------------------------

export async function recordAiUsage(provider: string, tokens: number): Promise<void> {
  await ensureSchema();
  const nowStr = now();
  await sql`
    INSERT INTO ai_usage_daily (provider, day, total_tokens, request_count, updated_at)
    VALUES (${provider}, (now() AT TIME ZONE 'Asia/Tashkent')::date, ${tokens}, 1, ${nowStr})
    ON CONFLICT (provider, day) DO UPDATE SET
      total_tokens = ai_usage_daily.total_tokens + ${tokens},
      request_count = ai_usage_daily.request_count + 1,
      updated_at = ${nowStr}
  `;
}

export interface AiUsageDay {
  day: string;
  totalTokens: number;
  requestCount: number;
}

/** Oxirgi `days` kun (bugungisi bilan birga) — bugun uchun yozuv umuman
 * bo'lmasa (hali hech qanday chaqiruv bo'lmagan), 0 bilan to'ldiriladi (UI
 * "bugun 0 token" deb aniq ko'rsatsin, kunni umuman o'tkazib yubormasin). */
export async function getAiUsageRecent(provider: string, days: number): Promise<AiUsageDay[]> {
  await ensureSchema();
  // OVERNIGHT-03: `generate_series(date, date, interval)` DEGAN OVERLOAD
  // POSTGRES'DA UMUMAN MAVJUD EMAS (faqat timestamp/timestamptz+interval yoki
  // int/bigint/numeric+qadam qabul qilinadi) — avvalgi kod `date - ${days-1}`
  // (butun son ayirish) ishlatgani uchun bu funksiya HAR CHAQIRUVDA
  // "function generate_series(integer, date, interval) does not exist" xatosi
  // bilan qulardi (production'da tasdiqlangan: /api/admin/ai-settings har
  // doim 500 qaytarardi). `make_interval(days => ...)` orqali natija
  // `timestamp`ga aylantiriladi — bu ALLAQACHON to'g'ri ishlaydigan
  // getAdminStats'dagi 30-kunlik grafik bilan bir xil naqsh. Natijadagi
  // `day` maydoni ENDI `::date::text` bilan aniq qisqartiriladi — aks holda
  // vaqt qismi ham qo'shilib ("2026-09-12 00:00:00"), UI'ning
  // `d.day.slice(5)` formatlashini buzardi.
  const rows = (await sql`
    SELECT
      d.day::date::text as day,
      COALESCE(u.total_tokens, 0)::int as total_tokens,
      COALESCE(u.request_count, 0)::int as request_count
    FROM generate_series(
      (now() AT TIME ZONE 'Asia/Tashkent')::date - make_interval(days => (${days}::int - 1)),
      (now() AT TIME ZONE 'Asia/Tashkent')::date,
      interval '1 day'
    ) as d(day)
    LEFT JOIN ai_usage_daily u ON u.day = d.day::date AND u.provider = ${provider}
    ORDER BY d.day ASC
  `) as unknown as { day: string; total_tokens: number; request_count: number }[];
  return rows.map((r) => ({ day: r.day, totalTokens: r.total_tokens, requestCount: r.request_count }));
}

// ---------------------------------------------------------------------------
// Telefon raqamni Telegram bot orqali tasdiqlash — foydalanuvchi telefon
// kiritgach vaqtinchalik yozuv yaratiladi (token), botga "Start" bosilgach
// shu yozuvga chat_id + kod qo'shiladi (server/telegram-bot.ts), foydalanuvchi
// kodni kiritib tasdiqlaganda hisob yaratiladi/kirish beriladi.
// ---------------------------------------------------------------------------

const PHONE_VERIFICATION_TTL_MINUTES = 10;
// FIX-04: shu son urinishdan keyin token butunlay bekor qilinadi (to'g'ri kod
// kiritilsa ham) — 6 xonali kodni TTL ichida cheksiz sinab ko'rishning oldini
// oladi.
const PHONE_VERIFICATION_MAX_ATTEMPTS = 5;

interface PhoneVerificationRow {
  id: string;
  token: string;
  phone: string;
  language: Language;
  code: string | null;
  telegram_chat_id: string | null;
  verified_at: string | null;
  created_at: string;
  attempts: number;
}

export async function createPhoneVerification(phone: string, language: Language): Promise<{ token: string }> {
  await ensureSchema();
  const id = randomUUID();
  const token = randomUUID().replace(/-/g, "");
  await sql`
    INSERT INTO phone_verifications (id, token, phone, language, created_at) VALUES (${id}, ${token}, ${phone}, ${language}, ${now()})
  `;
  return { token };
}

export async function getPhoneVerificationByToken(token: string): Promise<PhoneVerificationRow | null> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM phone_verifications WHERE token = ${token}`) as unknown as PhoneVerificationRow[];
  return rows[0] ?? null;
}

function normalizePhoneDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** Bot'dan "/start <token>" kelganda chaqiriladi — chat_id'ni yozuvga bog'laydi
 * (hali kod YO'Q — avval haqiqiy egasi ekanini tekshirish uchun Telegram'ning
 * "telefon raqamni ulashish" tugmasi so'raladi, server/telegram-bot.ts). */
export async function registerTelegramStart(token: string, chatId: string): Promise<{ phone: string; language: Language } | null> {
  await ensureSchema();
  // FIX3-12: ilgari bir xil token uchun ikkinchi marta /start bosilsa
  // (masalan forward qilingan havola yoki ikkinchi qurilma orqali), eski
  // telegram_chat_id HECH QANDAY TEKSHIRUVSIZ yangi chat bilan
  // almashtirilardi — birinchi foydalanuvchining login urinishi jimgina
  // o'ladi (kodi endi BOSHQA chatga yuboriladi), token esa oxirgi bosgan
  // kishiga "tegishli" bo'lib qolardi. Endi "birinchi da'vogar yutadi" —
  // agar allaqachon boshqa (turli) chatga bog'langan bo'lsa, UPDATE hech
  // narsani o'zgartirmaydi (0 qator, null qaytadi).
  const rows = (await sql`
    UPDATE phone_verifications SET telegram_chat_id = ${chatId}
    WHERE token = ${token} AND verified_at IS NULL AND code IS NULL
      AND (telegram_chat_id IS NULL OR telegram_chat_id = ${chatId})
    RETURNING phone, language
  `) as unknown as { phone: string; language: Language }[];
  return rows[0] ?? null;
}

/**
 * Foydalanuvchi Telegram'da "Telefon raqamimni ulashish" tugmasini bosganda
 * chaqiriladi — ulashilgan raqam saytga kiritilgan raqam bilan ustma-ust
 * tushishini tekshiradi (aks holda ISTALGAN Telegram hisobidan "Start"
 * bosib, o'zganing raqamiga kod olib bo'lardi — bu haqiqiy egalikni
 * tasdiqlamaydi). Faqat mos kelsa kod generatsiya qilinadi.
 */
export async function confirmPhoneViaContact(
  chatId: string,
  sharedPhone: string
): Promise<{ matched: true; token: string; phone: string; language: Language; code: string } | { matched: false } | null> {
  await ensureSchema();
  const rows = (await sql`
    SELECT token, phone, language FROM phone_verifications
    WHERE telegram_chat_id = ${chatId} AND code IS NULL AND verified_at IS NULL
    ORDER BY created_at DESC LIMIT 1
  `) as unknown as { token: string; phone: string; language: Language }[];
  const row = rows[0];
  if (!row) return null;

  if (normalizePhoneDigits(row.phone) !== normalizePhoneDigits(sharedPhone)) {
    return { matched: false };
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  // FIX3-07: SELECT va UPDATE orasida hech qanday qulf yo'q edi — Telegram
  // webhookni ikki marta yuborsa (masalan kechikish tufayli qayta urinish),
  // ikkala so'rov ham "kod hali yo'q" (yuqoridagi SELECT) deb ko'rib,
  // ikkita TURLI kod generatsiya qilib, ikkalasini ham yuborishi mumkin
  // edi — oxirgisi saqlanadi, foydalanuvchi esa birinchi (endi noto'g'ri)
  // kodni ko'rib, tasdiqlashda muvaffaqiyatsiz bo'laveradi. Endi bitta
  // atomik `UPDATE ... WHERE code IS NULL` — agar bu ikkitasi orasida
  // boshqa (parallel) chaqiruv allaqachon kod yozgan bo'lsa, bu UPDATE
  // hech qanday qator o'zgartirmaydi va chaqiruvchi jim qoladi (xuddi
  // "topilmadi" holatidagi kabi — ikkinchi, ziddiyatli kod yubormaydi).
  const updated = (await sql`
    UPDATE phone_verifications SET code = ${code}
    WHERE token = ${row.token} AND code IS NULL
    RETURNING token
  `) as unknown as { token: string }[];
  if (updated.length === 0) return null;
  return { matched: true, token: row.token, phone: row.phone, language: row.language, code };
}

/** FIX3-08: kod DB'ga yozilgandan keyin Telegram xabari yuborilishi
 * MUVAFFAQIYATSIZ bo'lsa (bot bloklangan, tarmoq xatosi) chaqiriladi —
 * saqlangan kodni tozalab, foydalanuvchi qayta kontakt yuborib qayta
 * urinishi mumkin bo'lishini ta'minlaydi (aks holda keyingi urinish ham
 * "kod allaqachon bor" jim mantig'iga tushib, foydalanuvchi hech qachon
 * kelmaydigan xabarni abadiy kutib qolardi). */
export async function clearPhoneVerificationCode(token: string): Promise<void> {
  await ensureSchema();
  await sql`UPDATE phone_verifications SET code = NULL WHERE token = ${token}`;
}

/** Kodni tekshiradi — to'g'ri bo'lsa, yozuvni "ishlatilgan" deb belgilaydi
 * (qayta ishlatib bo'lmasligi uchun) va telefon raqamni qaytaradi. */
export async function verifyPhoneCode(token: string, code: string): Promise<{ phone: string; language: Language } | null> {
  await ensureSchema();
  const row = await getPhoneVerificationByToken(token);
  if (!row || !row.code || row.verified_at) return null;
  // FIX-04: ilgari bu yerda urinishlar soni HECH QANDAY cheklanmagan edi —
  // 6 xonali kodni (1 000 000 variant) TTL (10 daqiqa) ichida tez skript
  // bilan sinab ko'rish mumkin edi. Endi har chaqiruv (to'g'ri yoki noto'g'ri
  // kod bilan) urinishni hisoblaydi, chegaradan oshsa token butunlay bekor
  // qilinadi (to'g'ri kod kiritilgan taqdirda ham).
  if (row.attempts >= PHONE_VERIFICATION_MAX_ATTEMPTS) return null;
  await sql`UPDATE phone_verifications SET attempts = attempts + 1 WHERE token = ${token}`;
  if (row.code !== code) return null;
  const ageMinutes = (Date.now() - new Date(row.created_at).getTime()) / 60000;
  if (ageMinutes > PHONE_VERIFICATION_TTL_MINUTES) return null;
  await sql`UPDATE phone_verifications SET verified_at = ${now()} WHERE token = ${token}`;
  return { phone: row.phone, language: row.language };
}

// ---------------------------------------------------------------------------
// Telegram Mini App orqali kirish — telefon/ism/rasm Telegram'dan avtomatik
// olinadi (server/telegram-miniapp-auth.ts:verifyTelegramInitData tomonidan
// tasdiqlangan initData asosida). Xotira: 1:1 shaxsiy chatda chat_id === user_id,
// shuning uchun bot xabar yuborishda ham users.telegram_user_id ishlatiladi.
// ---------------------------------------------------------------------------

export async function findUserByTelegramId(telegramUserId: string): Promise<(User & { tokenVersion: number }) | null> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM users WHERE telegram_user_id = ${telegramUserId}`) as unknown as UserRow[];
  const row = rows[0];
  return row ? { ...userFromRow(row), tokenVersion: row.token_version } : null;
}

/** Telegram'ni akkauntga bog'laydi — `name`/`avatarUrl` FAQAT hozir bo'sh bo'lsa
 * to'ldiriladi (foydalanuvchi qo'lda o'zgartirgan bo'lsa bosib yozilmaydi). */
export async function linkTelegramToUser(
  userId: string,
  opts: { telegramUserId: string; name?: string | null; avatarUrl?: string | null }
): Promise<void> {
  await ensureSchema();
  await sql`
    UPDATE users SET
      telegram_user_id = ${opts.telegramUserId},
      name = COALESCE(name, ${opts.name ?? null}),
      avatar_url = COALESCE(avatar_url, ${opts.avatarUrl ?? null})
    WHERE id = ${userId}
  `;
}

export async function upsertMiniAppPending(telegramUserId: string): Promise<void> {
  await ensureSchema();
  await sql`
    INSERT INTO telegram_miniapp_pending (telegram_user_id, phone, created_at)
    VALUES (${telegramUserId}, NULL, ${now()})
    ON CONFLICT (telegram_user_id) DO UPDATE SET phone = NULL, created_at = ${now()}
  `;
}

export async function getMiniAppPendingPhone(telegramUserId: string): Promise<string | null> {
  await ensureSchema();
  const rows = (await sql`
    SELECT phone FROM telegram_miniapp_pending WHERE telegram_user_id = ${telegramUserId}
  `) as unknown as { phone: string | null }[];
  return rows[0]?.phone ?? null;
}

export async function deleteMiniAppPending(telegramUserId: string): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM telegram_miniapp_pending WHERE telegram_user_id = ${telegramUserId}`;
}

/** Webhook'dan chaqiriladi (`message.contact` kelganda) — shu telegram_user_id
 * uchun kutilayotgan Mini App kirish bormi, bo'lsa ulashilgan raqamni saqlaydi.
 * Mini App'ning o'z `requestContact()`i faqat foydalanuvchining O'Z kontaktini
 * so'raydi (rasmiy hujjatda tasdiqlangan) — eski klaviatura-tugma yo'lidagi kabi
 * "boshqa birovning kontaktini yuborish" xavfi yo'q, shuning uchun bu yerda
 * qo'shimcha solishtirish shart emas. */
export async function confirmMiniAppContact(telegramUserId: string, phone: string): Promise<boolean> {
  await ensureSchema();
  const rows = (await sql`
    UPDATE telegram_miniapp_pending SET phone = ${phone}
    WHERE telegram_user_id = ${telegramUserId} AND phone IS NULL
    RETURNING telegram_user_id
  `) as unknown as { telegram_user_id: string }[];
  return rows.length > 0;
}

/** Foydalanuvchini IKKALA kanal orqali xabardor qiladi (bittasi yo'q bo'lsa,
 * boshqasi baribir ishlaydi): Telegram bog'langan bo'lsa bot orqali, HAQIQIY
 * telefon push-bildirishnomasi ro'yxatga olingan bo'lsa Expo Push orqali
 * (server/push-notifications.ts — roadmap 10-band, ilgari faqat Telegram
 * bor edi). `notifications_enabled` ikkalasi uchun ham hurmat qilinadi.
 * Xato bo'lsa ham jimgina yutiladi — asosiy amal (izoh/xabar yaratish)
 * buzilmasligi kerak. */
export async function notifyUser(userId: string, payload: { title: string; text: string }): Promise<void> {
  try {
    await ensureSchema();
    const rows = (await sql`
      SELECT telegram_user_id, expo_push_token, notifications_enabled FROM users WHERE id = ${userId}
    `) as unknown as { telegram_user_id: string | null; expo_push_token: string | null; notifications_enabled: boolean }[];
    const row = rows[0];
    if (!row || !row.notifications_enabled) return;

    const tasks: Promise<void>[] = [];
    if (row.telegram_user_id) {
      // Telegram xabarida alohida "sarlavha" maydoni yo'q — bitta matnga
      // birlashtiriladi (push'da esa title/body alohida ko'rsatiladi).
      tasks.push(
        import("./telegram-bot").then(({ sendTelegramMessage }) =>
          sendTelegramMessage(row.telegram_user_id!, `${payload.title}\n${payload.text}`)
        )
      );
    }
    if (row.expo_push_token) {
      tasks.push(
        import("./push-notifications").then(({ sendExpoPushNotification }) =>
          sendExpoPushNotification(row.expo_push_token!, { title: payload.title, body: payload.text })
        )
      );
    }
    await Promise.all(tasks);
  } catch {
    // Bildirishnoma yuborilmasa ham asosiy amal davom etadi.
  }
}

/** Mobil ilova OS push ruxsatini olgach chaqiradi (POST /api/push-token) —
 * bitta ustun, bitta qurilma (V1, ko'p-qurilma qo'llab-quvvatlash yo'q). */
export async function setExpoPushToken(userId: string, token: string): Promise<void> {
  await ensureSchema();
  await sql`UPDATE users SET expo_push_token = ${token} WHERE id = ${userId}`;
}

/** Botga "/start" bosilgan HAR SAFAR chaqiriladi (webhook route.ts) — token
 * bilan yoki tokensiz, akkaunt yaratilgan-yaratilmaganidan qat'i nazar.
 * Admin paneldan "hammaga xabar yuborish" shu yozuvlarga tayanadi, shuning
 * uchun keyinroq akkaunt yaratmagan (onboarding'ni tashlab ketgan) odamlar
 * ham yo'qolib qolmasligi kerak. `ON CONFLICT` — qayta "Start" bosilganda
 * ism/username yangilanishi mumkin (Telegram profilini o'zgartirgan bo'lsa),
 * lekin `first_started_at` o'zgarmaydi. */
export async function recordTelegramBotStart(
  chatId: string,
  info: { telegramUserId?: string | null; firstName?: string | null; username?: string | null }
): Promise<void> {
  await ensureSchema();
  const now = new Date().toISOString();
  await sql`
    INSERT INTO telegram_bot_starts (chat_id, telegram_user_id, first_name, username, first_started_at, last_started_at)
    VALUES (${chatId}, ${info.telegramUserId ?? null}, ${info.firstName ?? null}, ${info.username ?? null}, ${now}, ${now})
    ON CONFLICT (chat_id) DO UPDATE SET
      telegram_user_id = COALESCE(EXCLUDED.telegram_user_id, telegram_bot_starts.telegram_user_id),
      first_name = COALESCE(EXCLUDED.first_name, telegram_bot_starts.first_name),
      username = COALESCE(EXCLUDED.username, telegram_bot_starts.username),
      last_started_at = EXCLUDED.last_started_at
  `;
}

/** "Hammaga xabar yuborish" (admin broadcast) uchun manzil ro'yxati —
 * `telegram_bot_starts` (har qanday /start, akkauntsiz ham) VA
 * `users.telegram_user_id` (allaqachon ro'yxatdan o'tgan, lekin bu jadval
 * qo'shilishidan OLDIN "Start" bosgan bo'lishi mumkin bo'lganlar) birlashtirilib,
 * takrorlanganlar olib tashlanadi. Test/bloklangan akkauntlar chiqarib
 * tashlanadi (is_test_account/is_blocked) — xom `telegram_bot_starts`
 * yozuvlarida bunday bayroq yo'q, ular har doim kiritiladi. */
export async function listTelegramBroadcastChatIds(): Promise<string[]> {
  await ensureSchema();
  const rows = (await sql`
    SELECT DISTINCT chat_id FROM (
      SELECT chat_id FROM telegram_bot_starts
      UNION
      SELECT telegram_user_id AS chat_id FROM users
      WHERE telegram_user_id IS NOT NULL AND is_test_account = FALSE AND is_blocked = FALSE
    ) combined
  `) as unknown as { chat_id: string }[];
  return rows.map((r) => r.chat_id);
}

// ---------------------------------------------------------------------------
// Onboarding
// ---------------------------------------------------------------------------

interface OnboardingRow {
  user_id: string;
  name: string | null;
  age: number;
  is_pregnant: boolean;
  cycle_regularity: OnboardingProfile["cycleRegularity"];
  family_history: boolean | null;
  sexually_active: boolean | null;
  hpv_vaccinated: boolean | null;
  hormonal_contraception: boolean | null;
  smokes: boolean | null;
  has_given_birth: boolean | null;
  chronic_conditions: string | null;
  last_checkup: OnboardingProfile["lastCheckup"];
  primary_goal: OnboardingProfile["primaryGoal"];
  heard_about_us: HeardAboutUs | null;
  typical_symptoms: string;
  period_attitude: PeriodAttitude | null;
  health_conditions: string;
  health_conditions_other: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  blood_type: BloodType | null;
}

function onboardingFromRow(row: OnboardingRow): OnboardingProfile {
  return {
    userId: row.user_id,
    name: row.name,
    age: row.age,
    isPregnant: !!row.is_pregnant,
    cycleRegularity: row.cycle_regularity,
    // GATE-01: `!!` ATAYLAB olib tashlandi — u `null`ni `false`ga
    // aylantirib, "bilmayman" javobini "yo'q"dan ajratib bo'lmaydigan
    // qilardi. Bu bazaga NULL yozish o'zgarishini butunlay behuda
    // qilgan bo'lardi: yozilardi, lekin o'qishda yo'qolardi.
    familyHistory: row.family_history,
    sexuallyActive: row.sexually_active,
    // PROFILE-01: `?? null` ATAYLAB — bu maydonlar eski qatorlarda umuman
    // yo'q va `null` "hali so'ralmagan" degani (GATE-01: uni `false` ga
    // aylantirish "yo'q" javobi bilan chalkashtirib yuborardi).
    hpvVaccinated: row.hpv_vaccinated ?? null,
    hormonalContraception: row.hormonal_contraception ?? null,
    smokes: row.smokes ?? null,
    hasGivenBirth: row.has_given_birth ?? null,
    chronicConditions: row.chronic_conditions ? (JSON.parse(row.chronic_conditions) as ChronicCondition[]) : null,
    lastCheckup: row.last_checkup,
    primaryGoal: row.primary_goal,
    heardAboutUs: row.heard_about_us,
    typicalSymptoms: JSON.parse(row.typical_symptoms) as Symptom[],
    periodAttitude: row.period_attitude,
    healthConditions: JSON.parse(row.health_conditions) as HealthCondition[],
    healthConditionsOther: row.health_conditions_other,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    bloodType: row.blood_type,
  };
}

export async function saveOnboardingProfile(profile: OnboardingProfile): Promise<void> {
  await ensureSchema();
  const typicalSymptoms = JSON.stringify(profile.typicalSymptoms ?? []);
  const healthConditions = JSON.stringify(profile.healthConditions ?? []);
  // PROFILE-01: `null` — "hali so'ralmagan". `?? []` QO'YILMAYDI: bo'sh
  // massiv "so'radik, hech narsa tanlamadi" degani bo'lardi, bu esa boshqa
  // holat va keyin savolni qayta bermay qo'yardi.
  const chronicConditions = profile.chronicConditions ? JSON.stringify(profile.chronicConditions) : null;
  await sql`
    INSERT INTO onboarding_profiles (
      user_id, name, age, is_pregnant, cycle_regularity, family_history, sexually_active, last_checkup, primary_goal,
      heard_about_us, typical_symptoms, period_attitude, health_conditions, health_conditions_other, height_cm, weight_kg, blood_type,
      hpv_vaccinated, hormonal_contraception, smokes, has_given_birth, chronic_conditions
    )
    VALUES (
      ${profile.userId}, ${profile.name}, ${profile.age}, ${profile.isPregnant}, ${profile.cycleRegularity},
      ${profile.familyHistory}, ${profile.sexuallyActive}, ${profile.lastCheckup}, ${profile.primaryGoal}, ${profile.heardAboutUs},
      ${typicalSymptoms}, ${profile.periodAttitude}, ${healthConditions}, ${profile.healthConditionsOther},
      ${profile.heightCm}, ${profile.weightKg}, ${profile.bloodType},
      ${profile.hpvVaccinated}, ${profile.hormonalContraception}, ${profile.smokes},
      ${profile.hasGivenBirth}, ${chronicConditions}
    )
    ON CONFLICT (user_id) DO UPDATE SET
      name = EXCLUDED.name, age = EXCLUDED.age, is_pregnant = EXCLUDED.is_pregnant,
      cycle_regularity = EXCLUDED.cycle_regularity, family_history = EXCLUDED.family_history,
      sexually_active = EXCLUDED.sexually_active,
      last_checkup = EXCLUDED.last_checkup, primary_goal = EXCLUDED.primary_goal,
      heard_about_us = EXCLUDED.heard_about_us, typical_symptoms = EXCLUDED.typical_symptoms,
      period_attitude = EXCLUDED.period_attitude,
      health_conditions = EXCLUDED.health_conditions, health_conditions_other = EXCLUDED.health_conditions_other,
      height_cm = EXCLUDED.height_cm, weight_kg = EXCLUDED.weight_kg, blood_type = EXCLUDED.blood_type,
      hpv_vaccinated = EXCLUDED.hpv_vaccinated, hormonal_contraception = EXCLUDED.hormonal_contraception,
      smokes = EXCLUDED.smokes, has_given_birth = EXCLUDED.has_given_birth,
      chronic_conditions = EXCLUDED.chronic_conditions
  `;
}

export async function getOnboardingProfile(userId: string): Promise<OnboardingProfile | null> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM onboarding_profiles WHERE user_id = ${userId}`) as unknown as OnboardingRow[];
  const row = rows[0];
  return row ? onboardingFromRow(row) : null;
}

/**
 * Rejim almashtirish (Profil, "REJIMNI TANLANG") va shaxsiy ma'lumotlarni
 * (yosh/bo'y/vazn/qon guruhi) qisman yangilash — to'liq onboarding'ni qayta
 * topshirish shart emas.
 */
export async function updateOnboardingProfile(
  userId: string,
  // FIX3-02: `sexuallyActive` shu yerga qo'shildi — profilda tahrirlash
  // imkoni bo'lmasa, haqiqatan jinsiy faol bo'lib qolgan eski
  // foydalanuvchilar (onboarding'da "yo'q"/"bilmayman" deb belgilagan)
  // muhim tekshiruv bandlaridan (bachadon bo'yni skrininggi, JYI va h.k.)
  // hech qanday signalsiz doimiy mahrum qolaverardi.
  patch: Partial<
    Pick<
      OnboardingProfile,
      | "primaryGoal"
      | "isPregnant"
      | "age"
      | "heightCm"
      | "weightKg"
      | "bloodType"
      | "sexuallyActive"
      // PROFILE-01: onboarding'dan keyin so'raladigan javoblar shu yo'l
      // orqali saqlanadi.
      | "familyHistory"
      | "hpvVaccinated"
      | "hormonalContraception"
      | "smokes"
      | "hasGivenBirth"
      | "chronicConditions"
    >
  >
): Promise<OnboardingProfile> {
  await ensureSchema();
  const current = await getOnboardingProfile(userId);
  if (!current) throw new ApiError(404, "Onboarding profili topilmadi");
  const merged = { ...current, ...patch };
  await saveOnboardingProfile(merged);
  return merged;
}

// ---------------------------------------------------------------------------
// Cycle
// ---------------------------------------------------------------------------

interface CycleSettingsRow {
  user_id: string;
  last_period_start: string | null;
  average_cycle_length: number;
  average_period_length: number;
}

export async function getCycleSettings(userId: string): Promise<CycleSettings> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM cycle_settings WHERE user_id = ${userId}`) as unknown as CycleSettingsRow[];
  const row = rows[0];
  if (!row) {
    return {
      userId,
      lastPeriodStart: null,
      averageCycleLength: DEFAULT_CYCLE_LENGTH,
      averagePeriodLength: DEFAULT_PERIOD_LENGTH,
    };
  }
  return {
    userId,
    lastPeriodStart: row.last_period_start,
    averageCycleLength: row.average_cycle_length,
    averagePeriodLength: row.average_period_length,
  };
}

export async function updateCycleSettings(
  userId: string,
  patch: Partial<Pick<CycleSettings, "lastPeriodStart" | "averageCycleLength" | "averagePeriodLength">>
): Promise<CycleSettings> {
  await ensureSchema();
  const current = await getCycleSettings(userId);
  const merged = { ...current, ...patch };
  await sql`
    INSERT INTO cycle_settings (user_id, last_period_start, average_cycle_length, average_period_length)
    VALUES (${merged.userId}, ${merged.lastPeriodStart}, ${merged.averageCycleLength}, ${merged.averagePeriodLength})
    ON CONFLICT (user_id) DO UPDATE SET
      last_period_start = EXCLUDED.last_period_start,
      average_cycle_length = EXCLUDED.average_cycle_length,
      average_period_length = EXCLUDED.average_period_length
  `;
  return merged;
}

interface CycleLogRow {
  id: string;
  user_id: string;
  date: string;
  flow: FlowLevel | null;
  mood: Mood | null;
  symptoms: string;
  created_at: string;
  basal_body_temp: number | null;
}

function cycleLogFromRow(row: CycleLogRow): CycleLog {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    flow: row.flow,
    mood: row.mood,
    symptoms: JSON.parse(row.symptoms) as Symptom[],
    createdAt: row.created_at,
    basalBodyTemp: row.basal_body_temp,
  };
}

export async function listCycleLogs(userId: string, limit = 180): Promise<CycleLog[]> {
  await ensureSchema();
  const rows = (await sql`
    SELECT * FROM cycle_logs WHERE user_id = ${userId} ORDER BY date DESC LIMIT ${limit}
  `) as unknown as CycleLogRow[];
  return rows.map(cycleLogFromRow);
}

/** Faqat AI'ning proaktiv tahlilini QAYTA generatsiya qilish kerakmi-yo'qmi
 * tekshirish uchun (server/active-insights.ts) — to'liq ro'yxatni o'qishdan
 * ancha arzon. */
export async function countCycleLogs(userId: string): Promise<number> {
  await ensureSchema();
  const [{ count }] = (await sql`SELECT count(*)::int as count FROM cycle_logs WHERE user_id = ${userId}`) as unknown as { count: number }[];
  return count;
}

/** FIX2-26: `logsCount` o'zgarmagan (yangi/o'chirilgan yozuv yo'q), lekin
 * MAVJUD kunning kayfiyati/simptomi tahrirlangan holatni aniqlash uchun —
 * shu qiymat active-insights.ts'ning kesh-eskirish tekshiruviga qo'shiladi. */
export async function getMaxCycleLogUpdatedAt(userId: string): Promise<string | null> {
  await ensureSchema();
  const rows = (await sql`SELECT MAX(updated_at) as max_updated_at FROM cycle_logs WHERE user_id = ${userId}`) as unknown as {
    max_updated_at: string | null;
  }[];
  return rows[0]?.max_updated_at ?? null;
}

/**
 * ARCH-01 (2026-09-22) — bu yerda ilgari `recomputeLastPeriodStart()` bor edi:
 * har bir hayz yozuvidan keyin u `cycle_settings.last_period_start`ni
 * `cycle_logs`dan qayta hisoblab yozib qo'yardi.
 *
 * OLIB TASHLANDI, chunki u ikkita muammoning manbai edi:
 *
 * 1. IKKI MANBA. `cycle_settings` ham, `cycle_logs` ham bir xil savolga javob
 *    berardi ("oxirgi hayz qachon boshlangan?"). Yangi kod yozgan odam
 *    ikkalasidan birini tanlashi kerak edi va noto'g'ri tanlasa xato JIM
 *    turardi. Shu haftada bunday to'rtta joy topildi (bosh ekran, kalendar,
 *    faza kartasi, hamkor ekrani).
 *
 * 2. BUG-01: "qiymat qaydlardan kelgan bo'lsa tozalaymiz" sharti O'LIK KOD
 *    edi — u qaydlarni O'CHIRISHDAN KEYIN o'qirdi, o'sha sanada qayd hali
 *    tursa esa funksiya yuqorida return qilardi. Ya'ni shartga yetib
 *    kelinganda u har doim `false`. Natijada barcha qaydlar o'chirilsa ham
 *    langar tozalanmasdi va ilova orqasida hech narsa yo'q sanadan bashorat
 *    qilishda davom etardi (foydalanuvchi buni sezgan).
 *
 * Endi mas'uliyat aniq bo'lindi:
 *   • `cycle_settings.last_period_start` — AYOLNING O'ZI aytgan sana
 *     (onboarding yoki "oxirgi hayz sanasini o'zgartirish" oynasi). Uni
 *     faqat foydalanuvchi o'zgartiradi.
 *   • `cycle_logs` — haqiqiy qaydlar. Ular BOR bo'lsa, o'qish paytida
 *     ustun turadi: `deriveAdaptiveCycleSettings` da
 *     `starts[starts.length - 1] ?? fallback.lastPeriodStart` (CYCLE-ALGO-20).
 *
 * Shu tufayli hech narsani sinxronlab turish shart emas, va barcha qaydlar
 * o'chirilsa ilova tabiiy ravishda ayolning o'z gapiga qaytadi.
 */

export async function upsertCycleLog(
  userId: string,
  log: Pick<CycleLog, "date" | "flow" | "mood" | "symptoms"> & Partial<Pick<CycleLog, "basalBodyTemp">>
): Promise<CycleLog> {
  await ensureSchema();
  const id = randomUUID();
  const createdAt = now();
  const symptoms = JSON.stringify(log.symptoms ?? []);
  // CYCLE-ALGO-15: `basalBodyTemp` ixtiyoriy — chaqiruvchi bermasa (mavjud
  // barcha eski chaqiruvlar shunday) `undefined` bo'ladi, `?? null` bilan
  // ustunga `NULL` yoziladi (o'zgarishsiz eski xatti-harakat).
  const basalBodyTemp = log.basalBodyTemp ?? null;
  // FIX2-26: `updated_at` har bir yozish/tahrirlashda yangilanadi —
  // active-insights.ts shundan foydalanib, faqat yozuvlar SONI o'zgarmagan
  // (mavjud kun tahrirlangan) holatlarda ham AI tahlilini qayta generatsiya
  // qilishi kerakligini aniqlaydi.
  await sql`
    INSERT INTO cycle_logs (id, user_id, date, flow, mood, symptoms, created_at, updated_at, basal_body_temp)
    VALUES (${id}, ${userId}, ${log.date}, ${log.flow}, ${log.mood}, ${symptoms}, ${createdAt}, ${createdAt}, ${basalBodyTemp})
    ON CONFLICT (user_id, date) DO UPDATE SET
      flow = EXCLUDED.flow, mood = EXCLUDED.mood, symptoms = EXCLUDED.symptoms, updated_at = EXCLUDED.updated_at,
      basal_body_temp = EXCLUDED.basal_body_temp
  `;
  // Har doim qayta hisoblanadi (faqat `log.flow` bor bo'lganda emas) — aks
  // holda mavjud oqim kunini "bekor qilish" (flow'ni null'ga o'zgartirish)
  // eski boshlanish sanasini eskirgan holda qoldirib ketardi.

  const rows = (await sql`
    SELECT * FROM cycle_logs WHERE user_id = ${userId} AND date = ${log.date}
  `) as unknown as CycleLogRow[];
  return cycleLogFromRow(rows[0]);
}

/* ------------------------------------------------------------------ *
 * CAL-01 — kalendarda hayz davrini BIR BOSISHDA belgilash/olib tashlash.
 *
 * Foydalanuvchi so'rovi: kalendarda bir kunga bossa, o'sha kundan boshlab
 * uning O'Z o'rtacha hayz uzunligi (cycle_settings.average_period_length)
 * bo'yicha butun davr belgilansin; xato bosgan bo'lsa — qaytarib olsin.
 *
 * Nega alohida funksiya: kun-ma-kun `upsertCycleLog` chaqirish har safar
 * `recomputeLastPeriodStart`ni ham ishga tushirardi (5 kun = 5 ta ortiqcha
 * to'liq qayta hisoblash). Bu yerda yozuvlar yoziladi va qayta hisoblash
 * OXIRIDA BIR MARTA bajariladi.
 * ------------------------------------------------------------------ */

function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** `startDate`dan boshlab `days` kunni hayz kuni sifatida belgilaydi.
 * Mavjud kayfiyat/simptom yozuvlari SAQLANADI — faqat `flow` qo'yiladi. */
export async function setPeriodRange(userId: string, startDate: string, days: number): Promise<void> {
  await ensureSchema();
  const span = Math.min(Math.max(days, 1), 14); // aqlli chegara — xato kiritishdan himoya
  for (let i = 0; i < span; i++) {
    const date = addDaysStr(startDate, i);
    await sql`
      INSERT INTO cycle_logs (id, user_id, date, flow, mood, symptoms, created_at, updated_at, basal_body_temp)
      VALUES (${randomUUID()}, ${userId}, ${date}, 'medium', NULL, '[]', ${now()}, ${now()}, NULL)
      ON CONFLICT (user_id, date) DO UPDATE SET flow = 'medium', updated_at = ${now()}
    `;
  }
}

/**
 * CAL-04 — kalendardagi "tahrirlash" rejimining yagona yozish nuqtasi:
 * foydalanuvchi bir nechta kunni belgilaydi/bekor qiladi va "Saqlash"ni
 * bosganda hammasi BITTA so'rovda qo'llanadi.
 *
 * Nega diff (qo'shilgan/olib tashlangan), butun ro'yxat emas: foydalanuvchi
 * kalendarda faqat bir necha oyni ko'radi, butun ro'yxatni yuborish esa
 * KO'RINMAGAN oylardagi yozuvlarni bexosdan o'chirib yuborardi.
 *
 * `removed` kunlarida kayfiyat/simptom/harorat bo'lsa, yozuv O'CHIRILMAYDI —
 * faqat `flow` bo'shatiladi (foydalanuvchining boshqa ma'lumoti yo'qolmasin).
 */
export async function applyPeriodDiff(userId: string, added: string[], removed: string[]): Promise<void> {
  await ensureSchema();

  for (const date of added) {
    await sql`
      INSERT INTO cycle_logs (id, user_id, date, flow, mood, symptoms, created_at, updated_at, basal_body_temp)
      VALUES (${randomUUID()}, ${userId}, ${date}, 'medium', NULL, '[]', ${now()}, ${now()}, NULL)
      ON CONFLICT (user_id, date) DO UPDATE SET flow = 'medium', updated_at = ${now()}
    `;
  }

  if (removed.length > 0) {
    const existing = await listCycleLogs(userId, 365);
    const byDate = new Map(existing.map((l) => [l.date, l]));
    for (const date of removed) {
      const log = byDate.get(date);
      const hasOtherData = !!log && (log.mood !== null || log.symptoms.length > 0 || log.basalBodyTemp !== null);
      if (hasOtherData) {
        await sql`UPDATE cycle_logs SET flow = NULL, updated_at = ${now()} WHERE user_id = ${userId} AND date = ${date}`;
      } else {
        await sql`DELETE FROM cycle_logs WHERE user_id = ${userId} AND date = ${date}`;
      }
    }
  }

}

/** `dateInRange` tegishli bo'lgan UZLUKSIZ hayz kunlari ketma-ketligini
 * topib, o'shalarning hammasidan hayz belgisini olib tashlaydi (xato
 * bosilgan sanani qaytarib olish). Kunda kayfiyat/simptom ham bo'lsa,
 * yozuv O'CHIRILMAYDI — faqat `flow` bo'shatiladi, ya'ni foydalanuvchining
 * boshqa ma'lumoti yo'qolmaydi. */
export async function clearPeriodRange(userId: string, dateInRange: string): Promise<void> {
  await ensureSchema();
  const logs = await listCycleLogs(userId, 365);
  const flowDates = new Set(logs.filter((l) => l.flow).map((l) => l.date));
  if (!flowDates.has(dateInRange)) return;

  const run: string[] = [dateInRange];
  for (let d = addDaysStr(dateInRange, -1); flowDates.has(d); d = addDaysStr(d, -1)) run.unshift(d);
  for (let d = addDaysStr(dateInRange, 1); flowDates.has(d); d = addDaysStr(d, 1)) run.push(d);

  const byDate = new Map(logs.map((l) => [l.date, l]));
  for (const date of run) {
    const log = byDate.get(date);
    const hasOtherData = !!log && (log.mood !== null || log.symptoms.length > 0 || log.basalBodyTemp !== null);
    if (hasOtherData) {
      await sql`UPDATE cycle_logs SET flow = NULL, updated_at = ${now()} WHERE user_id = ${userId} AND date = ${date}`;
    } else {
      await sql`DELETE FROM cycle_logs WHERE user_id = ${userId} AND date = ${date}`;
    }
  }
}

/** CYCLE-002: xato qayd etilgan kunni butunlay o'chirish (masalan noto'g'ri
 * sanaga bosilgan bo'lsa) — shundan keyin ham lastPeriodStart to'g'ri qayta
 * hisoblanadi, xuddi upsert'dagidek. */
export async function deleteCycleLog(userId: string, date: string): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM cycle_logs WHERE user_id = ${userId} AND date = ${date}`;
}

// ---------------------------------------------------------------------------
// Pregnancy
// ---------------------------------------------------------------------------

interface PregnancyRow {
  user_id: string;
  last_menstrual_period: string | null;
  due_date: string | null;
}

export async function getPregnancyProfile(userId: string): Promise<PregnancyProfile | null> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM pregnancy_profiles WHERE user_id = ${userId}`) as unknown as PregnancyRow[];
  const row = rows[0];
  if (!row) return null;
  return { userId, lastMenstrualPeriod: row.last_menstrual_period, dueDate: row.due_date };
}

export async function updatePregnancyProfile(
  userId: string,
  patch: Partial<Pick<PregnancyProfile, "lastMenstrualPeriod" | "dueDate">>
): Promise<PregnancyProfile> {
  await ensureSchema();
  const current = (await getPregnancyProfile(userId)) ?? { userId, lastMenstrualPeriod: null, dueDate: null };
  const merged = { ...current, ...patch };
  await sql`
    INSERT INTO pregnancy_profiles (user_id, last_menstrual_period, due_date)
    VALUES (${merged.userId}, ${merged.lastMenstrualPeriod}, ${merged.dueDate})
    ON CONFLICT (user_id) DO UPDATE SET
      last_menstrual_period = EXCLUDED.last_menstrual_period, due_date = EXCLUDED.due_date
  `;
  return merged;
}

interface VisitRow {
  id: string;
  user_id: string;
  label: string;
  date: string;
  clinic_name: string | null;
  note: string | null;
  created_at: string;
}

function visitFromRow(row: VisitRow): PregnancyVisitLog {
  return {
    id: row.id,
    userId: row.user_id,
    label: row.label,
    date: row.date,
    clinicName: row.clinic_name,
    note: row.note,
    createdAt: row.created_at,
  };
}

export async function listPregnancyVisits(userId: string): Promise<PregnancyVisitLog[]> {
  await ensureSchema();
  const rows = (await sql`
    SELECT * FROM pregnancy_visits WHERE user_id = ${userId} ORDER BY date ASC
  `) as unknown as VisitRow[];
  return rows.map(visitFromRow);
}

export async function addPregnancyVisit(
  userId: string,
  visit: Pick<PregnancyVisitLog, "label" | "date" | "clinicName" | "note">
): Promise<PregnancyVisitLog> {
  await ensureSchema();
  const id = randomUUID();
  const createdAt = now();
  await sql`
    INSERT INTO pregnancy_visits (id, user_id, label, date, clinic_name, note, created_at)
    VALUES (${id}, ${userId}, ${visit.label}, ${visit.date}, ${visit.clinicName}, ${visit.note}, ${createdAt})
  `;
  return { id, userId, label: visit.label, date: visit.date, clinicName: visit.clinicName, note: visit.note, createdAt };
}

// ---------------------------------------------------------------------------
// Homiladorlik albomi — rasmning o'zi Vercel Blob'da (private), bu yerda
// faqat metama'lumot (`blob_pathname` orqali bog'lanadi). "photoUrl" har doim
// bizning proksi route'imizga ishora qiladi (server/views.ts emas, to'g'ridan-
// to'g'ri route'da quriladi — chunki API_BASE kerak emas, nisbiy yo'l yetarli).
// ---------------------------------------------------------------------------

interface AlbumPhotoRow {
  id: string;
  pregnancy_week: number | null;
  blob_pathname: string;
  note: string | null;
  created_at: string;
}

export async function listPregnancyAlbumPhotos(userId: string): Promise<{ id: string; pregnancyWeek: number | null; blobPathname: string; note: string | null; createdAt: string }[]> {
  await ensureSchema();
  const rows = (await sql`
    SELECT id, pregnancy_week, blob_pathname, note, created_at
    FROM pregnancy_album_photos WHERE user_id = ${userId} ORDER BY created_at DESC
  `) as unknown as AlbumPhotoRow[];
  return rows.map((r) => ({ id: r.id, pregnancyWeek: r.pregnancy_week, blobPathname: r.blob_pathname, note: r.note, createdAt: r.created_at }));
}

export async function addPregnancyAlbumPhoto(
  userId: string,
  entry: { pregnancyWeek: number | null; blobPathname: string; note: string | null }
): Promise<{ id: string; pregnancyWeek: number | null; blobPathname: string; note: string | null; createdAt: string }> {
  await ensureSchema();
  const id = randomUUID();
  const createdAt = now();
  await sql`
    INSERT INTO pregnancy_album_photos (id, user_id, pregnancy_week, blob_pathname, note, created_at)
    VALUES (${id}, ${userId}, ${entry.pregnancyWeek}, ${entry.blobPathname}, ${entry.note}, ${createdAt})
  `;
  return { id, pregnancyWeek: entry.pregnancyWeek, blobPathname: entry.blobPathname, note: entry.note, createdAt };
}

/** `blobPathname`ni ham qaytaradi — chaqiruvchi (route) shu yo'l bo'yicha
 * Blob'dan HAM o'chirishi kerak (bo'lmasa faylning o'zi abadiy qolib ketadi). */
export async function deletePregnancyAlbumPhoto(userId: string, id: string): Promise<string | null> {
  await ensureSchema();
  const rows = (await sql`
    DELETE FROM pregnancy_album_photos WHERE id = ${id} AND user_id = ${userId} RETURNING blob_pathname
  `) as unknown as { blob_pathname: string }[];
  return rows[0]?.blob_pathname ?? null;
}

/** Bitta yozuvni (blob_pathname bilan) topadi — proksi route'da EGALIKNI
 * tekshirish uchun (boshqa foydalanuvchining rasmini so'rab bo'lmasligi kerak). */
export async function getPregnancyAlbumPhoto(userId: string, id: string): Promise<{ blobPathname: string } | null> {
  await ensureSchema();
  const rows = (await sql`
    SELECT blob_pathname FROM pregnancy_album_photos WHERE id = ${id} AND user_id = ${userId}
  `) as unknown as { blob_pathname: string }[];
  return rows[0] ? { blobPathname: rows[0].blob_pathname } : null;
}

// ---------------------------------------------------------------------------
// Obuna (Premium) — izoh uchun packages/shared/src/types.ts#Subscription'ga
// qarang. Holat (aktiv/muddati o'tgan) SAQLANMAYDI — har doim `expires_at`dan
// hisoblanadi, shu bilan ikkita maydon orasidagi sinxronizatsiya xatosining
// oldi olinadi.
// ---------------------------------------------------------------------------

interface SubscriptionRow {
  user_id: string;
  plan: string;
  expires_at: string | null;
  granted_by: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

function subscriptionFromRow(row: SubscriptionRow): Subscription {
  return {
    userId: row.user_id,
    plan: "premium",
    expiresAt: row.expires_at,
    grantedBy: row.granted_by,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getSubscription(userId: string): Promise<Subscription | null> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM subscriptions WHERE user_id = ${userId}`) as unknown as SubscriptionRow[];
  return rows[0] ? subscriptionFromRow(rows[0]) : null;
}

/** `getSubscription` + shu yerda vaqtni tekshirishni takrorlamaslik uchun —
 * chat/statistika route'lari shu bittasini chaqirishi kifoya. */
export async function hasPremiumAccess(userId: string): Promise<boolean> {
  await ensureSchema();
  const rows = (await sql`
    SELECT 1 FROM subscriptions
    WHERE user_id = ${userId} AND (expires_at IS NULL OR (expires_at)::timestamptz > now())
  `) as unknown as unknown[];
  return rows.length > 0;
}

/** Admin panel orqali qo'lda faollashtirish — to'lov provayderi ulanmaguncha
 * shu yagona yo'l (masalan mijoz Click/Payme'ga to'g'ridan-to'g'ri o'tkazma
 * qilgach). Kelajakda haqiqiy to'lov webhook'i ham aynan shu funksiyani
 * chaqiradi, faqat `grantedBy`ni provayder nomiga o'zgartirib. */
export async function grantPremium(
  userId: string,
  input: { durationDays: number | null; note: string | null; grantedBy?: string }
): Promise<Subscription> {
  await ensureSchema();
  const createdAt = now();
  const expiresAt = input.durationDays ? new Date(Date.now() + input.durationDays * 86400000).toISOString() : null;
  const grantedBy = input.grantedBy ?? "admin";
  await sql`
    INSERT INTO subscriptions (user_id, plan, expires_at, granted_by, note, created_at, updated_at)
    VALUES (${userId}, 'premium', ${expiresAt}, ${grantedBy}, ${input.note}, ${createdAt}, ${createdAt})
    ON CONFLICT (user_id) DO UPDATE SET
      expires_at = EXCLUDED.expires_at, granted_by = EXCLUDED.granted_by, note = EXCLUDED.note, updated_at = EXCLUDED.updated_at
  `;
  return { userId, plan: "premium", expiresAt, grantedBy, note: input.note, createdAt, updatedAt: createdAt };
}

export async function revokePremium(userId: string): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM subscriptions WHERE user_id = ${userId}`;
}

export async function listSubscriptionsAdmin(params: { search?: string; limit?: number; offset?: number }): Promise<{
  subscriptions: (Subscription & { name: string | null; phone: string | null; active: boolean })[];
  total: number;
}> {
  await ensureSchema();
  const limit = params.limit ?? 30;
  const offset = params.offset ?? 0;
  const q = params.search?.trim();
  const searchPattern = q ? `%${q}%` : null;
  const searchClause = searchPattern ? sql`AND (u.name ILIKE ${searchPattern} OR u.phone ILIKE ${searchPattern})` : sql``;

  const rows = (await sql`
    SELECT s.*, u.name, u.phone
    FROM subscriptions s
    JOIN users u ON u.id = s.user_id
    WHERE TRUE ${searchClause}
    ORDER BY s.updated_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `) as unknown as (SubscriptionRow & { name: string | null; phone: string | null })[];

  const [{ count }] = (await sql`
    SELECT count(*)::int as count FROM subscriptions s JOIN users u ON u.id = s.user_id WHERE TRUE ${searchClause}
  `) as unknown as { count: number }[];

  return {
    total: count,
    subscriptions: rows.map((r) => ({
      ...subscriptionFromRow(r),
      name: r.name,
      phone: r.phone,
      active: r.expires_at === null || new Date(r.expires_at) > new Date(),
    })),
  };
}

// ---------------------------------------------------------------------------
// AI'ning proaktiv ("faol") tahlili — izoh uchun db.ts#ai_active_insights'ga
// qarang. Bitta userga bitta joriy yozuv (cycle_settings kabi singleton naqsh).
// ---------------------------------------------------------------------------

export interface ActiveInsight {
  content: string;
  logsCountAtGeneration: number;
  // FIX2-26: yozuvlar SONI o'zgarmagan, lekin MAVJUD yozuv tahrirlangan
  // holatni ham aniqlash uchun (getMaxCycleLogUpdatedAt() qiymati).
  logsUpdatedAtAtGeneration: string | null;
  generatedAt: string;
}

export async function getActiveInsight(userId: string): Promise<ActiveInsight | null> {
  await ensureSchema();
  const rows = (await sql`
    SELECT content, logs_count_at_generation, logs_updated_at_at_generation, generated_at
    FROM ai_active_insights WHERE user_id = ${userId}
  `) as unknown as {
    content: string;
    logs_count_at_generation: number;
    logs_updated_at_at_generation: string | null;
    generated_at: string;
  }[];
  const r = rows[0];
  return r
    ? {
        content: r.content,
        logsCountAtGeneration: r.logs_count_at_generation,
        logsUpdatedAtAtGeneration: r.logs_updated_at_at_generation,
        generatedAt: r.generated_at,
      }
    : null;
}

export async function saveActiveInsight(
  userId: string,
  input: { content: string; logsCountAtGeneration: number; logsUpdatedAtAtGeneration: string | null }
): Promise<void> {
  await ensureSchema();
  const generatedAt = now();
  await sql`
    INSERT INTO ai_active_insights (user_id, content, logs_count_at_generation, logs_updated_at_at_generation, generated_at)
    VALUES (${userId}, ${input.content}, ${input.logsCountAtGeneration}, ${input.logsUpdatedAtAtGeneration}, ${generatedAt})
    ON CONFLICT (user_id) DO UPDATE SET
      content = EXCLUDED.content, logs_count_at_generation = EXCLUDED.logs_count_at_generation,
      logs_updated_at_at_generation = EXCLUDED.logs_updated_at_at_generation, generated_at = EXCLUDED.generated_at
  `;
}

export async function getKicksToday(userId: string): Promise<number> {
  await ensureSchema();
  const rows = (await sql`
    SELECT count FROM pregnancy_kicks WHERE user_id = ${userId} AND date = ${today()}
  `) as unknown as { count: number }[];
  return rows[0]?.count ?? 0;
}

export async function incrementKicks(userId: string): Promise<number> {
  await ensureSchema();
  await sql`
    INSERT INTO pregnancy_kicks (user_id, date, count) VALUES (${userId}, ${today()}, 1)
    ON CONFLICT (user_id, date) DO UPDATE SET count = pregnancy_kicks.count + 1
  `;
  return getKicksToday(userId);
}

/* ------------------------------------------------------------------ *
 * TODAY-02 — kunlik "Check-in" kartalari javoblari.
 * ------------------------------------------------------------------ */

export async function getCheckinAnswers(userId: string): Promise<CheckinResponse> {
  await ensureSchema();
  const rows = (await sql`
    SELECT question_key, answer FROM checkin_answers WHERE user_id = ${userId} AND date = ${today()}
  `) as unknown as { question_key: string; answer: boolean }[];
  return { date: today(), answers: rows.map((r) => ({ questionKey: r.question_key, answer: r.answer })) };
}

/** Bir savolga javob. Foydalanuvchi fikrini o'zgartirsa YANGILANADI — shu
 * sababli `ON CONFLICT ... DO UPDATE` (dublikat yozuv yaratilmaydi). */
export async function saveCheckinAnswer(userId: string, questionKey: string, answer: boolean): Promise<CheckinResponse> {
  await ensureSchema();
  await sql`
    INSERT INTO checkin_answers (user_id, date, question_key, answer, created_at)
    VALUES (${userId}, ${today()}, ${questionKey}, ${answer}, ${now()})
    ON CONFLICT (user_id, date, question_key) DO UPDATE SET answer = ${answer}, created_at = ${now()}
  `;
  return getCheckinAnswers(userId);
}

export async function getWellnessToday(userId: string): Promise<WellnessLog> {
  await ensureSchema();
  const rows = (await sql`
    SELECT water_ml, calories FROM wellness_logs WHERE user_id = ${userId} AND date = ${today()}
  `) as unknown as { water_ml: number; calories: number }[];
  const row = rows[0];
  return { date: today(), waterMl: row?.water_ml ?? 0, calories: row?.calories ?? 0 };
}

/** `deltaMl` manfiy ham bo'lishi mumkin (foydalanuvchi "ortiqcha qo'shdim"
 * bosgan bo'lsa bekor qilish) — GREATEST bilan manfiy umumiy qiymatga
 * tushib ketishning oldi olinadi. */
export async function addWater(userId: string, deltaMl: number): Promise<WellnessLog> {
  await ensureSchema();
  await sql`
    INSERT INTO wellness_logs (user_id, date, water_ml, calories) VALUES (${userId}, ${today()}, GREATEST(0, ${deltaMl}), 0)
    ON CONFLICT (user_id, date) DO UPDATE SET water_ml = GREATEST(0, wellness_logs.water_ml + ${deltaMl})
  `;
  return getWellnessToday(userId);
}

export async function addCalories(userId: string, deltaKcal: number): Promise<WellnessLog> {
  await ensureSchema();
  await sql`
    INSERT INTO wellness_logs (user_id, date, water_ml, calories) VALUES (${userId}, ${today()}, 0, GREATEST(0, ${deltaKcal}))
    ON CONFLICT (user_id, date) DO UPDATE SET calories = GREATEST(0, wellness_logs.calories + ${deltaKcal})
  `;
  return getWellnessToday(userId);
}

interface VitalRow {
  id: string;
  user_id: string;
  type: VitalType;
  value: string;
  recorded_at: string;
  created_at: string;
}

function vitalFromRow(row: VitalRow): PregnancyVitalLog {
  return { id: row.id, userId: row.user_id, type: row.type, value: row.value, recordedAt: row.recorded_at, createdAt: row.created_at };
}

/** Turi bo'yicha eng so'nggi (created_at bo'yicha) yozuvlar — 2 tasi (delta hisoblash uchun). */
export async function listRecentVitalsByType(userId: string, type: VitalType, limit = 2): Promise<PregnancyVitalLog[]> {
  await ensureSchema();
  const rows = (await sql`
    SELECT * FROM pregnancy_vitals WHERE user_id = ${userId} AND type = ${type}
    ORDER BY created_at DESC LIMIT ${limit}
  `) as unknown as VitalRow[];
  return rows.map(vitalFromRow);
}

/** Har bir tur uchun eng so'nggi qayd — bosh sahifadagi "Sog'liq ko'rsatkichlari" bo'limi uchun. */
export async function getLatestVitals(userId: string): Promise<Partial<Record<VitalType, PregnancyVitalLog>>> {
  const types: VitalType[] = ["heart_rate", "blood_pressure", "weight", "temperature"];
  const result: Partial<Record<VitalType, PregnancyVitalLog>> = {};
  for (const type of types) {
    const [latest] = await listRecentVitalsByType(userId, type, 1);
    if (latest) result[type] = latest;
  }
  return result;
}

export async function addPregnancyVital(
  userId: string,
  type: VitalType,
  value: string,
  recordedAt?: string
): Promise<PregnancyVitalLog> {
  await ensureSchema();
  const id = randomUUID();
  const createdAt = now();
  const recorded = recordedAt ?? today();
  await sql`
    INSERT INTO pregnancy_vitals (id, user_id, type, value, recorded_at, created_at)
    VALUES (${id}, ${userId}, ${type}, ${value}, ${recorded}, ${createdAt})
  `;
  return { id, userId, type, value, recordedAt: recorded, createdAt };
}

// ---------------------------------------------------------------------------
// Checklist
// ---------------------------------------------------------------------------

interface ChecklistRow {
  id: string;
  user_id: string;
  type: ChecklistItemType;
  status: ChecklistItem["status"];
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

function checklistFromRow(row: ChecklistRow): ChecklistItem {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    status: row.status,
    dueDate: row.due_date,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    isFree: CHECKLIST_ITEM_IS_FREE[row.type],
  };
}

export async function listChecklistItems(userId: string): Promise<ChecklistItem[]> {
  await ensureSchema();
  const rows = (await sql`
    SELECT * FROM checklist_items WHERE user_id = ${userId} ORDER BY (due_date IS NULL), due_date ASC
  `) as unknown as ChecklistRow[];

  const todayStr = today();
  const items = rows.map(checklistFromRow);

  // Muddati o'tgan bandlarni belgilaymiz (spec §4: "Muddati o'tgan bandlar uchun eslatma").
  for (const item of items) {
    if (item.status === "pending" && item.dueDate && item.dueDate < todayStr) {
      await sql`UPDATE checklist_items SET status = 'overdue' WHERE id = ${item.id}`;
      item.status = "overdue";
    }
  }
  return items;
}

/**
 * ATTN-01 — muddati o'tgan tekshiruvlar SONI (pastki menyudagi belgi uchun).
 *
 * `listChecklistItems` dan ataylab alohida: u butun ro'yxatni o'qiydi VA
 * yon ta'sir sifatida statuslarni yangilaydi. Bu esa HAR SAHIFADA
 * chaqiriladi, shuning uchun faqat sanaydi — hech narsa yozmaydi.
 */
export async function countOverdueChecklistItems(userId: string): Promise<number> {
  await ensureSchema();
  const [{ n }] = (await sql`
    SELECT count(*)::int AS n FROM checklist_items
    WHERE user_id = ${userId}
      AND status IN ('pending', 'overdue')
      AND due_date IS NOT NULL
      AND due_date < ${today()}
  `) as unknown as { n: number }[];
  return n;
}

export async function ensureChecklistItem(
  userId: string,
  type: ChecklistItemType,
  dueDate: string | null,
  recurrenceDays?: number
): Promise<void> {
  await ensureSchema();
  // FIX-UX-03: ilgari SELECT (faqat 'done' bo'lmagan qatorlarni qidirib) +
  // keyin shartli INSERT edi — bu ikkita muammoga olib kelardi: (1) tekshirish
  // va yozish orasida tranzaksiya yo'q edi (race condition — parallel
  // chaqiruvlar dublikat qator yaratardi), (2) status 'done' bo'lgach, keyingi
  // chaqiruv "existing" deb hech narsa topmay, ESKI 'done' qator yonida
  // YANGI 'pending' qator qo'shardi — foydalanuvchiga bir xil band ikki marta
  // (biri bajarilgan, biri kutilayotgan) ko'rinardi. Endi `checklist_items(user_id,
  // type)`dagi UNIQUE indeksga (db.ts) tayanib, bitta atomik
  // INSERT ... ON CONFLICT DO NOTHING — takroriy chaqiruv hech narsa qilmaydi.
  await sql`
    INSERT INTO checklist_items (id, user_id, type, status, due_date, created_at)
    VALUES (${randomUUID()}, ${userId}, ${type}, 'pending', ${dueDate}, ${now()})
    ON CONFLICT (user_id, type) DO NOTHING
  `;
  // FIX-CHECKUPS: davriy (masalan yillik) tekshiruvlar uchun — yuqoridagi
  // UNIQUE cheklov bir turdan faqat bitta qator saqlab turadi, shuning uchun
  // 'done' bo'lgan qator abadiy shu holatda qolib ketardi (keyingi yilgi
  // tekshiruv hech qachon "kutilayotgan"ga aylanmasdi). `recurrenceDays`
  // berilgan bo'lsa va oxirgi bajarilgandan beri shuncha kun o'tgan bo'lsa —
  // qatorni yangi due_date bilan qayta 'pending'ga qaytaradi. Bir martalik
  // bandlar (recurrenceDays berilmagan) hech qachon qayta ochilmaydi —
  // homiladorlik bandlari uchun ilgaridan mavjud xatti-harakat bilan bir xil.
  if (recurrenceDays != null) {
    await sql`
      UPDATE checklist_items
      SET status = 'pending', due_date = ${dueDate}, completed_at = NULL
      WHERE user_id = ${userId} AND type = ${type} AND status = 'done'
        AND completed_at IS NOT NULL
        AND (completed_at)::timestamptz < (now() - make_interval(days => ${recurrenceDays}))
    `;
  }
}

// WEB3-01 (xavfsizlik): CHECKLIST_ITEM_IS_FREE ilgari FAQAT mijoz tomonda
// (UI'da tugmani ko'rsatish/yashirish uchun) tekshirilardi — bu funksiyaning
// o'zi hech qanday premium tekshiruvi qilmasdi, shuning uchun to'g'ridan-
// to'g'ri POST /api/checklist/[id]/complete so'rovi bilan har qanday
// (pullik) bandni bepul "bajarilgan" deb belgilash mumkin edi.
/**
 * PAYWALL-01: tekshiruvni "bajarildi" deb belgilash — HAMMAGA bepul.
 *
 * Ilgari bu yerda paywall bor edi va u `CHECKLIST_ITEM_IS_FREE` bayrog'iga
 * tayanardi. Lekin o'sha bayroqning ma'nosi butunlay boshqa: u
 * "DAVLAT POLIKLINIKASI shu tekshiruvni qoplaydimi" degan savolga javob
 * beradi (ekrandagi "Bepul/Pullik" belgisi ham shundan). Uni paywall
 * sifatida ishlatish quyidagi ma'noni bergan edi:
 *
 *   "Siz xususiy klinikaga o'z pulingizni to'lab UTT qildingiz —
 *    endi buni belgilab qo'yish uchun BIZGA ham to'lang."
 *
 * Ya'ni sog'lig'i uchun eng ko'p harakat qilayotgan ayol jazolanardi.
 *
 * Production o'lchovi (2026-09-23) buni tasdiqladi:
 *   • 74 ayolda jami 179 ta shunday to'sib qo'yilgan band bor edi;
 *   • ularning NOL tasi "bajarildi" deb belgilangan;
 *   • umuman belgilanganlar — 6 ta, hammasi bepul turdagi.
 *
 * Ya'ni to'siq daromad keltirmagan (2 ta obunachi ham boshqa sabab bilan),
 * lekin mahsulotning ASOSIY halqasini — "tekshiruvni bajardim" deyishni —
 * to'sib qo'ygan. Ustiga u bizdan eng qimmatli ma'lumotni olib qo'ygan:
 * ayol tekshiruvni HAQIQATAN o'tkazdimi degan natija.
 *
 * `CHECKLIST_ITEM_IS_FREE` o'z asl vazifasida qoladi — ekranda klinika
 * narxini ko'rsatish uchun.
 */
export async function completeChecklistItem(userId: string, id: string): Promise<void> {
  await ensureSchema();
  await sql`
    UPDATE checklist_items SET status = 'done', completed_at = ${now()} WHERE id = ${id} AND user_id = ${userId}
  `;
}

/**
 * CHECKLIST-PRUNE-01 — foydalanuvchiga ENDI tegishli bo'lmagan bandlarni
 * ro'yxatdan olib tashlaydi.
 *
 * Nega kerak: `syncChecklistForUser` faqat QO'SHARDI, hech qachon olib
 * tashlamasdi. Natijada holat o'zgargach eski bandlar abadiy qolib ketardi
 * va ro'yxat YOLG'ON gapirardi. Production'da bu aniq zarar berdi: soxta
 * homiladorlik belgisi tufayli 10 ayolga 23 ta homiladorlik tekshiruvi
 * qo'shilgan, keyin belgi to'g'rilangandan keyin ham ular ro'yxatda
 * qolavergan (PREG-STATE-01). Shu sinf xatosi yana takrorlanmasligi uchun.
 *
 * XAVFSIZLIK CHEGARALARI — nima O'CHIRILMAYDI:
 *  - `done` bandlar. Ular ayolning HAQIQIY tarixi: "men buni qildim".
 *    Qoida o'zgargani bu faktni bekor qilmaydi.
 *  - `keepTypes` bo'sh bo'lsa — HECH NARSA. Bo'sh ro'yxat haqiqiy holatdan
 *    ko'ra ko'proq xatoga o'xshaydi (masalan profil vaqtincha o'qilmagan),
 *    va bunda butun ro'yxatni supurib tashlash og'ir zarar bo'lardi.
 *
 * Bog'langan `referral_events` qatorlari saqlanadi (FK endi SET NULL) —
 * ayolning "klinika qidirdim" harakati yo'qolmaydi.
 */
export async function removeStaleChecklistItems(userId: string, keepTypes: ChecklistItemType[]): Promise<number> {
  await ensureSchema();
  if (keepTypes.length === 0) return 0;
  const rows = (await sql`
    DELETE FROM checklist_items
    WHERE user_id = ${userId}
      AND status IN ('pending', 'overdue')
      AND NOT (type = ANY(${keepTypes}))
    RETURNING id
  `) as unknown as { id: string }[];
  return rows.length;
}

// ---------------------------------------------------------------------------
// Clinics + referrals
// ---------------------------------------------------------------------------

interface ClinicRow {
  id: string;
  name: string;
  address: string;
  region: string;
  lat: number;
  lng: number;
  phone: string;
  specialties: string;
  free_screening: boolean;
}

function clinicFromRow(row: ClinicRow): Clinic {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    region: row.region,
    lat: row.lat,
    lng: row.lng,
    phone: row.phone,
    specialties: JSON.parse(row.specialties),
    freeScreening: !!row.free_screening,
    isSeedData: true,
  };
}

export async function listClinics(): Promise<Clinic[]> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM clinics ORDER BY name ASC`) as unknown as ClinicRow[];
  return rows.map(clinicFromRow);
}

export async function logReferralEvent(
  userId: string,
  payload: { clinicId: string; checklistItemId: string | null; action: ReferralAction }
): Promise<void> {
  await ensureSchema();
  await sql`
    INSERT INTO referral_events (id, user_id, clinic_id, checklist_item_id, action, created_at)
    VALUES (${randomUUID()}, ${userId}, ${payload.clinicId}, ${payload.checklistItemId}, ${payload.action}, ${now()})
  `;
}

// ---------------------------------------------------------------------------
// Illyustratsiyalar — admin panelda tanlanadigan rasmlar (har bir "joy" mustaqil).
// ---------------------------------------------------------------------------

/** Hozirgi holat — DB'da yozuv bo'lmagan slot uchun DEFAULT_SLOT_ASSIGNMENTS
 * ishlatiladi (shu tufayli admin hali hech narsa o'zgartirmagan bo'lsa ham
 * ilova ilgarigidek ko'rinadi). */
export async function getIllustrationSlots(): Promise<Record<IllustrationSlotKey, string>> {
  await ensureSchema();
  const rows = (await sql`SELECT slot_key, illustration_slug FROM illustration_slots`) as unknown as {
    slot_key: string;
    illustration_slug: string;
  }[];
  const overrides = new Map(rows.map((r) => [r.slot_key, r.illustration_slug]));
  const result = {} as Record<IllustrationSlotKey, string>;
  for (const key of SLOT_KEYS) {
    result[key] = overrides.get(key) ?? DEFAULT_SLOT_ASSIGNMENTS[key];
  }
  return result;
}

export async function setIllustrationSlot(slotKey: IllustrationSlotKey, slug: string): Promise<void> {
  await ensureSchema();
  await sql`
    INSERT INTO illustration_slots (slot_key, illustration_slug, updated_at)
    VALUES (${slotKey}, ${slug}, ${now()})
    ON CONFLICT (slot_key) DO UPDATE SET illustration_slug = ${slug}, updated_at = ${now()}
  `;
}

// ---------------------------------------------------------------------------
// Xavf-testi (App.pdf §19)
// ---------------------------------------------------------------------------

interface RiskQuizRow {
  user_id: string;
  answers: string;
  score: number;
  level: RiskLevel;
  completed_at: string;
}

function riskQuizFromRow(row: RiskQuizRow): RiskQuizResult {
  return {
    userId: row.user_id,
    answers: JSON.parse(row.answers) as RiskQuizAnswers,
    score: row.score,
    level: row.level,
    completedAt: row.completed_at,
  };
}

export async function getRiskQuizResult(userId: string): Promise<RiskQuizResult | null> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM risk_quiz_results WHERE user_id = ${userId}`) as unknown as RiskQuizRow[];
  const row = rows[0];
  return row ? riskQuizFromRow(row) : null;
}

export async function saveRiskQuizResult(
  userId: string,
  answers: RiskQuizAnswers,
  score: number,
  level: RiskLevel
): Promise<RiskQuizResult> {
  await ensureSchema();
  const completedAt = now();
  const answersJson = JSON.stringify(answers);
  await sql`
    INSERT INTO risk_quiz_results (user_id, answers, score, level, completed_at)
    VALUES (${userId}, ${answersJson}, ${score}, ${level}, ${completedAt})
    ON CONFLICT (user_id) DO UPDATE SET
      answers = EXCLUDED.answers, score = EXCLUDED.score, level = EXCLUDED.level, completed_at = EXCLUDED.completed_at
  `;
  return { userId, answers, score, level, completedAt };
}

// ---------------------------------------------------------------------------
// Maqolalar (App.pdf §20)
// ---------------------------------------------------------------------------

interface ArticleRow {
  id: string;
  slug: string;
  category: ArticleCategory;
  title: string;
  excerpt: string;
  body: string;
}

function articleFromRow(row: ArticleRow): Article {
  return {
    id: row.id,
    slug: row.slug,
    category: row.category,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    isSeedData: true,
  };
}

export async function listArticles(): Promise<Article[]> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM articles ORDER BY title ASC`) as unknown as ArticleRow[];
  return rows.map(articleFromRow);
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM articles WHERE slug = ${slug}`) as unknown as ArticleRow[];
  const row = rows[0];
  return row ? articleFromRow(row) : null;
}

export async function createArticle(article: Omit<Article, "id" | "isSeedData">): Promise<Article> {
  await ensureSchema();
  const id = randomUUID();
  await sql`
    INSERT INTO articles (id, slug, category, title, excerpt, body)
    VALUES (${id}, ${article.slug}, ${article.category}, ${article.title}, ${article.excerpt}, ${article.body})
  `;
  return { id, ...article, isSeedData: true };
}

export async function updateArticle(id: string, patch: Partial<Omit<Article, "id" | "isSeedData">>): Promise<void> {
  await ensureSchema();
  const current = (await sql`SELECT * FROM articles WHERE id = ${id}`) as unknown as ArticleRow[];
  const row = current[0];
  if (!row) throw new ApiError(404, "Maqola topilmadi");
  const merged = { ...articleFromRow(row), ...patch };
  await sql`
    UPDATE articles SET slug = ${merged.slug}, category = ${merged.category}, title = ${merged.title},
      excerpt = ${merged.excerpt}, body = ${merged.body}
    WHERE id = ${id}
  `;
}

export async function deleteArticle(id: string): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM articles WHERE id = ${id}`;
}

// ---------------------------------------------------------------------------
// Admin — klinikalar CRUD
// ---------------------------------------------------------------------------

export async function createClinic(clinic: Omit<Clinic, "id" | "isSeedData">): Promise<Clinic> {
  await ensureSchema();
  const id = randomUUID();
  await sql`
    INSERT INTO clinics (id, name, address, region, lat, lng, phone, specialties, free_screening)
    VALUES (${id}, ${clinic.name}, ${clinic.address}, ${clinic.region}, ${clinic.lat}, ${clinic.lng}, ${clinic.phone}, ${JSON.stringify(clinic.specialties)}, ${clinic.freeScreening})
  `;
  return { id, ...clinic, isSeedData: true };
}

export async function updateClinic(id: string, patch: Partial<Omit<Clinic, "id" | "isSeedData">>): Promise<void> {
  await ensureSchema();
  const current = (await sql`SELECT * FROM clinics WHERE id = ${id}`) as unknown as ClinicRow[];
  const row = current[0];
  if (!row) throw new ApiError(404, "Klinika topilmadi");
  const merged = { ...clinicFromRow(row), ...patch };
  await sql`
    UPDATE clinics SET name = ${merged.name}, address = ${merged.address}, region = ${merged.region},
      lat = ${merged.lat}, lng = ${merged.lng}, phone = ${merged.phone},
      specialties = ${JSON.stringify(merged.specialties)}, free_screening = ${merged.freeScreening}
    WHERE id = ${id}
  `;
}

export async function deleteClinic(id: string): Promise<void> {
  await ensureSchema();
  // FIX3-20: referral_events.clinic_id endi ON DELETE SET NULL bo'lsa-da,
  // boshqa (kelajakdagi) FK xom "foreign_key_violation" (23503) xatosini
  // partner-links'dagi kabi tushunarli xabarga aylantiramiz — 500 o'rniga.
  try {
    await sql`DELETE FROM clinics WHERE id = ${id}`;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "23503") {
      throw new ApiError(409, "Bu klinika hali ishlatilmoqda, o'chirib bo'lmadi");
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Admin — foydalanuvchilar ro'yxati va boshqaruvi
// ---------------------------------------------------------------------------

export interface AdminUserSummary extends User {
  primaryGoal: OnboardingProfile["primaryGoal"] | null;
  cycleLogsCount: number;
  lastActiveAt: string | null;
}

export async function listUsersAdmin(params: { search?: string; limit?: number; offset?: number }): Promise<{
  users: AdminUserSummary[];
  total: number;
}> {
  await ensureSchema();
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;
  const q = params.search?.trim();
  const searchPattern = q ? `%${q}%` : null;

  // `is_test_account` (masalan Play Store tekshiruvchisi) — admin ro'yxatida
  // umuman ko'rinmasligi kerak, shuning uchun har doim (qidiruvdan qat'iy
  // nazar) chetlab o'tiladi.
  const searchClause = searchPattern
    ? sql`AND (u.name ILIKE ${searchPattern} OR u.phone ILIKE ${searchPattern} OR u.email ILIKE ${searchPattern})`
    : sql``;

  const rows = (await sql`
    SELECT u.*, o.primary_goal,
      (SELECT count(*) FROM cycle_logs c WHERE c.user_id = u.id)::int AS cycle_logs_count,
      GREATEST(
        (SELECT max(c.created_at) FROM cycle_logs c WHERE c.user_id = u.id),
        (SELECT max(v.created_at) FROM pregnancy_vitals v WHERE v.user_id = u.id),
        (SELECT max(k.completed_at) FROM checklist_items k WHERE k.user_id = u.id AND k.completed_at IS NOT NULL)
      ) AS last_active_at
    FROM users u
    LEFT JOIN onboarding_profiles o ON o.user_id = u.id
    WHERE u.is_test_account = FALSE ${searchClause}
    ORDER BY u.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `) as unknown as (UserRow & { primary_goal: OnboardingProfile["primaryGoal"] | null; cycle_logs_count: number; last_active_at: string | null })[];

  const [{ count }] = (await sql`
    SELECT count(*)::int as count FROM users u WHERE u.is_test_account = FALSE ${searchClause}
  `) as unknown as { count: number }[];

  return {
    total: count,
    users: rows.map((row) => ({
      ...userFromRow(row),
      primaryGoal: row.primary_goal,
      cycleLogsCount: row.cycle_logs_count,
      lastActiveAt: row.last_active_at,
    })),
  };
}

export async function deleteUserAdmin(id: string): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM users WHERE id = ${id}`;
}

// ---------------------------------------------------------------------------
// Admin — hamjamiyat moderatsiyasi (post/izoh o'chirish-tahrirlash, foydalanuvchi
// bloklash "imkoni bo'lsa yaxshi" so'rovi bo'yicha qo'shildi).
// ---------------------------------------------------------------------------

export interface AdminCommunityPost extends CommunityPost {
  authorId: string;
  authorPhone: string | null;
}

function adminCommunityPostFromRow(row: CommunityPostRow & { author_id: string; author_phone: string | null }): AdminCommunityPost {
  return {
    id: row.id,
    tag: row.tag,
    body: row.body,
    isAnonymous: row.is_anonymous,
    // Admin uchun muallif har doim ko'rsatiladi — anonim postlarda ham
    // qoidabuzarlik holatida foydalanuvchini aniqlash imkoni bo'lishi kerak.
    authorName: row.author_name,
    authorAvatarUrl: row.author_avatar_url,
    likesCount: row.likes_count,
    commentsCount: row.comments_count,
    viewerLiked: false,
    isOwn: false,
    createdAt: row.created_at,
    authorId: row.author_id,
    authorPhone: row.author_phone,
  };
}

export async function listCommunityPostsAdmin(params: { search?: string; limit?: number; offset?: number }): Promise<{
  posts: AdminCommunityPost[];
  total: number;
}> {
  await ensureSchema();
  const limit = params.limit ?? 30;
  const offset = params.offset ?? 0;
  const q = params.search?.trim();
  const searchPattern = q ? `%${q}%` : null;
  const whereClause = searchPattern ? sql`WHERE p.body ILIKE ${searchPattern} OR u.name ILIKE ${searchPattern}` : sql``;

  const rows = (await sql`
    SELECT p.*, u.name as author_name, u.avatar_url as author_avatar_url, u.id as author_id, u.phone as author_phone
    FROM community_posts p
    JOIN users u ON u.id = p.user_id
    ${whereClause}
    ORDER BY p.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `) as unknown as (CommunityPostRow & { author_id: string; author_phone: string | null })[];
  const [{ count }] = (await sql`
    SELECT count(*)::int as count FROM community_posts p JOIN users u ON u.id = p.user_id ${whereClause}
  `) as unknown as { count: number }[];

  return { total: count, posts: rows.map(adminCommunityPostFromRow) };
}

export async function updateCommunityPostAdmin(postId: string, body: string): Promise<void> {
  await ensureSchema();
  await sql`UPDATE community_posts SET body = ${body} WHERE id = ${postId}`;
}

export async function deleteCommunityPostAdmin(postId: string): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM community_posts WHERE id = ${postId}`;
}

export async function listCommunityCommentsAdmin(postId: string): Promise<(CommunityComment & { authorId: string; authorPhone: string | null })[]> {
  await ensureSchema();
  const rows = (await sql`
    SELECT c.*, u.name as author_name, u.avatar_url as author_avatar_url, u.id as author_id, u.phone as author_phone
    FROM community_comments c
    JOIN users u ON u.id = c.user_id
    WHERE c.post_id = ${postId}
    ORDER BY c.created_at ASC
  `) as unknown as (CommunityCommentRow & { author_id: string; author_phone: string | null })[];
  return rows.map((row) => ({
    id: row.id,
    postId: row.post_id,
    body: row.body,
    isAnonymous: row.is_anonymous,
    authorName: row.author_name,
    authorAvatarUrl: row.author_avatar_url,
    isOwn: false,
    createdAt: row.created_at,
    authorId: row.author_id,
    authorPhone: row.author_phone,
  }));
}

// WEB3-07: FIX2-28'da toggleCommunityLike'ga xuddi shu turdagi tuzatish
// kiritilgan edi — DELETE 0 qator o'zgartirsa ham (masalan izoh
// allaqachon o'chirilgan/boshqa admin tomonidan) comments_count shartsiz
// kamayardi, vaqt o'tishi bilan haqiqiy izohlar soni bilan
// comments_count orasida farq to'planardi.
export async function deleteCommunityCommentAdmin(postId: string, commentId: string): Promise<void> {
  await ensureSchema();
  const deleted = await sql`DELETE FROM community_comments WHERE id = ${commentId} AND post_id = ${postId}`;
  if (deleted.count > 0) {
    await sql`UPDATE community_posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = ${postId}`;
  }
}

// ---------------------------------------------------------------------------
// Admin — statistika (bosh sahifasi uchun)
// ---------------------------------------------------------------------------

export interface AdminStats {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  activeUsersLast7Days: number;
  languageBreakdown: { language: Language; count: number }[];
  goalBreakdown: { goal: string; count: number }[];
  contentCounts: {
    cycleLogs: number;
    pregnancyVisits: number;
    pregnancyVitals: number;
    checklistCompleted: number;
    riskQuizResults: number;
    referralEvents: number;
    clinics: number;
    articles: number;
  };
  signupsByDay: { day: string; count: number }[];
}

export async function getAdminStats(): Promise<AdminStats> {
  await ensureSchema();

  const [
    [{ count: totalUsers }],
    [{ count: newUsersToday }],
    [{ count: newUsersThisWeek }],
    [{ count: activeUsersLast7Days }],
    languageRows,
    goalRows,
    [{ count: cycleLogs }],
    [{ count: pregnancyVisits }],
    [{ count: pregnancyVitals }],
    [{ count: checklistCompleted }],
    [{ count: riskQuizResults }],
    [{ count: referralEvents }],
    [{ count: clinicsCount }],
    [{ count: articlesCount }],
    signupsByDayRows,
  ] = (await Promise.all([
    sql`SELECT count(*)::int as count FROM users WHERE is_test_account = FALSE`,
    // DATA-ACCURACY-05: "Bugun ro'yxatdan o'tdi" UI'da KALENDAR kuni
    // ma'nosini beradi (Toshkent bo'yicha bugungi 00:00'dan boshlab), lekin
    // avvalgi so'rov `now() - interval '1 day'` — ya'ni SO'NGGI 24 SOAT
    // (aylanuvchi oyna) edi. Bu ikkalasi FAQAT roppa-rosa yarim tunda bir
    // xil — kuningizning istalgan boshqa vaqtida "bugun" soni kechagi
    // kunning tegishli qismini ham qo'shib, doimo XATO (haqiqatdan katta)
    // ko'rsatilardi. Endi Toshkent mahalliy yarim tunidan hisoblanadi.
    sql`
      SELECT count(*)::int as count FROM users
      WHERE is_test_account = FALSE
        AND (created_at)::timestamptz >= date_trunc('day', now() AT TIME ZONE 'Asia/Tashkent') AT TIME ZONE 'Asia/Tashkent'
    `,
    // DATA-ACCURACY-05: xuddi shu muammo "Shu hafta ro'yxatdan o'tdi"da —
    // "shu hafta" KALENDAR haftasini (dushanbadan boshlab) anglatadi,
    // `now() - interval '7 days'` esa aylanuvchi oyna edi. `Faol (7 kun)`
    // ko'rsatkichi ATAYLAB o'zgartirilmagan — uning o'z yorlig'ida aniq
    // "(7 kun)" deb yozilgan, ya'ni aylanuvchi oyna sifatida TO'G'RI
    // nomlangan (kalendar haftasi degan da'vo yo'q).
    sql`
      SELECT count(*)::int as count FROM users
      WHERE is_test_account = FALSE
        AND (created_at)::timestamptz >= date_trunc('week', now() AT TIME ZONE 'Asia/Tashkent') AT TIME ZONE 'Asia/Tashkent'
    `,
    // WEB3-06: ilgari faqat cycle_logs/pregnancy_vitals/checklist_items
    // hisobga olinardi — wellness_logs (suv/kaloriya), pregnancy_kicks
    // (tepish hisoblagichi), chat_messages (AI Yordamchi), community_posts/
    // community_comments (hamjamiyat), pregnancy_visits (tashrif kundaligi)
    // va feedback_responses (fikr-mulohaza) UMUMAN hisoblanmasdi — real
    // faollik sezilarli kam ko'rsatilardi.
    sql`
      SELECT count(DISTINCT recent.user_id)::int as count FROM (
        SELECT user_id, created_at FROM cycle_logs WHERE (created_at)::timestamptz >= now() - interval '7 days'
        UNION ALL
        SELECT user_id, created_at FROM pregnancy_vitals WHERE (created_at)::timestamptz >= now() - interval '7 days'
        UNION ALL
        SELECT user_id, completed_at FROM checklist_items WHERE completed_at IS NOT NULL AND (completed_at)::timestamptz >= now() - interval '7 days'
        UNION ALL
        SELECT user_id, date FROM wellness_logs WHERE (date)::timestamptz >= now() - interval '7 days'
        UNION ALL
        SELECT user_id, date FROM pregnancy_kicks WHERE (date)::timestamptz >= now() - interval '7 days'
        UNION ALL
        SELECT user_id, created_at FROM chat_messages WHERE (created_at)::timestamptz >= now() - interval '7 days'
        UNION ALL
        SELECT user_id, created_at FROM community_posts WHERE (created_at)::timestamptz >= now() - interval '7 days'
        UNION ALL
        SELECT user_id, created_at FROM community_comments WHERE (created_at)::timestamptz >= now() - interval '7 days'
        UNION ALL
        SELECT user_id, created_at FROM pregnancy_visits WHERE (created_at)::timestamptz >= now() - interval '7 days'
        UNION ALL
        SELECT user_id, created_at FROM feedback_responses WHERE (created_at)::timestamptz >= now() - interval '7 days'
      ) recent
      JOIN users u ON u.id = recent.user_id AND u.is_test_account = FALSE
    `,
    sql`SELECT language, count(*)::int as count FROM users WHERE is_test_account = FALSE GROUP BY language ORDER BY count DESC`,
    sql`
      SELECT o.primary_goal as goal, count(*)::int as count FROM onboarding_profiles o
      JOIN users u ON u.id = o.user_id AND u.is_test_account = FALSE
      GROUP BY o.primary_goal ORDER BY count DESC
    `,
    sql`SELECT count(*)::int as count FROM cycle_logs`,
    sql`SELECT count(*)::int as count FROM pregnancy_visits`,
    sql`SELECT count(*)::int as count FROM pregnancy_vitals`,
    sql`SELECT count(*)::int as count FROM checklist_items WHERE status = 'done'`,
    sql`SELECT count(*)::int as count FROM risk_quiz_results`,
    sql`SELECT count(*)::int as count FROM referral_events`,
    sql`SELECT count(*)::int as count FROM clinics`,
    sql`SELECT count(*)::int as count FROM articles`,
    // DATA-ACCURACY-05: kunlik ustunlar avval `now()::date`/`created_at::date`
    // orqali SESSIYANING standart vaqt zonasida (odatda UTC) guruhlanardi —
    // Toshkent yarim tunidan keyingi (UTC bo'yicha hali "kecha") ro'yxatdan
    // o'tishlar bir kun OLDINGI ustunga tushib qolardi. Endi ikkalasi ham
    // Toshkent mahalliy sanasiga aylantirilgan.
    sql`
      SELECT to_char(d.day, 'YYYY-MM-DD') as day, count(u.id)::int as count
      FROM generate_series(
        (now() AT TIME ZONE 'Asia/Tashkent')::date - interval '29 days',
        (now() AT TIME ZONE 'Asia/Tashkent')::date,
        interval '1 day'
      ) as d(day)
      LEFT JOIN users u ON ((u.created_at)::timestamptz AT TIME ZONE 'Asia/Tashkent')::date = d.day AND u.is_test_account = FALSE
      GROUP BY d.day ORDER BY d.day ASC
    `,
  ])) as unknown as [
    { count: number }[],
    { count: number }[],
    { count: number }[],
    { count: number }[],
    { language: Language; count: number }[],
    { goal: string; count: number }[],
    { count: number }[],
    { count: number }[],
    { count: number }[],
    { count: number }[],
    { count: number }[],
    { count: number }[],
    { count: number }[],
    { count: number }[],
    { day: string; count: number }[],
  ];

  return {
    totalUsers,
    newUsersToday,
    newUsersThisWeek,
    activeUsersLast7Days,
    languageBreakdown: languageRows,
    goalBreakdown: goalRows.filter((r) => r.goal),
    contentCounts: {
      cycleLogs,
      pregnancyVisits,
      pregnancyVitals,
      checklistCompleted,
      riskQuizResults,
      referralEvents,
      clinics: clinicsCount,
      articles: articlesCount,
    },
    signupsByDay: signupsByDayRows,
  };
}

// ---------------------------------------------------------------------------
// Foydalanish analitikasi — mijoz qaysi sahifada qancha vaqt o'tkazgani va
// qaysi tugmani bosgani (admin panel "chuqur tahlil" so'roviga ko'ra qo'shildi).
// ---------------------------------------------------------------------------

const ANALYTICS_TYPES = new Set(["pageview", "click"]);
const ANALYTICS_PLATFORMS = new Set(["web", "mobile"]);

// FIX2-24: /api/analytics/events autentifikatsiyasiz ham ishlaydi (ataylab —
// onboarding tugamasdan oldingi hodisalar uchun), shuning uchun userId
// bo'yicha emas, IP manzil bo'yicha cheklanadi. Chegaralar partner-connect
// (FIX-03)dan yumshoqroq — haqiqiy foydalanuvchi normal foydalanishda ham
// bir necha o'nlab pageview/click hodisasini bir necha daqiqada yig'ib
// yuborishi mumkin, buni bloklab qo'ymaslik kerak.
const ANALYTICS_RATE_LIMIT_MAX_ATTEMPTS = 20;
const ANALYTICS_RATE_LIMIT_WINDOW_SECONDS = 60;
const ANALYTICS_RATE_LIMIT_BLOCK_SECONDS = 5 * 60;

export async function checkAnalyticsIngestRateLimit(ipKey: string): Promise<void> {
  await ensureSchema();
  const rows = (await sql`
    SELECT attempt_count, window_start, blocked_until FROM analytics_ingest_attempts WHERE ip_key = ${ipKey}
  `) as unknown as { attempt_count: number; window_start: string; blocked_until: string | null }[];
  const row = rows[0];
  const nowMs = Date.now();

  if (row?.blocked_until && new Date(row.blocked_until).getTime() > nowMs) {
    throw new ApiError(429, "Juda ko'p so'rov — birozdan keyin qayta urinib ko'ring");
  }

  const windowExpired = !row || new Date(row.window_start).getTime() + ANALYTICS_RATE_LIMIT_WINDOW_SECONDS * 1000 < nowMs;
  if (windowExpired) {
    await sql`
      INSERT INTO analytics_ingest_attempts (ip_key, attempt_count, window_start, blocked_until)
      VALUES (${ipKey}, 1, ${new Date(nowMs).toISOString()}, NULL)
      ON CONFLICT (ip_key) DO UPDATE SET attempt_count = 1, window_start = EXCLUDED.window_start, blocked_until = NULL
    `;
    return;
  }

  const newCount = (row?.attempt_count ?? 0) + 1;
  if (newCount > ANALYTICS_RATE_LIMIT_MAX_ATTEMPTS) {
    const blockedUntil = new Date(nowMs + ANALYTICS_RATE_LIMIT_BLOCK_SECONDS * 1000).toISOString();
    await sql`UPDATE analytics_ingest_attempts SET attempt_count = ${newCount}, blocked_until = ${blockedUntil} WHERE ip_key = ${ipKey}`;
    throw new ApiError(429, "Juda ko'p so'rov — birozdan keyin qayta urinib ko'ring");
  }
  await sql`UPDATE analytics_ingest_attempts SET attempt_count = ${newCount} WHERE ip_key = ${ipKey}`;
}

// FIX3-16: POST /api/auth/phone-code/start autentifikatsiyasiz ishlaydi va
// hech qanday rate-limit yo'q edi — analytics-ingest bilan bir xil
// (foydalanuvchisiz, IP-asoslangan) naqsh.
const PHONE_CODE_START_RATE_LIMIT_MAX_ATTEMPTS = 10;
const PHONE_CODE_START_RATE_LIMIT_WINDOW_SECONDS = 60;
const PHONE_CODE_START_RATE_LIMIT_BLOCK_SECONDS = 10 * 60;

export async function checkPhoneCodeStartRateLimit(ipKey: string): Promise<void> {
  await ensureSchema();
  const rows = (await sql`
    SELECT attempt_count, window_start, blocked_until FROM phone_code_start_attempts WHERE ip_key = ${ipKey}
  `) as unknown as { attempt_count: number; window_start: string; blocked_until: string | null }[];
  const row = rows[0];
  const nowMs = Date.now();

  if (row?.blocked_until && new Date(row.blocked_until).getTime() > nowMs) {
    throw new ApiError(429, "Juda ko'p urinish — birozdan keyin qayta urinib ko'ring");
  }

  const windowExpired = !row || new Date(row.window_start).getTime() + PHONE_CODE_START_RATE_LIMIT_WINDOW_SECONDS * 1000 < nowMs;
  if (windowExpired) {
    await sql`
      INSERT INTO phone_code_start_attempts (ip_key, attempt_count, window_start, blocked_until)
      VALUES (${ipKey}, 1, ${new Date(nowMs).toISOString()}, NULL)
      ON CONFLICT (ip_key) DO UPDATE SET attempt_count = 1, window_start = EXCLUDED.window_start, blocked_until = NULL
    `;
    return;
  }

  const newCount = (row?.attempt_count ?? 0) + 1;
  if (newCount > PHONE_CODE_START_RATE_LIMIT_MAX_ATTEMPTS) {
    const blockedUntil = new Date(nowMs + PHONE_CODE_START_RATE_LIMIT_BLOCK_SECONDS * 1000).toISOString();
    await sql`UPDATE phone_code_start_attempts SET attempt_count = ${newCount}, blocked_until = ${blockedUntil} WHERE ip_key = ${ipKey}`;
    throw new ApiError(429, "Juda ko'p urinish — birozdan keyin qayta urinib ko'ring");
  }
  await sql`UPDATE phone_code_start_attempts SET attempt_count = ${newCount} WHERE ip_key = ${ipKey}`;
}

// FIX3-18: admin login'da hech qanday urinishlar cheklovi yo'q edi (oddiy
// foydalanuvchi OTP'i FIX-04 bilan himoyalangan, lekin admin login emas) —
// IP manzil bo'yicha, tor chegara (bu — eng nozik kirish nuqtasi).
const ADMIN_LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 5;
const ADMIN_LOGIN_RATE_LIMIT_WINDOW_SECONDS = 5 * 60;
const ADMIN_LOGIN_RATE_LIMIT_BLOCK_SECONDS = 15 * 60;

export async function checkAdminLoginRateLimit(ipKey: string): Promise<void> {
  await ensureSchema();
  const rows = (await sql`
    SELECT attempt_count, window_start, blocked_until FROM admin_login_attempts WHERE ip_key = ${ipKey}
  `) as unknown as { attempt_count: number; window_start: string; blocked_until: string | null }[];
  const row = rows[0];
  const nowMs = Date.now();

  if (row?.blocked_until && new Date(row.blocked_until).getTime() > nowMs) {
    throw new ApiError(429, "Juda ko'p urinish — birozdan keyin qayta urinib ko'ring");
  }

  const windowExpired = !row || new Date(row.window_start).getTime() + ADMIN_LOGIN_RATE_LIMIT_WINDOW_SECONDS * 1000 < nowMs;
  if (windowExpired) {
    await sql`
      INSERT INTO admin_login_attempts (ip_key, attempt_count, window_start, blocked_until)
      VALUES (${ipKey}, 1, ${new Date(nowMs).toISOString()}, NULL)
      ON CONFLICT (ip_key) DO UPDATE SET attempt_count = 1, window_start = EXCLUDED.window_start, blocked_until = NULL
    `;
    return;
  }

  const newCount = (row?.attempt_count ?? 0) + 1;
  if (newCount > ADMIN_LOGIN_RATE_LIMIT_MAX_ATTEMPTS) {
    const blockedUntil = new Date(nowMs + ADMIN_LOGIN_RATE_LIMIT_BLOCK_SECONDS * 1000).toISOString();
    await sql`UPDATE admin_login_attempts SET attempt_count = ${newCount}, blocked_until = ${blockedUntil} WHERE ip_key = ${ipKey}`;
    throw new ApiError(429, "Juda ko'p urinish — birozdan keyin qayta urinib ko'ring");
  }
  await sql`UPDATE admin_login_attempts SET attempt_count = ${newCount} WHERE ip_key = ${ipKey}`;
}

/** Bitta to'plamdagi hodisalarni bitta INSERT bilan yozadi — har bir klik/sahifa
 * ko'rish uchun alohida so'rov yubormaslik uchun (mijoz tomon to'playdi, davriy
 * yuboradi). Noto'g'ri (schema'ga mos kelmaydigan) yozuvlar jimgina tashlanadi —
 * analitika ilovaning asosiy ishlashiga ta'sir qilmasligi kerak. */
export async function recordAnalyticsEvents(userId: string | null, events: AnalyticsEventInput[]): Promise<void> {
  const valid = events.filter(
    (e) =>
      ANALYTICS_TYPES.has(e.type) &&
      ANALYTICS_PLATFORMS.has(e.platform) &&
      typeof e.sessionId === "string" &&
      e.sessionId.length > 0 &&
      typeof e.path === "string" &&
      e.path.length > 0
  );
  if (valid.length === 0) return;
  await ensureSchema();
  const createdAt = now();
  const rows = valid.map((e) => ({
    id: randomUUID(),
    user_id: userId,
    session_id: e.sessionId.slice(0, 100),
    platform: e.platform,
    type: e.type,
    path: e.path.slice(0, 300),
    label: e.label ? e.label.slice(0, 150) : null,
    duration_ms: e.durationMs && e.durationMs > 0 ? Math.round(e.durationMs) : null,
    created_at: createdAt,
  }));
  await sql`
    INSERT INTO analytics_events ${sql(rows, "id", "user_id", "session_id", "platform", "type", "path", "label", "duration_ms", "created_at")}
  `;
}

interface AnalyticsDailyRow {
  day: string;
  sessions: number;
  pageviews: number;
  clicks: number;
}

export async function getAnalyticsSummary(days: number): Promise<AnalyticsSummary> {
  await ensureSchema();
  const clampedDays = Math.min(Math.max(Math.round(days) || 14, 1), 90);
  const sinceInterval = `${clampedDays} days`;
  const seriesStartInterval = `${clampedDays - 1} days`;

  const [totalsRows, avgSessionRows, dailyRows, topPagesRows, topButtonsRows, qrSignupRows, pageDropOffRows, liveNowRows, bounceRows] = (await Promise.all([
    sql`
      SELECT count(DISTINCT session_id)::int as sessions,
        count(*) FILTER (WHERE type = 'pageview')::int as pageviews,
        count(*) FILTER (WHERE type = 'click')::int as clicks
      FROM analytics_events
      WHERE (created_at)::timestamptz >= now() - ${sinceInterval}::interval
    `,
    // Seans davomiyligi — mijoz o'zi hisoblab yuborgan har bir sahifa
    // `duration_ms`'i yig'indisi orqali olinadi (server qabul qilgan vaqt farqi
    // EMAS — chunki qisqa tashrifning barcha hodisalari bitta to'plamda, bitta
    // vaqt belgisi bilan kelishi mumkin, bu holda vaqt farqi 0 chiqib qolardi).
    sql`
      SELECT coalesce(avg(duration_ms), 0)::bigint as avg_ms FROM (
        SELECT session_id, sum(coalesce(duration_ms, 0)) as duration_ms
        FROM analytics_events
        WHERE type = 'pageview' AND (created_at)::timestamptz >= now() - ${sinceInterval}::interval
        GROUP BY session_id
      ) t
    `,
    // OVERNIGHT-07: DATA-ACCURACY-05'da `getAdminStats`ning 30-kunlik
    // grafigida tuzatilgan bilan bir xil sinf xato bu yerda (Analitika
    // sahifasining kunlik grafigi) hali qolgan edi — `now()::date`/
    // `created_at::date` SESSIYANING standart (odatda UTC) vaqt zonasida
    // guruhlardi, Toshkent yarim tunidan keyingi tashriflar bir kun OLDINGI
    // ustunga tushib qolardi.
    sql`
      SELECT to_char(d.day, 'YYYY-MM-DD') as day,
        count(DISTINCT e.session_id)::int as sessions,
        count(*) FILTER (WHERE e.type = 'pageview')::int as pageviews,
        count(*) FILTER (WHERE e.type = 'click')::int as clicks
      FROM generate_series(
        (now() AT TIME ZONE 'Asia/Tashkent')::date - ${seriesStartInterval}::interval,
        (now() AT TIME ZONE 'Asia/Tashkent')::date,
        interval '1 day'
      ) as d(day)
      LEFT JOIN analytics_events e ON ((e.created_at)::timestamptz AT TIME ZONE 'Asia/Tashkent')::date = d.day
      GROUP BY d.day ORDER BY d.day ASC
    `,
    sql`
      SELECT path, count(*)::int as view_count, sum(coalesce(duration_ms, 0))::bigint as total_duration_ms
      FROM analytics_events
      WHERE type = 'pageview' AND path IS NOT NULL AND (created_at)::timestamptz >= now() - ${sinceInterval}::interval
      GROUP BY path
      ORDER BY total_duration_ms DESC
      LIMIT 10
    `,
    sql`
      SELECT label, path, count(*)::int as count
      FROM analytics_events
      WHERE type = 'click' AND label IS NOT NULL AND (created_at)::timestamptz >= now() - ${sinceInterval}::interval
      GROUP BY label, path
      ORDER BY count DESC
      LIMIT 10
    `,
    // QR-funnel (/baholash?src=...) orqali ro'yxatdan o'tishlar — onboarding
    // "signup_from_qr:<src>" labelli hodisa yuboradi (lib/analytics.ts:trackEvent).
    sql`
      SELECT substring(label from 'signup_from_qr:(.*)') as source, count(*)::int as count
      FROM analytics_events
      WHERE type = 'click' AND label LIKE 'signup_from_qr:%' AND (created_at)::timestamptz >= now() - ${sinceInterval}::interval
      GROUP BY source
      ORDER BY count DESC
      LIMIT 20
    `,
    // Foydalanuvchi so'rovi (2026-09-17): har bir sahifa uchun "qolib
    // ketish" (exit rate) — umumiy sondan farqli, sahifama-sahifa. `last_view`
    // — har bir seansning ENG OXIRGI ko'rgan sahifasi (`DISTINCT ON` +
    // `created_at DESC`). `entries` — shu sahifani ko'rgan noyob seanslar
    // soni. Ikkalasini `path` bo'yicha birlashtirib, "shu yerdan chiqib
    // ketishgan" foizni hisoblaymiz. Shovqinni kamaytirish uchun kamida 5 ta
    // kirishi bo'lgan sahifalar (`HAVING`), eng yuqori foizdan boshlab.
    sql`
      WITH last_view AS (
        SELECT DISTINCT ON (session_id) session_id, path
        FROM analytics_events
        WHERE type = 'pageview' AND path IS NOT NULL AND (created_at)::timestamptz >= now() - ${sinceInterval}::interval
        ORDER BY session_id, (created_at)::timestamptz DESC
      ),
      entries AS (
        SELECT path, count(DISTINCT session_id)::int as entry_count
        FROM analytics_events
        WHERE type = 'pageview' AND path IS NOT NULL AND (created_at)::timestamptz >= now() - ${sinceInterval}::interval
        GROUP BY path
      ),
      exits AS (
        SELECT path, count(*)::int as exit_count FROM last_view GROUP BY path
      )
      SELECT e.path, e.entry_count, coalesce(x.exit_count, 0)::int as exit_count
      FROM entries e
      LEFT JOIN exits x ON x.path = e.path
      WHERE e.entry_count >= 5
      ORDER BY (coalesce(x.exit_count, 0)::float / e.entry_count) DESC, e.entry_count DESC
      LIMIT 20
    `,
    // Yandex Metrica uslubidagi "hozir onlayn" — `days` filtridan MUSTAQIL,
    // doim so'nggi 5 daqiqaga qaraydi (real vaqtga yaqin ko'rsatkich).
    sql`
      SELECT count(DISTINCT session_id)::int as live_now
      FROM analytics_events
      WHERE (created_at)::timestamptz >= now() - interval '5 minutes'
    `,
    // "Otказ" (bounce rate) — TANLANGAN oyna ichida FAQAT BITTA sahifa
    // ko'rib, hech qanday tugma bosmasdan ketgan seanslar foizi (Yandex
    // Metrica/Google Analytics'dagi klassik ta'rif bilan bir xil).
    sql`
      SELECT
        count(*) FILTER (WHERE pv = 1 AND cl = 0)::int as bounced,
        count(*)::int as total
      FROM (
        SELECT session_id,
          count(*) FILTER (WHERE type = 'pageview') as pv,
          count(*) FILTER (WHERE type = 'click') as cl
        FROM analytics_events
        WHERE (created_at)::timestamptz >= now() - ${sinceInterval}::interval
        GROUP BY session_id
      ) t
    `,
  ])) as unknown as [
    { sessions: number; pageviews: number; clicks: number }[],
    { avg_ms: number }[],
    AnalyticsDailyRow[],
    { path: string; view_count: number; total_duration_ms: number }[],
    { label: string; path: string | null; count: number }[],
    { source: string; count: number }[],
    { path: string; entry_count: number; exit_count: number }[],
    { live_now: number }[],
    { bounced: number; total: number }[],
  ];

  const totals = totalsRows[0] ?? { sessions: 0, pageviews: 0, clicks: 0 };
  const avgSessionDurationMs = Number(avgSessionRows[0]?.avg_ms ?? 0);
  const bounce = bounceRows[0] ?? { bounced: 0, total: 0 };

  return {
    liveNow: liveNowRows[0]?.live_now ?? 0,
    bounceRatePct: bounce.total > 0 ? Math.round((bounce.bounced / bounce.total) * 1000) / 10 : 0,
    totals: { ...totals, avgSessionDurationMs },
    dailyActivity: dailyRows.map((r) => ({ day: r.day, sessions: r.sessions, pageviews: r.pageviews, clicks: r.clicks })),
    topPages: topPagesRows.map((r) => ({
      path: r.path,
      viewCount: r.view_count,
      totalDurationMs: Number(r.total_duration_ms),
      avgDurationMs: r.view_count > 0 ? Math.round(Number(r.total_duration_ms) / r.view_count) : 0,
    })),
    topButtons: topButtonsRows.map((r) => ({ label: r.label, path: r.path, count: r.count })),
    qrSignups: qrSignupRows.map((r) => ({ source: r.source, count: r.count })),
    pageDropOff: pageDropOffRows.map((r) => ({
      path: r.path,
      entries: r.entry_count,
      exits: r.exit_count,
      exitRatePct: r.entry_count > 0 ? Math.round((r.exit_count / r.entry_count) * 1000) / 10 : 0,
    })),
  };
}

// ---------------------------------------------------------------------------
// Traction Dashboard — foydalanuvchi so'roviga ko'ra ("Demo Day'ni kutma,
// birinchi kundan raqamlarni yig'"): AARRR ko'rsatkichlari bitta joyda.
// Mumkin bo'lgan joyda MAVJUD jadvallardan hisoblanadi; ikkita yangi
// hodisa shu funksiya bilan birga qo'shildi — `qr_scan:<src>` (baholash/page.tsx,
// QR havolasi ochilgan zahoti, konversiyadan OLDIN) va
// `onboarding_step:<step>` (onboarding/page.tsx + mobile onboarding.tsx, har bir
// bosqichga kirilganda) — bular bugundan boshlab to'planadi, tarixiy ma'lumot
// yo'q (shuning uchun `*Tracked` bayroqlari bilan izohlanadi, 0 emas
// "hali yo'q" sifatida UI'da ko'rsatiladi).
// ---------------------------------------------------------------------------

const GROWTH_SOURCE_PATTERNS: { key: "school" | "university" | "clinic"; re: RegExp }[] = [
  { key: "school", re: /maktab|school/i },
  { key: "university", re: /universitet|university|uni-|talaba|student/i },
  { key: "clinic", re: /klinika|clinic|shifoxona|poliklinika/i },
];

// Chat'da ko'p so'raladigan mavzularni taxminan aniqlash uchun kalit so'zlar —
// haqiqiy NLP/klasterlash emas, oddiy ILIKE moslashtirish (V1, admin panelda
// shunday deb izohlangan).
const QUESTION_TOPIC_KEYWORDS: { topic: string; words: string[] }[] = [
  { topic: "Og'riq/spazm", words: ["og'riq", "ogriq", "og'riyapti", "spazm", "болит", "боль"] },
  { topic: "Sikl kechikishi", words: ["kechik", "kelmadi", "задерж", "задержка"] },
  { topic: "Homiladorlik belgisi", words: ["homila", "homiladorman", "beremen", "беремен"] },
  { topic: "Ajralma/ranglar", words: ["ajralma", "выделен"] },
  { topic: "Kontratseptsiya", words: ["kontraseptsiya", "tabletka", "prezervativ", "spiral", "контрацепт"] },
  { topic: "Ovulyatsiya", words: ["ovulyatsiya", "овуляц"] },
  { topic: "Diyeta/vazn", words: ["vazn", "diyeta", "ozish", "вес", "похуд"] },
  { topic: "Kayfiyat/stress", words: ["kayfiyat", "stress", "depress", "настроен", "стресс"] },
];

export async function getTractionSummary(days: number): Promise<TractionSummary> {
  await ensureSchema();
  const clampedDays = Math.min(Math.max(Math.round(days) || 30, 1), 180);
  const sinceInterval = `${clampedDays} days`;

  const [
    // --- Acquisition (davr bilan cheklangan) ---
    [{ count: registrations }],
    [{ count: telegramStarts }],
    [{ count: websiteVisitors }],
    [{ count: qrScansTotal }],
    qrScansBySourceRows,
    qrSignupsBySourceRows,
    // --- Activation (jami, doim butun tarix) ---
    [{ count: totalUsers }],
    [{ count: completedOnboarding }],
    [{ count: loggedFirstPeriod }],
    [{ count: addedFirstSymptom }],
    [{ count: usedChatbot }],
    // --- Engagement (DAU/WAU/MAU — doim qat'iy 1/7/30 kun) ---
    [{ count: dau }],
    [{ count: wau }],
    [{ count: mau }],
    [{ count: sessions30d }],
    [{ count: symptomEntriesTotal }],
    [{ count: chatMessagesTotal }],
    // --- Retention (kohort, doim jami) ---
    [{ cohort: d1Cohort, returned: d1Returned }],
    [{ cohort: d7Cohort, returned: d7Returned }],
    [{ cohort: d30Cohort, returned: d30Returned }],
    // --- Product (davr bilan cheklangan) ---
    mostUsedFeatureRows,
    abandonedOnboardingRows,
    questionMessageRows,
    symptomRows,
    // --- Quality (davr bilan cheklangan) ---
    [{ count: complaintsCount }],
    recentComplaintRows,
  ] = (await Promise.all([
    sql`SELECT count(*)::int as count FROM users WHERE is_test_account = FALSE AND (created_at)::timestamptz >= now() - ${sinceInterval}::interval`,
    sql`SELECT count(*)::int as count FROM telegram_bot_starts WHERE (first_started_at)::timestamptz >= now() - ${sinceInterval}::interval`,
    sql`SELECT count(DISTINCT session_id)::int as count FROM analytics_events WHERE platform = 'web' AND (created_at)::timestamptz >= now() - ${sinceInterval}::interval`,
    sql`SELECT count(*)::int as count FROM analytics_events WHERE type = 'click' AND label LIKE 'qr_scan:%' AND (created_at)::timestamptz >= now() - ${sinceInterval}::interval`,
    sql`
      SELECT substring(label from 'qr_scan:(.*)') as source, count(*)::int as count
      FROM analytics_events
      WHERE type = 'click' AND label LIKE 'qr_scan:%' AND (created_at)::timestamptz >= now() - ${sinceInterval}::interval
      GROUP BY source ORDER BY count DESC LIMIT 20
    `,
    sql`
      SELECT substring(label from 'signup_from_qr:(.*)') as source, count(*)::int as count
      FROM analytics_events
      WHERE type = 'click' AND label LIKE 'signup_from_qr:%' AND (created_at)::timestamptz >= now() - ${sinceInterval}::interval
      GROUP BY source ORDER BY count DESC LIMIT 20
    `,
    sql`SELECT count(*)::int as count FROM users WHERE is_test_account = FALSE`,
    sql`SELECT count(*)::int as count FROM onboarding_profiles o JOIN users u ON u.id = o.user_id AND u.is_test_account = FALSE`,
    sql`SELECT count(DISTINCT cl.user_id)::int as count FROM cycle_logs cl JOIN users u ON u.id = cl.user_id AND u.is_test_account = FALSE WHERE cl.flow IS NOT NULL`,
    sql`SELECT count(DISTINCT cl.user_id)::int as count FROM cycle_logs cl JOIN users u ON u.id = cl.user_id AND u.is_test_account = FALSE WHERE cl.symptoms <> '[]'`,
    sql`SELECT count(DISTINCT cm.user_id)::int as count FROM chat_messages cm JOIN users u ON u.id = cm.user_id AND u.is_test_account = FALSE WHERE cm.role = 'user'`,
    sql`
      SELECT count(DISTINCT a.user_id)::int as count FROM (
        SELECT user_id, created_at FROM analytics_events WHERE user_id IS NOT NULL AND (created_at)::timestamptz >= now() - interval '1 day'
        UNION ALL
        SELECT user_id, created_at FROM cycle_logs WHERE (created_at)::timestamptz >= now() - interval '1 day'
        UNION ALL
        SELECT user_id, created_at FROM chat_messages WHERE (created_at)::timestamptz >= now() - interval '1 day'
      ) a JOIN users u ON u.id = a.user_id AND u.is_test_account = FALSE
    `,
    sql`
      SELECT count(DISTINCT a.user_id)::int as count FROM (
        SELECT user_id, created_at FROM analytics_events WHERE user_id IS NOT NULL AND (created_at)::timestamptz >= now() - interval '7 days'
        UNION ALL
        SELECT user_id, created_at FROM cycle_logs WHERE (created_at)::timestamptz >= now() - interval '7 days'
        UNION ALL
        SELECT user_id, created_at FROM chat_messages WHERE (created_at)::timestamptz >= now() - interval '7 days'
      ) a JOIN users u ON u.id = a.user_id AND u.is_test_account = FALSE
    `,
    sql`
      SELECT count(DISTINCT a.user_id)::int as count FROM (
        SELECT user_id, created_at FROM analytics_events WHERE user_id IS NOT NULL AND (created_at)::timestamptz >= now() - interval '30 days'
        UNION ALL
        SELECT user_id, created_at FROM cycle_logs WHERE (created_at)::timestamptz >= now() - interval '30 days'
        UNION ALL
        SELECT user_id, created_at FROM chat_messages WHERE (created_at)::timestamptz >= now() - interval '30 days'
      ) a JOIN users u ON u.id = a.user_id AND u.is_test_account = FALSE
    `,
    sql`SELECT count(DISTINCT session_id)::int as count FROM analytics_events WHERE (created_at)::timestamptz >= now() - interval '30 days'`,
    sql`SELECT count(*)::int as count FROM cycle_logs cl JOIN users u ON u.id = cl.user_id AND u.is_test_account = FALSE WHERE cl.symptoms <> '[]'`,
    sql`SELECT count(*)::int as count FROM chat_messages cm JOIN users u ON u.id = cm.user_id AND u.is_test_account = FALSE WHERE cm.role = 'user'`,
    // Retention: klassik kohort — ro'yxatdan o'tgan kundan aynan N kun keyin
    // qaytganlar. Kohort faqat shu N-kun chegarasidan allaqachon o'tgan
    // foydalanuvchilarni qamraydi (aks holda "hali kelmagan" kunni hisoblab
    // foizni sun'iy pasaytirib yuboradi).
    sql`
      WITH cohort AS (
        SELECT id as user_id, (created_at)::timestamptz::date as signup_date
        FROM users WHERE is_test_account = FALSE AND (created_at)::timestamptz::date <= now()::date - interval '1 day'
      ), activity AS (
        SELECT user_id, (created_at)::timestamptz::date as d FROM analytics_events WHERE user_id IS NOT NULL
        UNION SELECT user_id, (created_at)::timestamptz::date FROM cycle_logs
        UNION SELECT user_id, (created_at)::timestamptz::date FROM chat_messages
      )
      SELECT count(*)::int as cohort,
        count(*) FILTER (WHERE EXISTS (SELECT 1 FROM activity a WHERE a.user_id = cohort.user_id AND a.d = cohort.signup_date + 1))::int as returned
      FROM cohort
    `,
    sql`
      WITH cohort AS (
        SELECT id as user_id, (created_at)::timestamptz::date as signup_date
        FROM users WHERE is_test_account = FALSE AND (created_at)::timestamptz::date <= now()::date - interval '7 days'
      ), activity AS (
        SELECT user_id, (created_at)::timestamptz::date as d FROM analytics_events WHERE user_id IS NOT NULL
        UNION SELECT user_id, (created_at)::timestamptz::date FROM cycle_logs
        UNION SELECT user_id, (created_at)::timestamptz::date FROM chat_messages
      )
      SELECT count(*)::int as cohort,
        count(*) FILTER (WHERE EXISTS (SELECT 1 FROM activity a WHERE a.user_id = cohort.user_id AND a.d = cohort.signup_date + 7))::int as returned
      FROM cohort
    `,
    sql`
      WITH cohort AS (
        SELECT id as user_id, (created_at)::timestamptz::date as signup_date
        FROM users WHERE is_test_account = FALSE AND (created_at)::timestamptz::date <= now()::date - interval '30 days'
      ), activity AS (
        SELECT user_id, (created_at)::timestamptz::date as d FROM analytics_events WHERE user_id IS NOT NULL
        UNION SELECT user_id, (created_at)::timestamptz::date FROM cycle_logs
        UNION SELECT user_id, (created_at)::timestamptz::date FROM chat_messages
      )
      SELECT count(*)::int as cohort,
        count(*) FILTER (WHERE EXISTS (SELECT 1 FROM activity a WHERE a.user_id = cohort.user_id AND a.d = cohort.signup_date + 30))::int as returned
      FROM cohort
    `,
    sql`
      SELECT path, count(*)::int as view_count
      FROM analytics_events
      WHERE type = 'pageview' AND path IS NOT NULL AND (created_at)::timestamptz >= now() - ${sinceInterval}::interval
      GROUP BY path ORDER BY view_count DESC LIMIT 30
    `,
    // Onboardingni tugatmagan (onboarding_profiles yo'q) foydalanuvchilarning
    // shu seansdagi ENG OXIRGI "onboarding_step:<step>" hodisasi — ya'ni qaysi
    // bosqichda "tiqilib qolishgan". `onboarding_step:*` hodisasi shu ishlash
    // bilan birga qo'shildi — tarixiy ma'lumot yo'q, bugundan boshlab yig'iladi.
    sql`
      WITH ranked AS (
        SELECT e.user_id, substring(e.label from 'onboarding_step:(.*)') as step,
          row_number() OVER (PARTITION BY e.session_id ORDER BY e.created_at DESC) as rn
        FROM analytics_events e
        LEFT JOIN onboarding_profiles o ON o.user_id = e.user_id
        WHERE e.type = 'click' AND e.label LIKE 'onboarding_step:%' AND o.user_id IS NULL
          AND (e.created_at)::timestamptz >= now() - ${sinceInterval}::interval
      )
      SELECT step, count(*)::int as count FROM ranked WHERE rn = 1 GROUP BY step ORDER BY count DESC LIMIT 10
    `,
    sql`
      SELECT content FROM chat_messages cm
      JOIN users u ON u.id = cm.user_id AND u.is_test_account = FALSE
      WHERE cm.role = 'user' AND (cm.created_at)::timestamptz >= now() - ${sinceInterval}::interval
    `,
    sql`
      SELECT value as symptom, count(*)::int as count
      FROM cycle_logs cl
      JOIN users u ON u.id = cl.user_id AND u.is_test_account = FALSE
      CROSS JOIN LATERAL jsonb_array_elements_text(cl.symptoms::jsonb) as value
      WHERE (cl.created_at)::timestamptz >= now() - ${sinceInterval}::interval
      GROUP BY value ORDER BY count DESC LIMIT 10
    `,
    sql`
      SELECT count(*)::int as count FROM feedback_responses f
      JOIN users u ON u.id = f.user_id AND u.is_test_account = FALSE
      WHERE f.rating = 0 AND (f.created_at)::timestamptz >= now() - ${sinceInterval}::interval
    `,
    sql`
      SELECT f.message, f.created_at FROM feedback_responses f
      JOIN users u ON u.id = f.user_id AND u.is_test_account = FALSE
      WHERE f.message IS NOT NULL AND (f.created_at)::timestamptz >= now() - ${sinceInterval}::interval
      ORDER BY f.created_at DESC LIMIT 10
    `,
  ])) as unknown as [
    { count: number }[],
    { count: number }[],
    { count: number }[],
    { count: number }[],
    { source: string; count: number }[],
    { source: string; count: number }[],
    { count: number }[],
    { count: number }[],
    { count: number }[],
    { count: number }[],
    { count: number }[],
    { count: number }[],
    { count: number }[],
    { count: number }[],
    { count: number }[],
    { count: number }[],
    { count: number }[],
    { cohort: number; returned: number }[],
    { cohort: number; returned: number }[],
    { cohort: number; returned: number }[],
    { path: string; view_count: number }[],
    { step: string | null; count: number }[],
    { content: string }[],
    { symptom: string; count: number }[],
    { count: number }[],
    { message: string | null; created_at: string }[],
  ];

  // Sahifa yo'lini o'qish mumkin xususiyatga aylantiradi — mobile (expo-router
  // guruh segmentlari, masalan "/(tabs)/asosiy") va web ("/asosiy") bir xil
  // ekranga tegishli bo'lsa bitta yorliq ostida birlashtiriladi.
  const FEATURE_LABELS: Record<string, string> = {
    asosiy: "Bosh sahifa / Tsikl",
    tsikl: "Tsikl",
    yordamchi: "AI Yordamchi",
    jamiyat: "Jamiyat",
    hamkor: "Hamkor",
    tekshiruvlar: "Tekshiruvlar",
    profil: "Profil",
    homiladorlik: "Homiladorlik",
    "xavf-testi": "Xavf-testi",
    maqolalar: "Maqolalar",
    klinikalar: "Klinikalar",
    baholash: "QR-baholash",
  };
  function normalizeFeaturePath(path: string): string {
    const segment = path.replace(/\(tabs\)\/?/g, "").split("/").filter(Boolean)[0] ?? path;
    return FEATURE_LABELS[segment] ?? segment;
  }
  const featureAgg = new Map<string, number>();
  for (const r of mostUsedFeatureRows) {
    const label = normalizeFeaturePath(r.path);
    featureAgg.set(label, (featureAgg.get(label) ?? 0) + r.view_count);
  }
  const mostUsedFeatures = [...featureAgg.entries()]
    .map(([label, viewCount]) => ({ label, viewCount }))
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 8);

  const topicCounts = new Map<string, number>();
  for (const row of questionMessageRows) {
    const text = row.content.toLowerCase();
    for (const { topic, words } of QUESTION_TOPIC_KEYWORDS) {
      if (words.some((w) => text.includes(w))) {
        topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
        break; // bitta xabar — birinchi mos kelgan mavzuga, takror sanamaslik uchun
      }
    }
  }
  const mostCommonQuestionTopics = [...topicCounts.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const growthBuckets = { school: 0, university: 0, clinic: 0, other: 0 };
  for (const row of qrSignupsBySourceRows) {
    const match = GROWTH_SOURCE_PATTERNS.find((p) => p.re.test(row.source));
    if (match) growthBuckets[match.key] += row.count;
    else growthBuckets.other += row.count;
  }
  const taggedQrSignups = qrSignupsBySourceRows.reduce((sum, r) => sum + r.count, 0);
  const organic = Math.max(0, registrations - taggedQrSignups);

  function pct(returned: number, cohort: number): number | null {
    return cohort > 0 ? Math.round((returned / cohort) * 1000) / 10 : null;
  }

  return {
    periodDays: clampedDays,
    acquisition: {
      qrScansTotal,
      qrScansTracked: true,
      qrScansBySource: qrScansBySourceRows,
      qrSignupsBySource: qrSignupsBySourceRows,
      websiteVisitors,
      telegramStarts,
      registrations,
      conversionRate: telegramStarts > 0 ? Math.round((registrations / telegramStarts) * 1000) / 10 : null,
    },
    activation: {
      totalUsers,
      completedOnboarding,
      loggedFirstPeriod,
      addedFirstSymptom,
      usedChatbot,
    },
    engagement: {
      dau,
      wau,
      mau,
      sessionsPerActiveUser: mau > 0 ? Math.round((sessions30d / mau) * 10) / 10 : 0,
      symptomsLoggedPerUser: addedFirstSymptom > 0 ? Math.round((symptomEntriesTotal / addedFirstSymptom) * 10) / 10 : 0,
      chatMessagesPerUser: usedChatbot > 0 ? Math.round((chatMessagesTotal / usedChatbot) * 10) / 10 : 0,
    },
    retention: {
      d1: pct(d1Returned, d1Cohort),
      d1CohortSize: d1Cohort,
      d7: pct(d7Returned, d7Cohort),
      d7CohortSize: d7Cohort,
      d30: pct(d30Returned, d30Cohort),
      d30CohortSize: d30Cohort,
    },
    product: {
      mostUsedFeatures,
      mostAbandonedOnboardingSteps: abandonedOnboardingRows
        .filter((r): r is { step: string; count: number } => !!r.step)
        .map((r) => ({ step: r.step, count: r.count })),
      onboardingStepsTracked: true,
      mostCommonQuestionTopics,
      mostCommonSymptoms: symptomRows.map((r) => ({ symptom: r.symptom, count: r.count })),
    },
    quality: {
      complaintsCount,
      recentComplaints: recentComplaintRows.map((r) => ({ message: r.message, createdAt: r.created_at })),
    },
    growth: {
      school: growthBuckets.school,
      university: growthBuckets.university,
      clinic: growthBuckets.clinic,
      organic,
      other: growthBuckets.other,
      referralTracked: false,
    },
    revenue: {
      applicable: false,
    },
  };
}

export async function listAnalyticsUsersAdmin(params: { search?: string; limit?: number; offset?: number }): Promise<{
  users: AnalyticsUserSummary[];
  total: number;
}> {
  await ensureSchema();
  const limit = params.limit ?? 30;
  const offset = params.offset ?? 0;
  const q = params.search?.trim();
  const searchPattern = q ? `%${q}%` : null;
  const searchClause = searchPattern ? sql`AND (u.name ILIKE ${searchPattern} OR u.phone ILIKE ${searchPattern})` : sql``;

  const rows = (await sql`
    SELECT u.id as user_id, u.name, u.phone,
      count(DISTINCT e.session_id)::int as sessions_count,
      count(e.id)::int as events_count,
      max(e.created_at) as last_active_at,
      sum(CASE WHEN e.type = 'pageview' THEN coalesce(e.duration_ms, 0) ELSE 0 END)::bigint as total_duration_ms,
      (
        SELECT e2.path FROM analytics_events e2
        WHERE e2.user_id = u.id AND e2.type = 'pageview' AND e2.path IS NOT NULL
        GROUP BY e2.path ORDER BY sum(coalesce(e2.duration_ms, 0)) DESC LIMIT 1
      ) as top_path
    FROM users u
    JOIN analytics_events e ON e.user_id = u.id
    WHERE u.is_test_account = FALSE ${searchClause}
    GROUP BY u.id, u.name, u.phone
    ORDER BY total_duration_ms DESC
    LIMIT ${limit} OFFSET ${offset}
  `) as unknown as {
    user_id: string;
    name: string | null;
    phone: string | null;
    sessions_count: number;
    events_count: number;
    last_active_at: string | null;
    total_duration_ms: number;
    top_path: string | null;
  }[];

  const [{ count }] = (await sql`
    SELECT count(DISTINCT u.id)::int as count FROM users u JOIN analytics_events e ON e.user_id = u.id
    WHERE u.is_test_account = FALSE ${searchClause}
  `) as unknown as { count: number }[];

  return {
    total: count,
    users: rows.map((r) => ({
      userId: r.user_id,
      name: r.name,
      phone: r.phone,
      sessionsCount: r.sessions_count,
      eventsCount: r.events_count,
      totalDurationMs: Number(r.total_duration_ms),
      lastActiveAt: r.last_active_at,
      topPath: r.top_path,
    })),
  };
}

// ---------------------------------------------------------------------------
// Jamiyat (Community) — post-lenta, sharh va yoqtirishlar.
// ---------------------------------------------------------------------------

interface CommunityPostRow {
  id: string;
  user_id: string;
  tag: CommunityTag;
  body: string;
  is_anonymous: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  author_name: string | null;
  author_avatar_url: string | null;
  viewer_liked: boolean;
}

function communityPostFromRow(row: CommunityPostRow, viewerId: string): CommunityPost {
  return {
    id: row.id,
    tag: row.tag,
    body: row.body,
    isAnonymous: row.is_anonymous,
    authorName: row.is_anonymous ? null : row.author_name,
    authorAvatarUrl: row.is_anonymous ? null : row.author_avatar_url,
    likesCount: row.likes_count,
    commentsCount: row.comments_count,
    viewerLiked: row.viewer_liked,
    isOwn: row.user_id === viewerId,
    createdAt: row.created_at,
  };
}

/** COMM-001: `blocked_users`ga qarab "NOT IN" sharti — bittasi tag filtriga,
 * bittasi bloklanganlarni chiqarib tashlashga. Ikkalasi ham `listCommunityPosts`
 * VA `listCommunityComments`da bir xil, shuning uchun alohida funksiya. */
function excludeBlockedAuthorsFilter(viewerId: string) {
  return sql`p.user_id NOT IN (SELECT blocked_id FROM blocked_users WHERE blocker_id = ${viewerId})`;
}

export async function listCommunityPosts(
  viewerId: string,
  params: { tag?: CommunityTag; limit?: number; offset?: number; scope?: CommunityFeedScope }
): Promise<{ posts: CommunityPost[]; total: number }> {
  await ensureSchema();
  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;
  // COMM-02: "Savollarim" va "Javoblarim" yorliqlari uchun.
  //
  // Ayol savol berib, javob kelganini BILISH uchun butun lentani qaytadan
  // varaqlashi kerak edi — savol bir necha soatdan keyin pastga tushib
  // ketardi va u qaytib topa olmasdi. Shu sababli ko'pchilik bir marta
  // savol berib, javobini umuman ko'rmasdi.
  const scope = params.scope ?? "all";
  const scopeFilter =
    scope === "mine"
      ? sql`p.user_id = ${viewerId}`
      : scope === "answered"
        ? // "Javoblarim" — ayol IZOH YOZGAN postlar. Muallif o'zi bo'lishi
          // shart emas: u boshqaga javob bergan bo'lsa ham shu ro'yxatda
          // ko'rinadi va suhbat davomini kuzatib boradi.
          sql`EXISTS(SELECT 1 FROM community_comments c WHERE c.post_id = p.id AND c.user_id = ${viewerId})`
        : sql`TRUE`;
  const tagFilter = params.tag ? sql`p.tag = ${params.tag}` : sql`TRUE`;
  const conditions = sql`WHERE ${tagFilter} AND ${scopeFilter} AND ${excludeBlockedAuthorsFilter(viewerId)}`;
  const rows = (await sql`
    SELECT p.*, u.name as author_name, u.avatar_url as author_avatar_url,
      EXISTS(SELECT 1 FROM community_post_likes l WHERE l.post_id = p.id AND l.user_id = ${viewerId}) as viewer_liked
    FROM community_posts p
    JOIN users u ON u.id = p.user_id
    ${conditions}
    ORDER BY p.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `) as unknown as CommunityPostRow[];
  const [{ count }] = (await sql`SELECT count(*)::int as count FROM community_posts p ${conditions}`) as unknown as { count: number }[];
  return { posts: rows.map((row) => communityPostFromRow(row, viewerId)), total: count };
}

export async function createCommunityPost(
  userId: string,
  payload: { tag: CommunityTag; body: string; isAnonymous: boolean }
): Promise<CommunityPost> {
  await ensureSchema();
  const id = randomUUID();
  const createdAt = now();
  await sql`
    INSERT INTO community_posts (id, user_id, tag, body, is_anonymous, created_at)
    VALUES (${id}, ${userId}, ${payload.tag}, ${payload.body}, ${payload.isAnonymous}, ${createdAt})
  `;
  const author = await getUserById(userId);
  return {
    id,
    tag: payload.tag,
    body: payload.body,
    isAnonymous: payload.isAnonymous,
    authorName: payload.isAnonymous ? null : (author?.name ?? null),
    authorAvatarUrl: payload.isAnonymous ? null : (author?.avatarUrl ?? null),
    likesCount: 0,
    commentsCount: 0,
    viewerLiked: false,
    isOwn: true,
    createdAt,
  };
}

export async function deleteCommunityPost(userId: string, postId: string): Promise<void> {
  await ensureSchema();
  const rows = (await sql`SELECT user_id FROM community_posts WHERE id = ${postId}`) as unknown as { user_id: string }[];
  const row = rows[0];
  if (!row) throw new ApiError(404, "Post topilmadi");
  if (row.user_id !== userId) throw new ApiError(403, "Bu postni faqat muallifi o'chira oladi");
  await sql`DELETE FROM community_posts WHERE id = ${postId}`;
}

export async function toggleCommunityLike(userId: string, postId: string): Promise<{ liked: boolean; likesCount: number }> {
  await ensureSchema();
  const existing = (await sql`SELECT 1 FROM community_post_likes WHERE post_id = ${postId} AND user_id = ${userId}`) as unknown as unknown[];
  let liked: boolean;
  // FIX2-28: ilgari likes_count HAR DOIM shartsiz oshirilardi/kamaytirilardi,
  // hatto INSERT/DELETE haqiqatan hech narsani o'zgartirmagan holatda ham
  // (masalan ikki marta tez bosilganda `ON CONFLICT DO NOTHING` hech narsa
  // qo'shmaydi) — vaqt o'tishi bilan haqiqiy like'lar soni bilan likes_count
  // orasida farq to'planardi. Endi INSERT/DELETE'ning HAQIQATAN nechta
  // qatorni o'zgartirganini (`.count` — postgres.js'ning natija metama'lumoti)
  // tekshirib, faqat shundagina hisoblagich yangilanadi.
  if (existing.length > 0) {
    const deleted = await sql`DELETE FROM community_post_likes WHERE post_id = ${postId} AND user_id = ${userId}`;
    if (deleted.count > 0) {
      await sql`UPDATE community_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = ${postId}`;
    }
    liked = false;
  } else {
    const inserted = await sql`
      INSERT INTO community_post_likes (post_id, user_id, created_at) VALUES (${postId}, ${userId}, ${now()})
      ON CONFLICT (post_id, user_id) DO NOTHING
    `;
    if (inserted.count > 0) {
      await sql`UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = ${postId}`;
    }
    liked = true;
  }
  const rows = (await sql`SELECT likes_count FROM community_posts WHERE id = ${postId}`) as unknown as { likes_count: number }[];
  const row = rows[0];
  if (!row) throw new ApiError(404, "Post topilmadi");
  return { liked, likesCount: row.likes_count };
}

interface CommunityCommentRow {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  is_anonymous: boolean;
  created_at: string;
  author_name: string | null;
  author_avatar_url: string | null;
}

function communityCommentFromRow(row: CommunityCommentRow, viewerId: string): CommunityComment {
  return {
    id: row.id,
    postId: row.post_id,
    body: row.body,
    isAnonymous: row.is_anonymous,
    authorName: row.is_anonymous ? null : row.author_name,
    authorAvatarUrl: row.is_anonymous ? null : row.author_avatar_url,
    isOwn: row.user_id === viewerId,
    createdAt: row.created_at,
  };
}

export async function listCommunityComments(postId: string, viewerId: string): Promise<CommunityComment[]> {
  await ensureSchema();
  const rows = (await sql`
    SELECT c.*, u.name as author_name, u.avatar_url as author_avatar_url
    FROM community_comments c
    JOIN users u ON u.id = c.user_id
    WHERE c.post_id = ${postId}
      AND c.user_id NOT IN (SELECT blocked_id FROM blocked_users WHERE blocker_id = ${viewerId})
    ORDER BY c.created_at ASC
  `) as unknown as CommunityCommentRow[];
  return rows.map((row) => communityCommentFromRow(row, viewerId));
}

export async function addCommunityComment(
  userId: string,
  postId: string,
  payload: { body: string; isAnonymous: boolean }
): Promise<CommunityComment> {
  await ensureSchema();
  const postRows = (await sql`SELECT user_id FROM community_posts WHERE id = ${postId}`) as unknown as { user_id: string }[];
  const post = postRows[0];
  if (!post) throw new ApiError(404, "Post topilmadi");
  const id = randomUUID();
  const createdAt = now();
  await sql`
    INSERT INTO community_comments (id, post_id, user_id, body, is_anonymous, created_at)
    VALUES (${id}, ${postId}, ${userId}, ${payload.body}, ${payload.isAnonymous}, ${createdAt})
  `;
  await sql`UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = ${postId}`;
  // Post muallifiga bildirishnoma — o'ziga o'zi izoh qoldirsa yuborilmaydi.
  if (post.user_id !== userId) {
    await sql`
      INSERT INTO notifications (id, user_id, actor_user_id, type, post_id, comment_id, is_anonymous_actor, created_at)
      VALUES (${randomUUID()}, ${post.user_id}, ${userId}, 'comment_on_post', ${postId}, ${id}, ${payload.isAnonymous}, ${now()})
    `;
    await notifyUser(post.user_id, { title: "💬 Postingizga yangi izoh qoldirildi", text: payload.body });
  }
  const author = await getUserById(userId);
  return {
    id,
    postId,
    body: payload.body,
    isAnonymous: payload.isAnonymous,
    authorName: payload.isAnonymous ? null : (author?.name ?? null),
    authorAvatarUrl: payload.isAnonymous ? null : (author?.avatarUrl ?? null),
    isOwn: true,
    createdAt,
  };
}

/** Izohni o'chiradi — izoh muallifi YOKI postning egasi (o'z posti ostidagi
 * izohlarni boshqarish uchun) o'chira oladi. */
export async function deleteCommunityComment(userId: string, postId: string, commentId: string): Promise<void> {
  await ensureSchema();
  const rows = (await sql`
    SELECT c.user_id as comment_user_id, p.user_id as post_user_id
    FROM community_comments c
    JOIN community_posts p ON p.id = c.post_id
    WHERE c.id = ${commentId} AND c.post_id = ${postId}
  `) as unknown as { comment_user_id: string; post_user_id: string }[];
  const row = rows[0];
  if (!row) throw new ApiError(404, "Izoh topilmadi");
  if (row.comment_user_id !== userId && row.post_user_id !== userId) {
    throw new ApiError(403, "Bu izohni faqat muallifi yoki post egasi o'chira oladi");
  }
  await sql`DELETE FROM community_comments WHERE id = ${commentId}`;
  await sql`UPDATE community_posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = ${postId}`;
}

export async function getCommunityStats(): Promise<CommunityStats> {
  await ensureSchema();
  const [[{ count: totalMembers }], [{ count: totalPosts }], [{ count: postsToday }]] = (await Promise.all([
    // DATA-ACCURACY-06: `is_test_account = FALSE` filtri YO'Q edi — bu
    // FOYDALANUVCHIGA ko'rsatiladigan "N a'zo" (Jamiyat ekrani) rivojlanish
    // davomida yaratilgan/o'chirilgan barcha sinov hisoblarini ham hisobga
    // olib, haqiqiy hamjamiyat hajmini oshirib ko'rsatardi — `getAdminStats`
    // va deyarli barcha boshqa foydalanuvchi-soni so'rovlarida bu filtr
    // ALLAQACHON bor edi, faqat shu yerda unutilgan edi.
    sql`SELECT count(*)::int as count FROM users WHERE is_test_account = FALSE`,
    sql`SELECT count(*)::int as count FROM community_posts`,
    // DATA-ACCURACY-06: "Bugun N ta" (FOYDALANUVCHIGA ko'rinadigan Jamiyat
    // ekrani) KALENDAR kunini anglatadi, lekin `now() - interval '1 day'`
    // SO'NGGI 24 SOATLIK aylanuvchi oyna edi — DATA-ACCURACY-05'da
    // getAdminStats'da tuzatilgan bilan bir xil sinf xato, bu yerda ham bor
    // edi. Endi Toshkent mahalliy yarim tunidan hisoblanadi.
    sql`
      SELECT count(*)::int as count FROM community_posts
      WHERE (created_at)::timestamptz >= date_trunc('day', now() AT TIME ZONE 'Asia/Tashkent') AT TIME ZONE 'Asia/Tashkent'
    `,
  ])) as unknown as [{ count: number }[], { count: number }[], { count: number }[]];
  return { totalMembers, totalPosts, postsToday };
}

// --- COMM-001: shikoyat va bloklash ----------------------------------------

export async function createCommunityReport(
  reporterId: string,
  payload: { targetType: CommunityReportTargetType; postId: string; commentId?: string | null; reason: CommunityReportReason; note?: string | null }
): Promise<void> {
  await ensureSchema();
  // Postning mavjudligini tekshiramiz — bo'lmasa 404 (masalan link eskirgan).
  const postRows = (await sql`SELECT 1 FROM community_posts WHERE id = ${payload.postId}`) as unknown as unknown[];
  if (postRows.length === 0) throw new ApiError(404, "Post topilmadi");
  // FIX-04: izoh haqidagi shikoyatda commentId ham tekshiriladi — aks holda
  // foydalanuvchi shikoyat oynasini ochib turgan paytda izoh o'chirilib
  // ketsa, INSERT FOREIGN KEY cheklovini buzib, handled bo'lmagan 500
  // xatosi qaytardi (post topilmasa esa toza 404 qaytadi — nomutanosiblik).
  if (payload.commentId) {
    const commentRows = (await sql`SELECT 1 FROM community_comments WHERE id = ${payload.commentId}`) as unknown as unknown[];
    if (commentRows.length === 0) throw new ApiError(404, "Izoh topilmadi");
  }
  await sql`
    INSERT INTO community_reports (id, reporter_id, target_type, post_id, comment_id, reason, note, status, created_at)
    VALUES (${randomUUID()}, ${reporterId}, ${payload.targetType}, ${payload.postId}, ${payload.commentId ?? null}, ${payload.reason}, ${payload.note ?? null}, 'open', ${now()})
  `;
}

/** `postId`/`commentId` orqali muallifni SERVER TOMONDA aniqlaydi — klient
 * hech qachon xom `user_id`ni ko'rmaydi, shuning uchun anonim post muallifini
 * ham, ismini bilmasdan, bloklash mumkin. O'zini-o'zi bloklashga urinish
 * jimgina e'tiborsiz qoldiriladi (xato emas — foydalanuvchi buni bila olmaydi). */
export async function blockCommunityPostAuthor(blockerId: string, postId: string): Promise<void> {
  await ensureSchema();
  const rows = (await sql`SELECT user_id FROM community_posts WHERE id = ${postId}`) as unknown as { user_id: string }[];
  const row = rows[0];
  if (!row) throw new ApiError(404, "Post topilmadi");
  if (row.user_id === blockerId) return;
  await sql`
    INSERT INTO blocked_users (blocker_id, blocked_id, created_at) VALUES (${blockerId}, ${row.user_id}, ${now()})
    ON CONFLICT (blocker_id, blocked_id) DO NOTHING
  `;
}

export async function blockCommunityCommentAuthor(blockerId: string, commentId: string): Promise<void> {
  await ensureSchema();
  const rows = (await sql`SELECT user_id FROM community_comments WHERE id = ${commentId}`) as unknown as { user_id: string }[];
  const row = rows[0];
  if (!row) throw new ApiError(404, "Izoh topilmadi");
  if (row.user_id === blockerId) return;
  await sql`
    INSERT INTO blocked_users (blocker_id, blocked_id, created_at) VALUES (${blockerId}, ${row.user_id}, ${now()})
    ON CONFLICT (blocker_id, blocked_id) DO NOTHING
  `;
}

export async function listBlockedUsers(blockerId: string): Promise<BlockedUserEntry[]> {
  await ensureSchema();
  const rows = (await sql`
    SELECT b.blocked_id as user_id, b.created_at, u.name
    FROM blocked_users b
    JOIN users u ON u.id = b.blocked_id
    WHERE b.blocker_id = ${blockerId}
    ORDER BY b.created_at DESC
  `) as unknown as { user_id: string; created_at: string; name: string | null }[];
  return rows.map((r) => ({ userId: r.user_id, name: r.name, blockedAt: r.created_at }));
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM blocked_users WHERE blocker_id = ${blockerId} AND blocked_id = ${blockedId}`;
}

/** Admin moderatsiya navbati — faqat `status = 'open'`. Har bir yozuv shikoyat
 * qilingan matnning o'zini ham olib keladi (moderator qaror qabul qilishi
 * uchun postni alohida ochish shart emas). Post/izoh allaqachon o'chirilgan
 * bo'lishi mumkin (masalan muallif o'zi o'chirgan) — `targetExists: false`. */
export async function listOpenCommunityReports(limit = 50): Promise<CommunityReportAdmin[]> {
  await ensureSchema();
  const rows = (await sql`
    SELECT
      r.id, r.target_type, r.post_id, r.comment_id, r.reason, r.note, r.status, r.created_at,
      reporter.name as reporter_name,
      COALESCE(c.body, p.body) as target_body,
      -- FIX-02: post haqidagi shikoyatda comment_id NULL bo'lgani uchun
      -- 'c.body IS NOT NULL' doim 'false' (SQL NULL emas!) qaytarardi,
      -- COALESCE esa buni "bo'sh bo'lmagan qiymat" deb hisoblab, p.body'ni
      -- tekshirmay to'xtardi — har bir post haqidagi shikoyat "o'chirilgan"
      -- deb ko'rsatilardi.
      CASE WHEN r.comment_id IS NOT NULL THEN c.body IS NOT NULL ELSE p.body IS NOT NULL END as target_exists,
      COALESCE(cu.name, pu.name) as target_author_name
    FROM community_reports r
    JOIN users reporter ON reporter.id = r.reporter_id
    LEFT JOIN community_posts p ON p.id = r.post_id
    LEFT JOIN users pu ON pu.id = p.user_id
    LEFT JOIN community_comments c ON c.id = r.comment_id
    LEFT JOIN users cu ON cu.id = c.user_id
    WHERE r.status = 'open'
    ORDER BY r.created_at ASC
    LIMIT ${limit}
  `) as unknown as {
    id: string;
    target_type: CommunityReportTargetType;
    post_id: string | null;
    comment_id: string | null;
    reason: CommunityReportReason;
    note: string | null;
    status: "open" | "resolved" | "dismissed";
    created_at: string;
    reporter_name: string | null;
    target_body: string | null;
    target_exists: boolean;
    target_author_name: string | null;
  }[];
  return rows.map((r) => ({
    id: r.id,
    targetType: r.target_type,
    postId: r.post_id,
    commentId: r.comment_id,
    reason: r.reason,
    note: r.note,
    status: r.status,
    createdAt: r.created_at,
    reporterName: r.reporter_name,
    targetBody: r.target_body ?? "(o'chirilgan)",
    targetAuthorName: r.target_author_name,
    targetExists: r.target_exists,
  }));
}

export async function resolveCommunityReport(id: string, status: "resolved" | "dismissed"): Promise<void> {
  await ensureSchema();
  await sql`UPDATE community_reports SET status = ${status}, resolved_at = ${now()} WHERE id = ${id}`;
}

export async function countOpenCommunityReports(): Promise<number> {
  await ensureSchema();
  const [{ count }] = (await sql`SELECT count(*)::int as count FROM community_reports WHERE status = 'open'`) as unknown as { count: number }[];
  return count;
}

// --- CONTENT-001: homiladorlik haftalik kontenti ----------------------------

function pregnancyWeekContentFromRow(row: {
  week: number;
  size_label: string;
  baby_development: string;
  mother_changes: string;
  updated_at: string;
}): PregnancyWeekContent {
  return { week: row.week, sizeLabel: row.size_label, babyDevelopment: row.baby_development, motherChanges: row.mother_changes, updatedAt: row.updated_at };
}

/** `null` — hali admin panel/seed orqali kiritilmagan (chaqiruvchi eski
 * statik meva-qiyoslash tizimiga tushadi — PregnancyWeekImage/getMilestoneForWeek). */
export async function getPregnancyWeekContent(week: number): Promise<PregnancyWeekContent | null> {
  await ensureSchema();
  const clamped = Math.min(42, Math.max(1, Math.round(week)));
  const rows = (await sql`SELECT * FROM pregnancy_week_content WHERE week = ${clamped}`) as unknown as {
    week: number;
    size_label: string;
    baby_development: string;
    mother_changes: string;
    updated_at: string;
  }[];
  return rows[0] ? pregnancyWeekContentFromRow(rows[0]) : null;
}

export async function listPregnancyWeekContent(): Promise<PregnancyWeekContent[]> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM pregnancy_week_content ORDER BY week ASC`) as unknown as {
    week: number;
    size_label: string;
    baby_development: string;
    mother_changes: string;
    updated_at: string;
  }[];
  return rows.map(pregnancyWeekContentFromRow);
}

export async function upsertPregnancyWeekContent(
  week: number,
  patch: { sizeLabel: string; babyDevelopment: string; motherChanges: string }
): Promise<PregnancyWeekContent> {
  await ensureSchema();
  const updatedAt = now();
  await sql`
    INSERT INTO pregnancy_week_content (week, size_label, baby_development, mother_changes, updated_at)
    VALUES (${week}, ${patch.sizeLabel}, ${patch.babyDevelopment}, ${patch.motherChanges}, ${updatedAt})
    ON CONFLICT (week) DO UPDATE SET
      size_label = EXCLUDED.size_label, baby_development = EXCLUDED.baby_development,
      mother_changes = EXCLUDED.mother_changes, updated_at = EXCLUDED.updated_at
  `;
  return { week, ...patch, updatedAt };
}

// --- ADMIN-001: alohida admin hisoblari va audit-jurnal ---------------------

export interface AdminAccountSummary {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export async function createAdminUser(email: string, passwordHash: string, name: string): Promise<AdminAccountSummary> {
  await ensureSchema();
  const id = randomUUID();
  const createdAt = now();
  await sql`INSERT INTO admin_users (id, email, password_hash, name, created_at) VALUES (${id}, ${email.toLowerCase()}, ${passwordHash}, ${name}, ${createdAt})`;
  return { id, email: email.toLowerCase(), name, createdAt };
}

export async function listAdminUsers(): Promise<AdminAccountSummary[]> {
  await ensureSchema();
  const rows = (await sql`SELECT id, email, name, created_at FROM admin_users ORDER BY created_at ASC`) as unknown as {
    id: string;
    email: string;
    name: string;
    created_at: string;
  }[];
  return rows.map((r) => ({ id: r.id, email: r.email, name: r.name, createdAt: r.created_at }));
}

export async function deleteAdminUser(id: string): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM admin_users WHERE id = ${id}`;
}

/** Login uchun — email bo'yicha topadi, parol xeshini ham qaytaradi
 * (solishtirishning o'zi admin-auth.ts'da, timing-safe). */
export async function findAdminUserByEmail(email: string): Promise<{ id: string; name: string; passwordHash: string } | null> {
  await ensureSchema();
  const rows = (await sql`SELECT id, name, password_hash FROM admin_users WHERE email = ${email.toLowerCase()}`) as unknown as {
    id: string;
    name: string;
    password_hash: string;
  }[];
  const row = rows[0];
  return row ? { id: row.id, name: row.name, passwordHash: row.password_hash } : null;
}

/** FIX-03: requireAdmin har so'rovda hisob hali mavjudligini shu orqali
 * tekshiradi — admin o'chirilgandan keyin uning eski sessiya cookie'si
 * (7 kungacha amal qiladi) endi kirish huquqi bermasligi uchun. */
export async function adminUserExistsById(id: string): Promise<boolean> {
  await ensureSchema();
  const rows = (await sql`SELECT 1 FROM admin_users WHERE id = ${id}`) as unknown as unknown[];
  return rows.length > 0;
}

export interface AdminAuditEntry {
  id: string;
  adminLabel: string;
  action: string;
  detail: string | null;
  createdAt: string;
}

/** `adminLabel` snapshot sifatida saqlanadi (FK emas) — admin hisobi keyin
 * o'chirilsa ham tarixiy yozuv "kim qilgani"ni yo'qotmaydi. Xato bo'lsa ham
 * (masalan bog'lanish uzilib qolsa) asosiy amalni to'xtatmaslik uchun
 * chaqiruvchi tomonda odatda `.catch(() => {})` bilan ishlatiladi. */
export async function logAdminAction(adminLabel: string, action: string, detail?: string | null): Promise<void> {
  await ensureSchema();
  await sql`INSERT INTO admin_audit_log (id, admin_label, action, detail, created_at) VALUES (${randomUUID()}, ${adminLabel}, ${action}, ${detail ?? null}, ${now()})`;
}

export async function listAdminAuditLog(limit = 100): Promise<AdminAuditEntry[]> {
  await ensureSchema();
  const rows = (await sql`
    SELECT id, admin_label, action, detail, created_at FROM admin_audit_log ORDER BY created_at DESC LIMIT ${limit}
  `) as unknown as { id: string; admin_label: string; action: string; detail: string | null; created_at: string }[];
  return rows.map((r) => ({ id: r.id, adminLabel: r.admin_label, action: r.action, detail: r.detail, createdAt: r.created_at }));
}

// ---------------------------------------------------------------------------
// Bildirishnomalar — hozircha faqat "postingizga izoh qoldirildi" (repo.ts
// addCommunityComment shu yerda yozadi).
// ---------------------------------------------------------------------------

interface NotificationRow {
  id: string;
  type: AppNotification["type"];
  post_id: string | null;
  message: string | null;
  is_anonymous_actor: boolean;
  is_read: boolean;
  created_at: string;
  actor_name: string | null;
  post_body: string | null;
}

const POST_EXCERPT_LENGTH = 80;

function notificationFromRow(row: NotificationRow): AppNotification {
  const body = row.post_body ?? "";
  return {
    id: row.id,
    type: row.type,
    actorName: row.is_anonymous_actor ? null : row.actor_name,
    postId: row.post_id,
    postExcerpt: row.post_id ? (body.length > POST_EXCERPT_LENGTH ? `${body.slice(0, POST_EXCERPT_LENGTH)}…` : body) : null,
    message: row.message,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

export async function listNotifications(
  userId: string,
  limit = 30
): Promise<{ notifications: AppNotification[]; unreadCount: number }> {
  await ensureSchema();
  const [rows, unreadRows] = (await Promise.all([
    sql`
      SELECT n.*, u.name as actor_name, p.body as post_body
      FROM notifications n
      LEFT JOIN users u ON u.id = n.actor_user_id
      LEFT JOIN community_posts p ON p.id = n.post_id
      WHERE n.user_id = ${userId}
      ORDER BY n.created_at DESC
      LIMIT ${limit}
    `,
    sql`SELECT count(*)::int as count FROM notifications WHERE user_id = ${userId} AND is_read = FALSE`,
  ])) as unknown as [NotificationRow[], { count: number }[]];
  return { notifications: rows.map(notificationFromRow), unreadCount: unreadRows[0].count };
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await ensureSchema();
  await sql`UPDATE notifications SET is_read = TRUE WHERE user_id = ${userId} AND is_read = FALSE`;
}

/** Tizim (kunlik eslatma kabi) bildirishnomasi — haqiqiy "actor" yo'q
 * (`actor_user_id` NULL), shuning uchun UI'da hech kimning ismi ko'rsatilmaydi. */
export async function createSystemNotification(userId: string, type: "daily_reminder", message: string): Promise<void> {
  await ensureSchema();
  await sql`
    INSERT INTO notifications (id, user_id, actor_user_id, type, message, created_at)
    VALUES (${randomUUID()}, ${userId}, NULL, ${type}, ${message}, ${now()})
  `;
}

// FIX2-25: runDailyReminders() uchun idempotentlik tekshiruvi — cron
// (bir kunda bir marta ishlashi kerak) retry/qo'lda qayta ishga
// tushirilsa, bir xil foydalanuvchiga IKKI MARTA yubormaslik uchun.
// Aniq kalendar-kun chegarasi (Toshkent vaqti) o'rniga oxirgi ~20 soat
// ichida allaqachon yuborilganmi deb tekshiradi — cron kuniga bir marta
// ishlagani uchun bu farq qilmaydi, lekin vaqt-zonasi murakkabligidan qochadi.
const DAILY_REMINDER_DEDUPE_HOURS = 20;

export async function hasSentDailyReminderRecently(userId: string): Promise<boolean> {
  await ensureSchema();
  const cutoff = new Date(Date.now() - DAILY_REMINDER_DEDUPE_HOURS * 60 * 60 * 1000).toISOString();
  const rows = (await sql`
    SELECT 1 FROM notifications WHERE user_id = ${userId} AND type = 'daily_reminder' AND created_at > ${cutoff} LIMIT 1
  `) as unknown as unknown[];
  return rows.length > 0;
}

/** Kunlik eslatma (server/daily-reminders.ts) uchun — faqat Telegram bog'langan,
 * bildirishnoma yoqilgan va test/bloklangan bo'lmagan foydalanuvchilar. */
/** Kunlik eslatma uchun — kamida BITTA yetkazish kanali bor foydalanuvchilar
 * (Telegram VA/YOKI haqiqiy push token). Ilgari FAQAT Telegram bog'langanlar
 * qamrab olinardi — mobil ilovadan foydalanadigan, lekin Telegram bog'lamagan
 * foydalanuvchilar hech qachon kunlik eslatma olmasdi (roadmap 10-band bilan
 * tuzatildi). */
export async function listUsersForDailyReminders(): Promise<
  { id: string; language: Language; telegramUserId: string | null; expoPushToken: string | null }[]
> {
  await ensureSchema();
  const rows = (await sql`
    SELECT id, language, telegram_user_id, expo_push_token FROM users
    WHERE (telegram_user_id IS NOT NULL OR expo_push_token IS NOT NULL) AND notifications_enabled = TRUE
      AND is_test_account = FALSE AND is_blocked = FALSE
  `) as unknown as { id: string; language: Language; telegram_user_id: string | null; expo_push_token: string | null }[];
  return rows.map((r) => ({ id: r.id, language: r.language, telegramUserId: r.telegram_user_id, expoPushToken: r.expo_push_token }));
}

export async function hasLoggedToday(userId: string): Promise<boolean> {
  await ensureSchema();
  const rows = (await sql`SELECT 1 FROM cycle_logs WHERE user_id = ${userId} AND date = ${today()} LIMIT 1`) as unknown as unknown[];
  return rows.length > 0;
}

// ---------------------------------------------------------------------------
// Hamkor (Partner) — kod orqali ikkita akkauntni bog'lash (Figma referens:
// "Hamkor" bo'limi). Har bir foydalanuvchi o'z ulashish sozlamalarini
// mustaqil boshqaradi — `partner_links.user_a_shares`/`user_b_shares`.
// ---------------------------------------------------------------------------

const PARTNER_INVITE_TTL_HOURS = 24;
const DEFAULT_PARTNER_SHARING: PartnerShareSettings = { pregnancy: true, checkups: true, mood: true, period: false };

// FIX-03: ilgari faqat 4 xonali raqam edi (~9000 variant) — kod hech qanday
// rate-limitsiz sinab ko'rilishi mumkin bo'lgani uchun bu amalda qo'pol kuch
// bilan bir necha soatda topib bo'ladigan darajada zaif edi. 0/O va 1/I kabi
// chalkash belgilar chiqarib tashlangan 32 belgili alifbodan 8 ta belgi —
// 32^8 (~1.1 trln) variant, pastdagi rate-limit bilan birga amaliy jihatdan
// qo'pol kuchga chidamli.
const PARTNER_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PARTNER_CODE_LENGTH = 8;

function randomPartnerCode(): string {
  let code = "";
  for (let i = 0; i < PARTNER_CODE_LENGTH; i++) {
    code += PARTNER_CODE_ALPHABET[Math.floor(Math.random() * PARTNER_CODE_ALPHABET.length)];
  }
  return `MAMMO-${code}`;
}

// FIX-03: connectPartnerByCode uchun oddiy, DB-asosidagi urinishlar
// hisoblagichi — bir daqiqada belgilangan sondan ko'p urinish qilinsa,
// vaqtincha bloklaydi. Umumiy maqsadli rate-limit infratuzilmasi (Redis va
// h.k.) bu loyihada yo'q, shuning uchun eng minimal, DB'ga tayangan yechim.
const PARTNER_CONNECT_MAX_ATTEMPTS = 5;
const PARTNER_CONNECT_WINDOW_SECONDS = 60;
const PARTNER_CONNECT_BLOCK_SECONDS = 15 * 60;

async function checkPartnerConnectRateLimit(userId: string): Promise<void> {
  const rows = (await sql`
    SELECT attempt_count, window_start, blocked_until FROM partner_connect_attempts WHERE user_id = ${userId}
  `) as unknown as { attempt_count: number; window_start: string; blocked_until: string | null }[];
  const row = rows[0];
  const nowMs = Date.now();

  if (row?.blocked_until && new Date(row.blocked_until).getTime() > nowMs) {
    throw new ApiError(429, "Juda ko'p urinish qildingiz — birozdan keyin qayta urinib ko'ring");
  }

  const windowExpired = !row || new Date(row.window_start).getTime() + PARTNER_CONNECT_WINDOW_SECONDS * 1000 < nowMs;
  if (windowExpired) {
    await sql`
      INSERT INTO partner_connect_attempts (user_id, attempt_count, window_start, blocked_until)
      VALUES (${userId}, 1, ${new Date(nowMs).toISOString()}, NULL)
      ON CONFLICT (user_id) DO UPDATE SET attempt_count = 1, window_start = EXCLUDED.window_start, blocked_until = NULL
    `;
    return;
  }

  const newCount = (row?.attempt_count ?? 0) + 1;
  if (newCount > PARTNER_CONNECT_MAX_ATTEMPTS) {
    const blockedUntil = new Date(nowMs + PARTNER_CONNECT_BLOCK_SECONDS * 1000).toISOString();
    await sql`UPDATE partner_connect_attempts SET attempt_count = ${newCount}, blocked_until = ${blockedUntil} WHERE user_id = ${userId}`;
    throw new ApiError(429, "Juda ko'p urinish qildingiz — birozdan keyin qayta urinib ko'ring");
  }
  await sql`UPDATE partner_connect_attempts SET attempt_count = ${newCount} WHERE user_id = ${userId}`;
}

// FIX3-13: izoh yozish har post egasiga HAQIQIY Telegram/push bildirishnoma
// yuboradi — cheksiz tez izoh bilan "bombardimon" qilishning oldini olish
// uchun (partner-connect naqshiga o'xshab).
const COMMENT_RATE_LIMIT_MAX_ATTEMPTS = 8;
const COMMENT_RATE_LIMIT_WINDOW_SECONDS = 60;
const COMMENT_RATE_LIMIT_BLOCK_SECONDS = 5 * 60;

export async function checkCommentRateLimit(userId: string): Promise<void> {
  await ensureSchema();
  const rows = (await sql`
    SELECT attempt_count, window_start, blocked_until FROM comment_rate_limit_attempts WHERE user_id = ${userId}
  `) as unknown as { attempt_count: number; window_start: string; blocked_until: string | null }[];
  const row = rows[0];
  const nowMs = Date.now();

  if (row?.blocked_until && new Date(row.blocked_until).getTime() > nowMs) {
    throw new ApiError(429, "Juda ko'p izoh yozdingiz — birozdan keyin qayta urinib ko'ring");
  }

  const windowExpired = !row || new Date(row.window_start).getTime() + COMMENT_RATE_LIMIT_WINDOW_SECONDS * 1000 < nowMs;
  if (windowExpired) {
    await sql`
      INSERT INTO comment_rate_limit_attempts (user_id, attempt_count, window_start, blocked_until)
      VALUES (${userId}, 1, ${new Date(nowMs).toISOString()}, NULL)
      ON CONFLICT (user_id) DO UPDATE SET attempt_count = 1, window_start = EXCLUDED.window_start, blocked_until = NULL
    `;
    return;
  }

  const newCount = (row?.attempt_count ?? 0) + 1;
  if (newCount > COMMENT_RATE_LIMIT_MAX_ATTEMPTS) {
    const blockedUntil = new Date(nowMs + COMMENT_RATE_LIMIT_BLOCK_SECONDS * 1000).toISOString();
    await sql`UPDATE comment_rate_limit_attempts SET attempt_count = ${newCount}, blocked_until = ${blockedUntil} WHERE user_id = ${userId}`;
    throw new ApiError(429, "Juda ko'p izoh yozdingiz — birozdan keyin qayta urinib ko'ring");
  }
  await sql`UPDATE comment_rate_limit_attempts SET attempt_count = ${newCount} WHERE user_id = ${userId}`;
}

// FIX3-17: /api/feedback va /api/community/posts/[id]/report'da rate-limit
// yo'q edi — fikr-mulohaza jadvali spam bilan to'ldirilishi yoki bitta
// foydalanuvchi ko'p postlarni "shikoyat" qilib moderatsiya navbatini
// bezovta qilishi mumkin edi. Ikkalasi ham soatlik chegara (kamdan-kam,
// lekin qonuniy holatlarda bir necha marta ishlatilishi mumkin bo'lgan
// amallar uchun daqiqalik emas, soatlik oyna mosroq).
const FEEDBACK_RATE_LIMIT_MAX_ATTEMPTS = 10;
const FEEDBACK_RATE_LIMIT_WINDOW_SECONDS = 60 * 60;
const FEEDBACK_RATE_LIMIT_BLOCK_SECONDS = 30 * 60;

export async function checkFeedbackRateLimit(userId: string): Promise<void> {
  await ensureSchema();
  const rows = (await sql`
    SELECT attempt_count, window_start, blocked_until FROM feedback_rate_limit_attempts WHERE user_id = ${userId}
  `) as unknown as { attempt_count: number; window_start: string; blocked_until: string | null }[];
  const row = rows[0];
  const nowMs = Date.now();

  if (row?.blocked_until && new Date(row.blocked_until).getTime() > nowMs) {
    throw new ApiError(429, "Juda ko'p fikr yubordingiz — birozdan keyin qayta urinib ko'ring");
  }

  const windowExpired = !row || new Date(row.window_start).getTime() + FEEDBACK_RATE_LIMIT_WINDOW_SECONDS * 1000 < nowMs;
  if (windowExpired) {
    await sql`
      INSERT INTO feedback_rate_limit_attempts (user_id, attempt_count, window_start, blocked_until)
      VALUES (${userId}, 1, ${new Date(nowMs).toISOString()}, NULL)
      ON CONFLICT (user_id) DO UPDATE SET attempt_count = 1, window_start = EXCLUDED.window_start, blocked_until = NULL
    `;
    return;
  }

  const newCount = (row?.attempt_count ?? 0) + 1;
  if (newCount > FEEDBACK_RATE_LIMIT_MAX_ATTEMPTS) {
    const blockedUntil = new Date(nowMs + FEEDBACK_RATE_LIMIT_BLOCK_SECONDS * 1000).toISOString();
    await sql`UPDATE feedback_rate_limit_attempts SET attempt_count = ${newCount}, blocked_until = ${blockedUntil} WHERE user_id = ${userId}`;
    throw new ApiError(429, "Juda ko'p fikr yubordingiz — birozdan keyin qayta urinib ko'ring");
  }
  await sql`UPDATE feedback_rate_limit_attempts SET attempt_count = ${newCount} WHERE user_id = ${userId}`;
}

const COMMUNITY_REPORT_RATE_LIMIT_MAX_ATTEMPTS = 10;
const COMMUNITY_REPORT_RATE_LIMIT_WINDOW_SECONDS = 60 * 60;
const COMMUNITY_REPORT_RATE_LIMIT_BLOCK_SECONDS = 30 * 60;

export async function checkCommunityReportRateLimit(userId: string): Promise<void> {
  await ensureSchema();
  const rows = (await sql`
    SELECT attempt_count, window_start, blocked_until FROM community_report_rate_limit_attempts WHERE user_id = ${userId}
  `) as unknown as { attempt_count: number; window_start: string; blocked_until: string | null }[];
  const row = rows[0];
  const nowMs = Date.now();

  if (row?.blocked_until && new Date(row.blocked_until).getTime() > nowMs) {
    throw new ApiError(429, "Juda ko'p shikoyat yubordingiz — birozdan keyin qayta urinib ko'ring");
  }

  const windowExpired = !row || new Date(row.window_start).getTime() + COMMUNITY_REPORT_RATE_LIMIT_WINDOW_SECONDS * 1000 < nowMs;
  if (windowExpired) {
    await sql`
      INSERT INTO community_report_rate_limit_attempts (user_id, attempt_count, window_start, blocked_until)
      VALUES (${userId}, 1, ${new Date(nowMs).toISOString()}, NULL)
      ON CONFLICT (user_id) DO UPDATE SET attempt_count = 1, window_start = EXCLUDED.window_start, blocked_until = NULL
    `;
    return;
  }

  const newCount = (row?.attempt_count ?? 0) + 1;
  if (newCount > COMMUNITY_REPORT_RATE_LIMIT_MAX_ATTEMPTS) {
    const blockedUntil = new Date(nowMs + COMMUNITY_REPORT_RATE_LIMIT_BLOCK_SECONDS * 1000).toISOString();
    await sql`UPDATE community_report_rate_limit_attempts SET attempt_count = ${newCount}, blocked_until = ${blockedUntil} WHERE user_id = ${userId}`;
    throw new ApiError(429, "Juda ko'p shikoyat yubordingiz — birozdan keyin qayta urinib ko'ring");
  }
  await sql`UPDATE community_report_rate_limit_attempts SET attempt_count = ${newCount} WHERE user_id = ${userId}`;
}

interface PartnerLinkRow {
  id: string;
  user_a_id: string;
  user_b_id: string;
  user_a_shares: string;
  user_b_shares: string;
  created_at: string;
}

async function findPartnerLink(userId: string): Promise<PartnerLinkRow | null> {
  const rows = (await sql`
    SELECT * FROM partner_links WHERE user_a_id = ${userId} OR user_b_id = ${userId} LIMIT 1
  `) as unknown as PartnerLinkRow[];
  return rows[0] ?? null;
}

/** Joriy foydalanuvchi uchun ulashish kodi — muddati o'tmagan mavjud kodi
 * bo'lsa o'shani qaytaradi, aks holda yangisini yaratadi. */
export async function createPartnerInviteCode(userId: string): Promise<string> {
  await ensureSchema();
  const existing = (await sql`
    SELECT code FROM partner_invites
    WHERE inviter_user_id = ${userId} AND (expires_at)::timestamptz > now()
    ORDER BY created_at DESC LIMIT 1
  `) as unknown as { code: string }[];
  if (existing[0]) return existing[0].code;

  let code = randomPartnerCode();
  for (let i = 0; i < 5; i++) {
    const clash = (await sql`SELECT 1 FROM partner_invites WHERE code = ${code}`) as unknown as unknown[];
    if (clash.length === 0) break;
    code = randomPartnerCode();
  }
  const expiresAt = new Date(Date.now() + PARTNER_INVITE_TTL_HOURS * 3600 * 1000).toISOString();
  await sql`
    INSERT INTO partner_invites (id, code, inviter_user_id, created_at, expires_at)
    VALUES (${randomUUID()}, ${code}, ${userId}, ${now()}, ${expiresAt})
  `;
  return code;
}

export async function connectPartnerByCode(userId: string, rawCode: string): Promise<void> {
  await ensureSchema();
  // FIX-03: kodni haqiqiy tekshirishdan OLDIN — muvaffaqiyatli va
  // muvaffaqiyatsiz urinishlar bir xil hisoblanadi, aks holda hujumchi faqat
  // "muvaffaqiyatsiz" urinishlarni sekinlashtirib, oxirgi (to'g'ri) urinishni
  // baribir cheklovsiz amalga oshira olardi.
  await checkPartnerConnectRateLimit(userId);
  const code = rawCode.trim().toUpperCase();
  const invites = (await sql`
    SELECT id, inviter_user_id FROM partner_invites WHERE code = ${code} AND (expires_at)::timestamptz > now()
  `) as unknown as { id: string; inviter_user_id: string }[];
  const invite = invites[0];
  if (!invite) throw new ApiError(404, "Kod topilmadi yoki muddati o'tgan");
  if (invite.inviter_user_id === userId) throw new ApiError(400, "O'zingizning kodingizni kirita olmaysiz");

  if (await findPartnerLink(userId)) throw new ApiError(400, "Siz allaqachon hamkorga ulangansiz");
  if (await findPartnerLink(invite.inviter_user_id)) throw new ApiError(400, "Bu foydalanuvchi allaqachon boshqa hamkorga ulangan");

  // FIX2-27: yuqoridagi ikkita tekshiruv va pastdagi INSERT orasida hali ham
  // race condition bor edi (tranzaksiya yo'q) — ikki parallel so'rov
  // (masalan ikki qurilma/tab) bir xil foydalanuvchini ikki xil hamkorga bir
  // vaqtda ulashi mumkin edi. `partner_links(user_a_id)`/`(user_b_id)`dagi
  // UNIQUE indeks (db.ts) endi buni bazada haqiqatan bloklaydi — bu yerda
  // faqat Postgres'ning xom "unique_violation" (23505) xatosini toza,
  // tushunarli xabarga aylantiramiz.
  try {
    await sql`
      INSERT INTO partner_links (id, user_a_id, user_b_id, user_a_shares, user_b_shares, created_at)
      VALUES (
        ${randomUUID()}, ${invite.inviter_user_id}, ${userId},
        ${JSON.stringify(DEFAULT_PARTNER_SHARING)}, ${JSON.stringify(DEFAULT_PARTNER_SHARING)}, ${now()}
      )
    `;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      throw new ApiError(400, "Siz yoki hamkoringiz shu payt ichida allaqachon boshqa hamkorga ulanib bo'lindi");
    }
    throw error;
  }
  await sql`DELETE FROM partner_invites WHERE inviter_user_id = ${invite.inviter_user_id}`;
}

export async function disconnectPartner(userId: string): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM partner_links WHERE user_a_id = ${userId} OR user_b_id = ${userId}`;
}

export async function updatePartnerSharing(userId: string, settings: PartnerShareSettings): Promise<void> {
  await ensureSchema();
  const link = await findPartnerLink(userId);
  if (!link) throw new ApiError(404, "Hamkor topilmadi");
  if (link.user_a_id === userId) {
    await sql`UPDATE partner_links SET user_a_shares = ${JSON.stringify(settings)} WHERE id = ${link.id}`;
  } else {
    await sql`UPDATE partner_links SET user_b_shares = ${JSON.stringify(settings)} WHERE id = ${link.id}`;
  }
}

interface PartnerMessageRow {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

function partnerMessageFromRow(row: PartnerMessageRow, viewerId: string): PartnerChatMessage {
  return { id: row.id, body: row.body, isOwn: row.sender_id === viewerId, createdAt: row.created_at };
}

/** Hamkor bilan to'liq (ikki tomonlama) suhbat tarixi — Telegram uslubidagi chat. */
export async function listPartnerChatMessages(userId: string): Promise<PartnerChatMessage[]> {
  await ensureSchema();
  const link = await findPartnerLink(userId);
  if (!link) throw new ApiError(404, "Hamkor topilmadi");
  const rows = (await sql`
    SELECT * FROM partner_messages WHERE partner_link_id = ${link.id} ORDER BY created_at ASC
  `) as unknown as PartnerMessageRow[];
  return rows.map((row) => partnerMessageFromRow(row, userId));
}

/** Xabar yuboradi (chat tarixiga yoziladi) va hamkorga bildirishnoma qoldiradi
 * (bildirishnomalar ro'yxatida "yangi xabor bor" sifatida ko'rinishi uchun). */
export async function sendPartnerChatMessage(userId: string, body: string): Promise<PartnerChatMessage> {
  await ensureSchema();
  const link = await findPartnerLink(userId);
  if (!link) throw new ApiError(404, "Hamkor topilmadi");
  const partnerId = link.user_a_id === userId ? link.user_b_id : link.user_a_id;
  const id = randomUUID();
  const createdAt = now();
  await sql`
    INSERT INTO partner_messages (id, partner_link_id, sender_id, body, created_at)
    VALUES (${id}, ${link.id}, ${userId}, ${body}, ${createdAt})
  `;
  await sql`
    INSERT INTO notifications (id, user_id, actor_user_id, type, message, created_at)
    VALUES (${randomUUID()}, ${partnerId}, ${userId}, 'partner_message', ${body}, ${createdAt})
  `;
  await notifyUser(partnerId, { title: "💌 Hamkoringizdan yangi xabar", text: body });
  return { id, body, isOwn: true, createdAt };
}

export async function getPartnerStatus(userId: string): Promise<PartnerStatusResponse> {
  await ensureSchema();
  const link = await findPartnerLink(userId);
  if (!link) {
    const inviteRows = (await sql`
      SELECT code FROM partner_invites
      WHERE inviter_user_id = ${userId} AND (expires_at)::timestamptz > now()
      ORDER BY created_at DESC LIMIT 1
    `) as unknown as { code: string }[];
    return { linked: false, partner: null, mySharing: null, partnerData: null, linkedSince: null, myInviteCode: inviteRows[0]?.code ?? null };
  }

  const isA = link.user_a_id === userId;
  const partnerId = isA ? link.user_b_id : link.user_a_id;
  const mySharing = JSON.parse(isA ? link.user_a_shares : link.user_b_shares) as PartnerShareSettings;
  const partnerSharing = JSON.parse(isA ? link.user_b_shares : link.user_a_shares) as PartnerShareSettings;

  const partnerUser = await getUserById(partnerId);

  let pregnancyWeek: number | null = null;
  let nextCheckup: { type: ChecklistItemType; date: string } | null = null;
  let todayMood: Mood | null = null;
  let cycleDay: number | null = null;

  if (partnerSharing.pregnancy) {
    const profile = await getPregnancyProfile(partnerId);
    if (profile) pregnancyWeek = getPregnancyStatus(profile)?.currentWeek ?? null;
  }
  if (partnerSharing.checkups) {
    const items = await listChecklistItems(partnerId);
    const next = items.find((i) => i.status !== "done" && i.dueDate);
    if (next?.dueDate) nextCheckup = { type: next.type, date: next.dueDate };
  }
  if (partnerSharing.mood) {
    const rows = (await sql`SELECT mood FROM cycle_logs WHERE user_id = ${partnerId} AND date = ${today()}`) as unknown as {
      mood: Mood | null;
    }[];
    todayMood = rows[0]?.mood ?? null;
  }
  if (partnerSharing.period) {
    // ARCH-01: hamkorga ko'rsatiladigan sikl kuni AYOLNING O'ZI ko'radigan
    // bilan bir xil bo'lishi shart. Ilgari bu yerda xom `cycle_settings`
    // ishlatilardi, ayolning ekrani esa qaydlardan o'rganilgan qiymatlarni —
    // ya'ni ikkalasi boshqa-boshqa kun ko'rsatishi mumkin edi. Bu shu haftada
    // topilgan "ikki manba" muammosining TO'RTINCHI nusxasi.
    const [settings, logs] = await Promise.all([getCycleSettings(partnerId), listCycleLogs(partnerId, 365)]);
    const adaptive = deriveAdaptiveCycleSettings(logs, settings);
    if (adaptive) {
      const diff = Math.round((new Date(today()).getTime() - new Date(adaptive.lastPeriodStart).getTime()) / 86400000);
      const cycleLen = adaptive.averageCycleLength;
      cycleDay = (((diff % cycleLen) + cycleLen) % cycleLen) + 1;
    }
  }

  return {
    linked: true,
    partner: partnerUser ? { id: partnerUser.id, name: partnerUser.name, avatarUrl: partnerUser.avatarUrl } : null,
    mySharing,
    partnerData: { pregnancyWeek, nextCheckup, todayMood, cycleDay },
    linkedSince: link.created_at,
    myInviteCode: null,
  };
}

/** "Hamkorimni kuzataman" maqsadidagi foydalanuvchi uchun — o'zining
 * (bo'sh) tekshiruv ro'yxati o'rniga ulangan hamkorining ro'yxatini
 * qaytaradi (faqat hamkor "Tekshiruvlar" ma'lumotini ulashishga rozi
 * bo'lsa — `partner_links`dagi `checkups` sozlamasi, xuddi Hamkor
 * ekranidagi "Ko'ra oladi" ro'yxati kabi). Ataylab READ-ONLY: kuzatuvchi
 * hamkorining tekshiruvini "bajarildi" deb belgilay olmaydi — bu haqiqatan
 * uni bajargan kishining o'zi qilishi kerak bo'lgan amal. */
export async function getPartnerChecklistItems(
  userId: string
): Promise<{ items: ChecklistItem[]; emptyReason: "not_linked" | "not_shared" | null; partnerName: string | null }> {
  await ensureSchema();
  const link = await findPartnerLink(userId);
  if (!link) return { items: [], emptyReason: "not_linked", partnerName: null };

  const isA = link.user_a_id === userId;
  const partnerId = isA ? link.user_b_id : link.user_a_id;
  const partnerSharing = JSON.parse(isA ? link.user_b_shares : link.user_a_shares) as PartnerShareSettings;
  const partnerUser = await getUserById(partnerId);

  if (!partnerSharing.checkups) return { items: [], emptyReason: "not_shared", partnerName: partnerUser?.name ?? null };

  const items = await listChecklistItems(partnerId);
  return { items, emptyReason: null, partnerName: partnerUser?.name ?? null };
}

// ---------------------------------------------------------------------------
// AI Yordamchi — chat tarixi. Xotira/pattern-aniqlash logikasi shu yerda emas,
// server/ai-chat.ts'da — u mavjud cycle_logs/onboarding_profiles'ni o'qiydi.
// ---------------------------------------------------------------------------

interface ChatMessageRow {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

function chatMessageFromRow(row: ChatMessageRow): ChatMessage {
  return { id: row.id, role: row.role, content: row.content, createdAt: row.created_at };
}

/** Oxirgi N ta chat xabari (eskidan yangiga qarab) — Claude'ga tarix sifatida
 * yuboriladi va ekranda ko'rsatiladi. */
export async function listChatMessages(userId: string, limit = 50): Promise<ChatMessage[]> {
  await ensureSchema();
  const rows = (await sql`
    SELECT * FROM (
      SELECT * FROM chat_messages WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT ${limit}
    ) recent ORDER BY created_at ASC
  `) as unknown as ChatMessageRow[];
  return rows.map(chatMessageFromRow);
}

/** MONETIZE-01: foydalanuvchi shu paytgacha jami nechta xabar yozgani
 * (assistant javoblari sanalmaydi). "Bepul tanishtiruv" chegarasi shu
 * songa qarab hisoblanadi — alohida jadval/ustun kerak emas, chunki
 * chat_messages allaqachon aynan shu faktni saqlaydi.
 *
 * KUNLIK limitdan (chat_daily_usage) farqi: bu UMRBOD hisoblagich va
 * hech qachon nolga qaytmaydi. */
export async function countUserChatMessages(userId: string): Promise<number> {
  await ensureSchema();
  const rows = (await sql`
    SELECT count(*)::int AS count FROM chat_messages WHERE user_id = ${userId} AND role = 'user'
  `) as unknown as { count: number }[];
  return rows[0]?.count ?? 0;
}

export async function saveChatMessage(userId: string, role: "user" | "assistant", content: string): Promise<ChatMessage> {
  await ensureSchema();
  const id = randomUUID();
  const createdAt = now();
  await sql`
    INSERT INTO chat_messages (id, user_id, role, content, created_at)
    VALUES (${id}, ${userId}, ${role}, ${content}, ${createdAt})
  `;
  return { id, role, content, createdAt };
}

/** FIX3-15: bugungi AI-chat xabarlar sonini atomik oshiradi va yangi
 * qiymatni qaytaradi — parallel so'rovlar (bir necha tab) bir xil
 * "hali to'lmagan" holatni ko'rib, limitdan oshib ketishining oldini oladi
 * (`ON CONFLICT DO UPDATE` bitta qator ustida serializatsiya qiladi). */
export async function incrementDailyChatUsage(userId: string): Promise<number> {
  await ensureSchema();
  const rows = (await sql`
    INSERT INTO chat_daily_usage (user_id, usage_date, message_count)
    VALUES (${userId}, ${today()}, 1)
    ON CONFLICT (user_id, usage_date) DO UPDATE SET message_count = chat_daily_usage.message_count + 1
    RETURNING message_count
  `) as unknown as { message_count: number }[];
  return rows[0]?.message_count ?? 1;
}

/** DATA-ACCURACY-02: `incrementDailyChatUsage` limitni tekshirish uchun AI
 * chaqiruvidan OLDIN oshiriladi (poyga holatidan himoya — FIX3-15), lekin
 * agar shundan keyin AI javobi yoki xabarni saqlash muvaffaqiyatsiz tugasa,
 * foydalanuvchi HECH QANDAY javob olmagan bo'ladi. Muvozanatlash uchun
 * chaqiriladi — aks holda kunlik limit foydalanuvchiga hech qanday foyda
 * bermagan urinishlar uchun jimgina kamayib, Gemini API vaqtinchalik
 * ishlamay qolganda foydalanuvchini haqiqiy sabab-siz kunlik limitidan
 * mahrum qilardi. */
export async function decrementDailyChatUsage(userId: string): Promise<void> {
  await ensureSchema();
  await sql`
    UPDATE chat_daily_usage SET message_count = GREATEST(message_count - 1, 0)
    WHERE user_id = ${userId} AND usage_date = ${today()}
  `;
}

// ---------------------------------------------------------------------------
// Feedback loop — "Fikr bildirish" menyu bandi + AI Yordamchi ichidagi
// yumshoq 👍/👎 so'rov.
// ---------------------------------------------------------------------------

interface FeedbackRow {
  id: string;
  trigger: FeedbackTrigger;
  rating: number | null;
  message: string | null;
  created_at: string;
}

function feedbackFromRow(row: FeedbackRow): FeedbackResponse {
  return { id: row.id, trigger: row.trigger, rating: row.rating, message: row.message, createdAt: row.created_at };
}

export async function submitFeedback(userId: string, input: FeedbackSubmission): Promise<FeedbackResponse> {
  await ensureSchema();
  const id = randomUUID();
  const createdAt = now();
  const rating = input.rating ?? null;
  const message = input.message ?? null;
  await sql`
    INSERT INTO feedback_responses (id, user_id, trigger, rating, message, created_at)
    VALUES (${id}, ${userId}, ${input.trigger}, ${rating}, ${message}, ${createdAt})
  `;
  return { id, trigger: input.trigger, rating, message, createdAt };
}

/** Admin panel uchun — sahifalab ro'yxat + jami son + faqat 'manual'
 * (yulduzcha) baholarning o'rtachasi (chat 👍/👎 shu o'rtachaga kirmaydi). */
export async function listFeedbackAdmin(params: { limit?: number; offset?: number }): Promise<{
  responses: (FeedbackResponse & { userPhone: string | null })[];
  total: number;
  averageRating: number | null;
}> {
  await ensureSchema();
  const limit = params.limit ?? 30;
  const offset = params.offset ?? 0;

  const rows = (await sql`
    SELECT f.*, u.phone as user_phone
    FROM feedback_responses f
    JOIN users u ON u.id = f.user_id
    ORDER BY f.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `) as unknown as (FeedbackRow & { user_phone: string | null })[];
  const [{ count }] = (await sql`SELECT count(*)::int as count FROM feedback_responses`) as unknown as { count: number }[];
  const [{ avg }] = (await sql`
    SELECT avg(rating)::float as avg FROM feedback_responses WHERE trigger = 'manual' AND rating IS NOT NULL
  `) as unknown as { avg: number | null }[];

  return {
    total: count,
    averageRating: avg,
    responses: rows.map((row) => ({ ...feedbackFromRow(row), userPhone: row.user_phone })),
  };
}
