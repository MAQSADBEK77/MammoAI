# 04 — Onboarding: foydalanuvchi nima ko'radi va dizaynni qanday to'liq ishlatish

**Manba:** `apps/web/src/app/onboarding/page.tsx` (1300+ qator) o'qib chiqildi
**Oxirgi yangilanish:** 2026-09-21

---

## 1-QISM. Foydalanuvchi aslida nima ko'radi

### Ikki xil oqim bor va ular jiddiy farq qiladi

```ts
const filtered = isFromTelegram
  ? base.filter((s) => !["welcome", "account_choice", "account_identifier", "phone_verify"].includes(s))
  : base;
```

| | Veb orqali | **Telegram orqali (haqiqiy foydalanuvchilar)** |
|---|---|---|
| Qadamlar | 21 | **13–17** (maqsadga qarab) |
| Birinchi ekran | `welcome` — logo, gradient, animatsiya | **`language` — yalang'och ro'yxat** |
| Akkaunt | So'rovnoma ichida | Oldin yaratilgan |

### Telegram oqimi — qadamma-qadam

| # | Qadam | Nima so'raladi | Vizual |
|---|---|---|---|
| 1 | `language` | Til | **HECH NARSA** ⚠️ |
| 2 | `privacy` | Maxfiylik roziligi | Lottie aura + qalqon ikonkasi |
| 3 | `name` | Ism | Lottie aura + qalam |
| 4 | `age` | Tug'ilgan yil (g'ildirak) | Lottie aura + tort |
| 5 | `goal` | Maqsad (rejim) | To'liq illyustratsiya |
| 6 | `cycle_regularity` | Sikl muntazammi | Lottie aura + aylanish |
| 7 | `cycle_lengths` | Sikl/hayz uzunligi (28/5 oldindan) | To'liq illyustratsiya |
| 8 | `last_period` | Oxirgi hayz sanasi | To'liq illyustratsiya |
| — | `preview` | **Dastlabki bashorat** (A/B, 50%) | Emoji + qatorlar |
| 9 | `typical_symptoms` | Odatiy simptomlar | Lottie aura + kasallik |
| 10 | `period_attitude` | Hayzga munosabat | To'liq illyustratsiya |
| 11 | `health_conditions` | Sog'liq holatlari | To'liq illyustratsiya |
| 12 | `family_history` | Oilaviy tarix | Lottie aura + oila |
| 13 | `sexually_active` | Jinsiy hayot (15+) | Lottie aura + yurak |
| 14 | `last_checkup` | Oxirgi tekshiruv | To'liq illyustratsiya |
| 15 | `height_weight` | Bo'y/vazn (faqat homiladorlik rejimlarida) | Lottie aura + tarozi |
| 16 | `notifications` | Bildirishnoma roziligi | To'liq illyustratsiya |
| 17 | `analyzing` | "Tahlil qilinmoqda" | Illyustratsiya + `animate-pulse` |

### Vizual tizim — uch qatlam

**1-qatlam · To'liq illyustratsiya** (unDraw SVG, 144px) — 9 qadamda.
Admin panel orqali almashtirilishi mumkin (`illustration_slots`).

**2-qatlam · Lottie "aura" + ikonka** (176×176) — 9 qadamda.
Bu **o'zimizning** animatsiya, uchinchi tomon fayli emas — generatori
`scripts/generate-onboarding-animations.py`. Uchta rang varianti:
`aura-primary.json`, `aura-secondary.json`, `aura-accent.json`.

**3-qatlam · Maxsus** — `welcome` (logo + nur halqasi + bosqichli animatsiya),
`analyzing` (pulse), `preview` (yangi).

### Rang zonalari — mavjud, lekin ko'rinmaydi

`STEP_ICON_COLOR` da aniq uchta zona bor:

| Zona | Rang | Qadamlar |
|---|---|---|
| Shaxs | Binafsha (`secondary`) | account_*, privacy, name, age |
| Sikl | Pushti (`primary`) | goal, cycle_*, last_period, symptoms, attitude, notifications |
| Sog'liq | Turkuaz (`accent`) | health_conditions, family_history, sexually_active, last_checkup, height_weight |

**Muammo:** bu rang FAQAT Lottie auraga qo'llanadi. Fon, progress chizig'i va
tugmalar hamma qadamda bir xil. Ya'ni o'ylab tuzilgan tizim bor, lekin
foydalanuvchi uni **sezmaydi**.

---

## 2-QISM. Ikkita jiddiy muammo

### 🔴 MUAMMO 1 — Progress chizig'i ORQAGA sakraydi

```ts
<ProgressBar value={(stepIndex / (steps.length - 1)) * 100} />
```

`steps.length` — **o'zgaruvchan**: maqsad tanlanmaguncha ro'yxat qisqa
(`[...list, "analyzing"]`), tanlangandan keyin esa 11 ta qadam qo'shiladi.

Telegram oqimida hisob:

| Holat | stepIndex | steps.length | Foiz |
|---|---|---|---|
| `goal` qadamida, maqsad hali tanlanmagan | 4 | 6 | **80%** |
| Maqsad tanlandi (cycle) | 4 | 16 | **27%** |

Ya'ni foydalanuvchi **80% ko'radi, keyin 27% ga tushadi**. Bu eng yomon
demotivatsiya, va u aynan **eng muhim qadamda** (maqsad tanlash) sodir bo'ladi.

> ⚠️ Men progress **foizini** qo'shganimda bu muammoni ko'rinadigan qildim.
> Ilgari faqat chiziq bor edi va sakrash unchalik sezilmasdi. Endi raqam
> "80% → 27%" deb yozib turadi. **Bu birinchi navbatda tuzatilishi kerak.**

### 🔴 MUAMMO 2 — Haqiqiy foydalanuvchilar `welcome` ekranini KO'RMAYDI

`welcome` — loyihadagi eng yaxshi ishlangan ekran: logo, gradient fon
(`bg-aurora-cycle`), nur halqasi, uchta bosqichli animatsiya
(`animate-hero-badge` → `hero-title` → `hero-subtitle`), tugma 0.6s kechikish
bilan.

Va u **Telegram orqali kelgan foydalanuvchiga ko'rsatilmaydi** — filtrda
o'chirilgan.

Natija: haqiqiy foydalanuvchining **birinchi taassuroti** — yalang'och til
tanlash ro'yxati. Hech qanday vizual, hech qanday brend, hech qanday
"xush kelibsiz". Sizning o'z insight'ingiz: *"First animation matters —
boshida nima ko'rishi mumkin"*.

---

## 3-QISM. Dizaynni to'liq ishlatish — aniq tavsiyalar

### Tavsiya 1 · Progressni "3 bo'lim"ga aylantirish ⭐ eng katta ta'sir

Siz savollarni olib tashlamaslikni aytdingiz — **to'g'ri**. Lekin 21 qadamni
**qisqa ko'rsatish** mumkin: uni uchta bo'limga bo'lib.

```
Hozir:  [████░░░░░░░░░░░░░░░░]  27% tayyor        ← 21 ta qadam, cheksiz ko'rinadi

Taklif: ①──②──③     Siz haqingizda · 2/4        ← 3 ta qisqa bo'lim
        ●  ○  ○
```

Bo'limlar `STEP_ICON_COLOR` dagi **mavjud** zonalardan olinadi:
1. **Siz haqingizda** (binafsha) — til, maxfiylik, ism, yosh
2. **Siklingiz** (pushti) — maqsad, muntazamlik, uzunlik, sana, simptomlar
3. **Sog'lig'ingiz** (turkuaz) — oilaviy tarix, tekshiruv, bo'y/vazn, eslatmalar

Bu bir vaqtda **ikkita** muammoni yechadi:
- progress endi sakramaydi (bo'lim ichidagi qadam soni barqaror);
- 21 qadam "uchta qisqa bo'lim"ga aylanadi — psixologik jihatdan ancha yengil.

### Tavsiya 2 · Telegram foydalanuvchisiga ham brend lahzasini berish

`welcome` ni qaytarmang (u akkaunt yaratish uchun edi), lekin **qisqartirilgan
versiyasini** til tanlashdan oldin 2 soniyaga ko'rsatish mumkin: logo +
gradient + "Xush kelibsiz" → o'zi o'tib ketadi.

Yoki soddaroq: `language` qadamiga ham vizual berish (hozir yagona vizualsiz
qadam) va uni gradient fonda ko'rsatish.

### Tavsiya 3 · Rang zonasini ko'rinadigan qilish

Zona rangi allaqachon hisoblangan (`STEP_ICON_COLOR[step]`). Uni yana uch
joyga qo'llash kifoya:
- progress chizig'i rangi;
- fonning juda yengil tusi (`color-mix` bilan 4–6%);
- "Davom etish" tugmasi.

Natija: bo'limdan bo'limga o'tganda foydalanuvchi **rang o'zgarishini**
sezadi — "yangi bo'limga o'tdim" degan tuyg'u. Yangi aktiv kerak emas.

### Tavsiya 4 · Bo'lim oxirida kichik nishon

Sizning insight'ingiz: *"Celebrate small wins"*. Hozir **hech qanday** nishonlash
yo'q. Har bir bo'lim oxirida 1.5 soniyalik lahza:

> ✓ **Birinchi bo'lim tayyor**
> Endi siklingiz haqida so'raymiz — 4 ta savol qoldi.

Loyihada `animate-pop-bounce` allaqachon bor va u aynan shu maqsad uchun
yozilgan ("bevosita foydalanuvchi amaliga javob").

### Tavsiya 5 · `analyzing` — eng kuchsiz ishlangan eng muhim lahza

Hozir: statik SVG + `animate-pulse` + "Tahlil qilinmoqda".

Bu **emotsional cho'qqi** — foydalanuvchi 13 ta savolga javob berdi va natija
kutyapti. Uni ishlatish kerak: nima hisoblanayotganini ketma-ket ko'rsatish.

> Siklingiz tahlil qilinmoqda...
> ✓ Sikl uzunligi aniqlandi
> ✓ Keyingi hayz hisoblandi
> ✓ Tekshiruv rejasi tuzildi

Har biri 600ms oralig'ida. Ma'lumot allaqachon bor — faqat ko'rsatish kerak.
Bu "ilova men uchun ishlayapti" tuyg'usini beradi.

### Tavsiya 6 · `preview` ekranini kuchaytirish (A/B "on" varianti)

Hozir: emoji + uch qator. Yaxshi boshlanish, lekin:
- raqam (`15-oktabr`) **animatsiya bilan** paydo bo'lsa kuchliroq bo'ladi;
- kalendarning kichik ko'rinishi (bir necha kun belgilangan) matndan ta'sirli;
- `motion-breathe` allaqachon bor — bashorat kartasiga qo'llash mumkin.

---

## Ustuvorlik

| # | Ish | Sabab | Hajm |
|---|---|---|---|
| 1 | Progress sakrashini tuzatish | **Xato** — 80%→27% | Kichik |
| 2 | 3 bo'limli progress | Ikkita muammoni yechadi | O'rta |
| 3 | Rang zonasini ko'rinadigan qilish | Aktiv kerak emas | Kichik |
| 4 | `language` ga vizual / brend lahzasi | Birinchi taassurot | Kichik |
| 5 | `analyzing` ketma-ketligi | Emotsional cho'qqi | O'rta |
| 6 | Bo'lim oxirida nishon | Retention | Kichik |
| 7 | `preview` ni kuchaytirish | A/B natijasiga ta'sir | Kichik |

Hech biri yangi savol qo'shmaydi va hech biri savol olib tashlamaydi.
