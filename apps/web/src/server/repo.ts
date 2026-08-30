import { randomUUID } from "node:crypto";
import { sql, ensureSchema } from "./db";
import { ApiError } from "./api-utils";
import type {
  Article,
  ArticleCategory,
  ChecklistItem,
  ChecklistItemType,
  Clinic,
  CycleLog,
  CycleSettings,
  FlowLevel,
  HealthCondition,
  HeardAboutUs,
  Language,
  Mood,
  OnboardingProfile,
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
import { CHECKLIST_ITEM_IS_FREE, DEFAULT_CYCLE_LENGTH, DEFAULT_PERIOD_LENGTH } from "@mammoai/shared";

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
    },
    tokenVersion: 0,
  };
}

/** Telefon raqammi yoki emailmi — oddiy tekshirish (App.pdf §2). */
export function isEmailIdentifier(identifier: string): boolean {
  return identifier.includes("@");
}

export async function findUserByIdentifier(identifier: string): Promise<(User & { tokenVersion: number }) | null> {
  await ensureSchema();
  const isEmail = isEmailIdentifier(identifier);
  const rows = (isEmail
    ? await sql`SELECT * FROM users WHERE email = ${identifier}`
    : await sql`SELECT * FROM users WHERE phone = ${identifier}`) as unknown as UserRow[];
  const row = rows[0];
  return row ? { ...userFromRow(row), tokenVersion: row.token_version } : null;
}

/**
 * Yangi akkaunt — telefon/email bilan, SMS/parolsiz (App.pdf §2: "SMS kelishi shart
 * emas"). Xavfsizlik pasayadi (identifikator bilishning o'zi kirish uchun yetarli),
 * lekin bu ongli tanlangan tezkor-ro'yxatdan o'tish yechimi.
 */
export async function createUserWithIdentifier(
  identifier: string,
  language: Language
): Promise<{ user: User; tokenVersion: number }> {
  await ensureSchema();
  const id = randomUUID();
  const createdAt = now();
  const isEmail = isEmailIdentifier(identifier);
  const phone = isEmail ? null : identifier;
  const email = isEmail ? identifier : null;
  await sql`INSERT INTO users (id, phone, email, language, created_at) VALUES (${id}, ${phone}, ${email}, ${language}, ${createdAt})`;
  return {
    user: {
      id,
      phone,
      email,
      name: null,
      region: null,
      language,
      fontScale: "normal",
      highContrast: false,
      notificationsEnabled: true,
      createdAt,
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
  patch: Partial<Pick<User, "name" | "phone" | "language" | "fontScale" | "highContrast" | "notificationsEnabled">>
): Promise<User> {
  await ensureSchema();
  const current = await getUserById(id);
  if (!current) throw new Error("Foydalanuvchi topilmadi");
  const merged = { ...current, ...patch };
  await sql`
    UPDATE users SET
      name = ${merged.name}, phone = ${merged.phone}, language = ${merged.language},
      font_scale = ${merged.fontScale}, high_contrast = ${merged.highContrast},
      notifications_enabled = ${merged.notificationsEnabled}
    WHERE id = ${id}
  `;
  return merged;
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
  };
}

export async function saveOnboardingProfile(profile: OnboardingProfile): Promise<void> {
  await ensureSchema();
  const typicalSymptoms = JSON.stringify(profile.typicalSymptoms ?? []);
  const healthConditions = JSON.stringify(profile.healthConditions ?? []);
  await sql`
    INSERT INTO onboarding_profiles (
      user_id, name, age, is_pregnant, cycle_regularity, family_history, last_checkup, primary_goal,
      heard_about_us, typical_symptoms, period_attitude, health_conditions, health_conditions_other, height_cm, weight_kg
    )
    VALUES (
      ${profile.userId}, ${profile.name}, ${profile.age}, ${profile.isPregnant}, ${profile.cycleRegularity},
      ${profile.familyHistory}, ${profile.lastCheckup}, ${profile.primaryGoal}, ${profile.heardAboutUs},
      ${typicalSymptoms}, ${profile.periodAttitude}, ${healthConditions}, ${profile.healthConditionsOther},
      ${profile.heightCm}, ${profile.weightKg}
    )
    ON CONFLICT (user_id) DO UPDATE SET
      name = EXCLUDED.name, age = EXCLUDED.age, is_pregnant = EXCLUDED.is_pregnant,
      cycle_regularity = EXCLUDED.cycle_regularity, family_history = EXCLUDED.family_history,
      last_checkup = EXCLUDED.last_checkup, primary_goal = EXCLUDED.primary_goal,
      heard_about_us = EXCLUDED.heard_about_us, typical_symptoms = EXCLUDED.typical_symptoms,
      period_attitude = EXCLUDED.period_attitude,
      health_conditions = EXCLUDED.health_conditions, health_conditions_other = EXCLUDED.health_conditions_other,
      height_cm = EXCLUDED.height_cm, weight_kg = EXCLUDED.weight_kg
  `;
}

export async function getOnboardingProfile(userId: string): Promise<OnboardingProfile | null> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM onboarding_profiles WHERE user_id = ${userId}`) as unknown as OnboardingRow[];
  const row = rows[0];
  return row ? onboardingFromRow(row) : null;
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
