# 07 — API spetsifikatsiyasi

**Manba:** `apps/web/src/app/api/**/route.ts` — koddan avtomatik chiqarilgan.
**Oxirgi yangilanish:** 2026-09-21 · **Endpointlar:** 99

## Shartnoma qayerda

Mijoz-server shartnomasi **TypeScript orqali majburlanadi** — `packages/shared/src/api-client.ts`.
Ya'ni endpoint o'zgarsa va mijoz mos kelmasa, `npm run typecheck` xato beradi.
OpenAPI fayli yo'q va hozircha kerak emas: veb va mobil bir xil `createApiClient()` dan foydalanadi.

## Autentifikatsiya darajalari

| Daraja | Soni | Qanday tekshiriladi |
|---|---|---|
| Foydalanuvchi | 53 | `requireUser()` — `mammoai_session` cookie yoki `Authorization: Bearer` |
| Admin | 35 | Alohida admin sessiyasi (`requireAdmin`) |
| Ochiq | 11 | Tekshiruvsiz (webhook, analitika, ochiq kalkulyatorlar) |

Bloklangan foydalanuvchi (`is_blocked`) hech qaysi API'dan foydalana olmaydi — `requireUser()` 403 qaytaradi.

## Umumiy qoidalar

- **Xatolar:** `{ error: string, errorKey?: string }`. `errorKey` — barqaror kod, mijoz uni tarjima qiladi (`translateApiError`).
- **Yozish amallari to'liq holat qaytaradi.** Masalan `POST /api/cycle/logs` yangilangan butun `CycleResponse` ni qaytaradi — mijoz ikkinchi so'rov yubormaydi.
- **Mijoz kiritgan qiymat server tomonda QAYTA tekshiriladi** (masalan `pet`, `questionKey` faqat tanilgan ro'yxatdan).
- **Rate limit** alohida `*_attempts` jadvallari orqali.


---

## Autentifikatsiya

Kirish faqat Telegram orqali (mahsulot qarori). Veb ro'yxatdan o'tish o'chirilgan.

| Endpoint | Metodlar | Kirish |
|---|---|---|
| `/api/auth/logout` | POST | ochiq |
| `/api/auth/phone-code/start` | POST | ochiq |
| `/api/auth/phone-code/status` | GET | ochiq |
| `/api/auth/phone-code/verify` | POST | ochiq |
| `/api/auth/telegram-miniapp/finish` | POST | ochiq |
| `/api/auth/telegram-miniapp/start` | POST | ochiq |
| `/api/auth/telegram-miniapp/status` | GET | ochiq |

---

## Foydalanuvchi va profil

Profil o'qish/yangilash va akkauntni o'chirish.

| Endpoint | Metodlar | Kirish |
|---|---|---|
| `/api/me` | DELETE, GET, PATCH | foydalanuvchi |
| `/api/me/export` | GET | foydalanuvchi |

---

## Onboarding

So'rovnomani saqlash va rejimni o'zgartirish.

| Endpoint | Metodlar | Kirish |
|---|---|---|
| `/api/onboarding` | PATCH, POST | foydalanuvchi |

---

## Hayz sikli

Yozuvlar, sozlamalar, davrni belgilash. Javob HAR DOIM to'liq CycleResponse — mijoz qayta so'ramaydi.

| Endpoint | Metodlar | Kirish |
|---|---|---|
| `/api/cycle` | GET | foydalanuvchi |
| `/api/cycle/logs` | POST | foydalanuvchi |
| `/api/cycle/logs/[date]` | DELETE | foydalanuvchi |
| `/api/cycle/period` | POST | foydalanuvchi |
| `/api/cycle/settings` | PATCH | foydalanuvchi |

---

## Kunlik check-in

Karta savollariga javoblar.

| Endpoint | Metodlar | Kirish |
|---|---|---|
| `/api/checkin` | GET, POST | foydalanuvchi |

---

## Homiladorlik

Profil, tashriflar, o'lchovlar, tepishlar, albom.

| Endpoint | Metodlar | Kirish |
|---|---|---|
| `/api/pregnancy` | GET, PATCH | foydalanuvchi |
| `/api/pregnancy/album` | GET, POST | foydalanuvchi |
| `/api/pregnancy/album/[id]` | DELETE | foydalanuvchi |
| `/api/pregnancy/album/[id]/photo` | GET | foydalanuvchi |
| `/api/pregnancy/kicks` | POST | foydalanuvchi |
| `/api/pregnancy/visits` | POST | foydalanuvchi |
| `/api/pregnancy/vitals` | POST | foydalanuvchi |
| `/api/pregnancy/week-content/[week]` | GET | foydalanuvchi |

---

## Farovonlik

Suv va kaloriya.

| Endpoint | Metodlar | Kirish |
|---|---|---|
| `/api/wellness` | GET | foydalanuvchi |
| `/api/wellness/calories` | POST | foydalanuvchi |
| `/api/wellness/water` | POST | foydalanuvchi |

---

## Tekshiruvlar va klinikalar

Tekshiruv ro'yxati.

| Endpoint | Metodlar | Kirish |
|---|---|---|
| `/api/checklist` | GET | foydalanuvchi |
| `/api/checklist/[id]/complete` | POST | foydalanuvchi |

---

## Klinikalar

Katalog.

| Endpoint | Metodlar | Kirish |
|---|---|---|
| `/api/clinics` | GET | foydalanuvchi |

---

## Yo'naltirishlar

Klinikaga o'tish hodisasi — daromad o'lchovi.

| Endpoint | Metodlar | Kirish |
|---|---|---|
| `/api/referrals` | POST | foydalanuvchi |

---

## Jamiyat

Postlar, izohlar, layklar, shikoyatlar.

| Endpoint | Metodlar | Kirish |
|---|---|---|
| `/api/community/blocked` | GET | foydalanuvchi |
| `/api/community/blocked/[userId]` | DELETE | foydalanuvchi |
| `/api/community/posts` | GET, POST | foydalanuvchi |
| `/api/community/posts/[id]` | DELETE | foydalanuvchi |
| `/api/community/posts/[id]/block-author` | POST | foydalanuvchi |
| `/api/community/posts/[id]/comments` | GET, POST | foydalanuvchi |
| `/api/community/posts/[id]/comments/[commentId]` | DELETE | foydalanuvchi |
| `/api/community/posts/[id]/comments/[commentId]/block-author` | POST | foydalanuvchi |
| `/api/community/posts/[id]/comments/[commentId]/report` | POST | foydalanuvchi |
| `/api/community/posts/[id]/like` | POST | foydalanuvchi |
| `/api/community/posts/[id]/report` | POST | foydalanuvchi |
| `/api/community/stats` | GET | foydalanuvchi |

---

## Juft

Ulanish, chat.

| Endpoint | Metodlar | Kirish |
|---|---|---|
| `/api/partner` | DELETE, GET | foydalanuvchi |
| `/api/partner/code` | POST | foydalanuvchi |
| `/api/partner/connect` | POST | foydalanuvchi |
| `/api/partner/messages` | GET, POST | foydalanuvchi |
| `/api/partner/settings` | PATCH | foydalanuvchi |

---

## AI yordamchi

Chat va limitlar.

| Endpoint | Metodlar | Kirish |
|---|---|---|
| `/api/chat/message` | POST | foydalanuvchi |
| `/api/chat/messages` | GET | foydalanuvchi |

---

## Tahlillar

Proaktiv tahlil va naqshlar.

| Endpoint | Metodlar | Kirish |
|---|---|---|
| `/api/insights` | GET | foydalanuvchi |

---

## Maqolalar

Kontent.

| Endpoint | Metodlar | Kirish |
|---|---|---|
| `/api/articles` | GET | foydalanuvchi |
| `/api/articles/[slug]` | GET | foydalanuvchi |

---

## Xavf testi

Saraton xavfi so'rovnomasi.

| Endpoint | Metodlar | Kirish |
|---|---|---|
| `/api/risk-quiz` | GET, POST | foydalanuvchi |

---

## Gamifikatsiya

Streak va nishonlar.

| Endpoint | Metodlar | Kirish |
|---|---|---|
| `/api/gamification` | GET | foydalanuvchi |

---

## Bildirishnomalar

Ilova ichidagi bildirishnomalar.

| Endpoint | Metodlar | Kirish |
|---|---|---|
| `/api/notifications` | GET | foydalanuvchi |
| `/api/notifications/read-all` | POST | foydalanuvchi |

---

## Push

Expo push tokeni.

| Endpoint | Metodlar | Kirish |
|---|---|---|
| `/api/push-token` | POST | foydalanuvchi |

---

## Fikr

Foydalanuvchi fikri.

| Endpoint | Metodlar | Kirish |
|---|---|---|
| `/api/feedback` | POST | foydalanuvchi |

---

## Illyustratsiyalar

Ekranlar uchun rasm slotlari.

| Endpoint | Metodlar | Kirish |
|---|---|---|
| `/api/illustrations` | GET | ochiq |

---

## Analitika

Hodisalarni yig'ish.

| Endpoint | Metodlar | Kirish |
|---|---|---|
| `/api/analytics/events` | POST | foydalanuvchi |

---

## Telegram

Bot webhook.

| Endpoint | Metodlar | Kirish |
|---|---|---|
| `/api/telegram/link` | GET | ochiq |
| `/api/telegram/webhook` | POST | admin |

---

## Admin

Admin panel — alohida sessiya, parol bilan.

| Endpoint | Metodlar | Kirish |
|---|---|---|
| `/api/admin/admins` | GET, POST | admin |
| `/api/admin/admins/[id]` | DELETE | admin |
| `/api/admin/ai-settings` | GET, PATCH | admin |
| `/api/admin/analytics/summary` | GET | admin |
| `/api/admin/analytics/users` | GET | admin |
| `/api/admin/articles` | GET, POST | admin |
| `/api/admin/articles/[id]` | DELETE, PATCH | admin |
| `/api/admin/audit-log` | GET | admin |
| `/api/admin/clinics` | GET, POST | admin |
| `/api/admin/clinics/[id]` | DELETE, PATCH | admin |
| `/api/admin/community/posts` | GET | admin |
| `/api/admin/community/posts/[id]` | DELETE, PATCH | admin |
| `/api/admin/community/posts/[id]/comments` | GET | admin |
| `/api/admin/community/posts/[id]/comments/[commentId]` | DELETE | admin |
| `/api/admin/community/reports` | GET | admin |
| `/api/admin/community/reports/[id]` | PATCH | admin |
| `/api/admin/feedback` | GET | admin |
| `/api/admin/illustrations` | GET, PATCH | admin |
| `/api/admin/login` | POST | admin |
| `/api/admin/logout` | POST | admin |
| `/api/admin/me` | GET | admin |
| `/api/admin/pregnancy-content` | GET | admin |
| `/api/admin/pregnancy-content/[week]` | PATCH | admin |
| `/api/admin/stats` | GET | admin |
| `/api/admin/subscriptions` | GET | admin |
| `/api/admin/subscriptions/[userId]` | DELETE, POST | admin |
| `/api/admin/telegram-bot` | GET, PATCH | admin |
| `/api/admin/telegram-bot/broadcast` | GET, POST | admin |
| `/api/admin/traction` | GET | admin |
| `/api/admin/users` | GET | admin |
| `/api/admin/users/[id]` | DELETE, PATCH | admin |
| `/api/admin/yandex-metrika` | GET, PATCH | admin |
| `/api/admin/yandex-metrika/dashboard` | GET | admin |
| `/api/admin/yandex-metrika/test` | POST | admin |

---

## Dev

FAQAT lokal ishlab chiqish. Production'da 404.

| Endpoint | Metodlar | Kirish |
|---|---|---|
| `/api/dev-login` | GET | ochiq |

---

## Rejalashtirilgan vazifalar (Cron)

Vercel Cron kuniga bir marta chaqiradi (`vercel.json`: 15:00 UTC = 20:00 Toshkent).

| Endpoint | Metodlar | Kirish |
|---|---|---|
| `/api/cron/daily-reminders` | GET | shartli |

> ⚠️ **XAVFSIZLIK — tekshirilishi kerak.** Bu endpoint `Authorization: Bearer $CRON_SECRET` bilan himoyalangan, LEKIN faqat `CRON_SECRET` muhit o'zgaruvchisi o'rnatilgan bo'lsa. O'rnatilmagan bo'lsa tekshiruv butunlay o'tkazib yuboriladi va istalgan odam kunlik eslatmalarni ishga tushirishi mumkin (barcha foydalanuvchilarga push yuboriladi).
>
> `CRON_SECRET` `.env.example` da ham yo'q — ya'ni uni o'rnatish kerakligi hech qayerda yozilmagan.
>
> **Amal:** Vercel muhit o'zgaruvchilarida `CRON_SECRET` borligini tasdiqlash; yo'q bo'lsa qo'shish va `.env.example` ga hujjatlash. Uzoq muddatda — o'zgaruvchi yo'q bo'lsa endpoint ISHLAMASLIGI kerak ("fail closed"), hozirgidek ochiq qolmasligi.
