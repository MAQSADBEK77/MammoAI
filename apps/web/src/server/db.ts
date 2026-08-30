import postgres from "postgres";

// Postgres (Supabase) — ilgari better-sqlite3 (lokal fayl) ishlatilgan, endi Vercel'ga
// deploy qilish uchun Postgres'ga o'tkazildi (serverless funksiyalarda doimiy fayl
// tizimi yo'q). `DATABASE_URL` — Supabase loyihasining "Connection Pooling" (pgbouncer,
// odatda 6543-port) manzili bo'lishi kerak, chunki har bir serverless chaqiruv yangi
// ulanish ochishi mumkin.
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL topilmadi. Supabase loyihangizning Postgres ulanish manzilini " +
      ".env.local (lokal) yoki Vercel loyihasi muhit o'zgaruvchilariga (production) qo'shing."
  );
}

declare global {
  var __mammoaiSql: ReturnType<typeof postgres> | undefined;
  var __mammoaiSchemaReady: Promise<void> | undefined;
}

// Dev rejimida modul qayta yuklanganda ulanishni qayta-qayta ochmaslik uchun global'da saqlaymiz.
export const sql =
  global.__mammoaiSql ??
  postgres(DATABASE_URL, {
    ssl: "require",
    // "CREATE TABLE/INDEX IF NOT EXISTS" har cold-start'da NOTICE chiqaradi (zararsiz) — bosamiz.
    onnotice: () => {},
  });
if (process.env.NODE_ENV !== "production") global.__mammoaiSql = sql;

async function initSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE,
      email TEXT UNIQUE,
      name TEXT,
      region TEXT,
      language TEXT NOT NULL DEFAULT 'uz',
      font_scale TEXT NOT NULL DEFAULT 'normal',
      high_contrast BOOLEAN NOT NULL DEFAULT FALSE,
      notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      token_version INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS onboarding_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      name TEXT,
      age INTEGER NOT NULL,
      is_pregnant BOOLEAN NOT NULL,
      cycle_regularity TEXT NOT NULL,
      family_history BOOLEAN NOT NULL,
      last_checkup TEXT NOT NULL,
      primary_goal TEXT NOT NULL,
      heard_about_us TEXT,
      typical_symptoms TEXT NOT NULL DEFAULT '[]',
      period_attitude TEXT,
      health_conditions TEXT NOT NULL DEFAULT '[]',
      health_conditions_other TEXT,
      height_cm DOUBLE PRECISION,
      weight_kg DOUBLE PRECISION
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS risk_quiz_results (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      answers TEXT NOT NULL,
      score INTEGER NOT NULL,
      level TEXT NOT NULL,
      completed_at TEXT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      body TEXT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS cycle_settings (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      last_period_start TEXT,
      average_cycle_length INTEGER NOT NULL DEFAULT 28,
      average_period_length INTEGER NOT NULL DEFAULT 5
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS cycle_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      flow TEXT,
      mood TEXT,
      symptoms TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      UNIQUE(user_id, date)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS pregnancy_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      last_menstrual_period TEXT,
      due_date TEXT
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS pregnancy_visits (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      date TEXT NOT NULL,
      clinic_name TEXT,
      note TEXT,
      created_at TEXT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS pregnancy_kicks (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, date)
    )
  `;

  // "Sog'liq ko'rsatkichlari" — foydalanuvchi o'zi qayd etadigan tezkor-jurnal.
  await sql`
    CREATE TABLE IF NOT EXISTS pregnancy_vitals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      value TEXT NOT NULL,
      recorded_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS checklist_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      due_date TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS clinics (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      region TEXT NOT NULL,
      lat DOUBLE PRECISION NOT NULL,
      lng DOUBLE PRECISION NOT NULL,
      phone TEXT NOT NULL,
      specialties TEXT NOT NULL DEFAULT '[]',
      free_screening BOOLEAN NOT NULL DEFAULT FALSE
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS referral_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      clinic_id TEXT NOT NULL REFERENCES clinics(id),
      checklist_item_id TEXT REFERENCES checklist_items(id),
      action TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_cycle_logs_user ON cycle_logs(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_checklist_user ON checklist_items(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_referral_user ON referral_events(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_pregnancy_vitals_user ON pregnancy_vitals(user_id)`;
}

// Har bir sovuq-start (cold start)da bir marta ishga tushadi va idempotent
// (`CREATE TABLE IF NOT EXISTS`) — shuning uchun serverless muhitda xavfsiz.
export function ensureSchema(): Promise<void> {
  if (!global.__mammoaiSchemaReady) global.__mammoaiSchemaReady = initSchema();
  return global.__mammoaiSchemaReady;
}
