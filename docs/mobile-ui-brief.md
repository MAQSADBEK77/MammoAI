# Ayollar salomatligi ilovasi — Mobile dasturchi (UI/UX) uchun texnik topshiriq

## 1. Nima uchun buni qurayapmiz

Aksariyat o'zbek ayollari o'z salomatlik ma'lumotlarini hech qayerda kuzatib bormaydi. Biz **klinikalar va ginekologlar orqali** tarqatiladigan hayz / homiladorlik / tekshiruv kuzatuvchisini qurayapmiz. Bu strategiya — ishonch, maxfiylik va klinik aniqlikni odatiy iste'molchi ilovalariga qaraganda muhimroq qiladi.

Sizga backend/AI/arxitektura tafsilotlari kerak emas — ular alohida hujjatda, CTO uchun. Sizning ishingiz: **foydalanuvchi ilovada nimani ko'radi, nimani bosadi, qanday his qiladi**.

**Uzoq muddatli yo'nalish** (faqat kontekst — hozirgi qurilishga kirmaydi): hamkorlarga o'z yaqinlarining salomatligini kuzatish imkoniyati, kengroq tibbiy-maslahat ekotizimi, O'zbekiston/Markaziy Osiyo uchun FLO ekvivalenti bo'lish.

## 2. Figma andozasi haqida

Sizga Flo ilovasining Figma andozasi yuboriladi. Vazifa — uni **nusxalash emas, moslashtirish**:

- **Til**: barcha matnlar o'zbek (va rus) tilida, hardcode qilinmagan — tarjima tizimi orqali
- **Vizual til**: Flo'ning ranglar palitrasi va layout mantig'ini saqlab qolish mumkin, lekin illyustratsiyalar va ikonografiya mahalliy madaniy me'yorlarga mos bo'lishi kerak — haddan tashqari ochiq/G'arbcha tasvirlardan saqlaning, oilaviy va hurmatli ohangni saqlang
- **Ohang**: matnlar hazil-mutoyiba emas, iliq va professional bo'lsin — bemor buni klinikada ginekolog tavsiyasi bilan oladi, tasodifiy app-store yuklamasi emas
- Har bir ekranda qaysi joylarda Flo'dan farqlanish kerakligini (matn, rasm, oqim) alohida belgilab chiqing — bu keyingi muhokama uchun asos bo'ladi

## 3. Ekranlar va oqimlar (V1)

### 3.1 Onboarding
- Tez ro'yxatdan o'tish (~2 daqiqadan kam) — ko'pincha klinika kutish xonasida to'ldiriladi
- Asosiy ma'lumotlar: tug'ilgan sana, oxirgi hayz sanasi, maqsad (sikl kuzatish / homiladorlik / tekshiruv)
- Til tanlash (o'zbek/rus)

### 3.2 Hayz kuzatuvchisi
- Kalendar ko'rinishi (oylik jadval, sikl fazasiga qarab rangli: hayz, unumdor davr, kutilayotgan hayz)
- Kunlik qayd ekrani: oqim intensivligi, og'riq, kayfiyat, moslashtiriladigan teglar (tez bosish uchun icon-based)
- Bashorat ko'rsatuvchi karta: "Keyingi hayzingiz X kundan keyin"
- Push-bildirishnoma sozlamalari (yoqish/o'chirish, vaqt)
- Ginekolog uchun xulosa/eksport ekrani (oddiy, chop etiladigan yoki ulashiladigan format)

### 3.3 Homiladorlik yordamchisi kuzatuvchisi
- Haftama-hafta ekran: **bola qanday o'sib borayotgani** — vizual (o'lcham taqqoslash, masalan "bu hafta bola limon kattaligida"), qisqa hikoya matni, rasm/illyustratsiya
- Bu bo'lim FLO uslubida **hissiy jalb qiluvchi** bo'lishi kerak — chiroyli animatsiya/o'tish effektlari, "bugun sizning bolangiz..." kabi shaxsiylashtirilgan matnlar
- Tug'ilish sanasi hisoblagichi (progress bar — necha hafta qoldi)
- Trimestrga asoslangan tekshiruv jadvali (kontent backenddan keladi, siz faqat ko'rsatasiz)
- Homiladorlikka xos simptom qaydlari

### 3.4 Tekshiruv kuzatuvchisi
- Tavsiya etilgan tekshiruv jadvali ro'yxati (kontent backenddan)
- "Tekshiruv qildim" tugmasi — sana va izoh bilan
- Kelayotgan/o'tkazib yuborilgan tekshiruvlar uchun vizual belgilash (masalan qizil/sariq/yashil status)
- Tarix jurnali — sana bo'yicha saralanadigan ro'yxat

### 3.5 Klinikalar xaritasi/ro'yxati (daromad manbai)
- Xarita ko'rinishi + ro'yxat ko'rinishi (toggle)
- Har bir klinika kartochkasi: nomi, masofa, xizmat turi teglari, reyting (backend orqali Yandex'dan keladi — pastga qarang)
- Filtrlash: xizmat turi bo'yicha (hayz muammolari / homiladorlik / yillik ko'rik)
- Bosilganda: klinika tafsilotlari + "Yo'nalish" tugmasi (Yandex Maps/Google Maps'ga link) + qo'ng'iroq tugmasi
- **Muhim**: reyting/sharhlar bizning UI'da ko'rsatiladi, lekin manba sifatida Yandex'ga ochiq havola bo'lishi kerak (huquqiy sabablarga ko'ra — CTO hujjatida batafsil)

## 4. Til va lokalizatsiya
- Barcha matnlar tarjima kalitlari orqali (i18n), hech qanday hardcoded string yo'q
- Sana/vaqt formatlari mahalliy standartga mos
- RTL kerak emas (o'zbek/rus lotin/kiril — ikkalasi ham LTR)

## 5. Funksional bo'lmagan UI talablari
- Past/o'rta darajadagi Android qurilmalarida silliq ishlashi (animatsiyalarni optimallashtiring)
- Offline holatda ham asosiy qayd ekranlar ishlashi kerak (ma'lumot keyin sinxronlanadi — bu backend logikasi, lekin UI "sinxronlanmoqda" holatini ko'rsatishi kerak)
- Bitta qo'l bilan foydalanish qulay bo'lishi (katta tugmalar, pastki navigatsiya)

## 6. V1 uchun aniq qamrovdan tashqarida
- Hamkor/yaqinlarni kuzatish akkauntlari va UI
- Chegirma/promo-kod UI (klinika hamkorliklari hali yo'q)
- Ginekologlar/klinikalar uchun alohida panel

## 7. Siz hal qilmasligingiz kerak bo'lgan savollar (CTO/asoschi tomonidan hal qilinadi)
- Klinika reytinglari qayerdan keladi va qanday yangilanadi
- Tibbiy kontent (tekshiruv jadvallari, haftalik homiladorlik ma'lumotlari) qayerdan keladi
- Backend API strukturasi

Figma andozasini olgach, yuqoridagi ekranlar ro'yxati bilan solishtirib chiqing va qaysi ekranlar yetishmayotganini yoki ortiqcha ekanini belgilang — shundan keyin muhokama qilamiz.
