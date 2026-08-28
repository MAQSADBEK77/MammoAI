# Ayollar salomatligi platformasi — Texnik hujjat v2
**Kimga: CTO**
**Kimdan: Shohzoda**
**Sana: 2026-yil avgust**

## 0. Nima ishga tushiryapmiz

Ishga tushirish uchun 3 ta asosiy funksiya, hammasi birga, avval veb-sayt, parallel ravishda ilova:

1. **Hayz tsikli kuzatuvchisi**
2. **Homiladorlik kuzatuvchisi**
3. **Tekshiruv ro'yxati (checkup to-do list)** — bu mahsulotning asosiy o'zagi. Qolgan ikkitasi foydalanuvchini ilovaga jalb qilish va ma'lumot yig'ish uchun, lekin klinikalarga referral va pul ishlash aynan shu funksiyadan chiqadi

Auditoriya: 20 yoshdan 60+ gacha bo'lgan ayollar. Bu quyidagilarni talab qiladi:
- Katta tugmalar, murakkab gestlarsiz navigatsiya, har bir asosiy amal 2 ta bosishdan oshmasin
- O'zbek va rus tillari — ishga tushirishda majburiy (ingliz tili — ixtiyoriy)
- Hech qanday tibbiy jargon: "keyingi hayz kutilmoqda", "profilaktik tekshiruv ehtimoli" emas
- Past darajadagi Android telefonlar va sekin internetda ham yaxshi ishlashi kerak (45+ segment ko'pincha shu holatda)
- Shrift o'lchamini kattalashtirish imkoniyati, default holatda yuqori kontrast

## 1. Kirish tajribasi (Onboarding)

Flo kabi — imkon qadar sodda, lekin ma'lumot yig'ishga qaratilgan.

**Oqim:**
1. **Xush kelibsiz animatsiyasi** — ilovaga birinchi marta kirganda qisqa, yengil animatsiya (3-5 soniya, o'tkazib yuborish tugmasi bilan). Brendni tanishtirish va foydalanuvchini "his qildirish" uchun — texnik jihatdan og'ir bo'lmasin, sekin telefonlarda ham silliq ishlashi kerak.
2. **Personalizatsiya so'rovnomasi** — animatsiyadan keyin darhol:
   - Yosh
   - Hozir homiladormi yoki yo'q
   - Hayz tsikli muntazammi (bilmayman varianti bilan)
   - Oilada saraton/ginekologik kasalliklar tarixi (ha/yo'q, sodda)
   - Oxirgi ginekologik tekshiruv qachon bo'lgan (bilmayman varianti bilan)
3. So'rovnoma javoblariga qarab foydalanuvchiga mos funksiyalar ochiladi: homilador bo'lsa — homiladorlik kuzatuvchisi birinchi ekranda, bo'lmasa — hayz tsikli kuzatuvchisi.
4. So'rovnoma savollari va ulardan kelib chiqadigan checklist mantiqi — bu keyingi bosqichda alohida ishlab chiqiladi (hozircha faqat struktura).

**Muhim:** so'rovnoma 5 daqiqadan oshmasligi kerak. Har bir qo'shimcha savol - tark etish (drop-off) xavfi. Boshida minimal savollar, keyinchalik profil sahifasida to'ldirish imkoniyati qoldiriladi.

## 2. Funksiya 1 — Hayz tsikli kuzatuvchisi

**Asosiy oqim:** hayzni belgilash → ilova keyingi tsiklni bashorat qiladi → kunlik belgilash (ixtiyoriy) → eslatmalar.

Ishga tushirish uchun zarur:
- Onboarding: oxirgi hayz sanasi, o'rtacha tsikl uzunligi (bilmasa — standart qiymat)
- Kalendar ko'rinishi: o'tgan hayzlar, keyingi bashorat, unumdor kunlar oynasi
- Bir bosishda kunlik belgilash: oqim intensivligi, kayfiyat, alomatlar (~8 ta ikonka, matn yozish shart emas)
- Eslatma: "hayz 2 kundan keyin kutilmoqda"
- Tsikl tartibsizligi belgisi → bu tekshiruv ro'yxatiga ko'prik ("3+ oy tartibsiz tsikl — tekshiruvdan o'tishni ko'rib chiqing")

Ishga tushirishda kerak emas: simptomlarga asoslangan ML bashorati, gadjetlar bilan integratsiya, ijtimoiy/community funksiyalar.

## 3. Funksiya 2 — Homiladorlik kuzatuvchisi (vizual)

**Asosiy oqim:** tug'ilish sanasi yoki oxirgi hayz sanasini kiritish → haftalik vizual kontent → simptom/tashrif belgilash.

**Vizual qism (siz so'ragan narsa):**
- Har bir hafta uchun **oldindan tayyorlangan illyustratsiya** — homila qanday ko'rinishi va taxminiy o'lchami
- O'lcham taqqoslash mashhur formatda: "bolangiz hozir limon kattaligida" — bu Flo, BabyCenter, Pregnancy+ kabi ilovalarda ishlaydigan, foydalanuvchilar yaxshi ko'radigan format
- **Muhim tavsiya:** har bir foydalanuvchi uchun AI orqali rasm generatsiya qilish shart emas va tavsiya etilmaydi — bu qimmat, sekin, va tibbiyotga aloqador ilovada "aniqlik" degan noto'g'ri taassurot qoldirishi mumkin. Buning o'rniga: ~40 haftalik tayyor illyustratsiyalar to'plami (bir marta dizayner tomonidan chizilgan/sotib olingan), har bir foydalanuvchi o'z haftasiga mos rasmni ko'radi. Natija bir xil, xarajat va risk yo'q.
- Har bir hafta: rasm + o'lcham taqqoslash + 2-3 gapda "bu hafta nima bo'lyapti" + onaning tez-tez uchraydigan alomatlari

Ishga tushirish uchun zarur:
- Tug'ilish sanasi kalkulyatori (oxirgi hayz yoki homiladorlik sanasidan)
- Haftalik ko'rinish: yuqoridagi vizual + matn
- Tashrif/eslatma jurnali (qo'lda kiritish — "keyingi ginekolog tashrifi", sana, klinika) — bu tekshiruv ro'yxatiga ikkinchi ko'prik
- Tepki hisoblagichi (oddiy hisoblagich, uchinchi trimestr uchun)

Ishga tushirishda kerak emas: simptom-tahlil analitikasi, ovqatlanish/vazn kuzatuvi, tug'ruq rejasi tuzuvchi.

## 4. Funksiya 3 — Tekshiruv ro'yxati (mahsulotning o'zagi)

**Asosiy oqim:** onboarding so'rovnomasi (yosh, xavf omillari) → ilova O'zbekiston skrining protokollariga asoslangan shaxsiy tekshiruv ro'yxatini yaratadi → foydalanuvchi bajarilgan deb belgilaydi yoki "klinika topish" tugmasini bosadi → bosishni qayd qilamiz.

Ishga tushirish uchun zarur:
- Yosh guruhiga qarab ro'yxat, masalan:
  - 20-30 yosh: yillik ginekologik ko'rik, 3 yilda bir marta pap-test
  - 40 yosh: mammografiya skrining qo'shiladi
  - 45+: bepul mammografiya skrining (davlat dasturi bo'yicha) — alohida ta'kidlanadi, chunki u bepul va kam qo'llaniladi
- Har bir ro'yxat bandi: nima ekani (1 gap), nima uchun muhim (1 gap), "Klinika topish" tugmasi
- Bajarilganlik belgisi — bu sizning natija (outcome) ma'lumotingiz
- Muddati o'tgan bandlar uchun eslatma

Bu **oddiy qoidalar jadvali** bilan yechiladi (yosh × xavf omillari × homiladorlik holati → tekshiruv ro'yxati), ML kerak emas. Buni ortiqcha murakkablashtirmaslik kerak.

**So'rovnoma savollari va ulardan chiqadigan aniq checklist mantiqi — keyingi bosqichda alohida ishlab chiqiladi.**

## 5. Klinikalar katalogi + xarita

**Yandex Maps'dan barcha klinikalarni ko'chirib olish tavsiya etilmaydi** — bu ularning foydalanish shartlariga zid va ma'lumot tez eskiradi. Ikki to'g'ri yo'l:

- **Ishga tushirish uchun tavsiya etiladi:** qo'lda yig'ilgan 50-100 ta real klinika bazasi (nomi, manzili, koordinatalari, telefoni, mutaxassisligi, ish vaqti) — jamoa tomonidan qo'lda yoki hamkorlik orqali yig'iladi.
- **Yandex Maps API** (yoki Google Maps Platform) — faqat xaritani va belgilarni ko'rsatish uchun ishlatiladi, bu qonuniy, chunki siz ularning biznes ma'lumotlar bazasini ko'chirmayapsiz.

Har bir klinika uchun minimal ma'lumot: nomi, manzili, koordinatalari, telefoni, mutaxassislik teglari (ginekologiya, onkologiya, radiologiya, umumiy), bepul davlat skriningi bor-yo'qligi.

**Referral kuzatuvi — bu funksiyaning asosiy maqsadi.** Har bir "klinikani ko'rish", "qo'ng'iroq qilish", "yo'l ko'rsatish" bosishi quyidagilar bilan qayd qilinishi kerak: foydalanuvchi ID (anonim bo'lishi mumkin), klinika ID, qaysi tekshiruv bandi orqali kelgani, vaqt belgisi. Bu — keyinchalik klinikaga borib "biz sizga o'tgan oy 40 ta odam yubordik, hamkorlik qilaylik" deyish uchun kerak bo'ladigan ma'lumot.

Onlayn bron qilish — ishga tushirish doirasida emas. Avval klinikalar bilan real hamkorlik kelishuvlari bo'lishi kerak, keyin bron qilish infratuzilmasini qurish mantiqiy.

## 6. Ma'lumotlar modeli (yuqori darajada)

Asosiy obyektlar:
- `User` — anonim bo'lishi mumkin, telefon/email ixtiyoriy, yosh, hudud
- `OnboardingProfile` — yosh, homiladorlik holati, tsikl muntazamligi, oilaviy tarix (so'rovnoma javoblari)
- `CycleLog` — user_id, sana, oqim, alomatlar
- `PregnancyProfile` — user_id, tug'ilish sanasi/oxirgi hayz, hozirgi hafta
- `ChecklistItem` — user_id, band turi, holati (kutilmoqda/bajarildi), muddati
- `Clinic` — nomi, joylashuvi, aloqa, mutaxassisliklar, bepul_skrining (bool)
- `ReferralEvent` — user_id, clinic_id, checklist_item_id, amal (ko'rish/qo'ng'iroq/yo'l), vaqt belgisi

`ReferralEvent` jadvali — biznes modelingiz shu ustida ishlaydi. Buni boshidanoq toza qurish kerak.

## 7. UI/UX yo'nalishi

- Yumshoq, ishonch beruvchi vizual til — tibbiy sovuqlik emas, iliqlik va xavfsizlik hissi (rang palitrasi: yumshoq pushti/binafsha/ko'k tonlar, keskin qizil/qora emas)
- Katta, aniq ikonkalar; matn emas, rasm orqali tushuniladigan interfeys imkon qadar ko'p joyda
- Progress-bar va kichik "yutuqlar" (masalan, "3 kunlik streak") — foydalanuvchini ilovaga qaytarib turish uchun, lekin bosim qilmasdan
- Onboarding animatsiyasi silliq, lekin yengil (past darajadagi qurilmalarda sekinlashmasin)
- Har bir ekranda bitta asosiy amal aniq ko'rinib turishi kerak — ortiqcha tugma/variant yo'q

## 8. Platforma strategiyasi

**Avval veb-sayt, parallel ravishda ilova, bitta backend.**

- Veb-sayt: moslashuvchan (responsive) veb-ilova, mobil brauzerda to'liq ishlaydi — bu real foydalanuvchi va referral ma'lumotiga eng tez yo'l, o'rnatish to'sig'i yo'q
- Ilova: React Native yoki Flutter tavsiya etiladi (bitta kod bazasi, veb jamoasi bilan parallel qurish osonroq) — veb bilan bir vaqtda yoki biroz keyinroq chiqadi, bitta backend/API'dan foydalanadi
- Bitta backend API ikkalasiga ham xizmat qiladi — biznes mantiqni ikki marta yozmang

Tavsiya etilgan stack (jamoa allaqachon bilgan texnologiyalarga moslashtiring):
- Backend: Node.js yoki Python (FastAPI)
- Veb frontend: React yoki Next.js (SSR — sekin/past darajadagi qurilmalarda yordam beradi)
- Mobil: React Native
- DB: PostgreSQL
- Hosting: jamoa uchun eng arzon variant, lekin O'zbekistonda sog'liqqa oid ma'lumotlar uchun rezidentlik qoidalari bo'lishi mumkin — tekshirib ko'rish kerak (bu ilova diagnostik tibbiy ma'lumot saqlamaydi, lekin ehtiyot chorasi sifatida)

## 9. Bosqichlar (taxminiy)

| Hafta | Bosqich |
|---|---|
| 1 | Ma'lumotlar modeli tayyor, klinika ro'yxatini yig'ish boshlanadi, onboarding so'rovnoma va checklist qoidalar jadvali ishlab chiqiladi |
| 2-3 | Asosiy qurilish: tsikl kuzatuvchisi, homiladorlik kuzatuvchisi (vizual bilan), checklist mexanizmi, klinika katalogi + xarita |
| 4 | Referral kuzatuvi ulanadi, eslatmalar ishlaydi, past darajadagi qurilmalarda QA tekshiruvi |
| 5 | Yopiq pilot (Farg'ona tarmog'i orqali), xatolarni tuzatish |
| 6 | Ochiq veb-lansh, ilova do'konlarga parallel yuboriladi |

## 10. CTO uchun ochiq savollar

- Stack tanlovi jamoaning hozirgi ko'nikmalariga mosmi? (Shohruhbekning backend/ML tajribasi, Maqsadbekning frontend stacki)
- Eslatma kanali: push (ilova kerak) yoki SMS (ilova o'rnatilmasdan ham ishlaydi, lekin har xabar uchun pul) — ehtimol ishga tushirishda SMS, chunki veb-foydalanuvchilar push ololmaydi
- Hosting va ma'lumotlar rezidentligi bo'yicha tezkor yuridik tekshiruv kerakmi?
- Homiladorlik haftalik illyustratsiyalar to'plamini (~40 ta rasm) kim tayyorlaydi — dizayner yollanadimi yoki tayyor litsenziyalangan to'plam sotib olinadimi?
- Dastlabki 50-100 ta klinika ma'lumotini yig'ish kimning zimmasida — dev jamoami yoki biznes/operatsion tomon?
