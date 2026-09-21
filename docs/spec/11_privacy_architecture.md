# 11 — Maxfiylik arxitekturasi

**Holat:** ishlanmoqda · **Oxirgi yangilanish:** 2026-09-21

MammoAI sog'liq ma'lumotini saqlaydi — hayz sanalari, simptomlar, homiladorlik, jamiyatdagi anonim savollar. Bu O'zbekiston "Personal ma'lumotlar to'g'risida"gi qonuni va GDPR ma'nosida **maxsus toifadagi** ma'lumot. Shuning uchun maxfiylik oxirida qo'shiladigan funksiya emas, arxitekturaning bir qismi.

---

## Nima allaqachon yaxshi (tekshirilgan)

**1. Cascade o'chirish to'liq.** Foydalanuvchiga bog'langan 29 ta ustunning **hammasida** `ON DELETE CASCADE` bor. `user_id` ustuni bor, lekin tashqi kaliti yo'q jadval — **yo'q**. Ya'ni `DELETE FROM users` haqiqatan butun sog'liq tarixini olib ketadi.

**2. Tibbiy ogohlantirishlar joyida.** Xavf testi, kalkulyatorlar va AI yordamchi — hammasida "bu tashxis emas" matni bor.

**3. Jamiyat moderatsiyasi bor.** Shikoyat, bloklash, o'chirish, rate limit.

**4. Sirlar kodda emas.** `SESSION_SECRET`, `DATABASE_URL`, `ADMIN_PASSWORD` — muhit o'zgaruvchilarida.

**5. SQL inyeksiya yo'q.** Hamma so'rov parametrlangan (`postgres` teg-shablonlari).

---

## PRIV-01 — ⏸️ TO'XTATILGAN (mahsulot qarori, 2026-09-21)

> **DIQQAT — bu "xato" emas, ATAYLAB shunday qoldirilgan. Tuzatmang.**
> Egasi (2026-09-21) aniq aytdi: hozircha ma'lumot o'chmasligi kerak, tadqiqot
> uchun kerak bo'ladi. Katta ma'lumotlar bazasi qurilganda qayta ko'riladi.

**Aniqlangan holat.** Foydalanuvchiga bog'langan 29 ta ustunning hammasida
`ON DELETE CASCADE` bor — ya'ni `DELETE FROM users` sog'liq tarixini
(sikl yozuvlari, simptomlar, onboarding profili) **o'chiradi**.

Lekin shaxsni identifikatsiya qiluvchi uchta jadval `users(id)` ga umuman
bog'lanmagan (telefon/Telegram ID bo'yicha kalitlangan) va o'chirishdan
keyin ham **qolib ketadi**:

| Jadval | Nima qoladi |
|---|---|
| `phone_verifications` | telefon raqam, Telegram chat ID, tasdiqlash kodi |
| `telegram_bot_starts` | Telegram ID, ism, username |
| `telegram_miniapp_pending` | Telegram ID, telefon raqam |

**Muhim nomuvofiqlik.** Bu uchta jadvalda **tadqiqot uchun qiymat yo'q** — yosh,
simptom, sikl ma'lumoti yo'q, faqat shaxsni aniqlovchi maydonlar. Tadqiqot
ma'lumotining o'zi esa cascade orqali **o'chib ketadi**. Ya'ni hozirgi holat
"ma'lumot yig'ish" maqsadiga erishmaydi — u faqat telefon raqamlarini saqlaydi.

**Huquqiy ta'sir.** Foydalanuvchi o'chirishni so'ragandan keyin uning telefon
raqamini saqlab qolish O'zbekiston "Personal ma'lumotlar to'g'risida"gi
qonuniga va (EU foydalanuvchilari bo'lsa) GDPR 17-moddasiga mos kelmaydi.
Play Store/App Store'ning ma'lumotlarni o'chirish talabi ham shuni so'raydi.

### Tavsiya etiladigan yechim (katta baza qurilganda)

Maqsad — **tadqiqot ma'lumotini saqlash**, shaxsni emas. To'liq o'chirish emas,
**anonimlashtirish**:

```
Foydalanuvchi o'chirishni so'radi
        │
        ├── SHAXSNI o'chirish:
        │     telefon, Telegram ID, ism, username, avatar, chat
        │
        └── TADQIQOT ma'lumotini saqlash (yangi tasodifiy research_id bilan):
              yosh oralig'i (28 emas, "25–29")
              sikl yozuvlari
              simptomlar
              mintaqa (shahar darajasida, aniq joy emas)
```

Shu bilan: foydalanuvchi huquqi buzilmaydi, tadqiqot ma'lumoti to'liq qoladi,
va ma'lumot bazasi buzilib ketsa ham hech kimni identifikatsiya qilib
bo'lmaydi. Hozirgi holatda esa aksincha — tadqiqot ma'lumoti yo'qoladi,
telefon raqamlari qoladi.

Bunga qaytilganda shu bo'lim yangilanadi.

---

## PRIV-02 — ✅ QILINDI: ma'lumotni yuklab olish

`GET /api/me/export` → JSON fayl. Profil sahifasida "Ma'lumotlarimni yuklab olish".

**Xavfsizlik qarorlari:**
- `userId` parametri **qabul qilinmaydi** — faqat `requireUser()` dan kelgan shaxs. Boshqa odamning ma'lumotini so'rash imkoni yo'q.
- `Cache-Control: no-store` — sog'liq ma'lumoti brauzer keshida qolmaydi.
- `Content-Disposition: attachment` — brauzerda ochilmaydi, faylga tushadi.

**Eksportga ATAYLAB kirmaydi:** parol/token hash'lari va `token_version` (xavfsizlik siri — foydalanuvchiga foyda bermaydi, fayl o'g'irlansa zarar beradi), rate-limit jadvallari (texnik), boshqa odamlarning postlari.

> ⚠️ Yangi jadval qo'shilganda `exportUserData()` ni ham yangilash kerak, aks holda eksport asta-sekin to'liqsiz bo'lib qoladi.

---

## PRIV-03 — ⏳ Shifrlash: halol tahlil

Bu yerda oson javob yo'q, shuning uchun batafsil yozaman.

**"Encryption at rest" allaqachon bor.** Supabase (Postgres) disk darajasida shifrlangan, ulanish TLS orqali. Ya'ni "disk o'g'irlandi" senariysi qoplangan.

**Ustun darajasidagi shifrlash (application-level) NIMA UCHUN sodda emas:**

Bashorat dvigateli sana va oqim qiymatlarini **o'qishi va solishtirishi** kerak — `WHERE date BETWEEN`, `ORDER BY date`, sikl uzunliklarini hisoblash. Agar `cycle_logs.date` va `flow` shifrlangan bo'lsa:
- server ularni SQL'da solishtira olmaydi → butun tarixni deshifrlab, xotirada hisoblashga to'g'ri keladi;
- indekslar ishlamaydi → 365 kunlik tarix har so'rovda to'liq o'qiladi;
- adaptiv algoritm (`deriveAdaptiveCycleSettings`) va kalendar sekinlashadi.

**Shuning uchun taklif — tanlab shifrlash.** Algoritmga kerak bo'lmagan, lekin eng sezgir bo'lgan **erkin matn** maydonlari:

| Maydon | Nega |
|---|---|
| `chat_messages.content` | AI bilan suhbat — eng shaxsiy matn |
| `community_posts` / `comments` (matn) | Anonim, lekin mazmuni identifikatsiya qilishi mumkin |
| `pregnancy_album_photos` | Shaxsiy suratlar |
| `feedback_responses.message` | Erkin matn |
| `pregnancy_visits.note` | Tibbiy izohlar |

Bular hech qanday hisob-kitobda ishlatilmaydi — faqat ko'rsatiladi. Ya'ni shifrlash **hech narsani buzmaydi**.

**Kalit boshqaruvi:** `DATA_ENCRYPTION_KEY` muhit o'zgaruvchisi, AES-256-GCM. Kalitni aylantirish (rotation) uchun har yozuvda kalit versiyasi saqlanadi.

> ⚠️ Bu **mavjud ma'lumotni migratsiya qilishni** talab qiladi (production). Foydalanuvchi tasdig'i shart.

---

## PRIV-04 — ⏳ Rozilik yozuvlari (consent)

Hozir: foydalanuvchi onboarding'da maxfiylik siyosatini ko'radi, lekin **qachon va qaysi versiyaga rozi bo'lgani yozilmaydi**. Siyosat o'zgarsa, kim nimaga rozi bo'lganini aytib bo'lmaydi.

Taklif — yangi jadval:

```sql
CREATE TABLE IF NOT EXISTS consent_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,            -- 'privacy_policy' | 'analytics' | 'ai_processing'
  policy_version TEXT NOT NULL,
  granted BOOLEAN NOT NULL,
  created_at TEXT NOT NULL
)
```

Muhim: rozilik **bekor qilinishi** ham yozuv sifatida saqlanadi (`granted = false`), o'chirilmaydi — aks holda tarix yo'qoladi.

---

## PRIV-05 — ⏳ Juft ruxsatlari (eng muhim foydalanuvchi-ko'rinadigan bo'shliq)

Hozir "juftni ulash" = **hammasini ko'rsatish**. Bu maxfiylik printsipini buzadi: ayol nimani ulashishini o'zi tanlashi kerak.

Taklif — `partner_links` ga ruxsat maydonlari:

```
ruxsatlar (standart holatda HAMMASI O'CHIQ, faqat ulanish holati ko'rinadi):
  ☐ homiladorlik haftasi
  ☐ tug'ilish sanasi
  ☐ tashrif eslatmalari
  ☐ kayfiyat
  ☐ hayz ma'lumotlari
  ☐ simptomlar
```

Printsip: **standart holat — eng maxfiy**. Ulanish o'zi hech narsa ochmaydi.
Har qanday vaqtda o'zgartirish va darhol bekor qilish imkoni.

---

## PRIV-06 — ⏳ Uchinchi tomon AI'ga yuborilayotgan ma'lumot

AI yordamchi tashqi provayderga so'rov yuboradi. Hozircha hujjatlashtirilmagan:
- qaysi maydonlar yuboriladi?
- provayder ularni o'qitish uchun ishlatadimi?
- foydalanuvchi bunga aniq rozi bo'ldimi?

Bu `PRIV-04` (rozilik) bilan bog'liq va **AI ishini davom ettirishdan oldin** hal qilinishi kerak.

---

## Ustuvorlik

| # | Ish | Xavf | Holat |
|---|---|---|---|
| PRIV-01 | O'chirish / anonimlashtirish | — | ⏸️ egasi to'xtatgan |
| PRIV-02 | Ma'lumot eksporti | Yo'q (faqat o'qish) | ✅ |
| PRIV-05 | Juft ruxsatlari | Past (additive ustunlar) | ⏳ keyingi |
| PRIV-04 | Rozilik yozuvlari | Past (yangi jadval) | ⏳ |
| PRIV-06 | AI ma'lumot oqimi hujjati | Yo'q (hujjat) | ⏳ |
| PRIV-03 | Tanlab shifrlash | **Yuqori** (migratsiya) | ⏳ oxirida |
