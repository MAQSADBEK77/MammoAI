# 00 — Hozirgi holat (Current State)

**Maqsad:** REBUILD v1.0 rejasidagi 20 ta bo'limning har biri bo'yicha *bugun kodda nima bor* degan savolga aniq javob berish.

**Nega bu hujjat birinchi:** MammoAI — bo'sh sahifa emas. Production'da ishlayotgan, haqiqiy foydalanuvchilari bor ilova. Spetsifikatsiyani noldan yozish o'rniga, avval mavjud tizimni hujjatlashtirish kerak — aks holda AI agentlari allaqachon ishlayotgan va sinovdan o'tgan kodni qayta yozib, regressiya kiritadi.

**Kim uchun:** loyihada kod yozadigan dasturchilar va AI agentlari. Har qanday yangi ish boshlashdan oldin shu hujjat o'qiladi.

**Oxirgi yangilanish:** 2026-09-21 · Manba: kodning o'zi (taxmin emas, o'lchangan).

---

## Raqamlarda

| Ko'rsatkich | Qiymat |
|---|---|
| Ekranlar (foydalanuvchi ilovasi) | 13 |
| Ekranlar (admin panel) | 16 |
| Ekranlar (ochiq: landing, onboarding, maxfiylik, baholash, tg) | 5 |
| API endpointlari | 99 |
| Ma'lumotlar bazasi jadvallari | 49 |
| Biznes-mantiq modullari (`packages/shared/src/logic`) | 16 |
| Kod qatorlari (test'siz) | ~34 800 |
| Avtomatik testlar | 255 (17 fayl) |
| Tillar | 4 (uz-lotin, uz-kirill, ru, en) |

Monorepo: `apps/web` (Next.js 16), `packages/shared` (biznes-mantiq + i18n + tiplar).
Arxitektura — **modulli monolit** (REBUILD hujjatida tavsiya qilingani bilan bir xil). Mikroservis yo'q va MVP uchun kerak emas.

---

## 20 bo'lim bo'yicha holat

Belgilar: ✅ bor va ishlaydi · 🟡 qisman · ❌ yo'q

### 1. Product architecture — ✅
Modulli monolit. `apps/web` (UI + API routes), `packages/shared` (platformadan mustaqil mantiq).
Sof funksiyalar `shared/logic`da — shuning uchun ular testlanadi va kelajakda mobil ilova bilan qayta ishlatiladi.

### 2. Navigation architecture — ✅
5 bandli pastki menyu: Asosiy · Jamiyat · Tekshiruvlar · Juft · Yordamchi.
Rejimga qarab yo'naltirish: `goalToLandingTab()` (`shared/logic/goal.ts`).
`partner_tracking` rejimida Jamiyat yashiriladi.

### 3. Screen inventory — 🟡
Ekranlar bor, lekin **ekran-ma-ekran spetsifikatsiya yozilmagan** (holatlar: bo'sh / yuklanmoqda / xato; analytics hodisalari; premium cheklovlari).
→ `03_screen_inventory.md` yozilishi kerak.

### 4. User journeys — 🟡
Oqimlar kodda mavjud, hujjatda yo'q.

### 5. Database schema — ✅ (hujjatsiz)
49 jadval, `apps/web/src/server/db.ts` da. Migratsiya `CREATE TABLE IF NOT EXISTS` + 27 ta `ALTER TABLE ADD COLUMN IF NOT EXISTS` orqali, sovuq startda avtomatik.
⚠️ Alohida migratsiya fayllari yo'q — sxema tarixi git'da, versiyalanmagan.

### 6. API specification — 🟡
99 endpoint ishlaydi, tiplangan mijoz `shared/api-client.ts` da (ya'ni shartnoma TypeScript orqali majburlanadi). OpenAPI hujjati yo'q.

### 7. Authentication — ✅
Sessiya = `httpOnly` cookie, JWT (`{sub, tokenVersion}`), 1 yil.
Kirish **faqat Telegram** orqali (mahsulot qarori 2026-09-16/17): telefon-kod va Mini App oqimlari.
Dev uchun `/api/dev-login` (production'da 404).
`tokenVersion` — barcha qurilmalardan chiqarish imkonini beradi.

### 8. Cycle algorithm — ✅ (kutilganidan kuchliroq)
`shared/logic/cycle.ts`. Bor:
- hayz boshlanishlarini aniqlash (spotting'ni noto'g'ri hisoblamaydi);
- outlier filtri (tartibsiz siklda kengroq chegara);
- **yaqinlik bo'yicha og'irlikli o'rtacha** (eski sikllar kamroq ta'sir qiladi);
- **Bayes shrinkage** — kam ma'lumotda foydalanuvchining o'z boshlang'ich qiymatiga suyanadi, ma'lumot ortgan sari shaxsiy o'rtachaga yumshoq o'tadi;
- **shaxsiy lyuteal faza** — BBT sakrashi yoki ovulyatsiya simptomidan o'rganiladi;
- standart og'ish → ishonch darajasi va bashorat diapazoni;
- `scripts/backtest-real-users.ts` — parametrlarni haqiqiy foydalanuvchi tarixiga qarshi o'lchaydi.

### 9. Prediction engine — ✅
`predictCycle()` + `forecastCycles()` (~1 yil oldinga).
Noaniqlik **σ·√n** bo'yicha o'sadi (dispersiyalar qo'shiladi), unumdor oyna shu noaniqlikka kengayadi.
→ REBUILD hujjatidagi `prediction_engine()` quvuri bilan solishtirish: `11_prediction_engine.md` ga qarang.

### 10. Notification engine — 🟡
`notifications` jadvali, `push-notifications.ts`, `daily-reminders.ts`, Expo push token.
❌ Yo'q: soat mintaqasiga qarab yuborish, yetkazib berish statistikasi, A/B.

### 11. Content system — ✅
`articles`, `pregnancy_week_content`, `illustration_slots` + admin CMS.

### 12. Subscription system — 🟡
`subscriptions` jadvali va admin paneli bor. **To'lov provayderi ULANMAGAN** — obuna hozir faqat admin tomonidan qo'lda beriladi.
→ Payme/Click integratsiyasi — alohida sprint.

### 13. Analytics — ✅
`analytics_events`, admin dashboard, Yandex Metrika eksporti, traction sahifasi.

### 14. AI assistant — ✅
`ai-chat.ts`, chat tarixi, kunlik limit, proaktiv insight'lar (`ai_active_insights`), premium cheklovi.

### 15. Privacy architecture — ❌ **eng katta bo'shliq**
Bor: maxfiylik sahifasi, akkauntni o'chirish (`deleteUser`), moderatsiya.
Yo'q: **dam olayotgan ma'lumot shifri (encryption at rest)**, anonim rejim, rozilik yozuvlari (consent records), ma'lumotni eksport qilish (GDPR), audit izlari.
⚠️ Ayollar salomatligi ilovasi uchun bu eng sezgir qism. REBUILD hujjatidagi baho to'g'ri: maxfiylik arxitekturasi oxirida emas, boshida qurilishi kerak.

### 16. Security — 🟡
Bor: admin parol + urinishlarni cheklash, bir necha `*_attempts` jadvali (rate limit), SQL parametrlash (inyeksiya yo'q), mijoz kiritgan qiymatlarni server tomonda tekshirish.
Yo'q: xavfsizlik auditi, sir aylantirish (secret rotation), CSP.

### 17. Admin panel — ✅
16 ta ekran: foydalanuvchilar, maqolalar, klinikalar, jamiyat moderatsiyasi, obunalar, AI sozlamalari, Telegram bot, analitika, traction.

### 18. CMS — ✅
Maqolalar, homiladorlik haftalik kontenti, illyustratsiya slotlari.

### 19. Testing — 🟡
255 birlik/mantiq testi (`shared/logic` yaxshi qoplangan) + integratsiya skripti.
❌ Yo'q: UI (komponent) testlari, E2E, CI'da avtomatik ishga tushirish.

### 20. Deployment — 🟡
Vercel, `vercel.json`. Sxema sovuq startda avtomatik yangilanadi.
❌ Yo'q: staging muhiti, migratsiya versiyalash, rollback rejasi.

---

## Xulosa: nimani qurish kerak emas

REBUILD rejasidagi 20 bo'limdan **11 tasi allaqachon tayyor**, 6 tasi qisman, 3 tasi yo'q.

Shuning uchun "noldan qayta qurish" **tavsiya etilmaydi**. Ayniqsa sikl algoritmi: u haqiqiy foydalanuvchi ma'lumotiga qarshi backtest qilingan va REBUILD hujjatidagi umumiy quvurdan ancha aniqroq (og'irlikli o'rtacha + Bayes shrinkage + shaxsiy lyuteal faza). Uni generik `prediction_engine()` bilan almashtirish — **aniqlikni pasaytirish** bo'lardi.

To'g'ri yondashuv: mavjud tizimni hujjatlashtirish → bo'shliqlarni sprintlar bilan to'ldirish.

## Haqiqiy ustuvorliklar (bo'shliqlar bo'yicha)

| # | Ish | Nega |
|---|---|---|
| 1 | Maxfiylik arxitekturasi | Eng sezgir bo'shliq; sog'liq ma'lumoti shifrlanmagan |
| 2 | To'lov integratsiyasi | Obuna jadvali bor, pul oqimi yo'q |
| 3 | Spetsifikatsiya hujjatlari | AI agentlari uchun "bible" — shu papka |
| 4 | Migratsiya versiyalash + staging | Production sxemasini xavfsiz o'zgartirish uchun |
| 5 | E2E testlar | UI regressiyasi hozir faqat qo'lda topilyapti |

---

## Keyingi hujjatlar (yozilishi kerak)

| Fayl | Holat |
|---|---|
| `01_product_vision.md` | `docs/technical-spec.md` dan ko'chiriladi va yangilanadi |
| `02_feature_inventory.md` | Shu hujjatdan ajratiladi |
| `03_screen_inventory.md` | ❌ yozilmagan — har ekran uchun holatlar, API, analytics |
| `04_user_flows.md` | ❌ |
| `05_design_system.md` | Qisman: `shared/design-tokens.ts` + `globals.css` |
| `06_database_schema.md` | ❌ — 49 jadval hujjatlanishi kerak |
| `07_api_spec.md` | ❌ — 99 endpoint |
| `08_prediction_engine.md` | Qisman: algoritm `cycle.ts` izohlarida batafsil yozilgan |
| `09_notification_engine.md` | ❌ |
| `10_subscription_system.md` | ❌ |
| `11_privacy_architecture.md` | ❌ — **eng muhim** |
| `12_security.md` | ❌ |
| `13_analytics.md` | ❌ |
| `14_admin_panel.md` | ❌ |
| `15_testing.md` | ❌ |
