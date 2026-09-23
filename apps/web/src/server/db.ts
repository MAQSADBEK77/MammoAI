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

// QA-001: CI'dagi vaqtinchalik Postgres xizmat konteyneri (localhost, SSL
// sertifikatisiz) uchun — productionda DATABASE_URL doim Supabase'ning
// tashqi hostiga ishora qiladi, shuning uchun bu tekshiruv u yerda hech
// qachon ishga tushmaydi va "ssl: require" o'zgarishsiz qoladi.
const isLocalDb = /^(localhost|127\.0\.0\.1)$/.test(new URL(DATABASE_URL).hostname);

// Dev rejimida modul qayta yuklanganda ulanishni qayta-qayta ochmaslik uchun global'da saqlaymiz.
export const sql =
  global.__mammoaiSql ??
  postgres(DATABASE_URL, {
    ssl: isLocalDb ? false : "require",
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
    // hajmini eng katta parallel so'rov portlashimizdan sezilarli darajada katta
    // qilib qo'yish, shunda navbatga turishga hech qachon to'g'ri kelmaydi.
    //
    // 2026-09-13: `max: 20` yetarli emasligi aniqlandi — initSchema()'ning
    // "1-bosqich" Promise.all bloki (COMM-001/ADMIN-001/CONTENT-001 yangi
    // jadvallari qo'shilgach) 22 ta parallel statement'ga yetdi, ya'ni eski
    // chegaradan OSHIB ketdi — production'da haqiqiy FUNCTION_INVOCATION_TIMEOUT
    // (/api/admin/login) sifatida ko'rindi. `max` shu portlashdan sezilarli
    // katta bo'lishi uchun 40'ga oshirildi (yangi jadval qo'shilganda bu
    // sonni qayta tekshirish kerak).
    max: 40,
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
        theme TEXT NOT NULL DEFAULT 'system',
        notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        token_version INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        avatar_url TEXT,
        is_blocked BOOLEAN NOT NULL DEFAULT FALSE
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
    // Umumiy kalit-qiymat sozlamalar — .env'ga bog'lanmasdan, admin panel orqali
    // ishlab chiqarishda ham o'zgartirsa bo'ladigan sirlar/moslamalar uchun
    // (masalan Telegram bot tokeni — qayta deploy qilmasdan yangilash mumkin bo'lsin).
    sql`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT NOT NULL
      )
    `,
    // AI-PROVIDER-02: har bir AI chaqiruvining (Gemini/Huawei MaaS) o'z
    // `usage.total_tokens`ini kuniga (Toshkent kuni bo'yicha) yig'ib boradi —
    // bepul kvotaga qancha yaqinlashganini admin panelda ko'rsatish uchun.
    // MUHIM: bu FAQAT bizning o'z hisobimiz (har bir muvaffaqiyatli chaqiruvdan
    // keyin qo'shiladigan son) — provayderning HAQIQIY, JONLI kvota-qoldig'i
    // EMAS (Huawei buni so'rash uchun ochiq API bermaydi). `users`ga bog'liq
    // emas, shuning uchun 0-bosqichda.
    sql`
      CREATE TABLE IF NOT EXISTS ai_usage_daily (
        provider TEXT NOT NULL,
        day DATE NOT NULL,
        total_tokens BIGINT NOT NULL DEFAULT 0,
        request_count INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (provider, day)
      )
    `,
    // Telegram bot orqali telefon raqamni tasdiqlash — foydalanuvchi telefon
    // kiritgach, shu jadvalga vaqtinchalik yozuv qo'shiladi (token — Telegram
    // chuqur havolasi uchun); botga "Start" bosilgach, chat_id va tasodifiy kod
    // shu yerga yoziladi, keyin foydalanuvchi kodni kiritib tasdiqlaydi.
    sql`
      CREATE TABLE IF NOT EXISTS phone_verifications (
        id TEXT PRIMARY KEY,
        token TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        language TEXT NOT NULL DEFAULT 'uz',
        code TEXT,
        telegram_chat_id TEXT,
        verified_at TEXT,
        created_at TEXT NOT NULL
      )
    `,
    // Admin panelda tanlanadigan illyustratsiyalar — har bir "joy" (masalan
    // "onboarding.welcome") mustaqil ravishda qaysi unDraw rasmi (slug)
    // ko'rsatilishini belgilaydi (packages/shared/src/illustration-library.ts).
    sql`
      CREATE TABLE IF NOT EXISTS illustration_slots (
        slot_key TEXT PRIMARY KEY,
        illustration_slug TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `,
    // FIX2-24: POST /api/analytics/events autentifikatsiyasiz ham ishlaydi
    // (onboarding tugamasdan oldingi hodisalar uchun ataylab) va hech qanday
    // rate-limit yo'q edi — bitta so'rovda 100 tagacha soxta hodisa cheksiz
    // marta yuborilishi mumkin edi. IP manzil bo'yicha (foydalanuvchi bo'lmasa
    // ham ishlaydi) — `users`ga bog'liq emas, shuning uchun 0-bosqichda.
    sql`
      CREATE TABLE IF NOT EXISTS analytics_ingest_attempts (
        ip_key TEXT PRIMARY KEY,
        attempt_count INTEGER NOT NULL DEFAULT 0,
        window_start TEXT NOT NULL,
        blocked_until TEXT
      )
    `,
    // FIX3-16: POST /api/auth/phone-code/start autentifikatsiyasiz ishlaydi
    // (login/ro'yxatdan o'tishning birinchi qadami) va hech qanday rate-limit
    // yo'q edi — istalgan kishi cheksiz marta ixtiyoriy telefon raqamlar bilan
    // so'rov yuborishi mumkin edi. IP manzil bo'yicha — `users`ga bog'liq
    // emas, shuning uchun 0-bosqichda.
    sql`
      CREATE TABLE IF NOT EXISTS phone_code_start_attempts (
        ip_key TEXT PRIMARY KEY,
        attempt_count INTEGER NOT NULL DEFAULT 0,
        window_start TEXT NOT NULL,
        blocked_until TEXT
      )
    `,
    // FIX3-18: admin login parolini kiritishda hech qanday urinishlar
    // cheklovi yo'q edi (oddiy foydalanuvchi OTP'i FIX-04 bilan himoyalangan,
    // lekin admin login emas) — IP manzil bo'yicha.
    sql`
      CREATE TABLE IF NOT EXISTS admin_login_attempts (
        ip_key TEXT PRIMARY KEY,
        attempt_count INTEGER NOT NULL DEFAULT 0,
        window_start TEXT NOT NULL,
        blocked_until TEXT
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
    // Hamkor (Partner) — kod orqali ulanish. `partner_invites` vaqtinchalik
    // (24 soat amal qiladi), ulangandan keyin `partner_links` yaratiladi va
    // invite o'chiriladi. Har ikkala foydalanuvchi o'z ulashish sozlamalarini
    // mustaqil boshqaradi (user_a_shares/user_b_shares — JSON).
    sql`
      CREATE TABLE IF NOT EXISTS partner_invites (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        inviter_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
      )
    `,
    sql`
      CREATE TABLE IF NOT EXISTS partner_links (
        id TEXT PRIMARY KEY,
        user_a_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_b_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_a_shares TEXT NOT NULL DEFAULT '{"pregnancy":true,"checkups":true,"mood":true,"period":false}',
        user_b_shares TEXT NOT NULL DEFAULT '{"pregnancy":true,"checkups":true,"mood":true,"period":false}',
        created_at TEXT NOT NULL
      )
    `,
    // FIX-03: hamkor kodini (4 xonali edi, endi ancha uzunroq) qo'pol kuch
    // bilan sinashning oldini olish — repo.ts:connectPartnerByCode har
    // urinishda shu jadvalni tekshiradi/yangilaydi.
    sql`
      CREATE TABLE IF NOT EXISTS partner_connect_attempts (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        attempt_count INTEGER NOT NULL DEFAULT 0,
        window_start TEXT NOT NULL,
        blocked_until TEXT
      )
    `,
    // FIX3-13: izoh yozishda rate-limit yo'q edi va har bir izoh post
    // egasiga HAQIQIY Telegram xabari + push bildirishnoma yuborardi —
    // istalgan login qilgan foydalanuvchi biror insonning postiga
    // cheksiz tez izoh yozib, uning Telegram/telefoniga bildirishnoma
    // "bombardimoni" uyushtirishi mumkin edi.
    sql`
      CREATE TABLE IF NOT EXISTS comment_rate_limit_attempts (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        attempt_count INTEGER NOT NULL DEFAULT 0,
        window_start TEXT NOT NULL,
        blocked_until TEXT
      )
    `,
    // FIX3-17: /api/feedback va /api/community/posts/[id]/report'da rate-limit
    // yo'q edi — fikr-mulohaza jadvali spam bilan to'ldirilishi yoki bitta
    // foydalanuvchi ko'p postlarni "shikoyat" qilib moderatsiya navbatini
    // bezovta qilishi mumkin edi.
    sql`
      CREATE TABLE IF NOT EXISTS feedback_rate_limit_attempts (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        attempt_count INTEGER NOT NULL DEFAULT 0,
        window_start TEXT NOT NULL,
        blocked_until TEXT
      )
    `,
    sql`
      CREATE TABLE IF NOT EXISTS community_report_rate_limit_attempts (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        attempt_count INTEGER NOT NULL DEFAULT 0,
        window_start TEXT NOT NULL,
        blocked_until TEXT
      )
    `,
    sql`
      CREATE TABLE IF NOT EXISTS pregnancy_profiles (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        last_menstrual_period TEXT,
        due_date TEXT
      )
    `,
    // Foydalanish analitikasi — qaysi sahifada qancha vaqt o'tkazilgani (pageview,
    // duration_ms) va qaysi tugma bosilgani (click, label). `user_id` NULL bo'lishi
    // mumkin (onboarding tugamasdan oldingi hodisalar) — CASCADE, chunki akkaunt
    // o'chirilganda bog'liq analitika ham tozalanishi kerak (App.pdf'dan tashqari,
    // maxfiylik siyosati bilan izchil).
    sql`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        session_id TEXT NOT NULL,
        platform TEXT NOT NULL DEFAULT 'web',
        type TEXT NOT NULL,
        path TEXT,
        label TEXT,
        duration_ms INTEGER,
        created_at TEXT NOT NULL
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
    // "Sog'liqni nazorat qilish" (wellbeing) rejimi — kunlik suv/kaloriya
    // jurnali. pregnancy_kicks bilan bir xil naqsh (bitta qator/kun, upsert
    // orqali increment qilinadi).
    // TODAY-02: kunlik "Check-in" kartalariga berilgan "Ha/Yo'q" javoblari.
    // `question_key` — packages/shared/src/logic/checkin.ts'dagi BARQAROR kalit
    // (savol matni o'zgarsa ham o'zgarmaydi). Kun + savol bo'yicha yagona —
    // foydalanuvchi fikrini o'zgartirsa, javob YANGILANADI (dublikat emas).
    sql`
      CREATE TABLE IF NOT EXISTS checkin_answers (
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        question_key TEXT NOT NULL,
        answer BOOLEAN NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (user_id, date, question_key)
      )
    `,
    sql`
      CREATE TABLE IF NOT EXISTS wellness_logs (
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        water_ml INTEGER NOT NULL DEFAULT 0,
        calories INTEGER NOT NULL DEFAULT 0,
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
    // Homiladorlik albomi — foydalanuvchi o'zi yuklagan qorin/chaqaloq rasmlari,
    // haftaga bog'langan holda ("bezakli frame" bilan ko'rsatiladi — UI'da,
    // rasmning o'ziga PISHIRILMAYDI, shuning uchun keyin dizayn o'zgarsa qayta
    // yuklash shart emas). Rasmning o'zi Postgres'da EMAS — Vercel Blob'da
    // (private store, `blob_pathname` shu yerga ishora qiladi); bazada faqat
    // yo'l saqlanadi. Sabab: bitta avatar (users.avatar_url, base64) bilan
    // solishtirganda bu yerda ko'p va kattaroq rasm bo'lishi mumkin — bazani
    // shishirib yubormaslik uchun (postgres-pool-hang-bug xotira eslatmasi).
    sql`
      CREATE TABLE IF NOT EXISTS pregnancy_album_photos (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        pregnancy_week INTEGER,
        blob_pathname TEXT NOT NULL,
        note TEXT,
        created_at TEXT NOT NULL
      )
    `,
    // Obuna (Premium) — foydalanuvchi so'roviga ko'ra: AI Yordamchi + chuqur
    // Statistika pullik, qolgan hammasi (kuzatuv, jamiyat, hamkor) bepul
    // qoladi. Hozircha AVTOMATIK to'lov provayderi ULANMAGAN (Click/Payme
    // uchun merchant ro'yxatdan o'tish kerak — foydalanuvchining o'zi qilishi
    // kerak, keyin API kalit beriladi) — shu oraliqda admin panel orqali
    // QO'LDA faollashtiriladi (masalan mijoz Click/Payme'ga to'g'ridan-to'g'ri
    // o'tkazma qilgach). Bitta qatorda foydalanuvchining JORIY holati (tarix
    // emas) — cycle_settings kabi singleton naqsh. Holat SAQLANMAYDI, har doim
    // `expires_at`dan HISOBLANADI (NULL = muddatsiz) — ikkita maydon orasida
    // sinxronizatsiya xatosi bo'lmasligi uchun.
    sql`
      CREATE TABLE IF NOT EXISTS subscriptions (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        plan TEXT NOT NULL DEFAULT 'premium',
        expires_at TEXT,
        granted_by TEXT NOT NULL DEFAULT 'admin',
        note TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `,
    // AI Yordamchining PROAKTIV tahlili ("faol tahlil" — roadmap) — foydalanuvchi
    // biror narsa so'ramasdan, Statistika ochilganda Gemini hisoblangan
    // ko'rsatkichlarni (sikl uzunligi, simptomlar, kayfiyat va h.k.) tabiiy
    // tilda talqin qiladi. Har chaqiruvda QAYTA generatsiya qilinmaydi (API
    // xarajati) — `logs_count_at_generation` orqali faqat yangi log qo'shilgan
    // yoki 7 kundan ko'p vaqt o'tgan bo'lsa yangilanadi (server/active-insights.ts).
    sql`
      CREATE TABLE IF NOT EXISTS ai_active_insights (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        logs_count_at_generation INTEGER NOT NULL,
        generated_at TEXT NOT NULL
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
    // AI Yordamchi — chat tarixi. Alohida "xotira" jadvali yo'q: kontekst
    // har safar mavjud cycle_logs/onboarding_profiles/pregnancy_profiles'dan
    // jonli yig'iladi (server/ai-chat.ts:buildUserContext).
    sql`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `,
    // FIX3-15: kunlik AI-chat xabar limitini (100/kun) atomik tekshirish
    // uchun — bitta (user_id, usage_date) qatorini `ON CONFLICT DO UPDATE`
    // orqali oshirish, parallel so'rovlar orasida poyga holatining oldini
    // oladi (mavjud rate-limiter jadvallari bilan bir xil naqsh).
    sql`
      CREATE TABLE IF NOT EXISTS chat_daily_usage (
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        usage_date TEXT NOT NULL,
        message_count INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (user_id, usage_date)
      )
    `,
    // Feedback loop — "Fikr bildirish" menyu bandi + AI Yordamchi ichidagi
    // yumshoq 👍/👎 so'rov. `trigger`: 'manual' | 'chat_prompt'.
    sql`
      CREATE TABLE IF NOT EXISTS feedback_responses (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        trigger TEXT NOT NULL,
        rating INTEGER,
        message TEXT,
        created_at TEXT NOT NULL
      )
    `,
    // Telegram Mini App orqali kirish — foydalanuvchi "Telefon raqamimni ulashish"
    // tugmasini bosgach, telefon shu yerga yoziladi (webhook orqali), keyin
    // /finish shu yozuvni o'qib akkaunt yaratadi/topadi va o'chiradi.
    sql`
      CREATE TABLE IF NOT EXISTS telegram_miniapp_pending (
        telegram_user_id TEXT PRIMARY KEY,
        phone TEXT,
        created_at TEXT NOT NULL
      )
    `,
    // Botga "/start" bosgan HAR BIR chat — token bilan yoki tokensiz, akkaunt
    // yaratilgan-yaratilmaganidan qat'i nazar (masalan onboarding'ni tugatmay
    // tashlab ketgan bo'lsa ham). Admin paneldan "hammaga xabar yuborish"
    // (broadcast) shu jadvaldagi + `users.telegram_user_id`dagi chat_id'larga
    // yuboriladi (repo.ts#listTelegramBroadcastChatIds).
    sql`
      CREATE TABLE IF NOT EXISTS telegram_bot_starts (
        chat_id TEXT PRIMARY KEY,
        telegram_user_id TEXT,
        first_name TEXT,
        username TEXT,
        first_started_at TEXT NOT NULL,
        last_started_at TEXT NOT NULL
      )
    `,
  ]);

  // 1.5-bosqich: eski (allaqachon mavjud) jadvallarga yangi ustunlar qo'shish —
  // `CREATE TABLE IF NOT EXISTS` yangi ustunlarni qo'shmaydi, shuning uchun
  // productionda avval yaratilgan jadvallar uchun alohida `ALTER TABLE` kerak.
  await Promise.all([
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`,
    // Admin panel — foydalanuvchini bloklash (App.pdf'dan tashqari, moderatsiya uchun).
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE`,
    sql`ALTER TABLE onboarding_profiles ADD COLUMN IF NOT EXISTS blood_type TEXT`,
    // FIX-CHECKUPS: bachadon bo'yni skrininggi/JYYI/kontratseptsiya kabi
    // bir nechta yangi tekshiruv turi shunga bog'liq (checklist-rules.ts).
    sql`ALTER TABLE onboarding_profiles ADD COLUMN IF NOT EXISTS sexually_active BOOLEAN NOT NULL DEFAULT FALSE`,
    // GATE-01: "bilmayman" javobini "yo'q"dan ajratish uchun NULL ruxsat
    // etiladi. Mavjud qatorlarga ta'sir qilmaydi (ular true/false bo'lib
    // qoladi) va takroran bajarilishi xavfsiz — Postgres'da allaqachon
    // nullable ustunda DROP NOT NULL xatolik bermaydi.
    sql`ALTER TABLE onboarding_profiles ALTER COLUMN sexually_active DROP NOT NULL`,
    sql`ALTER TABLE onboarding_profiles ALTER COLUMN family_history DROP NOT NULL`,
    // MUHIM: `notifications`ga tegishli ALTER'lar ATAYLAB bu yerda EMAS —
    // pastda, jadvalning o'zi ("2.5-bosqich") yaratilgandan KEYIN (qarang:
    // "2.6-bosqich"). Bu yerda turganda haqiqiy production'da hech qachon
    // xato bermasdi (jadval oylar oldin allaqachon mavjud edi), lekin
    // haqiqatan YANGI (bo'sh) bazada — masalan QA-001'ning CI integratsiya
    // testi ishlatadigan vaqtinchalik Postgres'da — "relation notifications
    // does not exist" xatosi bilan initSchema()ning O'ZI muvaffaqiyatsiz
    // tugardi (aynan shu CI xizmat konteynerida ushlangan real bug).
    // Telegram Mini App orqali kirgan (yoki keyinroq bog'langan) foydalanuvchilar —
    // 1:1 shaxsiy chatda chat_id === user_id, shuning uchun bot xabar yuborishda
    // ham shu ustunning o'zi ishlatiladi (alohida chat_id ustuni shart emas).
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_user_id TEXT`,
    // Play Store tekshiruvchisi kabi ichki test hisoblar — admin panelning
    // Foydalanuvchilar/Analitika ro'yxatlari va statistikasida ko'rinmasligi kerak.
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_test_account BOOLEAN NOT NULL DEFAULT FALSE`,
    // Yorug'/Qorong'u/Tizim mavzu tanlovi — eski "Yuqori kontrast" (high_contrast)
    // o'rnini bosadi. `high_contrast` ustuni ataylab o'chirilmaydi (dead column,
    // qaytarib bo'lmaydigan DROP COLUMN'dan qochish uchun), shunchaki endi kod
    // hech qayerda o'qimaydi/yozmaydi.
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT 'system'`,
    // Haqiqiy telefon push-bildirishnomasi (Expo Push API) — roadmap 10-band.
    // Bitta ustun, bitta qurilma (soddalik uchun — foydalanuvchi yangi
    // qurilmada kirsa eskisi ustidan yoziladi, ko'p-qurilma qo'llab-quvvatlash
    // V1'da yo'q). NULL = hali ro'yxatga olinmagan (ruxsat berilmagan yoki
    // FCM/APNs hali sozlanmagan bo'lishi mumkin).
    // WEB2-04 (2026-09-17): apps/mobile (Expo) butunlay olib tashlangani
    // sababli bu ustun ENDI ABADIY eskirgan — hech qanday klient uni
    // yangilamaydi. `sendExpoPushNotification` (push-notifications.ts)
    // shu tufayli no-op qilib qo'yildi. Ustunning o'zini (va
    // /api/push-token route'ini) olib tashlash REJALASHTIRILGAN, lekin
    // bu safar bajarilmagan — DB sxema o'zgarishi alohida migratsiya
    // sifatida qilinishi kerak.
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS expo_push_token TEXT`,
    // FIX-04: OTP kodini cheksiz sinab ko'rishning oldini olish uchun —
    // repo.ts:verifyPhoneCode shu ustunni token bo'yicha oshirib boradi va
    // chegaradan oshsa tokenni bekor qiladi.
    sql`ALTER TABLE phone_verifications ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0`,
    // FIX2-26: ilgari faqat `logs_count_at_generation` (yozuvlar SONI)
    // o'zgarganda AI tahlili qayta generatsiya qilinardi — foydalanuvchi
    // mavjud kunning kayfiyati/simptomini TAHRIRLASA (son o'zgarmaydi),
    // AI matni eskirgan qolardi. `cycle_logs.updated_at` (har bir yozish/
    // tahrirlashda yangilanadi) va `ai_active_insights`dagi keshlangan
    // qiymat orasidagi solishtiruv shu bo'shliqni yopadi.
    sql`ALTER TABLE cycle_logs ADD COLUMN IF NOT EXISTS updated_at TEXT`,
    sql`ALTER TABLE ai_active_insights ADD COLUMN IF NOT EXISTS logs_updated_at_at_generation TEXT`,
    // OVERNIGHT-18: Klinikalar bo'limidagi "eng yaqinlarini topish" — brauzer
    // geolokatsiyasidan (foydalanuvchi ruxsat bergandagina) olingan oxirgi
    // koordinata, admin panelda ham ko'rinishi uchun saqlanadi. Aniq manzil
    // EMAS, faqat lat/lng — foydalanuvchi istalgan vaqt "Bloklangan
    // foydalanuvchilar" kabi profil sozlamalaridan buni tozalay olishi
    // kerak bo'lsa, kelajakda alohida "tozalash" tugmasi qo'shiladi.
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_location_lat DOUBLE PRECISION`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_location_lng DOUBLE PRECISION`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_location_at TEXT`,
    // PET-01: bosh ekrandagi uy hayvoni (faqat 18 yoshgacha) — sof bezak.
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS pet TEXT`,
    // CYCLE-ALGO-15: bazal tana harorati (BBT) — ixtiyoriy, "Ilg'or" bo'lim
    // orqali kunlik yozuvga qo'shiladi. Ovulyatsiyani simptomdan ANIQROQ
    // aniqlash uchun (cycle.ts#detectOvulationFromBbt).
    sql`ALTER TABLE cycle_logs ADD COLUMN IF NOT EXISTS basal_body_temp NUMERIC`,
  ]);

  // Eski qatorlarda `updated_at` hali NULL — `created_at`dan bir martalik
  // backfill (bo'lmasa ular har doim "o'zgargan" deb hisoblanib, keraksiz
  // qayta generatsiyaga olib kelardi).
  await sql`UPDATE cycle_logs SET updated_at = created_at WHERE updated_at IS NULL`;

  // 2-bosqich: users + clinics + checklist_items + community_posts'ga bog'liq.
  await Promise.all([
    sql`
      CREATE TABLE IF NOT EXISTS referral_events (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        -- FIX3-20: SET NULL (standart RESTRICT emas) — haqiqatan ishlatilgan
        -- (deyarli barcha) klinikalarni o'chirib bo'lmay qolishining oldini
        -- oladi, referral tarixini saqlab qolgan holda.
        clinic_id TEXT REFERENCES clinics(id) ON DELETE SET NULL,
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
    // Hamkor bilan haqiqiy suhbat (Telegram uslubida) — avvalgi "Xabar" faqat
    // bir martalik bildirishnoma edi, endi to'liq tarix bilan ikki tomonlama chat.
    sql`
      CREATE TABLE IF NOT EXISTS partner_messages (
        id TEXT PRIMARY KEY,
        partner_link_id TEXT NOT NULL REFERENCES partner_links(id) ON DELETE CASCADE,
        sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        body TEXT NOT NULL,
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
      actor_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      post_id TEXT REFERENCES community_posts(id) ON DELETE CASCADE,
      comment_id TEXT REFERENCES community_comments(id) ON DELETE CASCADE,
      is_anonymous_actor BOOLEAN NOT NULL DEFAULT FALSE,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TEXT NOT NULL
    )
  `;

  // 2.6-bosqich: `notifications`ga tegishli ALTER'lar — jadval yuqorida
  // ("2.5-bosqich") ENDIGINA yaratilgani uchun, faqat SHUNDAN keyin
  // xavfsiz (qarang: "1.5-bosqich"dagi izoh).
  await Promise.all([
    // Hamkor "Xabar" (tezkor eslatma) tugmasi shu ustunni ishlatadi —
    // izoh-bildirishnomalaridan farqli o'laroq, erkin matn saqlaydi.
    sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message TEXT`,
    // Kunlik eslatma (system) bildirishnomalari uchun — haqiqiy "actor"
    // (boshqa foydalanuvchi) yo'q, shuning uchun bu ustun endi ixtiyoriy.
    sql`ALTER TABLE notifications ALTER COLUMN actor_user_id DROP NOT NULL`,
  ]);

  // 2.7-bosqich: COMM-001 (moderatsiya) — ikkalasi ham yuqoridagi
  // community_posts/community_comments/users allaqachon mavjud bo'lgandan
  // KEYIN yaratiladi (xuddi notifications kabi — "2.6-bosqich"dagi bug bilan
  // bir xil sababga ko'ra tartib muhim).
  await Promise.all([
    // Shikoyat — post yoki izohga, sabab + ixtiyoriy izoh bilan. Anonim
    // postlarda ham ishlaydi (moderator postning haqiqiy egasini ko'radi,
    // hisobot qoldiruvchi buni bilishi shart emas).
    sql`
      CREATE TABLE IF NOT EXISTS community_reports (
        id TEXT PRIMARY KEY,
        reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        target_type TEXT NOT NULL,
        -- FIX3-19: SET NULL (CASCADE emas) — hisobot kontent o'chirilgandan
        -- keyin ham admin audit izi sifatida saqlanishi kerak.
        post_id TEXT REFERENCES community_posts(id) ON DELETE SET NULL,
        comment_id TEXT REFERENCES community_comments(id) ON DELETE SET NULL,
        reason TEXT NOT NULL,
        note TEXT,
        status TEXT NOT NULL DEFAULT 'open',
        created_at TEXT NOT NULL,
        resolved_at TEXT
      )
    `,
    // Bloklash — muallifning IDsi orqali (klient hech qachon ID'ni o'zi
    // ko'rmaydi, "shu postni yozganni bloklash" server tomonda hal qilinadi —
    // shuning uchun anonim post muallifini ham, ismini bilmasdan, bloklash
    // mumkin).
    sql`
      CREATE TABLE IF NOT EXISTS blocked_users (
        blocker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        blocked_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL,
        PRIMARY KEY (blocker_id, blocked_id)
      )
    `,
    // ADMIN-001: bitta umumiy `ADMIN_PASSWORD` o'rniga har bir admin uchun
    // alohida hisob (email+parol) — bu ikkalasi ham `users`ga bog'liq emas,
    // shuning uchun istalgan bosqichda yaratilishi mumkin.
    sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `,
    // CONTENT-001: homiladorlikning har bir haftasi uchun admin-tahrirlanadigan
    // matn — boshqa jadvallarga bog'liq emas, istalgan bosqichda yaratilishi mumkin.
    sql`
      CREATE TABLE IF NOT EXISTS pregnancy_week_content (
        week INTEGER PRIMARY KEY,
        size_label TEXT NOT NULL,
        baby_development TEXT NOT NULL,
        mother_changes TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `,
    // Audit-jurnal — kim, qachon, nima qilgani. `admin_label`ning o'zi
    // saqlanadi (FK emas) — shunda admin hisobi keyinchalik o'chirilsa ham
    // tarixiy yozuv "kim qilgani"ni yo'qotmaydi.
    sql`
      CREATE TABLE IF NOT EXISTS admin_audit_log (
        id TEXT PRIMARY KEY,
        admin_label TEXT NOT NULL,
        action TEXT NOT NULL,
        detail TEXT,
        created_at TEXT NOT NULL
      )
    `,
  ]);

  // FIX3-19: community_reports.post_id/comment_id CASCADE bilan o'chirilardi —
  // repo.ts (listOpenCommunityReports) aynan "kontent o'chirilgan, lekin
  // hisobot qolgan" holatini boshqarish uchun yozilgan edi, lekin bu holat
  // HECH QACHON yuzaga kelmasdi (hisobot ham o'chirilgan kontent bilan birga
  // o'chib ketardi) — shikoyat qilingan foydalanuvchi shikoyatni o'z
  // kontentini o'chirish orqali jim-jimgina yo'qotib, admin audit izini
  // yo'qotishi mumkin edi. Endi SET NULL — hisobot qatori kontent
  // o'chirilgandan keyin ham saqlanadi (post_id shuning uchun endi ixtiyoriy).
  await sql`ALTER TABLE community_reports ALTER COLUMN post_id DROP NOT NULL`;
  // OVERNIGHT-19 (JIDDIY): bu DROP+ADD juftligi ilgari IKKITA ALOHIDA
  // `await sql` chaqiruvi edi — orasida hech qanday qulflash yo'q. Vercel'da
  // bir nechta sovuq (cold-start) Lambda nusxasi BIR VAQTDA `ensureSchema()`ni
  // birinchi marta ishga tushirsa (masalan bir nechta qurilma/foydalanuvchi
  // deyarli bir vaqtda kirganda — aynan Telegram Mini App'da "boshqa
  // qurilmadan kirsam xato chiqadi" degan real production topilma shundan
  // edi), ikkala nusxa ham DROP'ni muvaffaqiyatli bajarib, keyin ikkalasi
  // ham ADD'ga urinadi — biri g'olib chiqadi, ikkinchisi "constraint...
  // already exists" (Postgres kodi 42710) xatosi bilan MUVAFFAQIYATSIZ
  // bo'ladi. `ensureSchema()` natijasi HAR BIR Lambda nusxasida abadiy
  // keshlanadi (global.__mammoaiSchemaReady) — shuning uchun bu xato bir
  // marta yuz bersa, O'SHA ANIQ nusxa keyingi so'rovlarning BARCHASida
  // (nusxa qayta ishga tushmagunicha) muvaffaqiyatsiz bo'lib qolaverardi —
  // "2-3 marta yangilagandan keyin ishlaydi" aynan shu (boshqa, buzilmagan
  // nusxaga tushib qolgandan keyin) tushuntiriladi. Endi `DO $$ ...
  // EXCEPTION WHEN duplicate_object` bilan — ikkinchi (kechikkan) nusxa
  // ADD'da to'qnashsa ham, xatoni JIM yutib yuboradi (natija allaqachon
  // TO'G'RI — constraint muvaffaqiyatli boshqa nusxa tomonidan qo'yilgan).
  await sql`
    DO $$ BEGIN
      ALTER TABLE community_reports DROP CONSTRAINT IF EXISTS community_reports_post_id_fkey;
      ALTER TABLE community_reports ADD CONSTRAINT community_reports_post_id_fkey FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `;
  await sql`
    DO $$ BEGIN
      ALTER TABLE community_reports DROP CONSTRAINT IF EXISTS community_reports_comment_id_fkey;
      ALTER TABLE community_reports ADD CONSTRAINT community_reports_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES community_comments(id) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `;

  // FIX3-20: referral_events.clinic_id standart RESTRICT xatti-harakati
  // bilan edi (na CASCADE, na SET NULL) — deleteClinic() bu FK xatosini
  // tutmasdi, natijada haqiqatan ishlatilgan (deyarli barcha) klinikalarni
  // o'chirib bo'lmasdi (admin panelida tushunarsiz 500 xatosi). Endi SET
  // NULL — referral tarixi klinika o'chirilgandan keyin ham saqlanadi.
  await sql`ALTER TABLE referral_events ALTER COLUMN clinic_id DROP NOT NULL`;
  // OVERNIGHT-19: yuqoridagi bir xil poyga-holati xavfi — bir xil DO/EXCEPTION himoyasi.
  await sql`
    DO $$ BEGIN
      ALTER TABLE referral_events DROP CONSTRAINT IF EXISTS referral_events_clinic_id_fkey;
      ALTER TABLE referral_events ADD CONSTRAINT referral_events_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `;

  // FIX-UX-03: `checklist_items(user_id, type)`ga UNIQUE indeks qo'yishdan oldin,
  // ensureChecklistItem'dagi eski race condition tufayli produksiyada
  // allaqachon paydo bo'lgan dublikat qatorlarni tozalash SHART (bo'lmasa,
  // pastdagi CREATE UNIQUE INDEX haqiqiy dublikat mavjud bo'lganda xato
  // beradi). Har bir (user_id, type) juftligidan faqat ENG SO'NGGI (eng katta
  // created_at) qatorni qoldiradi — bu xuddi checklist sahifasidagi UI
  // dedup mantig'i bilan bir xil qoida.
  await sql`
    DELETE FROM checklist_items a USING checklist_items b
    WHERE a.user_id = b.user_id AND a.type = b.type
      AND (a.created_at < b.created_at OR (a.created_at = b.created_at AND a.id < b.id))
  `;

  // FIX2-27: connectPartnerByCode'da tekshirish (findPartnerLink) va INSERT
  // orasida tranzaksiya/unique constraint yo'q edi — ikkita parallel so'rov
  // bir xil foydalanuvchini ikki xil hamkorga ulashi mumkin edi. UNIQUE
  // indeks qo'yishdan oldin, xuddi yuqoridagi kabi, eski race condition
  // tufayli paydo bo'lgan bo'lishi mumkin bo'lgan dublikatlarni tozalaymiz —
  // har bir ustun bo'yicha ENG ERTA (created_at) yozuvni qoldiramiz (haqiqiy
  // ishlatilayotgan ulanish ko'proq ehtimol eskisi).
  await sql`
    DELETE FROM partner_links a USING partner_links b
    WHERE a.user_a_id = b.user_a_id AND a.id != b.id
      AND (a.created_at > b.created_at OR (a.created_at = b.created_at AND a.id > b.id))
  `;
  await sql`
    DELETE FROM partner_links a USING partner_links b
    WHERE a.user_b_id = b.user_b_id AND a.id != b.id
      AND (a.created_at > b.created_at OR (a.created_at = b.created_at AND a.id > b.id))
  `;
  // Eski (UNIQUE bo'lmagan) indekslar endi ortiqcha — pastdagi UNIQUE
  // indekslar xuddi shu ustunlar uchun qidiruvni ham qamrab oladi.
  await sql`DROP INDEX IF EXISTS idx_partner_links_a`;
  await sql`DROP INDEX IF EXISTS idx_partner_links_b`;

  // 3-bosqich: indekslar — tegishli jadvallar allaqachon mavjud, hammasi parallel.
  await Promise.all([
    sql`CREATE INDEX IF NOT EXISTS idx_phone_verifications_created ON phone_verifications(created_at)`,
    sql`CREATE INDEX IF NOT EXISTS idx_cycle_logs_user ON cycle_logs(user_id)`,
    sql`CREATE INDEX IF NOT EXISTS idx_checklist_user ON checklist_items(user_id)`,
    sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_checklist_user_type ON checklist_items(user_id, type)`,
    sql`CREATE INDEX IF NOT EXISTS idx_referral_user ON referral_events(user_id)`,
    sql`CREATE INDEX IF NOT EXISTS idx_pregnancy_vitals_user ON pregnancy_vitals(user_id)`,
    sql`CREATE INDEX IF NOT EXISTS idx_pregnancy_album_user ON pregnancy_album_photos(user_id, created_at DESC)`,
    sql`CREATE INDEX IF NOT EXISTS idx_community_posts_tag ON community_posts(tag, created_at DESC)`,
    // FIX3-22: "Barchasi" (teg tanlanmagan) standart ko'rinish teg bo'yicha
    // filtrlamaydi — bu holatda yuqoridagi kompozit indeks ishlamaydi va
    // Postgres butun jadvalni skanerlab saralashga majbur bo'ladi.
    sql`CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at DESC)`,
    sql`CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments(post_id, created_at ASC)`,
    sql`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC)`,
    sql`CREATE INDEX IF NOT EXISTS idx_partner_invites_code ON partner_invites(code)`,
    sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_links_a_unique ON partner_links(user_a_id)`,
    sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_links_b_unique ON partner_links(user_b_id)`,
    sql`CREATE INDEX IF NOT EXISTS idx_partner_messages_link ON partner_messages(partner_link_id, created_at ASC)`,
    sql`CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at)`,
    sql`CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id)`,
    sql`CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(type, created_at)`,
    sql`CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id, created_at ASC)`,
    sql`CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback_responses(created_at DESC)`,
    sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_telegram_user_id ON users(telegram_user_id) WHERE telegram_user_id IS NOT NULL`,
    sql`CREATE INDEX IF NOT EXISTS idx_community_reports_status ON community_reports(status, created_at DESC)`,
    sql`CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id)`,
    sql`CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created ON admin_audit_log(created_at DESC)`,
  ]);
}

// Har bir sovuq-start (cold start)da bir marta ishga tushadi va idempotent
// (`CREATE TABLE IF NOT EXISTS`) — shuning uchun serverless muhitda xavfsiz.
export function ensureSchema(): Promise<void> {
  if (!global.__mammoaiSchemaReady) global.__mammoaiSchemaReady = initSchema();
  return global.__mammoaiSchemaReady;
}
