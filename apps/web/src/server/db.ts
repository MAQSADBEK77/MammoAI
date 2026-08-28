import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "mammoai.db");

declare global {
  var __mammoaiDb: Database.Database | undefined;
}

function openDb(): Database.Database {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const database = new Database(DB_PATH);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  database.pragma("busy_timeout = 5000");
  return database;
}

// Dev rejimida modul qayta yuklanganda bazani qayta-qayta ochmaslik uchun global'da saqlaymiz.
export const db = global.__mammoaiDb ?? openDb();
if (process.env.NODE_ENV !== "production") global.__mammoaiDb = db;

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    phone TEXT UNIQUE,
    name TEXT,
    region TEXT,
    language TEXT NOT NULL DEFAULT 'uz',
    font_scale TEXT NOT NULL DEFAULT 'normal',
    high_contrast INTEGER NOT NULL DEFAULT 0,
    token_version INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS onboarding_profiles (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    age INTEGER NOT NULL,
    is_pregnant INTEGER NOT NULL,
    cycle_regularity TEXT NOT NULL,
    family_history INTEGER NOT NULL,
    last_checkup TEXT NOT NULL,
    primary_goal TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cycle_settings (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    last_period_start TEXT,
    average_cycle_length INTEGER NOT NULL DEFAULT 28,
    average_period_length INTEGER NOT NULL DEFAULT 5
  );

  CREATE TABLE IF NOT EXISTS cycle_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    flow TEXT,
    mood TEXT,
    symptoms TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    UNIQUE(user_id, date)
  );

  CREATE TABLE IF NOT EXISTS pregnancy_profiles (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    last_menstrual_period TEXT,
    due_date TEXT
  );

  CREATE TABLE IF NOT EXISTS pregnancy_visits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    date TEXT NOT NULL,
    clinic_name TEXT,
    note TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS pregnancy_kicks (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, date)
  );

  CREATE TABLE IF NOT EXISTS checklist_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    due_date TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS clinics (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    region TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    phone TEXT NOT NULL,
    specialties TEXT NOT NULL DEFAULT '[]',
    free_screening INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS referral_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clinic_id TEXT NOT NULL REFERENCES clinics(id),
    checklist_item_id TEXT REFERENCES checklist_items(id),
    action TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_cycle_logs_user ON cycle_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_checklist_user ON checklist_items(user_id);
  CREATE INDEX IF NOT EXISTS idx_referral_user ON referral_events(user_id);
`);
