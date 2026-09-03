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
    // MUHIM: DATABASE_URL Supabase'ning Supavisor "Transaction pooler"iga (6543-port)
    // ishora qiladi — bu rejimda har bir so'rov turli backend ulanishiga tushishi mumkin,
    // shuning uchun prepared statement'lar (postgres.js standart holati) ishlamaydi va
    // sekin/nostabil bo'lib qoladi. `prepare: false` buni butunlay o'chiradi.
    prepare: false,
    // MUHIM: postgres.js standart pool hajmi (max: 10) bilan sinovdan o'tkazilganda
    // aniqlandi — agar bir vaqtda ishlayotgan so'rovlar soni pool hajmidan oshib,
    // navbatga turishga (queue) to'g'ri kelsa, Supavisor bilan birga bu MUALLIQ
    // ABADIY osilib qoladi (xato chiqmaydi, shunchaki javob kelmaydi). Yechim — pool
    // hajmini bizning eng katta parallel so'rov portlashimizdan (getAdminStats'da 15 ta)
    // sezilarli darajada katta qilib qo'yish, shunda navbatga turishga hech qachon
    // to'g'ri kelmaydi.
    max: 20,
  });
if (process.env.NODE_ENV !== "production") global.__mammoaiSql = sql;

// Jadvallar orasidagi FK bog'liqligi bosqichlarga bo'lingan — har bosqich ichida
// so'rovlar bir-biriga bog'liq emas, shuning uchun ketma-ket emas, parallel
// yuboriladi (Supabase pooler'gacha bo'lgan tarmoq kechikishi tufayli 17 ta
// ketma-ket so'rov cold-start'da bir necha o'n soniyagacha cho'zilishi mumkin edi).
async function initSchema() {
  // 0-bosqich: hech kimga bog'liq bo'lmagan jadvallar.
  await Promise.all([
    sql`
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
        created_at TEXT NOT NULL,
        avatar_url TEXT
      )
    `,
    sql`
      CREATE TABLE IF NOT EXISTS articles (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        excerpt TEXT NOT NULL,
        body TEXT NOT NULL
      )
    `,
    sql`
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
    `,
  ]);

  // 1-bosqich: faqat users'ga bog'liq jadvallar (parallel, chunki bir-biriga bog'liq emas).
  await Promise.all([
    sql`
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
        weight_kg DOUBLE PRECISION,
        blood_type TEXT
      )
    `,
    sql`
      CREATE TABLE IF NOT EXISTS risk_quiz_results (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        answers TEXT NOT NULL,
        score INTEGER NOT NULL,
        level TEXT NOT NULL,
        completed_at TEXT NOT NULL
      )
    `,
    sql`
      CREATE TABLE IF NOT EXISTS cycle_settings (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        last_period_start TEXT,
        average_cycle_length INTEGER NOT NULL DEFAULT 28,
        average_period_length INTEGER NOT NULL DEFAULT 5
      )
    `,
    sql`
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
    `,
    sql`
      CREATE TABLE IF NOT EXISTS pregnancy_profiles (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        last_menstrual_period TEXT,
        due_date TEXT
      )
    `,
    sql`
      CREATE TABLE IF NOT EXISTS pregnancy_visits (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        label TEXT NOT NULL,
        date TEXT NOT NULL,
        clinic_name TEXT,
        note TEXT,
        created_at TEXT NOT NULL
      )
    `,
    sql`
      CREATE TABLE IF NOT EXISTS pregnancy_kicks (
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (user_id, date)
      )
    `,
    // "Sog'liq ko'rsatkichlari" — foydalanuvchi o'zi qayd etadigan tezkor-jurnal.
    sql`
      CREATE TABLE IF NOT EXISTS pregnancy_vitals (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        value TEXT NOT NULL,
        recorded_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `,
    sql`
      CREATE TABLE IF NOT EXISTS checklist_items (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        due_date TEXT,
        completed_at TEXT,
        created_at TEXT NOT NULL
      )
    `,
    // Jamiyat (Community) — post-lenta. `is_anonymous` true bo'lsa, muallif
    // nomi API darajasida ham yashiriladi (repo.ts).
    sql`
      CREATE TABLE IF NOT EXISTS community_posts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tag TEXT NOT NULL,
        body TEXT NOT NULL,
        is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
        likes_count INTEGER NOT NULL DEFAULT 0,
        comments_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      )
    `,
  ]);

  // 1.5-bosqich: eski (allaqachon mavjud) jadvallarga yangi ustunlar qo'shish —
  // `CREATE TABLE IF NOT EXISTS` yangi ustunlarni qo'shmaydi, shuning uchun
  // productionda avval yaratilgan jadvallar uchun alohida `ALTER TABLE` kerak.
  await Promise.all([
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`,
    sql`ALTER TABLE onboarding_profiles ADD COLUMN IF NOT EXISTS blood_type TEXT`,
  ]);

  // 2-bosqich: users + clinics + checklist_items + community_posts'ga bog'liq.
  await Promise.all([
    sql`
      CREATE TABLE IF NOT EXISTS referral_events (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        clinic_id TEXT NOT NULL REFERENCES clinics(id),
        checklist_item_id TEXT REFERENCES checklist_items(id),
        action TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `,
    sql`
      CREATE TABLE IF NOT EXISTS community_post_likes (
        post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL,
        PRIMARY KEY (post_id, user_id)
      )
    `,
    sql`
      CREATE TABLE IF NOT EXISTS community_comments (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        body TEXT NOT NULL,
        is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TEXT NOT NULL
      )
    `,
  ]);

  // 2.5-bosqich: community_comments'ga bog'liq (izoh qoldirilganda post
  // muallifiga bildirishnoma yuboriladi — repo.ts:addCommunityComment).
  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      actor_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      post_id TEXT REFERENCES community_posts(id) ON DELETE CASCADE,
      comment_id TEXT REFERENCES community_comments(id) ON DELETE CASCADE,
      is_anonymous_actor BOOLEAN NOT NULL DEFAULT FALSE,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TEXT NOT NULL
    )
  `;

  // 3-bosqich: indekslar — tegishli jadvallar allaqachon mavjud, hammasi parallel.
  await Promise.all([
    sql`CREATE INDEX IF NOT EXISTS idx_cycle_logs_user ON cycle_logs(user_id)`,
    sql`CREATE INDEX IF NOT EXISTS idx_checklist_user ON checklist_items(user_id)`,
    sql`CREATE INDEX IF NOT EXISTS idx_referral_user ON referral_events(user_id)`,
    sql`CREATE INDEX IF NOT EXISTS idx_pregnancy_vitals_user ON pregnancy_vitals(user_id)`,
    sql`CREATE INDEX IF NOT EXISTS idx_community_posts_tag ON community_posts(tag, created_at DESC)`,
    sql`CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments(post_id, created_at ASC)`,
    sql`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC)`,
  ]);
}

// Har bir sovuq-start (cold start)da bir marta ishga tushadi va idempotent
// (`CREATE TABLE IF NOT EXISTS`) — shuning uchun serverless muhitda xavfsiz.
export function ensureSchema(): Promise<void> {
  if (!global.__mammoaiSchemaReady) global.__mammoaiSchemaReady = initSchema();
  return global.__mammoaiSchemaReady;
}
