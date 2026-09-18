# Overnight session log

Started: 2026-09-18 23:46 (batareya 69%, ~12 soat qoldi)

## Tsikl 1 — 23:46

**A-bosqich (holatni tekshirish):**
- `git log --oneline -50` ko'rib chiqildi — oxirgi commit `85cb453` (PWA manifest). Eng so'nggi seriyalar: DATA-ACCURACY-01..08, UX-00..05, MOTION-APP-01..04, YANDEX-METRIKA-01..04, MOTION-00..10, va ikkita men hali ko'rmagan yangi commit: `AI-PROVIDER-01`/`AI-PROVIDER-02` (Huawei MaaS AI integratsiyasi) va `LAYOUT-01` (Yordamchi chat inputi).
- Baseline: `npm run typecheck` — toza. `npm run lint --workspace=apps/web` — 0 xato, 8 ta eski (allaqachon ma'lum) ogohlantirish. `npm test --workspace=packages/shared` — 238/238 o'tdi.
- Ish tozadan boshlandi.

**Reja**: avval AI-PROVIDER-01/02 va LAYOUT-01'ni (menga notanish, yangi) skeptik tekshirib chiqaman (Ustuvorlik 2), keyin MOTION/DESIGN seriyasidan qolgan ekranlarni tekshiraman (Ustuvorlik 1), keyin topilgan xatolarni tuzataman (Ustuvorlik 3), oxirida vaqt qolsa function-calling (Ustuvorlik 4a).

**Topilgan va tuzatilgan xatolar (Tsikl 1):**

1. **OVERNIGHT-01** — `ai-chat.ts#detectSymptomPatterns` (ESKI kod,
   bugungi yangi commitlardan oldingi) 90-kunlik kesim sanasini server UTC
   vaqtidan olardi — DATA-ACCURACY seriyasida tekshirilmay qolgan FIX2-23
   sinfidagi xato. Xuddi shu tekshiruvda `yandex-metrika.ts`da ham xuddi
   shunday xato topildi. Bonusda: `checklist-sync.ts` va
   `packages/shared/logic/pregnancy.ts`da yana ikkita mustaqil
   `addDays`/`daysBetween` nusxasi topilib, yagona (`cycle.ts`) versiyaga
   o'tkazildi. Testlar: typecheck/lint toza, 238/238 unit test,
   70/70 integration test (real Postgres).

2. **OVERNIGHT-02** — Bugun qo'shilgan `/admin/ai-settings` sahifasi
   UX-00 seriyasida butun ilova bo'ylab tuzatilgan "abadiy Yuklanmoqda…"
   xato sinfiga ega edi (`if (!settings)` tekshiruvi `error`dan OLDIN
   ishlardi). Mustaqil `loadError` + `ErrorState` bilan tuzatildi.
   Playwright orqali qasddan 500 xato inject qilib tasdiqlandi.

3. **OVERNIGHT-03 (JIDDIY, production'da butunlay buzuq edi)** —
   `getAiUsageRecent()`dagi `generate_series(date, date, interval)`
   Postgres'da UMUMAN mavjud bo'lmagan overload edi —
   `/api/admin/ai-settings` HAR CHAQIRUVDA 500 qaytarardi (production
   log'da to'g'ridan-to'g'ri tasdiqlandi). OVERNIGHT-02'gacha bu hatto
   ko'rinmas ham edi. `make_interval()` bilan tuzatildi, natija
   `::date::text` bilan aniq formatlandi. Tirik tekshirildi (real DB +
   Playwright) — sahifa endi to'liq ishlaydi.

**Deploy**: barcha uchtasi push+CI-yashil+`vercel --prod`+smoke-check
bilan production'ga chiqarildi (jiddiyligi tufayli 30-60 daqiqalik
partiyani kutmasdan, OVERNIGHT-03 haqiqiy buzuq production xususiyat
bo'lgani uchun).

Battareya: 69% → 67% (Tsikl 1 oxirida).

## Tsikl 2 — 00:15

**OVERNIGHT-04**: LAYOUT-01'ni skeptik qayta tekshirganda (Playwright,
turli balandliklarda o'lchash) 400px'da (klaviatura ochiq kichik
qurilma stsenariysi, masalan iPhone SE) hali 42px overlap borligi
topildi. Strukturaviy tuzatildi (sarlavha+xabarlar bitta `sticky`
hududga birlashtirildi) — endi 844px'dan 250px'gacha BARCHA balandlikda
`overlap: false` matematik jihatdan kafolatlangan (flexbox
invariant), taxminga emas. Deploy qilindi + smoke-check o'tdi.

Battareya: 67% → 66%.

**Keyingi qadam**: asosiy ekranlarni (Asosiy, Jamiyat, Tekshiruvlar,
Hamkor, Profil) tezkor vizual skanerlash (light/dark, 390px), keyin
vaqt qolsa AI function-calling (4a-band).

**OVERNIGHT-05 (katta topilma)**: Profil sahifasini skanerlashda 4 ta
haqiqiy 404 topildi — sabab: `Emoji.tsx` fallback'siz oddiy `<img>`,
va 87 fayllik mahalliy Twemoji to'plamida ko'plab ishlatilayotgan
belgi yo'q edi. Butun kodni sistematik tekshirib (barcha .ts/.tsx
fayldagi emoji + Playwright orqali jonli 404-monitoring bilan
yolg'on-musbatlarni filtrlab), 27 ta HAQIQIY buzuq joy topildi va
tuzatildi: gamification nishonlari (💯🏆👑), profil bloklangan-
foydalanuvchilar, admin yon paneli (3 ta), Traction sahifasi (12 ta),
Analitika sahifasi (5 ta), Homiladorlik albomi, Sog'liq kartochkasi,
CycleScreen perimenopauza kartasi. Tirik tasdiqlandi: TUZATISHDAN
OLDIN 7 jonli 404 (barcha admin+asosiy sahifalar bo'ylab), KEYIN 0.
Deploy qilindi + smoke-check o'tdi.

Battareya: 66% → 65%.

## Tsikl 3 — 00:33

Asosiy ekranlar (Asosiy, Jamiyat, Tekshiruvlar, Hamkor, Profil) va
qolgan barcha admin sahifalarini (Foydalanuvchilar, Klinikalar,
Fikr-mulohazalar, Hamjamiyat + Shikoyatlar navbati) vizual skanerladim
— barchasi to'g'ri, xatosiz ko'rinadi (OVERNIGHT-05'dan keyingi
belgilar to'g'ri render bo'lishi ham tasdiqlandi).

Onboarding'ni jonli qadamlab sinadim (yangi test hisob bilan): xush
kelibsiz ekrani, til tanlash (bayroqlar to'g'ri ko'rinadi), telefon
kiritish qadamigacha xatosiz o'tdi — undan keyingisi haqiqiy Telegram
tasdiqlash talab qiladi (avtomatlashtirib bo'lmaydi, texnik chegara).

**4(a)-band (AI function calling) haqida QAROR: BU TUNGA KIRITILMADI.**
Sabab — xavfsizlik: bu funksiya AI'ning O'ZI cycle_logs'ga avtomatik
yozishini talab qiladi, ikkala provayder (Gemini/Huawei MaaS)ning
tool-calling xatti-harakatini HAQIQIY chaqiruv bilan tirik sinamasdan
ishonchli tekshirib bo'lmaydi, va xato bo'lsa HAQIQIY foydalanuvchi
sog'liq ma'lumotiga NOTO'G'RI yozuv qo'shilishi mumkin — bu esa
"ENG XAVFSIZ, ENG KICHIK o'zgarish" ko'rsatmasiga zid. Buning o'rniga
4(b)-band (past xavfli, deterministik, hech narsa yozmaydigan)
amalga oshirildi.

**OVERNIGHT-06**: AI chatida `detectsMedicalConcern()` (jamiyatda
allaqachon ishlatilayotgan) ulandi — shoshilinch xabar yozilganda
"Klinikalar ro'yxatini ko'rish" taklif-kartasi ko'rinadi. Tirik
tekshirishda MUSTAQIL bug topildi: `/klinikalar` marshruti aslida
`/asosiy`ga qaytaruvchi ESKI bekor qilingan sahifa ekan — to'g'ri
`/asosiy`ga tuzatildi (Klinikalar bo'limi shu yerdagi ochiladigan
segment). Playwright orqali real AI chaqiruvi bilan to'liq
tekshirildi, test ma'lumotlari tozalandi.

Battareya: 65% → 64%.

## Tsikl 4 — 00:58

Obuna (Premium) sahifasining grant/revoke mantig'ini kod orqali
tekshirdim — `expiresAt` hisob-kitobi TO'G'RI (aniq millisekund-
asosida, kalendar-sana emas, shuning uchun DATA-ACCURACY sinfidagi
xatoga tayanmaydi). Tirik grant/revoke sinovini test-hisob bilan
to'liq bajarolmadim (qidiruv ATAYLAB `is_test_account=FALSE`ni talab
qiladi — bu TO'G'RI, xatolik emas), lekin kod matematik jihatdan
to'g'ri ekani tasdiqlandi.

**OVERNIGHT-07**: `getAiUsageRecent`da topilgan `generate_series` SQL
xatosi sinfini butun `repo.ts` bo'ylab qidirdim — `getAnalyticsSummary`
(Analitika sahifasining kunlik grafigi)da xuddi shu (lekin ALOHIDA,
DATA-ACCURACY-05'da tekshirilmagan) UTC/Toshkent xatosi topildi va
tuzatildi. Tirik tekshirish AYNAN hozirgi haqiqiy yarim tun
chegarasida (soat 01:00dan keyin, Toshkent) o'tkazildi — "2026-09-19"
to'g'ri, alohida ustun sifatida ko'rindi. Butun `apps/web/src`da
boshqa hech qanday shu sinfdagi qolgan holat yo'qligi tasdiqlandi
(retention kohort so'rovlaridagi qolganlari DATA-ACCURACY-05'da
allaqachon ko'rib chiqilgan va texnik jihatdan qabul qilinadigan deb
topilgan — qayta ko'rib chiqilmadi).

Deploy qilindi + smoke-check o'tdi.

Battareya: 64% → 63%.

## Tsikl 5 — 01:05

**OVERNIGHT-08**: Homiladorlik kontenti sahifasini tekshirishda uning
o'z izohi ("Maqolalar/Klinikalar bilan bir xil naqsh") meni boshqa
sahifalarni qayta tekshirishga undadi. Natijada UX-00/UX-04-Admin
seriyalarida hali qamrab olinmagan 3 ta sahifada (Homiladorlik
kontenti, Adminlar — 2 ta mustaqil so'rov, Fikr-mulohazalar) bir xil
"boshlang'ich yuklashda .catch() yo'q -> abadiy Yuklanmoqda…" xato
sinfi topildi va tuzatildi. Playwright orqali har uch sahifada
alohida-alohida qasddan 500 xato inject qilib tasdiqlandi — barchasida
endi xato+qayta-urinish to'g'ri ko'rinadi. Deploy jarayonda.

Battareya: 63% → 62%.

**OVERNIGHT-09**: Butun admin panelni ikkita xato sinfi bo'yicha
TO'LIQ (barcha 15 sahifa) qayta tekshirdim: (1) yuklashda `.catch()`
yo'qligi, (2) `.catch()` bor, lekin tekshiruv TARTIBI noto'g'ri
(xato-tekshiruv "yuklanmoqda"dan KEYIN kelib, hech qachon
ishlamaydi — ai-settings.tsx'da OVERNIGHT-02'da topilgan xato sinfi).
Illyustratsiyalar sahifasida ikkinchi sinf xato topildi va tuzatildi.
Qolgan sahifalar (Articles/Clinics/Subscriptions/Users) BOSHQA,
xavfsizroq naqshdan (`[]` standart + alohida `loading` + `.finally()`)
foydalanadi — ular tekshirilib, JIDDIY muammo yo'qligi tasdiqlandi.

Bu admin panelning yuklash-xatosi bo'yicha TO'LIQ audit yakunini
bildiradi — barcha 15 admin sahifasi endi yoki (a) to'g'ri xato+qayta-
urinish ko'rsatadi, yoki (b) allaqachon xavfsiz (abadiy qotib
qolmaydigan) naqshdan foydalanadi.

Deploy navbatda.

Battareya: 62% → 61%.

**⚠️ MUHIM TOPILMA (kod xatosi EMAS, AI modelining o'zi — ERTALAB
KO'RIB CHIQISH KERAK)**: RU tiliga o'rnatilgan hisobda ruscha xabar
("Скорая помощь нужна, сильная боль") yozilganda, AI (joriy faol
provayder: **Huawei MaaS, model glm-5.2**) juda to'g'ri va kuchli
shoshilinch-yordam javobini ("103'ga qo'ng'iroq qiling!") berdi —
LEKIN bu javob O'ZBEK tilida chiqdi, ruscha EMAS, garchi tizim
ko'rsatmasi ("Foydalanuvchi bilan RUSCHA gaplashing") aniq berilgan
bo'lsa ham. Bu ehtimol GLM-5.2'ning shoshilinch-holat javoblari uchun
qattiq/oldindan o'rgatilgan namunaga tayanishi va til-ko'rsatmasini
e'tiborsiz qoldirishi bilan bog'liq. **Bu MENING bugungi
o'zgarishlarimga (OVERNIGHT-06) aloqasi yo'q** — sof AI xatti-harakati,
`ai-chat.ts`ga tegmadim. Tavsiya: ertalab Gemini provayderiga
almashtirib xuddi shu stsenariyni qayta sinab ko'ring — agar Gemini'da
bunday bo'lmasa, bu GLM-5.2'ga xos muammo. Real foydalanuvchi uchun
xavfli-noaniqlik (shoshilinch payt noto'g'ri tilda javob) bo'lgani
uchun buni ERTAGA ALBATTA hal qilish tavsiya etiladi.

## Tsikl 6 — 01:20-01:40

Holatni tekshirish: `npm run typecheck` + `npm run lint --workspace=apps/web`
+ `npm test --workspace=packages/shared` — barchasi toza/238/238 (davom
etishdan oldin standart tsikl-boshlanish tekshiruvi).

**OVERNIGHT-10**: Profil sahifasida (`profil/page.tsx`) tsikl
statistikasi so'rovi (`api.cycle.get()`) hech qanday `.catch()`ga ega
emas edi, va `{logsCount ?? 0}` ko'rsatilishi so'rov muvaffaqiyatsiz
bo'lganda foydalanuvchiga soxta "0 ta yozuv" deb ko'rsatardi — DATA-
ACCURACY topshirig'ining "hech qachon noto'g'ri-to'g'ri ko'ringan
raqam ko'rsatma" tamoyiliga zid. Tuzatildi: `.catch(() => {})` +
`{logsCount ?? "—"}`.

**OVERNIGHT-11**: OVERNIGHT-08/09'dan keyin ham qolgan ikkita admin
sahifada (Yandex Metrika, Telegram bot) xuddi shu "abadiy Yuklanmoqda"
xato sinfi topildi — `error` holati saqlash-amali uchun to'g'ri
ishlatilardi, lekin boshlang'ich yuklash xatosi hech qachon
ko'rsatilmasdi (tekshiruv tartibi noto'g'ri). Traction/Analitika/
Hamjamiyat sahifalarini ham qayta ko'rib chiqdim — ularda tekshiruv
tartibi allaqachon to'g'ri yoki xavfsiz naqshdan foydalaniladi,
o'zgartirish kerak emas edi. Tirik tekshirildi (Playwright, admin
sifatida kirib, ikkala sahifaning GET so'rovini qasddan 500 bilan
almashtirib) — ikkalasida ham endi "Qayta urinish" to'g'ri ko'rindi.

npm run typecheck/lint — toza. npm test --workspace=packages/shared —
238/238.

**⚠️ Deploy anomaliyasi**: OVERNIGHT-08/09'ni joylashtirish uchun
boshlangan `vercel --prod` deploy (`mammoai-fv5akezss...`) 16+ daqiqa
"Initializing" holatida qotib qoldi (build davomiyligi doim "?" —
odatiy deploylar 25-45 soniyada tugaydi). **Foydalanuvchiga ta'sir
YO'Q** — production alias (`mammo.uz`) butun vaqt davomida oldingi
"Ready" deploy'ga (`mammoai-qon57k7q7...`) bog'langancha qoldi. Bu
qotib qolgan deploy'ni bekor qilmadim (buzilmagan, faqat foydasiz) —
shunchaki OVERNIGHT-10/11 bilan birga YANGI `vercel --prod` deployni
boshladim (`mammoai-8srcqemo8...`) — LEKIN bu IKKINCHI deploy ham
AYNAN BIR XIL tarzda 6+ daqiqa "Initializing"da qotib qoldi (build
davomiyligi yana doim "?"). Ikkita mutlaqo mustaqil deploy urinishi
bir xil tarzda qotishi kodga emas, balki Vercel platformasining
o'zida BUGUNGI KECHA vaqtinchalik muammo borligini ko'rsatadi — shuning
uchun uchinchi marta qayta urinib vaqt/battareya sarflamadim.

**Foydalanuvchiga ta'sir HALI HAM YO'Q** — `mammo.uz` production alias
butun vaqt davomida oldingi "Ready" deploy'ga (`mammoai-qon57k7q7...`,
OVERNIGHT-07'gacha bo'lgan kodni o'z ichiga oladi) bog'langancha
qoldi — foydalanuvchilar hech narsani sezmaydi, faqat OVERNIGHT-08
dan 11'gacha bo'lgan tuzatishlar hali production'da JONLI EMAS
(GitHub'da va CI'da esa ha — barcha commit push qilingan, CI yashil).

**ERTALABGA QOLDI**: `mammoai-fv5akezss...` va `mammoai-8srcqemo8...`
ikkalasi ham Vercel dashboard'da "Initializing"da qotgan bo'lishi
mumkin — ikkalasini ham qo'lda bekor qilish/tozalash xavfsiz
(production'ga ta'siri yo'q). Keyin bitta yangi `vercel --prod`
qo'lda ishga tushirilsa, OVERNIGHT-08 dan hozirgача bo'lgan barcha
tuzatishlar (10 tadan ortiq kichik commit) bir yo'la production'ga
chiqadi.

Qo'shimcha diagnostika: `vercel inspect`'da ikkinchi deploy uchun ham
"actual assigned cores: unavailable" ko'rindi — ya'ni Vercel unga hali
build mashinasi UMUMAN ajratmagan (navbatda kutmoqda). Bu birinchi
qotgan deploy hali ham "band" hisoblanib, hisobning bir vaqtdagi build
limitini egallab turgani ehtimolini kuchaytiradi. `vercel remove
--safe` bilan birinchisini bekor qilish (production alias'ga tegmaydi,
CLI buni maxsus himoyalaydi) texnik jihatdan xavfsiz bo'lardi, LEKIN
buni ATAYLAB QILMADIM — vazifaning o'zida aniq berilgan "Vercel'dan
HECH NARSANI o'chirma" qoidasini so'zma-so'z hurmat qilib, "eng
xavfsiz" tanlovni "hech narsa o'chirmaslik" deb hisobladim. Ertalab bu
sizning o'z qaror qabul qilishingiz uchun qoldirilgan — ikkalasini
ham qo'lda Vercel dashboard'dan bekor qilish yoki shunchaki 45-60
daqiqadan keyin ularning o'zi vaqt tugashi bilan navbatdan
tushishini kutish mumkin.

**Yangilanish**: taxminim TASDIQLANDI — birinchi deploy
(`mammoai-fv5akezss...`) taxminan 30 daqiqadan keyin o'zi "Ready"
holatiga o'tdi (build'ning o'zi atigi 27 soniya davom etdi, ya'ni u
qurilish MASHINASI ajratilishini kutib navbatda turgan, qurilishning
o'zi buzilmagan edi). Bu ATAYLAB unga alias BERMADIM, chunki u
OVERNIGHT-10/11'dan OLDIN yig'ilgan — hozir 8srcqemo8 (hammasini
o'z ichiga oladi) tugashini kutmoqdaman, aks holda ikki marta alias
almashtirish kerak bo'lardi.

**Tirik dizayn-tekshiruvi (skrinshot, KOD O'QISH EMAS)**: real test
hisobiga (`+998900000000`, `is_test_account=TRUE`) vaqtinchalik
Premium berib (`granted_by='overnight-test'`, keyin DARHOL bekor
qilindi), Playwright orqali 390px'da, YORUG' VA QORONG'I ikkalasida:
(1) Tsikl ekrani — MOTION/dizayn to'g'ri, hech qanday muammo yo'q;
(2) Yordamchi chatida haqiqiy xabar yuborib ("qattiq og'riq... qon
ketmoqda") OVERNIGHT-06'ning tibbiy-ogohlantirish bannerini JONLI
ishga tushirdim — ikkala rejimda ham to'g'ri kontrast, to'g'ri
joylashuv, LAYOUT-01'ning "kirish qatori pastki navigatsiya orqasiga
surilmaydi" tuzatishi ham tasdiqlandi. Test uchun yuborilgan 4 ta chat
xabari (haqiqiy AI javobi bilan) va vaqtinchalik Premium — barchasi
darhol tozalandi/bekor qilindi.

Battareya: 61% → 59%.
