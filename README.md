# Ayollar salomatligi platformasi (MammoAI)

Hayz tsikli, homiladorlik va tekshiruv (checkup) kuzatuvchisi — veb ilova (bitta
backend), Android'da esa Median.co orqali WebView sifatida qadoqlanadi. Texnik
asos: `docs/technical-spec.md` va `docs/mobile-ui-brief.md`.

> **2026-09-17**: bu repo avval `apps/mobile/` ostida alohida Expo (React
> Native) mobil ilova ham saqlagan (EAS Build orqali qurilgan) — u endi olib
> tashlandi, chunki Android ilovasi endi Median.co orqali `apps/web`'ning
> o'zini WebView'da qadoqlash yo'li bilan tayyorlanadi (alohida mobil kod bazasi
> shart emas). Eski kod git tarixida saqlanib qoladi.

## Tuzilma

```
packages/shared/   — umumiy tiplar, dizayn tokenlari, uz+ru lug'atlar, biznes mantiq,
                      API mijozi
apps/web/           — Next.js 16 veb-sayt + backend (API route'lar, Postgres/Supabase),
                      shu sayt Android'da Median.co orqali WebView ilova sifatida ham qadoqlanadi
```

## Ishga tushirish — veb

Backend Postgres (Supabase) ishlatadi — avval `apps/web/.env.local` faylida
`DATABASE_URL`ni sozlang (namuna: `apps/web/.env.example`). Supabase loyihangizda
**Project Settings → Database → Connection string → "Transaction pooler"** manzilini
oling.

```bash
npm install                 # repo ildizida, bir marta — barcha workspace'lar uchun
npm run seed                # namunaviy klinikalar bazasini to'ldiradi (bir martalik)
npm run dev:web              # http://localhost:3000
```

Birinchi ishga tushirishda jadvallar avtomatik yaratiladi (`CREATE TABLE IF NOT
EXISTS`) va `apps/web/.env.local` ichida `SESSION_SECRET` avtomatik yaratiladi
(lokal uchun; production/Vercel'da buni qo'lda muhit o'zgaruvchisi sifatida
qo'shish shart — pastga qarang).

## Production'ga deploy qilish (Vercel + Supabase)

1. **Supabase**: yangi loyiha yarating (bepul tarif) → Project Settings → Database
   → Connection string → "Transaction pooler" (6543-port) manzilini nusxalang.
2. **Vercel**: bu repo'ni GitHub'ga bog'lab import qiling, Root Directory'ni
   `apps/web` qilib belgilang.
3. Vercel loyihasi **Environment Variables** bo'limiga qo'shing:
   - `DATABASE_URL` — 1-qadamdagi Supabase pooler manzili
   - `SESSION_SECRET` — o'zingiz tasodifiy uzun satr yarating (masalan
     `openssl rand -hex 48`) — **bu majburiy**, aks holda har deploy/cold-start'da
     sessiyalar bekor bo'lib qoladi.
   - `ADMIN_PASSWORD` — admin panel (`/admin`) uchun parol, quyiga qarang.
4. Deploy qilingandan keyin bir marta `DATABASE_URL`ni mahalliy `.env.local`ga
   qo'yib `npm run seed` ishga tushiring (namunaviy klinikalar/maqolalarni
   to'ldirish uchun) — bazaga to'g'ridan-to'g'ri ulanadi, Vercel'ga deploy shart
   emas.
## Admin panel (`/admin`)

Foydalanuvchi/tizim sessiyasidan butunlay alohida, bitta parol bilan himoyalangan
boshqaruv paneli — foydalanuvchilar, klinikalar, maqolalar (CRUD) va real
statistika (ro'yxatdan o'tishlar, faollik, kontent hajmi) shu yerda.

1. `apps/web/.env.local` (lokal) va Vercel **Environment Variables** (production)
   ga `ADMIN_PASSWORD` qo'shing — o'zingiz tanlagan kuchli qiymat.
2. `http://localhost:3000/admin` (yoki `https://<domen>/admin`) ga kirib, shu
   parolni kiriting.

**Eslatma — "server yuklamasi":** Vercel serverless funksiyalarida an'anaviy
CPU/server-yuklama ko'rsatkichi mavjud emas (bu Vercelning o'z pullik Analytics
xizmati yoki alohida so'rov-logging tizimi talab qiladi — hozircha loyiha
doirasidan tashqarida qoldirildi). Shuning uchun boshqaruv panelida shu o'rniga
haqiqiy foydalanish/faollik statistikasi ko'rsatiladi; real trafik/so'rovlar
sonini bilish uchun to'g'ridan-to'g'ri [Vercel dashboard](https://vercel.com/dashboard)
ga qarang.

## Test

Sof mantiq (sikl bashorati, homiladorlik hisob-kitoblari, xavf-testi, checklist
qoidalari va h.k. — `packages/shared/src/logic/`) uchun avtomatlashtirilgan unit
testlar (Vitest). Har push/PR'da GitHub Actions orqali avtomatik ishga tushadi
(`.github/workflows/ci.yml`) — typecheck + test + lint.

```bash
npm test                                    # barcha logic testlarni ishga tushiradi
npm run test:watch --workspace=packages/shared   # rivojlantirish paytida (watch rejimi)
```

Backend route'lar/DB — bu testlarga kirmaydi (haqiqiy Postgres talab qiladi);
ular loyihaning o'zida o'rnatilgan naqsh bo'yicha to'g'ridan-to'g'ri (ehtiyotkorlik
bilan, `is_test_account` yozuvlari bilan, keyin tozalab) real bazaga qarshi qo'lda
tekshiriladi.

## Muhim eslatmalar (keyingi bosqich uchun)

- **Klinikalar** (`apps/web/scripts/seed.ts`) — namunaviy/demo yozuvlar, haqiqiy
  50-100 ta klinika bazasi bilan almashtirilishi kerak (spec §5).
- **Homiladorlik illyustratsiyalari** — placeholder (emoji + o'sib boruvchi doira),
  dizayner tomonidan chizilgan ~40 haftalik to'plam bilan almashtiriladi (spec §3).
- **Xarita** — Yandex/Google Maps API kaliti berilmagani uchun kalitsiz OpenStreetMap
  ishlatilgan; haqiqiy kalit paydo bo'lsa `ClinicsMap` komponentlarida almashtiriladi.
- **Mobil logotip** — SVG pipeline tayyor (`src/components/Logo.tsx`), lekin joriy
  `logo.svg`dagi maxsus shrift/uslublar RN'da sinovdan o'tkazilishi kerak.
- **Rus tili** — to'liq yozilgan, lekin tabiiy tilni tasdiqlash uchun ona tilida
  so'zlashuvchi tomonidan ko'rib chiqilishi tavsiya etiladi.
