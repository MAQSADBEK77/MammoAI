# 03 — Ekranlar ro'yxati (Screen inventory)

**Manba:** `apps/web/src/app/**/page.tsx` · **Oxirgi yangilanish:** 2026-09-21
**Jami:** 34 ekran — 13 ilova, 16 admin, 5 ochiq.

## Bu hujjat nima uchun

AI agenti yoki yangi dasturchi ekranga o'zgartirish kiritishdan oldin bilishi kerak: ekran nima uchun, qayerdan kiriladi, qaysi holatlari bor, qaysi API'ga bog'liq. Bularsiz agent mavjud xatti-harakatni bexosdan buzadi.

## Umumiy qoidalar (hamma ilova ekraniga taalluqli)

- **Kirish himoyasi:** `(app)/layout.tsx` — sessiya yo'q bo'lsa `/onboarding` ga yo'naltiradi. Har bir ekran alohida tekshirmaydi.
- **Yuklanish holati:** `LoadingSpinner`. Istisno — "Bugun" ekrani: u referens dizayn bo'yicha katta "tahlil qilinmoqda" doirasini ko'rsatadi.
- **Xato holati:** `ErrorState` + qayta urinish tugmasi. Sikl va homiladorlik ekranlarida majburiy (ilgari ular cheksiz "yuklanmoqda" da qolib ketgan — UX-01).
- **Bo'sh holat:** `EmptyState` — keyingi qadamni TAKLIF qilishi kerak, shunchaki "ma'lumot yo'q" demasligi.
- **Sahifa o'tishi:** `PageTransition` (`motion.div`). ⚠️ U **stacking context** yaratadi — ichidagi `z-index` tashqaridagi `BottomNav` bilan solishtirilmaydi. Shuning uchun to'liq ekranli oynalar `Portal` orqali `document.body` ga chiqariladi.
- **Tillar:** hamma matn `dict` orqali (4 til). Kodda qattiq yozilgan matn bo'lmasligi kerak.

---

## Ilova ekranlari

### `/asosiy` — Bugun (bosh ekran)
**Maqsad:** foydalanuvchining hozirgi reproduktiv holatini bir qarashda ko'rsatish.
**Fayl:** `app/(app)/asosiy/page.tsx` → `CycleScreen` yoki `PregnancyScreen`
**Rejim bo'yicha:**
- `pregnancy` → `PregnancyScreen`
- `partner_tracking` → `/hamkor` ga yo'naltiriladi
- qolgani → `CycleScreen`

**Ikki ko'rinish:** `variant="today"` (`cycle` va `planning_pregnancy` uchun — yangi dizayn) yoki `"classic"` (qolgan rejimlar).

**Tarkibi (today):** yuqori qator (avatar → burger menyu, ⚡streak, sana, kalendar ikonkasi) · hafta chizig'i (bugun O'RTADA) · katta markaziy blok · 3 ta dumaloq amal · yordamchi oynasi · kunlik maslahatlar · so'nggi yozuvlar · klinikalar.

**API:** `GET /api/cycle`, `GET /api/gamification`, `GET /api/me`
**Holatlar:** yuklanmoqda (tahlil doirasi) · xato (`loadError`) · yozuv saqlangandan keyin "bashoratlar yangilandi" (2.5s).
**Chiqish nuqtalari:** kalendar (ko'rish) · kalendar (tahrirlash) · yozuv formasi · check-in kartalari · yordamchi · profil.

### `/tsikl` — Sikl
**Maqsad:** alohida sikl ekrani (tarixiy — hozir mazmuni `/asosiy` ichida).

### `/homiladorlik` — Homiladorlik
**Maqsad:** haftalik kontent, tashriflar, o'lchovlar, tepishlar, albom.
**API:** `GET /api/pregnancy` va quyi endpointlar.

### `/tekshiruvlar` — Tekshiruvlar
**Maqsad:** profilga qarab yaratilgan tekshiruv ro'yxati. **Mahsulotning tijoriy o'zagi** — klinikaga yo'naltirish shu yerdan.
**API:** `GET /api/checklist`, `POST /api/checklist/:id/complete`

### `/klinikalar` — Klinikalar
**Maqsad:** klinikalar katalogi, xaritada (Leaflet) va ro'yxatda.
**API:** `GET /api/clinics`, `POST /api/referrals`

### `/jamiyat` — Jamiyat
**Maqsad:** anonim postlar va izohlar.
**Cheklov:** `partner_tracking` rejimida menyuda KO'RSATILMAYDI.
**Moderatsiya:** shikoyat, bloklash, rate limit.

### `/hamkor` — Juft
**Maqsad:** sherik bilan ulanish va chat.
**Oqim:** kod yaratish → sherik kiritadi → `partner_links`.

### `/yordamchi` — Yordamchi (AI)
**Maqsad:** AI chat + statistika tab'i.
**Premium:** chat premium, kunlik limit bilan.
**Parametr:** `?q=` — tayyor savol matn maydoniga qo'yiladi (yuborilmaydi).

### `/maqolalar`, `/maqolalar/[slug]` — Maqolalar
### `/xavf-testi` — Saraton xavfi testi
### `/profil` — Profil
**Tarkibi:** ism/avatar, rejim, shaxsiy ma'lumot, til, shrift, mavzu, uy hayvoni (faqat <18), yutuqlar, chiqish, akkauntni o'chirish.
### `/fikr` — Fikr bildirish

---

## To'liq ekranli oynalar (alohida route emas)

Bular URL'ga ega emas, lekin ekran darajasidagi tajriba — shuning uchun shu yerda hujjatlanadi.

| Oyna | Komponent | Ochilishi |
|---|---|---|
| Kalendar (ko'rish) | `PeriodCalendar` | Yuqoridagi kalendar ikonkasi |
| Kalendar (tahrirlash) | `PeriodCalendar` `initialEditing` | "Hayz belgilash" tugmasi |
| Kunlik yozuv | `LogSheet` | "Simptomlar" tugmasi, kalendardagi "+" |
| Check-in kartalari | `CheckinDeck` | "Check-in" tugmasi |
| Hayvon tanlash | `PetPicker` | Hayvonni bosish yoki Profil |

Hammasi `Portal` orqali `document.body` ga chiqariladi va (yordamchi oynasidan tashqari) sahifa skrollini qotiradi.

---

## Ochiq ekranlar

| Route | Maqsad | Eslatma |
|---|---|---|
| `/` | Landing | Sessiyasi bor → ilovaga; anonim → landing. "Boshlash" DOIM Telegram botga |
| `/onboarding` | So'rovnoma | Landing'dan havola YO'Q (mahsulot qarori) |
| `/tg` | Telegram Mini App kirish | |
| `/maxfiylik` | Maxfiylik siyosati | |
| `/baholash` | Ochiq kalkulyatorlar | SEO |

---

## Admin ekranlari (16)

`/admin/login` + `/admin/(dashboard)/…`: bosh sahifa, foydalanuvchilar, maqolalar, klinikalar, jamiyat, obunalar, fikrlar, illyustratsiyalar, homiladorlik kontenti, AI sozlamalari, Telegram bot, analitika, traction, Yandex Metrika, adminlar.

**Kirish:** alohida sessiya, `ADMIN_PASSWORD`, urinishlarni cheklash, `admin_audit_log`.

---

## Yozilishi kerak (bo'shliq)

Har bir ekran uchun hali YO'Q:
- analytics hodisalari ro'yxati
- premium cheklovlari matritsasi
- bo'sh/xato holatlarining aniq matnlari
- qabul testlari (acceptance criteria)
