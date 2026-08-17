# MammoAI

Ko'krak saratonini erta aniqlash uchun onlayn tizim: ro'yxatdan o'tish,
shaxsiy profil, xavf omillarini baholovchi test va admin panel.

Bu — **prototip bosqichi**. Barcha ma'lumotlar (foydalanuvchilar, test
savollari, natijalar) brauzeringizning `localStorage`'ida saqlanadi — hali
haqiqiy server/baza yo'q. Bu tez ko'rib chiqish va dizaynni tasdiqlash uchun
qulay, lekin: ma'lumotlar faqat shu brauzerda saqlanadi (boshqa qurilmadan
kirsangiz ko'rinmaydi), brauzer keshi tozalansa ma'lumot yo'qoladi, va parol
himoyasi haqiqiy emas. Keyingi qadam — Supabase'ga ulash (pastga qarang).

## Ishga tushirish

```bash
npm install
npm run dev
```

So'ng brauzerda [http://localhost:3000](http://localhost:3000) oching.

## Admin kirish

Birinchi ishga tushirishda avtomatik yaratiladi:

- Email: `admin@mammoai.uz`
- Parol: `admin123`

## Nima qilingan

- **Bosh sahifa** — logotip, tizim haqida ma'lumot, ro'yxatdan o'tishga chaqiruv.
- **Ro'yxatdan o'tish / Kirish** — ism, familiya, email, parol, tug'ilgan
  sana, passport seriya raqami, telefon.
- **Profil** — barcha shaxsiy ma'lumotlarni ko'rish va tahrirlash, o'tgan
  testlar tarixi.
- **Test** — ko'p bosqichli savolnoma, oxirida foizli xavf ko'rsatkichi va
  Past / O'rta / Yuqori xavf darajasi.
- **Admin panel** (`/admin`) — umumiy statistika, foydalanuvchilar ro'yxati
  (barcha shaxsiy ma'lumotlar bilan), test savollarini qo'shish/tahrirlash/
  o'chirish (har bir javob variantining xavf ballini ham), barcha
  foydalanuvchilarning test natijalari.

## Keyingi qadam: haqiqiy backend (Supabase)

Ma'lumotlar qatlami `src/lib/store.ts` faylida joylashgan va qasddan
Supabase jadvallariga o'xshash shaklda yozilgan (`getUsers`, `createUser`,
`getQuestions`, `submitAttempt` va h.k.). Supabase'ga o'tishda shu fayldagi
funksiyalarni Supabase so'rovlariga almashtirish kifoya — UI komponentlarini
qayta yozish shart emas. Bunga tayyor bo'lsangiz ayting — auth,
foydalanuvchilar jadvali va xavfsizlik qoidalari (RLS) bilan birga ulab
beraman.

## Texnologiyalar

Next.js (App Router) · TypeScript · Tailwind CSS · lucide-react
