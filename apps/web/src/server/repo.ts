import { randomUUID } from "node:crypto";
import { sql, ensureSchema } from "./db";
import { ApiError } from "./api-utils";
import type {
  AppNotification,
  Article,
  ArticleCategory,
  BloodType,
  ChecklistItem,
  ChecklistItemType,
  Clinic,
  CommunityComment,
  CommunityPost,
  CommunityStats,
  CommunityTag,
  CycleLog,
  CycleSettings,
  FlowLevel,
  HealthCondition,
  HeardAboutUs,
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
  VitalType,
  ReferralAction,
  RiskQuizAnswers,
  RiskQuizResult,
  RiskLevel,
  Symptom,
  User,
} from "@mammoai/shared";
import { CHECKLIST_ITEM_IS_FREE, DEFAULT_CYCLE_LENGTH, DEFAULT_PERIOD_LENGTH, getPregnancyStatus } from "@mammoai/shared";

const now = () => new Date().toISOString();
const today = () => now().slice(0, 10);

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
  high_contrast: boolean;
  notifications_enabled: boolean;
  token_version: number;
  created_at: string;
  avatar_url: string | null;
  is_blocked: boolean;
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
    highContrast: !!row.high_contrast,
    notificationsEnabled: !!row.notifications_enabled,
    createdAt: row.created_at,
    avatarUrl: row.avatar_url,
    isBlocked: !!row.is_blocked,
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
      highContrast: false,
      notificationsEnabled: true,
      createdAt,
      avatarUrl: null,
      isBlocked: false,
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
      highContrast: false,
      notificationsEnabled: true,
      createdAt,
      avatarUrl: null,
      isBlocked: false,
    },
    tokenVersion: 0,
  };
}

export async function getUserById(id: string): Promise<(User & { tokenVersion: number }) | null> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM users WHERE id = ${id}`) as unknown as UserRow[];
  const row = rows[0];
  if (!row) return null;
  return { ...userFromRow(row), tokenVersion: row.token_version };
}

export async function updateUser(
  id: string,
  patch: Partial<
    Pick<User, "name" | "phone" | "language" | "fontScale" | "highContrast" | "notificationsEnabled" | "avatarUrl" | "isBlocked">
  >
): Promise<User> {
  await ensureSchema();
  const current = await getUserById(id);
  if (!current) throw new Error("Foydalanuvchi topilmadi");
  const merged = { ...current, ...patch };
  await sql`
    UPDATE users SET
      name = ${merged.name}, phone = ${merged.phone}, language = ${merged.language},
      font_scale = ${merged.fontScale}, high_contrast = ${merged.highContrast},
      notifications_enabled = ${merged.notificationsEnabled}, avatar_url = ${merged.avatarUrl},
      is_blocked = ${merged.isBlocked}
    WHERE id = ${id}
  `;
  return merged;
}

/** Akkaunt va unga tegishli BARCHA ma'lumotlarni butunlay o'chiradi (Play Store
 * "hisobni o'chirish" talabi — App.pdf'dan tashqari). Barcha bog'liq jadvallar
 * `users(id)`ga `ON DELETE CASCADE` bilan bog'langan (db.ts), shuning uchun bitta
 * qatorni o'chirish tsikl yozuvlari, hamkorlik, jamiyat postlari va h.k.ni ham
 * avtomatik olib tashlaydi. Qaytarib bo'lmaydigan amal.
 */
export async function deleteUser(id: string): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM users WHERE id = ${id}`;
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
  family_history: boolean;
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
    familyHistory: !!row.family_history,
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
  await sql`
    INSERT INTO onboarding_profiles (
      user_id, name, age, is_pregnant, cycle_regularity, family_history, last_checkup, primary_goal,
      heard_about_us, typical_symptoms, period_attitude, health_conditions, health_conditions_other, height_cm, weight_kg, blood_type
    )
    VALUES (
      ${profile.userId}, ${profile.name}, ${profile.age}, ${profile.isPregnant}, ${profile.cycleRegularity},
      ${profile.familyHistory}, ${profile.lastCheckup}, ${profile.primaryGoal}, ${profile.heardAboutUs},
      ${typicalSymptoms}, ${profile.periodAttitude}, ${healthConditions}, ${profile.healthConditionsOther},
      ${profile.heightCm}, ${profile.weightKg}, ${profile.bloodType}
    )
    ON CONFLICT (user_id) DO UPDATE SET
      name = EXCLUDED.name, age = EXCLUDED.age, is_pregnant = EXCLUDED.is_pregnant,
      cycle_regularity = EXCLUDED.cycle_regularity, family_history = EXCLUDED.family_history,
      last_checkup = EXCLUDED.last_checkup, primary_goal = EXCLUDED.primary_goal,
      heard_about_us = EXCLUDED.heard_about_us, typical_symptoms = EXCLUDED.typical_symptoms,
      period_attitude = EXCLUDED.period_attitude,
      health_conditions = EXCLUDED.health_conditions, health_conditions_other = EXCLUDED.health_conditions_other,
      height_cm = EXCLUDED.height_cm, weight_kg = EXCLUDED.weight_kg, blood_type = EXCLUDED.blood_type
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
  patch: Partial<Pick<OnboardingProfile, "primaryGoal" | "isPregnant" | "age" | "heightCm" | "weightKg" | "bloodType">>
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
  };
}

export async function listCycleLogs(userId: string, limit = 180): Promise<CycleLog[]> {
  await ensureSchema();
  const rows = (await sql`
    SELECT * FROM cycle_logs WHERE user_id = ${userId} ORDER BY date DESC LIMIT ${limit}
  `) as unknown as CycleLogRow[];
  return rows.map(cycleLogFromRow);
}

export async function upsertCycleLog(
  userId: string,
  log: Pick<CycleLog, "date" | "flow" | "mood" | "symptoms">
): Promise<CycleLog> {
  await ensureSchema();
  const id = randomUUID();
  const createdAt = now();
  const symptoms = JSON.stringify(log.symptoms ?? []);
  await sql`
    INSERT INTO cycle_logs (id, user_id, date, flow, mood, symptoms, created_at)
    VALUES (${id}, ${userId}, ${log.date}, ${log.flow}, ${log.mood}, ${symptoms}, ${createdAt})
    ON CONFLICT (user_id, date) DO UPDATE SET
      flow = EXCLUDED.flow, mood = EXCLUDED.mood, symptoms = EXCLUDED.symptoms
  `;

  // Agar bu "hayz boshlanishi" bo'lsa (oqim belgilangan) va sana joriy last_period_start'dan
  // keyingi bo'lsa — sozlamalarni yangilaymiz, shunda bashorat to'g'ri hisoblanadi.
  if (log.flow) {
    const settings = await getCycleSettings(userId);
    if (!settings.lastPeriodStart || log.date > settings.lastPeriodStart) {
      await updateCycleSettings(userId, { lastPeriodStart: log.date });
    }
  }

  const rows = (await sql`
    SELECT * FROM cycle_logs WHERE user_id = ${userId} AND date = ${log.date}
  `) as unknown as CycleLogRow[];
  return cycleLogFromRow(rows[0]);
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

export async function ensureChecklistItem(userId: string, type: ChecklistItemType, dueDate: string | null): Promise<void> {
  await ensureSchema();
  const existing = await sql`
    SELECT id FROM checklist_items WHERE user_id = ${userId} AND type = ${type} AND status != 'done'
  `;
  if (existing.length > 0) return;
  await sql`
    INSERT INTO checklist_items (id, user_id, type, status, due_date, created_at)
    VALUES (${randomUUID()}, ${userId}, ${type}, 'pending', ${dueDate}, ${now()})
  `;
}

export async function completeChecklistItem(userId: string, id: string): Promise<void> {
  await ensureSchema();
  await sql`
    UPDATE checklist_items SET status = 'done', completed_at = ${now()} WHERE id = ${id} AND user_id = ${userId}
  `;
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
  await sql`DELETE FROM clinics WHERE id = ${id}`;
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

  const whereClause = searchPattern
    ? sql`WHERE u.name ILIKE ${searchPattern} OR u.phone ILIKE ${searchPattern} OR u.email ILIKE ${searchPattern}`
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
    ${whereClause}
    ORDER BY u.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `) as unknown as (UserRow & { primary_goal: OnboardingProfile["primaryGoal"] | null; cycle_logs_count: number; last_active_at: string | null })[];

  const [{ count }] = (await sql`SELECT count(*)::int as count FROM users u ${whereClause}`) as unknown as { count: number }[];

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

export async function deleteCommunityCommentAdmin(postId: string, commentId: string): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM community_comments WHERE id = ${commentId} AND post_id = ${postId}`;
  await sql`UPDATE community_posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = ${postId}`;
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
    sql`SELECT count(*)::int as count FROM users`,
    sql`SELECT count(*)::int as count FROM users WHERE (created_at)::timestamptz >= now() - interval '1 day'`,
    sql`SELECT count(*)::int as count FROM users WHERE (created_at)::timestamptz >= now() - interval '7 days'`,
    sql`
      SELECT count(DISTINCT user_id)::int as count FROM (
        SELECT user_id, created_at FROM cycle_logs WHERE (created_at)::timestamptz >= now() - interval '7 days'
        UNION ALL
        SELECT user_id, created_at FROM pregnancy_vitals WHERE (created_at)::timestamptz >= now() - interval '7 days'
        UNION ALL
        SELECT user_id, completed_at FROM checklist_items WHERE completed_at IS NOT NULL AND (completed_at)::timestamptz >= now() - interval '7 days'
      ) recent
    `,
    sql`SELECT language, count(*)::int as count FROM users GROUP BY language ORDER BY count DESC`,
    sql`SELECT primary_goal as goal, count(*)::int as count FROM onboarding_profiles GROUP BY primary_goal ORDER BY count DESC`,
    sql`SELECT count(*)::int as count FROM cycle_logs`,
    sql`SELECT count(*)::int as count FROM pregnancy_visits`,
    sql`SELECT count(*)::int as count FROM pregnancy_vitals`,
    sql`SELECT count(*)::int as count FROM checklist_items WHERE status = 'done'`,
    sql`SELECT count(*)::int as count FROM risk_quiz_results`,
    sql`SELECT count(*)::int as count FROM referral_events`,
    sql`SELECT count(*)::int as count FROM clinics`,
    sql`SELECT count(*)::int as count FROM articles`,
    sql`
      SELECT to_char(d.day, 'YYYY-MM-DD') as day, count(u.id)::int as count
      FROM generate_series(now()::date - interval '29 days', now()::date, interval '1 day') as d(day)
      LEFT JOIN users u ON (u.created_at)::timestamptz::date = d.day
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

export async function listCommunityPosts(
  viewerId: string,
  params: { tag?: CommunityTag; limit?: number; offset?: number }
): Promise<{ posts: CommunityPost[]; total: number }> {
  await ensureSchema();
  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;
  const tagFilter = params.tag ? sql`WHERE p.tag = ${params.tag}` : sql``;
  const rows = (await sql`
    SELECT p.*, u.name as author_name, u.avatar_url as author_avatar_url,
      EXISTS(SELECT 1 FROM community_post_likes l WHERE l.post_id = p.id AND l.user_id = ${viewerId}) as viewer_liked
    FROM community_posts p
    JOIN users u ON u.id = p.user_id
    ${tagFilter}
    ORDER BY p.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `) as unknown as CommunityPostRow[];
  const [{ count }] = (await sql`SELECT count(*)::int as count FROM community_posts p ${tagFilter}`) as unknown as { count: number }[];
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
  if (existing.length > 0) {
    await sql`DELETE FROM community_post_likes WHERE post_id = ${postId} AND user_id = ${userId}`;
    await sql`UPDATE community_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = ${postId}`;
    liked = false;
  } else {
    await sql`
      INSERT INTO community_post_likes (post_id, user_id, created_at) VALUES (${postId}, ${userId}, ${now()})
      ON CONFLICT (post_id, user_id) DO NOTHING
    `;
    await sql`UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = ${postId}`;
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
    sql`SELECT count(*)::int as count FROM users`,
    sql`SELECT count(*)::int as count FROM community_posts`,
    sql`SELECT count(*)::int as count FROM community_posts WHERE (created_at)::timestamptz >= now() - interval '1 day'`,
  ])) as unknown as [{ count: number }[], { count: number }[], { count: number }[]];
  return { totalMembers, totalPosts, postsToday };
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

// ---------------------------------------------------------------------------
// Hamkor (Partner) — kod orqali ikkita akkauntni bog'lash (Figma referens:
// "Hamkor" bo'limi). Har bir foydalanuvchi o'z ulashish sozlamalarini
// mustaqil boshqaradi — `partner_links.user_a_shares`/`user_b_shares`.
// ---------------------------------------------------------------------------

const PARTNER_INVITE_TTL_HOURS = 24;
const DEFAULT_PARTNER_SHARING: PartnerShareSettings = { pregnancy: true, checkups: true, mood: true, period: false };

function randomPartnerCode(): string {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `MAMMO-${digits}`;
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
  const code = rawCode.trim().toUpperCase();
  const invites = (await sql`
    SELECT id, inviter_user_id FROM partner_invites WHERE code = ${code} AND (expires_at)::timestamptz > now()
  `) as unknown as { id: string; inviter_user_id: string }[];
  const invite = invites[0];
  if (!invite) throw new ApiError(404, "Kod topilmadi yoki muddati o'tgan");
  if (invite.inviter_user_id === userId) throw new ApiError(400, "O'zingizning kodingizni kirita olmaysiz");

  if (await findPartnerLink(userId)) throw new ApiError(400, "Siz allaqachon hamkorga ulangansiz");
  if (await findPartnerLink(invite.inviter_user_id)) throw new ApiError(400, "Bu foydalanuvchi allaqachon boshqa hamkorga ulangan");

  await sql`
    INSERT INTO partner_links (id, user_a_id, user_b_id, user_a_shares, user_b_shares, created_at)
    VALUES (
      ${randomUUID()}, ${invite.inviter_user_id}, ${userId},
      ${JSON.stringify(DEFAULT_PARTNER_SHARING)}, ${JSON.stringify(DEFAULT_PARTNER_SHARING)}, ${now()}
    )
  `;
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
    const settings = await getCycleSettings(partnerId);
    if (settings.lastPeriodStart) {
      const diff = Math.round((new Date(today()).getTime() - new Date(settings.lastPeriodStart).getTime()) / 86400000);
      const cycleLen = settings.averageCycleLength || DEFAULT_CYCLE_LENGTH;
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
