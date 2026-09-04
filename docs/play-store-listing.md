# Play Store — ro'yxatdan o'tish materiallari

Bu fayl Play Console'da "Store listing" (Do'kon sahifasi) va "App content"
bo'limlarini to'ldirishda kerak bo'ladigan barcha matn va javoblarni saqlaydi.
Faqat nusxa ko'chirib joylashtirasiz.

## 1. Asosiy ma'lumotlar

| Maydon | Qiymat |
|---|---|
| Ilova nomi | Ayollar salomatligi |
| Package name | `uz.mammoai.app` |
| Toifa (Category) | Health & Fitness *(agar Google Medical toifasini alohida taklif qilsa, u ham mos)* |
| Kontakt email | maqsadbekusmonov8@gmail.com |
| Maxfiylik siyosati URL | `https://mammoai-maqsadbek77s-projects.vercel.app/maxfiylik` |
| Target audience | 18 yosh va undan katta (bolalar uchun mo'ljallanmagan) |
| Reklama (Ads) | Yo'q |
| Narxlash | Bepul |

## 2. Qisqa tavsif (Short description — ≤80 belgi)

```
Hayz sikli, homiladorlik va ko'krak salomatligini kuzatuvchi ilova
```
*(66 belgi)*

## 3. To'liq tavsif (Full description — ≤4000 belgi)

```
Ayollar salomatligi — ayollarning hayz sikli, homiladorlik va umumiy sog'lig'ini
bir joyda kuzatib borishga yordam beradigan ilova.

ASOSIY IMKONIYATLAR

🌸 Hayz sikli kalendari — kunlik yozuvlar, keyingi sikl va unumdor kunlar bashorati
🤰 Homiladorlik kuzatuvi — homiladorlik haftalari, shifokor tashriflari va
   tug'ilish kutilayotgan sana
🩺 Tekshiruv va eslatmalar — ko'krak bezi va boshqa tibbiy tekshiruvlar uchun
   shaxsiy eslatmalar, yaqin klinikalar haqida ma'lumot
📋 O'z-o'zini baholash testi — umumiy xavf omillariga asoslangan yo'naltiruvchi
   test (tibbiy tashxis emas)
👥 Jamiyat — boshqa foydalanuvchilar bilan tajriba almashish, xohlasangiz anonim
🤝 Hamkor bo'limi — turmush o'rtog'ingiz yoki yaqiningiz bilan tanlangan
   ma'lumotlarni ulashish
🌐 4 tilda: o'zbekcha (lotin va kirill), ruscha, inglizcha
♿ Ko'rish qulayligi — katta shrift va yuqori kontrast rejimlari

Ma'lumotlaringiz shaxsiy va xavfsiz saqlanadi, uchinchi shaxslarga sotilmaydi.
Istalgan vaqt ma'lumotlaringizni eksport qilishingiz yoki akkauntingizni
butunlay o'chirishingiz mumkin (Profil bo'limi).

Eslatma: ushbu ilova tibbiy tashxis qo'ymaydi va shifokor maslahati o'rnini
bosmaydi. Sog'lig'ingiz bo'yicha qaror qabul qilishdan oldin doim malakali
shifokorga murojaat qiling.
```

## 4. Grafik materiallar — holati

> ⚠️ **Muhim tuzatish:** `apps/mobile/assets/images/` ichidagi ikonka fayllari
> (icon, adaptive icon, splash) aslida hali ham Expo'ning standart shablon
> belgisi ("A" harfi, ko'k fon) edi — hech qachon almashtirilmagan. Bu bilan
> Play Store'ga chiqish extremely noqulay bo'lardi. Hammasini brendga mos
> (pushti #F43F7F fon + oq yurak belgisi) qilib qayta yasadim va joyiga
> qo'ydim — pastdagi jadvalda barchasi ✅.

| Material | O'lcham | Holat |
|---|---|---|
| App icon | 1024×1024 → 512×512 | ✅ Tayyor: `apps/mobile/assets/images/icon.png` + Play Console uchun tayyor nusxa: `docs/play-store-icon-512.png` |
| Android adaptive icon (foreground/background/monochrome) | 1024×1024 | ✅ Tayyor: `apps/mobile/assets/images/android-icon-*.png` |
| Splash-screen belgisi | — | ✅ Tayyor: `apps/mobile/assets/images/splash-icon.png` (avval bo'sh/oq fayl edi) |
| Feature graphic | 1024×500 | ✅ Tayyor: `docs/play-store-feature-graphic.png` — to'g'ridan-to'g'ri Play Console'ga yuklang |
| Telefon skrinshotlari | kamida 2 ta (tavsiya: 4-6 ta) | ❌ Kerak — quyidagi eslatmaga qarang |

> Skrinshotlarni bu muhitda (Android simulyatori/Play Console hisobiga kirish
> yo'q) mendan avtomatik olib bo'lmaydi, chunki ular ilovaning haqiqiy
> ko'rinishini aks ettirishi kerak. Telefoningizda (yoki `npm run dev:mobile`
> orqali Expo Go'da) ochib, asosiy 4-5 ekrandan (Asosiy, Tekshiruvlar,
> Jamiyat, Profil) skrinshot olishingiz eng ishonchli yo'l.

## 5. Content rating anketasi — tavsiya etilgan javoblar

- Zo'ravonlik, qo'rqinchli kontent, jinsiy kontent: **Yo'q**
- Foydalanuvchi tomonidan yaratilgan kontent (Jamiyat bo'limi): **Ha** — shuning
  uchun "User-generated content" belgisini qo'ying
- Alkogol/tamaki/narkotik mavzulari: **Yo'q**
- Tibbiy/sog'liq mavzusi: **Ha**

## 6. Data safety (Ma'lumotlar xavfsizligi) — tayyor javoblar

**Ma'lumotlar shifrlangan holda uzatiladimi?** Ha (HTTPS)

**Foydalanuvchi ma'lumotlarini o'chirishni so'rashi mumkinmi?** Ha — ilova
ichida (Profil → "Akkauntni butunlay o'chirish") va email orqali ham.

**Yig'iladigan ma'lumotlar turlari va sabab:**

| Ma'lumot turi | Yig'iladimi | Sabab |
|---|---|---|
| Ism | Ha | Shaxsiylashtirilgan tajriba |
| Telefon raqami | Ha (ixtiyoriy) | Akkauntni saqlab qolish |
| Sog'liq ma'lumotlari (hayz sikli, homiladorlik, tekshiruv holati, xavf-test natijalari) | Ha | Ilovaning asosiy funksiyasi — shaxsiy kuzatuv va tavsiyalar |
| Fotosuratlar (profil rasmi) | Ha (ixtiyoriy) | Profilni shaxsiylashtirish |
| App activity / foydalanish ma'lumotlari | Ha | Ilovani yaxshilash |

- **Uchinchi shaxslarga sotiladimi?** Yo'q
- **Reklama uchun ishlatiladimi?** Yo'q
- **Barcha ma'lumotlar ixtiyoriy taqdim etiladimi (bolalar uchun emas)?** Ha,
  ilova 18+ auditoriyaga mo'ljallangan

## 7. Texnik eslatma — production build

`apps/mobile/eas.json`dagi `production` profili endi `EXPO_PUBLIC_API_URL`ni
aniq belgilaydi (backend: `https://mammoai-maqsadbek77s-projects.vercel.app`).
`.aab` yasash uchun:

```bash
cd apps/mobile
EAS_NO_VCS=1 eas build --platform android --profile production
```

Tayyor bo'lgach, [expo.dev](https://expo.dev) hisobingizdagi "Builds"
bo'limidan yoki terminaldan chiqqan havoladan `.aab` faylini yuklab oling va
shuni Play Console'ga yuklaysiz (`.apk` emas, aynan `.aab`).
