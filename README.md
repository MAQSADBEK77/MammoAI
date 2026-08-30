# Ayollar salomatligi platformasi (MammoAI)

Hayz tsikli, homiladorlik va tekshiruv (checkup) kuzatuvchisi — veb va mobil ilova,
bitta backend. Texnik asos: `docs/technical-spec.md` va `docs/mobile-ui-brief.md`.

## Tuzilma

```
packages/shared/   — umumiy tiplar, dizayn tokenlari, uz+ru lug'atlar, biznes mantiq,
                      API mijozi (ham web, ham mobil shundan foydalanadi)
apps/web/           — Next.js 16 veb-sayt + backend (API route'lar, Postgres/Supabase)
apps/mobile/        — Expo (React Native) mobil ilova, xuddi shu backend'ga ulanadi
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
4. Deploy qilingandan keyin bir marta `DATABASE_URL`ni mahalliy `.env.local`ga
   qo'yib `npm run seed` ishga tushiring (namunaviy klinikalar/maqolalarni
   to'ldirish uchun) — bazaga to'g'ridan-to'g'ri ulanadi, Vercel'ga deploy shart
   emas.
5. Mobil ilova (`apps/mobile/eas.json` → `build.preview.env.EXPO_PUBLIC_API_URL`)
   manzilini Vercel domeningizga (masalan `https://mammoai.vercel.app`) o'zgartiring
   — shunda APK istalgan tarmoqdan ishlaydi (lokal Wi-Fi shart emas).

## Ishga tushirish — mobil

```bash
cp apps/mobile/.env.example apps/mobile/.env
# .env faylida EXPO_PUBLIC_API_URL'ni kompyuteringizning lokal IP'siga o'zgartiring
# (telefon "localhost"ga ulana olmaydi)

npm run dev:web              # backend fon rejimida ishlab tursin
npm run dev:mobile           # Expo dev server, QR kodni Expo Go bilan skanerlang
```

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
