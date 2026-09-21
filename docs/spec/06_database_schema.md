# 06 — Ma'lumotlar bazasi sxemasi

**Manba:** `apps/web/src/server/db.ts` — bu hujjat koddan AVTOMATIK chiqarilgan, qo'lda yozilmagan.
**Oxirgi yangilanish:** 2026-09-21 · **Jadvallar soni:** 47

## Qanday ishlaydi

Migratsiya alohida fayllarda emas — `initSchema()` funksiyasida:
- yangi jadval → `CREATE TABLE IF NOT EXISTS`
- yangi ustun → `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`

Bu server SOVUQ STARTDA bir marta bajariladi va natija `global.__mammoaiSchemaReady` da keshlanadi.

> ⚠️ **Amaliy oqibat:** ishlab turgan dev serverga yangi ustun qo'shilsa, u QO'LLANMAYDI — serverni qayta ishga tushirish kerak. Vercel'da bu muammo yo'q (har deploy sovuq start).

> ⚠️ **Bo'shliq:** sxema versiyalanmagan, rollback rejasi yo'q. Bu `00_current_state.md` dagi ustuvorliklar ro'yxatida turibdi.

## Umumiy qoidalar

- **Birlamchi kalit:** `TEXT` (UUID), tashqari — kompozit kalitli jadvallar.
- **Sanalar:** `TEXT` formatida `YYYY-MM-DD` (kun) yoki ISO vaqt belgisi. `DATE` turi faqat `ai_usage_daily` da.
- **O'chirish:** foydalanuvchiga bog'liq hamma jadval `REFERENCES users(id) ON DELETE CASCADE` — akkaunt o'chirilsa sog'liq ma'lumoti ham o'chadi.
- **Ro'yxatlar** (masalan simptomlar) `TEXT` ustunda JSON sifatida saqlanadi.


---

## Shaxs va kirish (Identity & auth)


### `users`

Markaziy jadval. Hamma sog'liq ma'lumoti shunga CASCADE bilan bog'langan — akkaunt o'chirilsa hammasi birga o'chadi.

```sql
id TEXT PRIMARY KEY
phone TEXT UNIQUE
email TEXT UNIQUE
name TEXT
region TEXT
language TEXT NOT NULL DEFAULT 'uz'
font_scale TEXT NOT NULL DEFAULT 'normal'
high_contrast BOOLEAN NOT NULL DEFAULT FALSE
theme TEXT NOT NULL DEFAULT 'system'
notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE
token_version INTEGER NOT NULL DEFAULT 0
created_at TEXT NOT NULL
avatar_url TEXT
is_blocked BOOLEAN NOT NULL DEFAULT FALSE
[ALTER] avatar_url TEXT
[ALTER] is_blocked BOOLEAN NOT NULL DEFAULT FALSE
[ALTER] telegram_user_id TEXT
[ALTER] is_test_account BOOLEAN NOT NULL DEFAULT FALSE
[ALTER] theme TEXT NOT NULL DEFAULT 'system'
[ALTER] expo_push_token TEXT
[ALTER] last_location_lat DOUBLE PRECISION
[ALTER] last_location_lng DOUBLE PRECISION
[ALTER] last_location_at TEXT
[ALTER] pet TEXT
```


### `phone_verifications`

Telegram bot orqali yuboriladigan tasdiqlash kodi.

```sql
id TEXT PRIMARY KEY
token TEXT UNIQUE NOT NULL
phone TEXT NOT NULL
language TEXT NOT NULL DEFAULT 'uz'
code TEXT
telegram_chat_id TEXT
verified_at TEXT
created_at TEXT NOT NULL
[ALTER] attempts INTEGER NOT NULL DEFAULT 0
```


### `phone_code_start_attempts`

Rate limit — IP bo'yicha.

```sql
ip_key TEXT PRIMARY KEY
attempt_count INTEGER NOT NULL DEFAULT 0
window_start TEXT NOT NULL
blocked_until TEXT
```


### `telegram_bot_starts`

Bot bilan birinchi aloqa.

```sql
chat_id TEXT PRIMARY KEY
telegram_user_id TEXT
first_name TEXT
username TEXT
first_started_at TEXT NOT NULL
last_started_at TEXT NOT NULL
```


### `telegram_miniapp_pending`

Mini App kirish oqimining vaqtinchalik holati.

```sql
telegram_user_id TEXT PRIMARY KEY
phone TEXT
created_at TEXT NOT NULL
```


### `blocked_users`

Foydalanuvchi boshqa foydalanuvchini bloklashi (jamiyat).

```sql
blocker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
blocked_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
created_at TEXT NOT NULL
PRIMARY KEY (blocker_id, blocked_id)
```


### `admin_users`

Admin panel hisoblari — parol hash bilan.

```sql
id TEXT PRIMARY KEY
email TEXT UNIQUE NOT NULL
password_hash TEXT NOT NULL
name TEXT NOT NULL
created_at TEXT NOT NULL
```


### `admin_login_attempts`

Admin kirishini cheklash.

```sql
ip_key TEXT PRIMARY KEY
attempt_count INTEGER NOT NULL DEFAULT 0
window_start TEXT NOT NULL
blocked_until TEXT
```


### `admin_audit_log`

Admin amallari izi.

```sql
id TEXT PRIMARY KEY
admin_label TEXT NOT NULL
action TEXT NOT NULL
detail TEXT
created_at TEXT NOT NULL
```


---

## Profil va xavf


### `onboarding_profiles`

So'rovnoma javoblari — checklist va bashorat shundan boshlanadi.

```sql
user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
name TEXT
age INTEGER NOT NULL
is_pregnant BOOLEAN NOT NULL
cycle_regularity TEXT NOT NULL
family_history BOOLEAN NOT NULL
last_checkup TEXT NOT NULL
primary_goal TEXT NOT NULL
heard_about_us TEXT
typical_symptoms TEXT NOT NULL DEFAULT '[]'
period_attitude TEXT
health_conditions TEXT NOT NULL DEFAULT '[]'
health_conditions_other TEXT
height_cm DOUBLE PRECISION
weight_kg DOUBLE PRECISION
blood_type TEXT
[ALTER] blood_type TEXT
[ALTER] sexually_active BOOLEAN NOT NULL DEFAULT FALSE
```


### `risk_quiz_results`

Saraton xavfi testi natijasi.

```sql
user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
answers TEXT NOT NULL
score INTEGER NOT NULL
level TEXT NOT NULL
completed_at TEXT NOT NULL
```


---

## Hayz sikli


### `cycle_settings`

Oxirgi hayz sanasi + o'rtacha uzunliklar. Bashorat bularni ADAPTIV qayta hisoblaydi (cycle.ts).

```sql
user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
last_period_start TEXT
average_cycle_length INTEGER NOT NULL DEFAULT 28
average_period_length INTEGER NOT NULL DEFAULT 5
```


### `cycle_logs`

Kunlik yozuv: oqim, kayfiyat, simptomlar, bazal harorat. Kun+foydalanuvchi bo'yicha YAGONA.

```sql
id TEXT PRIMARY KEY
user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
date TEXT NOT NULL
flow TEXT
mood TEXT
symptoms TEXT NOT NULL DEFAULT '[]'
created_at TEXT NOT NULL
UNIQUE(user_id, date)
[ALTER] updated_at TEXT
[ALTER] basal_body_temp NUMERIC
```


### `checkin_answers`

Kunlik check-in kartalariga Ha/Yo'q javoblari.

```sql
user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
date TEXT NOT NULL
question_key TEXT NOT NULL
answer BOOLEAN NOT NULL
created_at TEXT NOT NULL
PRIMARY KEY (user_id, date, question_key)
```


---

## Homiladorlik


### `pregnancy_profiles`

Oxirgi hayz yoki tug'ilish sanasi.

```sql
user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
last_menstrual_period TEXT
due_date TEXT
```


### `pregnancy_visits`

Shifokor tashriflari.

```sql
id TEXT PRIMARY KEY
user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
label TEXT NOT NULL
date TEXT NOT NULL
clinic_name TEXT
note TEXT
created_at TEXT NOT NULL
```


### `pregnancy_vitals`

O'lchovlar (vazn, bosim va h.k.).

```sql
id TEXT PRIMARY KEY
user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
type TEXT NOT NULL
value TEXT NOT NULL
recorded_at TEXT NOT NULL
created_at TEXT NOT NULL
```


### `pregnancy_kicks`

Tepishlar sanog'i.

```sql
user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
date TEXT NOT NULL
count INTEGER NOT NULL DEFAULT 0
PRIMARY KEY (user_id, date)
```


### `pregnancy_album_photos`

Qorin albomi.

```sql
id TEXT PRIMARY KEY
user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
pregnancy_week INTEGER
blob_pathname TEXT NOT NULL
note TEXT
created_at TEXT NOT NULL
```


### `pregnancy_week_content`

Haftalik kontent — admin CMS orqali.

```sql
week INTEGER PRIMARY KEY
size_label TEXT NOT NULL
baby_development TEXT NOT NULL
mother_changes TEXT NOT NULL
updated_at TEXT NOT NULL
```


---

## Farovonlik


### `wellness_logs`

Kunlik suv va kaloriya.

```sql
user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
date TEXT NOT NULL
water_ml INTEGER NOT NULL DEFAULT 0
calories INTEGER NOT NULL DEFAULT 0
PRIMARY KEY (user_id, date)
```


---

## Tekshiruvlar va klinikalar


### `checklist_items`

Profilga qarab avtomatik yaratiladigan tekshiruv ro'yxati — mahsulotning tijoriy o'zagi.

```sql
id TEXT PRIMARY KEY
user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
type TEXT NOT NULL
status TEXT NOT NULL DEFAULT 'pending'
due_date TEXT
completed_at TEXT
created_at TEXT NOT NULL
```


### `clinics`

Klinikalar katalogi.

```sql
id TEXT PRIMARY KEY
name TEXT NOT NULL
address TEXT NOT NULL
region TEXT NOT NULL
lat DOUBLE PRECISION NOT NULL
lng DOUBLE PRECISION NOT NULL
phone TEXT NOT NULL
specialties TEXT NOT NULL DEFAULT '[]'
free_screening BOOLEAN NOT NULL DEFAULT FALSE
```


### `referral_events`

Klinikaga yo'naltirish — daromad o'lchovi.

```sql
id TEXT PRIMARY KEY
user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
clinic_id TEXT REFERENCES clinics(id) ON DELETE SET NULL
checklist_item_id TEXT REFERENCES checklist_items(id)
action TEXT NOT NULL
created_at TEXT NOT NULL
```


---

## Kontent


### `articles`

Maqolalar.

```sql
id TEXT PRIMARY KEY
slug TEXT UNIQUE NOT NULL
category TEXT NOT NULL
title TEXT NOT NULL
excerpt TEXT NOT NULL
body TEXT NOT NULL
```


### `illustration_slots`

Har bir ekran uchun admin tanlagan illyustratsiya.

```sql
slot_key TEXT PRIMARY KEY
illustration_slug TEXT NOT NULL
updated_at TEXT NOT NULL
```


---

## Jamiyat


### `community_posts`

Postlar.

```sql
id TEXT PRIMARY KEY
user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
tag TEXT NOT NULL
body TEXT NOT NULL
is_anonymous BOOLEAN NOT NULL DEFAULT FALSE
likes_count INTEGER NOT NULL DEFAULT 0
comments_count INTEGER NOT NULL DEFAULT 0
created_at TEXT NOT NULL
```


### `community_comments`

Izohlar.

```sql
id TEXT PRIMARY KEY
post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE
user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
body TEXT NOT NULL
is_anonymous BOOLEAN NOT NULL DEFAULT FALSE
created_at TEXT NOT NULL
```


### `community_post_likes`

Layklar.

```sql
post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE
user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
created_at TEXT NOT NULL
PRIMARY KEY (post_id, user_id)
```


### `community_reports`

Shikoyatlar — moderatsiya uchun.

```sql
id TEXT PRIMARY KEY
reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
target_type TEXT NOT NULL
post_id TEXT REFERENCES community_posts(id) ON DELETE SET NULL
comment_id TEXT REFERENCES community_comments(id) ON DELETE SET NULL
reason TEXT NOT NULL
note TEXT
status TEXT NOT NULL DEFAULT 'open'
created_at TEXT NOT NULL
resolved_at TEXT
```


### `comment_rate_limit_attempts`

Izoh spamiga qarshi.

```sql
user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
attempt_count INTEGER NOT NULL DEFAULT 0
window_start TEXT NOT NULL
blocked_until TEXT
```


### `community_report_rate_limit_attempts`

Shikoyat spamiga qarshi.

```sql
user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
attempt_count INTEGER NOT NULL DEFAULT 0
window_start TEXT NOT NULL
blocked_until TEXT
```


---

## Juft (Partner)


### `partner_invites`

24 soat amal qiladigan ulanish kodi.

```sql
id TEXT PRIMARY KEY
code TEXT UNIQUE NOT NULL
inviter_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
created_at TEXT NOT NULL
expires_at TEXT NOT NULL
```


### `partner_links`

Ikki foydalanuvchi o'rtasidagi bog'lanish.

```sql
id TEXT PRIMARY KEY
user_a_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
user_b_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
user_a_shares TEXT NOT NULL DEFAULT '{"pregnancy":true,"checkups":true,"mood":true,"period":false}'
user_b_shares TEXT NOT NULL DEFAULT '{"pregnancy":true,"checkups":true,"mood":true,"period":false}'
created_at TEXT NOT NULL
```


### `partner_messages`

Juft chati.

```sql
id TEXT PRIMARY KEY
partner_link_id TEXT NOT NULL REFERENCES partner_links(id) ON DELETE CASCADE
sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
body TEXT NOT NULL
created_at TEXT NOT NULL
```


### `partner_connect_attempts`

Kod tanlashga qarshi himoya.

```sql
user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
attempt_count INTEGER NOT NULL DEFAULT 0
window_start TEXT NOT NULL
blocked_until TEXT
```


---

## AI yordamchi


### `chat_messages`

Chat tarixi.

```sql
id TEXT PRIMARY KEY
user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
role TEXT NOT NULL
content TEXT NOT NULL
created_at TEXT NOT NULL
```


### `chat_daily_usage`

Kunlik limit.

```sql
user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
usage_date TEXT NOT NULL
message_count INTEGER NOT NULL DEFAULT 0
PRIMARY KEY (user_id, usage_date)
```


### `ai_active_insights`

Proaktiv tahlil — yozuvlar o'zgarganda qayta generatsiya qilinadi.

```sql
user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
content TEXT NOT NULL
logs_count_at_generation INTEGER NOT NULL
generated_at TEXT NOT NULL
[ALTER] logs_updated_at_at_generation TEXT
```


### `ai_usage_daily`

Provayder bo'yicha token sarfi — xarajat nazorati.

```sql
provider TEXT NOT NULL
day DATE NOT NULL
total_tokens BIGINT NOT NULL DEFAULT 0
request_count INTEGER NOT NULL DEFAULT 0
updated_at TEXT NOT NULL
PRIMARY KEY (provider, day)
```


---

## Bildirishnoma, obuna, analitika


### `notifications`

Ilova ichidagi bildirishnomalar.

```sql
id TEXT PRIMARY KEY
user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
actor_user_id TEXT REFERENCES users(id) ON DELETE CASCADE
type TEXT NOT NULL
post_id TEXT REFERENCES community_posts(id) ON DELETE CASCADE
comment_id TEXT REFERENCES community_comments(id) ON DELETE CASCADE
is_anonymous_actor BOOLEAN NOT NULL DEFAULT FALSE
is_read BOOLEAN NOT NULL DEFAULT FALSE
created_at TEXT NOT NULL
[ALTER] message TEXT
```


### `subscriptions`

Obuna. TO'LOV PROVAYDERI ULANMAGAN — hozir faqat admin qo'lda beradi.

```sql
user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
plan TEXT NOT NULL DEFAULT 'premium'
expires_at TEXT
granted_by TEXT NOT NULL DEFAULT 'admin'
note TEXT
created_at TEXT NOT NULL
updated_at TEXT NOT NULL
```


### `analytics_events`

Hodisalar (pageview, click).

```sql
id TEXT PRIMARY KEY
user_id TEXT REFERENCES users(id) ON DELETE CASCADE
session_id TEXT NOT NULL
platform TEXT NOT NULL DEFAULT 'web'
type TEXT NOT NULL
path TEXT
label TEXT
duration_ms INTEGER
created_at TEXT NOT NULL
```


### `analytics_ingest_attempts`

Yuborishni cheklash.

```sql
ip_key TEXT PRIMARY KEY
attempt_count INTEGER NOT NULL DEFAULT 0
window_start TEXT NOT NULL
blocked_until TEXT
```


### `feedback_responses`

Foydalanuvchi fikri.

```sql
id TEXT PRIMARY KEY
user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
trigger TEXT NOT NULL
rating INTEGER
message TEXT
created_at TEXT NOT NULL
```


### `feedback_rate_limit_attempts`

Fikr spamiga qarshi.

```sql
user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
attempt_count INTEGER NOT NULL DEFAULT 0
window_start TEXT NOT NULL
blocked_until TEXT
```


### `app_settings`

Global sozlamalar (kalit-qiymat).

```sql
key TEXT PRIMARY KEY
value TEXT
updated_at TEXT NOT NULL
```
