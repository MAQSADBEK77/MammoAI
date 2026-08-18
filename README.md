# MammoAI

Ko'krak saratonini erta aniqlash uchun onlayn tizim: ro'yxatdan o'tish,
shaxsiy profil, xavf omillarini baholovchi test va admin panel.

## Backend

Bu endi **haqiqiy backend'ga ega** — barcha ma'lumotlar (foydalanuvchilar,
test savollari, natijalar) serverning o'zida, `data/mammoai.db` fayli
(SQLite) ichida saqlanadi. Brauzer faqat login sessiya cookie'sini
ushlab turadi, boshqa hech narsa emas.

- **Parollar** — oddiy matn emas, `scrypt` bilan xeshlanib saqlanadi
- **Sessiya** — httpOnly cookie ichidagi imzolangan token (JWT) orqali
- **O'chirish** — foydalanuvchini faqat admin panel orqali, faqat
  administrator huquqiga ega hisob o'chira oladi — bu server tomonida
  (`/api/admin/users/[id]`) tekshiriladi, shunchaki interfeysda
  yashirilgan emas. Oddiy foydalanuvchi uchun "hisobni o'chirish" imkoniyati
  umuman mavjud emas.
- **Test balli** — har doim serverda, joriy savollar asosida qayta
  hisoblanadi (brauzerdan yuborilgan ballga ishonilmaydi)

Texnik tafsilotlar: `src/server/` (baza, autentifikatsiya, sessiya) va
`src/app/api/` (REST endpointlar). Mijoz (brauzer) tomoni ular bilan faqat
`src/lib/store.ts` orqali gaplashadi.

## Ishga tushirish

```bash
npm install
npm run dev
```

Birinchi ishga tushirishda avtomatik ravishda:
- `data/mammoai.db` fayli yaratiladi va admin hisobi + standart test
  savollari bilan to'ldiriladi
- `.env.local` fayliga tasodifiy `SESSION_SECRET` yoziladi (agar hali yo'q
  bo'lsa)

So'ng brauzerda [http://localhost:3000](http://localhost:3000) oching.

## Admin kirish

- Email: `admin@mammoai.uz`
- Parol: `admin123`

**Production'ga chiqarishdan oldin bu parolni albatta o'zgartiring** —
hozircha admin profilini tahrirlash imkoniyati yo'q, shuning uchun
`data/mammoai.db` faylida to'g'ridan-to'g'ri (yoki kichik bir skript orqali)
yangilash kerak bo'ladi. Xohlasangiz, buni ham qo'shib beraman.

## Serverga joylashtirish (deploy)

Bu — bitta Node.js ilovasi, uni har qanday VPS/serverga joylashtirish mumkin:

```bash
npm install
npm run build
npm start   # portni PORT muhit o'zgaruvchisi orqali sozlash mumkin
```

**Muhim:**

1. **`SESSION_SECRET`** — o'zingiz sozlang (muhit o'zgaruvchisi sifatida),
   avtomatik generatsiya qilingan qiymatga tayanmang — server qayta ishga
   tushganda yoki bir nechta nusxada ishlaganda muammo tug'dirishi mumkin.
2. **`data/` papkasi** — barcha ma'lumotlar shu yerda. Serveringizda bu
   papka **doimiy diskda** turishi kerak (ephemeral/vaqtinchalik fayl
   tizimiga ega platformalarda — masalan ba'zi serverless xostinglarda —
   qayta deploy qilinganda ma'lumotlar yo'qolib qoladi). Oddiy VPS
   (masalan DigitalOcean, Hetzner) yoki doimiy volume beruvchi platforma
   tavsiya etiladi.
3. Muntazam **zaxira nusxa** (backup) oling — `data/mammoai.db` faylini
   davriy ko'chirib turish kifoya.

## Nima qilingan

- **Bosh sahifa** — logotip, statistika, animatsiyalar, dark/light rejim
- **Ro'yxatdan o'tish / Kirish** — ism, familiya, email, parol, tug'ilgan
  sana, passport seriya raqami, telefon
- **Profil** — ma'lumotlarni tahrirlash, xavf tarixi grafigi, qayta test
  eslatmasi
- **Test** — ko'p bosqichli savolnoma, natija chop etish/PDF imkoniyati
- **Qo'llanma** — o'z-o'zini tekshirish bo'yicha ochiq (login talab
  qilinmaydigan) sahifa
- **Admin panel** — statistika, foydalanuvchilar (faqat admin o'chira
  oladi), test savollari CRUD, barcha natijalar

## Texnologiyalar

Next.js (App Router, API routes) · TypeScript · Tailwind CSS ·
better-sqlite3 · jsonwebtoken · lucide-react
