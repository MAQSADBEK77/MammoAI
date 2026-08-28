# Ayollar salomatligi platformasi (MammoAI)

Hayz tsikli, homiladorlik va tekshiruv (checkup) kuzatuvchisi — veb va mobil ilova,
bitta backend. Texnik asos: `docs/technical-spec.md` va `docs/mobile-ui-brief.md`.

## Tuzilma

```
packages/shared/   — umumiy tiplar, dizayn tokenlari, uz+ru lug'atlar, biznes mantiq,
                      API mijozi (ham web, ham mobil shundan foydalanadi)
apps/web/           — Next.js 16 veb-sayt + backend (API route'lar, SQLite)
apps/mobile/        — Expo (React Native) mobil ilova, xuddi shu backend'ga ulanadi
```

## Ishga tushirish — veb

```bash
npm install                 # repo ildizida, bir marta — barcha workspace'lar uchun
npm run seed                # namunaviy klinikalar bazasini to'ldiradi (bir martalik)
npm run dev:web              # http://localhost:3000
```

Birinchi ishga tushirishda `apps/web/data/mammoai.db` (SQLite) va `apps/web/.env.local`
ichida `SESSION_SECRET` avtomatik yaratiladi.

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
