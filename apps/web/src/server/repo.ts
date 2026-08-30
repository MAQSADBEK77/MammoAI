import { randomUUID } from "node:crypto";
import { db } from "./db";
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
  high_contrast: number;
  notifications_enabled: number;
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

export function createAnonymousUser(language: Language): { user: User; tokenVersion: number } {
  const id = randomUUID();
  const createdAt = now();
  db.prepare(
    `INSERT INTO users (id, language, created_at) VALUES (?, ?, ?)`
  ).run(id, language, createdAt);
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

export function findUserByIdentifier(identifier: string): (User & { tokenVersion: number }) | null {
  const column = isEmailIdentifier(identifier) ? "email" : "phone";
  const row = db.prepare(`SELECT * FROM users WHERE ${column} = ?`).get(identifier) as UserRow | undefined;
  return row ? { ...userFromRow(row), tokenVersion: row.token_version } : null;
}

/**
 * Yangi akkaunt — telefon/email bilan, SMS/parolsiz (App.pdf §2: "SMS kelishi shart
 * emas"). Xavfsizlik pasayadi (identifikator bilishning o'zi kirish uchun yetarli),
 * lekin bu ongli tanlangan tezkor-ro'yxatdan o'tish yechimi.
 */
export function createUserWithIdentifier(
  identifier: string,
  language: Language
): { user: User; tokenVersion: number } {
  const id = randomUUID();
  const createdAt = now();
  const isEmail = isEmailIdentifier(identifier);
  db.prepare(
    `INSERT INTO users (id, phone, email, language, created_at) VALUES (?, ?, ?, ?, ?)`
  ).run(id, isEmail ? null : identifier, isEmail ? identifier : null, language, createdAt);
  return {
    user: {
      id,
      phone: isEmail ? null : identifier,
      email: isEmail ? identifier : null,
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

export function getUserById(id: string): (User & { tokenVersion: number }) | null {
  const row = db.prepare(`SELECT * FROM users WHERE id = ?`).get(id) as UserRow | undefined;
  if (!row) return null;
  return { ...userFromRow(row), tokenVersion: row.token_version };
}

export function updateUser(
  id: string,
  patch: Partial<Pick<User, "name" | "phone" | "language" | "fontScale" | "highContrast" | "notificationsEnabled">>
): User {
  const current = getUserById(id);
  if (!current) throw new Error("Foydalanuvchi topilmadi");
  const merged = { ...current, ...patch };
  db.prepare(
    `UPDATE users SET name = ?, phone = ?, language = ?, font_scale = ?, high_contrast = ?, notifications_enabled = ? WHERE id = ?`
  ).run(
    merged.name,
    merged.phone,
    merged.language,
    merged.fontScale,
    merged.highContrast ? 1 : 0,
    merged.notificationsEnabled ? 1 : 0,
    id
  );
  return merged;
}

// ---------------------------------------------------------------------------
// Onboarding
// ---------------------------------------------------------------------------

interface OnboardingRow {
  user_id: string;
  name: string | null;
  age: number;
  is_pregnant: number;
  cycle_regularity: OnboardingProfile["cycleRegularity"];
  family_history: number;
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

export function saveOnboardingProfile(profile: OnboardingProfile): void {
  db.prepare(
    `INSERT INTO onboarding_profiles (
       user_id, name, age, is_pregnant, cycle_regularity, family_history, last_checkup, primary_goal,
       heard_about_us, typical_symptoms, period_attitude, health_conditions, health_conditions_other, height_cm, weight_kg
     )
     VALUES (
       @userId, @name, @age, @isPregnant, @cycleRegularity, @familyHistory, @lastCheckup, @primaryGoal,
       @heardAboutUs, @typicalSymptoms, @periodAttitude, @healthConditions, @healthConditionsOther, @heightCm, @weightKg
     )
     ON CONFLICT(user_id) DO UPDATE SET
       name = excluded.name, age = excluded.age, is_pregnant = excluded.is_pregnant,
       cycle_regularity = excluded.cycle_regularity, family_history = excluded.family_history,
       last_checkup = excluded.last_checkup, primary_goal = excluded.primary_goal,
       heard_about_us = excluded.heard_about_us, typical_symptoms = excluded.typical_symptoms,
       period_attitude = excluded.period_attitude,
       health_conditions = excluded.health_conditions, health_conditions_other = excluded.health_conditions_other,
       height_cm = excluded.height_cm, weight_kg = excluded.weight_kg`
  ).run({
    userId: profile.userId,
    name: profile.name,
    age: profile.age,
    isPregnant: profile.isPregnant ? 1 : 0,
    cycleRegularity: profile.cycleRegularity,
    familyHistory: profile.familyHistory ? 1 : 0,
    lastCheckup: profile.lastCheckup,
    primaryGoal: profile.primaryGoal,
    heardAboutUs: profile.heardAboutUs,
    typicalSymptoms: JSON.stringify(profile.typicalSymptoms ?? []),
    periodAttitude: profile.periodAttitude,
    healthConditions: JSON.stringify(profile.healthConditions ?? []),
    healthConditionsOther: profile.healthConditionsOther,
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
  });
}

export function getOnboardingProfile(userId: string): OnboardingProfile | null {
  const row = db.prepare(`SELECT * FROM onboarding_profiles WHERE user_id = ?`).get(userId) as
    | OnboardingRow
    | undefined;
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

export function getCycleSettings(userId: string): CycleSettings {
  const row = db.prepare(`SELECT * FROM cycle_settings WHERE user_id = ?`).get(userId) as
    | CycleSettingsRow
    | undefined;
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

export function updateCycleSettings(
  userId: string,
  patch: Partial<Pick<CycleSettings, "lastPeriodStart" | "averageCycleLength" | "averagePeriodLength">>
): CycleSettings {
  const current = getCycleSettings(userId);
  const merged = { ...current, ...patch };
  db.prepare(
    `INSERT INTO cycle_settings (user_id, last_period_start, average_cycle_length, average_period_length)
     VALUES (@userId, @lastPeriodStart, @averageCycleLength, @averagePeriodLength)
     ON CONFLICT(user_id) DO UPDATE SET
       last_period_start = excluded.last_period_start,
       average_cycle_length = excluded.average_cycle_length,
       average_period_length = excluded.average_period_length`
  ).run(merged);
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

export function listCycleLogs(userId: string, limit = 180): CycleLog[] {
  const rows = db
    .prepare(`SELECT * FROM cycle_logs WHERE user_id = ? ORDER BY date DESC LIMIT ?`)
    .all(userId, limit) as CycleLogRow[];
  return rows.map(cycleLogFromRow);
}

export function upsertCycleLog(
  userId: string,
  log: Pick<CycleLog, "date" | "flow" | "mood" | "symptoms">
): CycleLog {
  const id = randomUUID();
  const createdAt = now();
  db.prepare(
    `INSERT INTO cycle_logs (id, user_id, date, flow, mood, symptoms, created_at)
     VALUES (@id, @userId, @date, @flow, @mood, @symptoms, @createdAt)
     ON CONFLICT(user_id, date) DO UPDATE SET
       flow = excluded.flow, mood = excluded.mood, symptoms = excluded.symptoms`
  ).run({
    id,
    userId,
    date: log.date,
    flow: log.flow,
    mood: log.mood,
    symptoms: JSON.stringify(log.symptoms ?? []),
    createdAt,
  });

  // Agar bu "hayz boshlanishi" bo'lsa (oqim belgilangan) va sana joriy last_period_start'dan
  // keyingi bo'lsa — sozlamalarni yangilaymiz, shunda bashorat to'g'ri hisoblanadi.
  if (log.flow) {
    const settings = getCycleSettings(userId);
    if (!settings.lastPeriodStart || log.date > settings.lastPeriodStart) {
      updateCycleSettings(userId, { lastPeriodStart: log.date });
    }
  }

  const row = db.prepare(`SELECT * FROM cycle_logs WHERE user_id = ? AND date = ?`).get(userId, log.date) as CycleLogRow;
  return cycleLogFromRow(row);
}

// ---------------------------------------------------------------------------
// Pregnancy
// ---------------------------------------------------------------------------

interface PregnancyRow {
  user_id: string;
  last_menstrual_period: string | null;
  due_date: string | null;
}

export function getPregnancyProfile(userId: string): PregnancyProfile | null {
  const row = db.prepare(`SELECT * FROM pregnancy_profiles WHERE user_id = ?`).get(userId) as
    | PregnancyRow
    | undefined;
  if (!row) return null;
  return { userId, lastMenstrualPeriod: row.last_menstrual_period, dueDate: row.due_date };
}

export function updatePregnancyProfile(
  userId: string,
  patch: Partial<Pick<PregnancyProfile, "lastMenstrualPeriod" | "dueDate">>
): PregnancyProfile {
  const current = getPregnancyProfile(userId) ?? { userId, lastMenstrualPeriod: null, dueDate: null };
  const merged = { ...current, ...patch };
  db.prepare(
    `INSERT INTO pregnancy_profiles (user_id, last_menstrual_period, due_date)
     VALUES (@userId, @lastMenstrualPeriod, @dueDate)
     ON CONFLICT(user_id) DO UPDATE SET
       last_menstrual_period = excluded.last_menstrual_period, due_date = excluded.due_date`
  ).run(merged);
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

export function listPregnancyVisits(userId: string): PregnancyVisitLog[] {
  const rows = db
    .prepare(`SELECT * FROM pregnancy_visits WHERE user_id = ? ORDER BY date ASC`)
    .all(userId) as VisitRow[];
  return rows.map(visitFromRow);
}

export function addPregnancyVisit(
  userId: string,
  visit: Pick<PregnancyVisitLog, "label" | "date" | "clinicName" | "note">
): PregnancyVisitLog {
  const id = randomUUID();
  const createdAt = now();
  db.prepare(
    `INSERT INTO pregnancy_visits (id, user_id, label, date, clinic_name, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, userId, visit.label, visit.date, visit.clinicName, visit.note, createdAt);
  return { id, userId, label: visit.label, date: visit.date, clinicName: visit.clinicName, note: visit.note, createdAt };
}

export function getKicksToday(userId: string): number {
  const row = db
    .prepare(`SELECT count FROM pregnancy_kicks WHERE user_id = ? AND date = ?`)
    .get(userId, today()) as { count: number } | undefined;
  return row?.count ?? 0;
}

export function incrementKicks(userId: string): number {
  db.prepare(
    `INSERT INTO pregnancy_kicks (user_id, date, count) VALUES (?, ?, 1)
     ON CONFLICT(user_id, date) DO UPDATE SET count = count + 1`
  ).run(userId, today());
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
export function listRecentVitalsByType(userId: string, type: VitalType, limit = 2): PregnancyVitalLog[] {
  const rows = db
    .prepare(`SELECT * FROM pregnancy_vitals WHERE user_id = ? AND type = ? ORDER BY created_at DESC LIMIT ?`)
    .all(userId, type, limit) as VitalRow[];
  return rows.map(vitalFromRow);
}

/** Har bir tur uchun eng so'nggi qayd — bosh sahifadagi "Sog'liq ko'rsatkichlari" bo'limi uchun. */
export function getLatestVitals(userId: string): Partial<Record<VitalType, PregnancyVitalLog>> {
  const types: VitalType[] = ["heart_rate", "blood_pressure", "weight", "temperature"];
  const result: Partial<Record<VitalType, PregnancyVitalLog>> = {};
  for (const type of types) {
    const [latest] = listRecentVitalsByType(userId, type, 1);
    if (latest) result[type] = latest;
  }
  return result;
}

export function addPregnancyVital(userId: string, type: VitalType, value: string, recordedAt?: string): PregnancyVitalLog {
  const id = randomUUID();
  const createdAt = now();
  const recorded = recordedAt ?? today();
  db.prepare(
    `INSERT INTO pregnancy_vitals (id, user_id, type, value, recorded_at, created_at) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, userId, type, value, recorded, createdAt);
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

export function listChecklistItems(userId: string): ChecklistItem[] {
  const rows = db
    .prepare(`SELECT * FROM checklist_items WHERE user_id = ? ORDER BY (due_date IS NULL), due_date ASC`)
    .all(userId) as ChecklistRow[];

  const todayStr = today();
  const items = rows.map(checklistFromRow);

  // Muddati o'tgan bandlarni belgilaymiz (spec §4: "Muddati o'tgan bandlar uchun eslatma").
  for (const item of items) {
    if (item.status === "pending" && item.dueDate && item.dueDate < todayStr) {
      db.prepare(`UPDATE checklist_items SET status = 'overdue' WHERE id = ?`).run(item.id);
      item.status = "overdue";
    }
  }
  return items;
}

export function ensureChecklistItem(
  userId: string,
  type: ChecklistItemType,
  dueDate: string | null
): void {
  const exists = db
    .prepare(`SELECT id FROM checklist_items WHERE user_id = ? AND type = ? AND status != 'done'`)
    .get(userId, type);
  if (exists) return;
  db.prepare(
    `INSERT INTO checklist_items (id, user_id, type, status, due_date, created_at) VALUES (?, ?, ?, 'pending', ?, ?)`
  ).run(randomUUID(), userId, type, dueDate, now());
}

export function completeChecklistItem(userId: string, id: string): void {
  db.prepare(
    `UPDATE checklist_items SET status = 'done', completed_at = ? WHERE id = ? AND user_id = ?`
  ).run(now(), id, userId);
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
  free_screening: number;
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

export function listClinics(): Clinic[] {
  const rows = db.prepare(`SELECT * FROM clinics ORDER BY name ASC`).all() as ClinicRow[];
  return rows.map(clinicFromRow);
}

export function logReferralEvent(
  userId: string,
  payload: { clinicId: string; checklistItemId: string | null; action: ReferralAction }
): void {
  db.prepare(
    `INSERT INTO referral_events (id, user_id, clinic_id, checklist_item_id, action, created_at) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(randomUUID(), userId, payload.clinicId, payload.checklistItemId, payload.action, now());
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

export function getRiskQuizResult(userId: string): RiskQuizResult | null {
  const row = db.prepare(`SELECT * FROM risk_quiz_results WHERE user_id = ?`).get(userId) as
    | RiskQuizRow
    | undefined;
  return row ? riskQuizFromRow(row) : null;
}

export function saveRiskQuizResult(
  userId: string,
  answers: RiskQuizAnswers,
  score: number,
  level: RiskLevel
): RiskQuizResult {
  const completedAt = now();
  db.prepare(
    `INSERT INTO risk_quiz_results (user_id, answers, score, level, completed_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       answers = excluded.answers, score = excluded.score, level = excluded.level, completed_at = excluded.completed_at`
  ).run(userId, JSON.stringify(answers), score, level, completedAt);
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

export function listArticles(): Article[] {
  const rows = db.prepare(`SELECT * FROM articles ORDER BY title ASC`).all() as ArticleRow[];
  return rows.map(articleFromRow);
}

export function getArticleBySlug(slug: string): Article | null {
  const row = db.prepare(`SELECT * FROM articles WHERE slug = ?`).get(slug) as ArticleRow | undefined;
  return row ? articleFromRow(row) : null;
}
