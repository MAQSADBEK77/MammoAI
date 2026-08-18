import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { hashPassword } from "./auth";
import { ApiError } from "./api-utils";
import { riskLevelFromPercent } from "@/lib/risk";
import type { QuizAttempt, QuizQuestion, RiskLevel, User } from "@/lib/types";

// A row as stored in the `users` table — has the password hash the API
// layer must never send to the client.
export interface UserRow extends User {
  passwordHash: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "mammoai.db");

declare global {
  var __mammoaiDb: Database.Database | undefined;
}

function openDb(): Database.Database {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  // Let a second concurrent process (e.g. a build tool evaluating several
  // route modules in parallel) wait for the writer lock instead of failing
  // outright — paired with the .immediate() seed transaction below.
  db.pragma("busy_timeout = 5000");
  return db;
}

// Reused across hot-reloads in dev (Next.js re-evaluates modules per
// request in some modes) so we don't open the file dozens of times.
const db = global.__mammoaiDb ?? openDb();
if (process.env.NODE_ENV !== "production") global.__mammoaiDb = db;

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    birth_date TEXT NOT NULL,
    passport_series TEXT NOT NULL,
    phone TEXT DEFAULT '',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS quiz_questions (
    id TEXT PRIMARY KEY,
    "order" INTEGER NOT NULL,
    category TEXT NOT NULL DEFAULT '',
    text TEXT NOT NULL,
    options TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS quiz_attempts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    answers TEXT NOT NULL,
    total_score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    percent INTEGER NOT NULL,
    risk_level TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_attempts_user ON quiz_attempts(user_id);
`);

// ---------------------------------------------------------------------------
// Row <-> domain-type mapping
// ---------------------------------------------------------------------------

function rowToUser(row: {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  passport_series: string;
  phone: string | null;
  created_at: string;
}): UserRow {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role as User["role"],
    firstName: row.first_name,
    lastName: row.last_name,
    birthDate: row.birth_date,
    passportSeries: row.passport_series,
    phone: row.phone ?? "",
    createdAt: row.created_at,
  };
}

export function toPublicUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    firstName: row.firstName,
    lastName: row.lastName,
    birthDate: row.birthDate,
    passportSeries: row.passportSeries,
    phone: row.phone,
    createdAt: row.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export function getUserByEmail(email: string): UserRow | undefined {
  const row = db
    .prepare("SELECT * FROM users WHERE lower(email) = lower(?)")
    .get(email) as Parameters<typeof rowToUser>[0] | undefined;
  return row ? rowToUser(row) : undefined;
}

export function getUserById(id: string): UserRow | undefined {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as
    | Parameters<typeof rowToUser>[0]
    | undefined;
  return row ? rowToUser(row) : undefined;
}

export function getAllUsers(): UserRow[] {
  const rows = db.prepare("SELECT * FROM users ORDER BY created_at ASC").all() as Parameters<
    typeof rowToUser
  >[0][];
  return rows.map(rowToUser);
}

export function createUser(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  passportSeries: string;
  phone?: string;
  role?: "user" | "admin";
}): UserRow {
  if (getUserByEmail(input.email)) {
    throw new ApiError(409, "Bu email allaqachon ro'yxatdan o'tgan.");
  }
  const row: UserRow = {
    id: randomUUID(),
    email: input.email,
    passwordHash: hashPassword(input.password),
    role: input.role ?? "user",
    firstName: input.firstName,
    lastName: input.lastName,
    birthDate: input.birthDate,
    passportSeries: input.passportSeries,
    phone: input.phone ?? "",
    createdAt: new Date().toISOString(),
  };
  db.prepare(
    `INSERT INTO users (id, email, password_hash, role, first_name, last_name, birth_date, passport_series, phone, created_at)
     VALUES (@id, @email, @passwordHash, @role, @firstName, @lastName, @birthDate, @passportSeries, @phone, @createdAt)`
  ).run(row);
  return row;
}

export function updateUserProfile(
  id: string,
  patch: Partial<Pick<User, "firstName" | "lastName" | "birthDate" | "passportSeries" | "phone">>
): UserRow | undefined {
  const current = getUserById(id);
  if (!current) return undefined;
  const next = { ...current, ...patch };
  db.prepare(
    `UPDATE users SET first_name=@firstName, last_name=@lastName, birth_date=@birthDate,
     passport_series=@passportSeries, phone=@phone WHERE id=@id`
  ).run(next);
  return next;
}

export function deleteUser(id: string) {
  db.prepare("DELETE FROM users WHERE id = ?").run(id);
}

export interface UserWithLatestAttempt extends User {
  latestAttempt: { percent: number; riskLevel: RiskLevel; createdAt: string } | null;
}

export function getAllUsersWithLatestAttempt(): UserWithLatestAttempt[] {
  const rows = db
    .prepare(
      `SELECT u.*,
        (SELECT percent FROM quiz_attempts a WHERE a.user_id = u.id ORDER BY a.created_at DESC LIMIT 1) AS latest_percent,
        (SELECT risk_level FROM quiz_attempts a WHERE a.user_id = u.id ORDER BY a.created_at DESC LIMIT 1) AS latest_risk_level,
        (SELECT created_at FROM quiz_attempts a WHERE a.user_id = u.id ORDER BY a.created_at DESC LIMIT 1) AS latest_created_at
       FROM users u ORDER BY u.created_at ASC`
    )
    .all() as (Parameters<typeof rowToUser>[0] & {
    latest_percent: number | null;
    latest_risk_level: string | null;
    latest_created_at: string | null;
  })[];

  return rows.map((row) => ({
    ...toPublicUser(rowToUser(row)),
    latestAttempt:
      row.latest_percent != null
        ? {
            percent: row.latest_percent,
            riskLevel: row.latest_risk_level as RiskLevel,
            createdAt: row.latest_created_at as string,
          }
        : null,
  }));
}

// ---------------------------------------------------------------------------
// Quiz questions
// ---------------------------------------------------------------------------

function rowToQuestion(row: {
  id: string;
  order: number;
  category: string;
  text: string;
  options: string;
}): QuizQuestion {
  return {
    id: row.id,
    order: row.order,
    category: row.category,
    text: row.text,
    options: JSON.parse(row.options),
  };
}

export function getQuestions(): QuizQuestion[] {
  const rows = db.prepare('SELECT * FROM quiz_questions ORDER BY "order" ASC').all() as Parameters<
    typeof rowToQuestion
  >[0][];
  return rows.map(rowToQuestion);
}

export function getQuestionById(id: string): QuizQuestion | undefined {
  const row = db.prepare("SELECT * FROM quiz_questions WHERE id = ?").get(id) as
    | Parameters<typeof rowToQuestion>[0]
    | undefined;
  return row ? rowToQuestion(row) : undefined;
}

export function createQuestion(input: Omit<QuizQuestion, "id">): QuizQuestion {
  const question: QuizQuestion = { ...input, id: randomUUID() };
  db.prepare(
    `INSERT INTO quiz_questions (id, "order", category, text, options) VALUES (@id, @order, @category, @text, @options)`
  ).run({ ...question, options: JSON.stringify(question.options) });
  return question;
}

export function updateQuestion(id: string, input: Omit<QuizQuestion, "id">): QuizQuestion {
  const question: QuizQuestion = { ...input, id };
  db.prepare(
    `UPDATE quiz_questions SET "order"=@order, category=@category, text=@text, options=@options WHERE id=@id`
  ).run({ ...question, options: JSON.stringify(question.options) });
  return question;
}

export function deleteQuestion(id: string) {
  db.prepare("DELETE FROM quiz_questions WHERE id = ?").run(id);
}

export function reorderQuestions(orderedIds: string[]) {
  const update = db.prepare('UPDATE quiz_questions SET "order" = ? WHERE id = ?');
  const tx = db.transaction((ids: string[]) => {
    ids.forEach((id, index) => update.run(index + 1, id));
  });
  tx(orderedIds);
}

// ---------------------------------------------------------------------------
// Quiz attempts
// ---------------------------------------------------------------------------

function rowToAttempt(row: {
  id: string;
  user_id: string;
  answers: string;
  total_score: number;
  max_score: number;
  percent: number;
  risk_level: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
}): QuizAttempt {
  return {
    id: row.id,
    userId: row.user_id,
    userFirstName: row.first_name,
    userLastName: row.last_name,
    answers: JSON.parse(row.answers),
    totalScore: row.total_score,
    maxScore: row.max_score,
    percent: row.percent,
    riskLevel: row.risk_level as RiskLevel,
    createdAt: row.created_at,
  };
}

export function getAttemptsForUser(userId: string): QuizAttempt[] {
  const rows = db
    .prepare("SELECT * FROM quiz_attempts WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId) as Parameters<typeof rowToAttempt>[0][];
  return rows.map(rowToAttempt);
}

export function getAllAttempts(): QuizAttempt[] {
  const rows = db
    .prepare(
      `SELECT a.*, u.first_name, u.last_name FROM quiz_attempts a
       JOIN users u ON u.id = a.user_id
       ORDER BY a.created_at DESC`
    )
    .all() as Parameters<typeof rowToAttempt>[0][];
  return rows.map(rowToAttempt);
}

/** Recomputes the score server-side from the current questions — never trusts a client-supplied score. */
export function submitAttempt(
  userId: string,
  selections: { questionId: string; optionId: string }[]
): QuizAttempt {
  const questions = getQuestions();
  const maxScore = questions.reduce(
    (sum, q) => sum + Math.max(...q.options.map((o) => o.score), 0),
    0
  );

  const answers = selections.map((sel) => {
    const question = questions.find((q) => q.id === sel.questionId);
    const option = question?.options.find((o) => o.id === sel.optionId);
    if (!question || !option) {
      throw new Error("Noto'g'ri savol yoki javob variant tanlandi.");
    }
    return { questionId: sel.questionId, optionId: sel.optionId, score: option.score };
  });

  const totalScore = answers.reduce((sum, a) => sum + a.score, 0);
  const percent = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  const attempt: QuizAttempt = {
    id: randomUUID(),
    userId,
    answers,
    totalScore,
    maxScore,
    percent,
    riskLevel: riskLevelFromPercent(percent),
    createdAt: new Date().toISOString(),
  };

  db.prepare(
    `INSERT INTO quiz_attempts (id, user_id, answers, total_score, max_score, percent, risk_level, created_at)
     VALUES (@id, @userId, @answers, @totalScore, @maxScore, @percent, @riskLevel, @createdAt)`
  ).run({ ...attempt, answers: JSON.stringify(attempt.answers) });

  return attempt;
}

// ---------------------------------------------------------------------------
// First-run seed — an admin account and a starter question set, so the app
// is usable immediately on a fresh database.
// ---------------------------------------------------------------------------

const DEFAULT_QUESTIONS: Omit<QuizQuestion, "id">[] = [
  {
    order: 1,
    category: "Umumiy ma'lumot",
    text: "Yoshingiz nechida?",
    options: [
      { id: randomUUID(), text: "30 yoshgacha", score: 0 },
      { id: randomUUID(), text: "30–39 yosh", score: 1 },
      { id: randomUUID(), text: "40–49 yosh", score: 2 },
      { id: randomUUID(), text: "50 yosh va undan katta", score: 3 },
    ],
  },
  {
    order: 2,
    category: "Oilaviy tarix",
    text: "Oilangizda (ona, opa-singil, buvi) ko'krak saratoni tarixi bo'lganmi?",
    options: [
      { id: randomUUID(), text: "Yo'q", score: 0 },
      { id: randomUUID(), text: "Uzoq qarindoshda bo'lgan", score: 1 },
      { id: randomUUID(), text: "Yaqin qarindoshda bo'lgan", score: 3 },
    ],
  },
  {
    order: 3,
    category: "Alomatlar",
    text: "Ko'kragingizda shish yoki tugun sezganmisiz?",
    options: [
      { id: randomUUID(), text: "Yo'q", score: 0 },
      { id: randomUUID(), text: "Ha", score: 3 },
    ],
  },
  {
    order: 4,
    category: "Alomatlar",
    text: "Ko'krak shakli, o'lchami yoki teri rangida so'nggi paytda o'zgarish kuzatdingizmi?",
    options: [
      { id: randomUUID(), text: "Yo'q", score: 0 },
      { id: randomUUID(), text: "Ha", score: 2 },
    ],
  },
  {
    order: 5,
    category: "Alomatlar",
    text: "Ko'krak uchidan sut bilan bog'liq bo'lmagan suyuqlik ajralishi bormi?",
    options: [
      { id: randomUUID(), text: "Yo'q", score: 0 },
      { id: randomUUID(), text: "Ha", score: 2 },
    ],
  },
  {
    order: 6,
    category: "Alomatlar",
    text: "Qo'ltiq ostida shish yoki og'riq sezyapsizmi?",
    options: [
      { id: randomUUID(), text: "Yo'q", score: 0 },
      { id: randomUUID(), text: "Ha", score: 2 },
    ],
  },
  {
    order: 7,
    category: "Gormonal omillar",
    text: "Uzoq muddat gormonal terapiya yoki kontratseptiv vositalar qabul qilganmisiz?",
    options: [
      { id: randomUUID(), text: "Yo'q", score: 0 },
      { id: randomUUID(), text: "Ha", score: 1 },
    ],
  },
  {
    order: 8,
    category: "Gormonal omillar",
    text: "Birinchi hayz 12 yoshgacha boshlangan yoki menopauza 55 yoshdan keyin kelganmi?",
    options: [
      { id: randomUUID(), text: "Yo'q", score: 0 },
      { id: randomUUID(), text: "Ha", score: 1 },
    ],
  },
  {
    order: 9,
    category: "Turmush tarzi",
    text: "Chekasizmi yoki muntazam alkogol iste'mol qilasizmi?",
    options: [
      { id: randomUUID(), text: "Yo'q", score: 0 },
      { id: randomUUID(), text: "Ha", score: 1 },
    ],
  },
  {
    order: 10,
    category: "Turmush tarzi",
    text: "Haftasiga kamida 3 marta jismoniy faollik bilan shug'ullanasizmi?",
    options: [
      { id: randomUUID(), text: "Ha", score: 0 },
      { id: randomUUID(), text: "Yo'q", score: 1 },
    ],
  },
];

// Module-level side effect — runs once per process, but a build tool or a
// burst of cold starts can easily evaluate this module in several processes
// at once, all racing to seed the same empty database. An IMMEDIATE
// transaction takes the write lock before the SELECT even runs, so a second
// racer blocks (via busy_timeout above) until the first one commits, then
// sees the data already there and does nothing — no duplicate rows, no
// UNIQUE-constraint crash.
const seedTransaction = db.transaction(() => {
  const userCount = (db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n;
  if (userCount === 0) {
    createUser({
      email: "admin@mammoai.uz",
      password: "admin123",
      role: "admin",
      firstName: "Admin",
      lastName: "MammoAI",
      birthDate: "1990-01-01",
      passportSeries: "AA0000000",
    });
  }

  const questionCount = (
    db.prepare("SELECT COUNT(*) AS n FROM quiz_questions").get() as { n: number }
  ).n;
  if (questionCount === 0) {
    for (const q of DEFAULT_QUESTIONS) createQuestion(q);
  }
});

try {
  seedTransaction.immediate();
} catch (err) {
  // A rare last-instant collision (both racers pass busy_timeout within the
  // same tick) can still surface a UNIQUE-constraint error here — safe to
  // ignore, since it only ever means "another process just seeded this".
  if (!(err instanceof Error) || !err.message.includes("UNIQUE constraint")) {
    throw err;
  }
}

export default db;
