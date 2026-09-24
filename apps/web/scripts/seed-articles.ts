// CONTENT-03 — maqolalar kontenti.
//
// Nega kerak: bazada 6 ta maqola bor edi, o'rtacha 320 belgi — bu maqola
// emas, izoh. Ayol "mammografiya og'riydimi?", "qanchaga tushadi?",
// "nima olib borishim kerak?" degan savollarga javob izlaydi va ularni
// o'zbek tilida deyarli topa olmaydi. Aynan shu bo'shliq.
//
// MUHIM: bu matnlar `isSeedData: true` bilan yoziladi, ya'ni ilovada
// "hali shifokor ko'rigidan o'tmagan" ogohlantirishi bilan ko'rsatiladi.
// Shifokor ko'rib chiqqach, admin panelda shu bayroq olib tashlanadi va
// uning ismi qo'yiladi. Tibbiy matnni tekshiruvsiz "ishonchli" deb
// ko'rsatish noto'g'ri bo'lardi.
//
// Ishga tushirish:
//   node --env-file=.env.local --import tsx scripts/seed-articles.ts
//   node --env-file=.env.local --import tsx scripts/seed-articles.ts --write

import { ensureSchema, sql } from "../src/server/db";
import { createArticle, updateArticle } from "../src/server/repo";
import type { ArticleCategory, ArticleSource } from "@mammoai/shared";

const WRITE = process.argv.includes("--write");

const SSV: ArticleSource = {
  label: "O'zbekiston Sog'liqni saqlash vazirligi — milliy klinik protokollar",
  url: "https://gov.uz/ru/ssv/pages/milliy-klinik-protokollar",
};
const WHO_CERVICAL: ArticleSource = {
  label: "JSST — bachadon bo'yni saratoni skrininggi bo'yicha qo'llanma",
  url: "https://www.who.int/publications/i/item/9789240030824",
};
const WHO_BREAST: ArticleSource = {
  label: "JSST — ko'krak saratoni bo'yicha ma'lumot",
  url: "https://www.who.int/news-room/fact-sheets/detail/breast-cancer",
};
const WHO_CONTRACEPTION: ArticleSource = {
  label: "JSST — oilani rejalashtirish va kontratseptsiya",
  url: "https://www.who.int/news-room/fact-sheets/detail/family-planning-contraception",
};
const WHO_INFERTILITY: ArticleSource = {
  label: "JSST — bepushtlik",
  url: "https://www.who.int/news-room/fact-sheets/detail/infertility",
};
const WHO_MENOPAUSE: ArticleSource = {
  label: "JSST — klimaks",
  url: "https://www.who.int/news-room/fact-sheets/detail/menopause",
};

interface Draft {
  slug: string;
  category: ArticleCategory;
  title: string;
  excerpt: string;
  body: string;
  sources: ArticleSource[];
}

const ARTICLES: Draft[] = [
  {
    slug: "hayz-sikli-nima-normal",
    category: "cycle",
    title: "Hayz sikli: nima normal, nima emas",
    excerpt: "Sikl uzunligi, qon ketish miqdori va og'riq — qachon xavotirlanish kerak, qachon yo'q.",
    body: `Ko'p ayol "meniki normalmi?" deb o'ylaydi, lekin buni so'rashga tortinadi. Quyida oddiy chegaralar.

**Sikl uzunligi.** Hayz boshlangan birinchi kundan keyingi hayzning birinchi kunigacha bo'lgan muddat. 21 kundan 35 kungacha bo'lsa — normal. Har oy bir xil bo'lishi shart emas: bir necha kunlik farq tabiiy.

**Qon ketish davomiyligi.** Odatda 2 kundan 7 kungacha.

**Qancha qon ketadi.** Buni aniq o'lchash qiyin, shuning uchun amaliy belgi ishlatiladi: agar bir-ikki soatda prokladka yoki tampon to'lib ketaversa, yoki kaftdek kattalikdagi laxtalar chiqsa — bu ko'p hisoblanadi.

**Og'riq.** Yengil-o'rtacha og'riq keng tarqalgan. Lekin og'riq sizni ishdan yoki o'qishdan qoldirsa, oddiy og'riq qoldiruvchi yordam bermasa — bu "chidash kerak" degani emas.

## Qachon shifokorga borish kerak

- hayz 3 oydan ortiq kelmasa (homilador bo'lmasangiz)
- sikl doim 21 kundan qisqa yoki 35 kundan uzun bo'lsa
- hayzlar orasida qonash paydo bo'lsa
- jinsiy aloqadan keyin qonash bo'lsa
- qon ketish yuqorida yozilgan darajada ko'p bo'lsa
- og'riq kundalik hayotingizga xalaqit bersa

## Nega qayd qilib borish muhim

Shifokor birinchi navbatda "sikllaringiz qanday?" deb so'raydi. Xotiradan aytish qiyin — ilovada belgilab borsangiz, aniq javob bera olasiz. Bu ortiqcha tekshiruvlardan ham qutqarishi mumkin.

Ikkinchidan, sizning shaxsiy me'yoringiz boshqa ayolnikidan farq qilishi mumkin. Muhimi — o'zingiz uchun nima odatiy ekanini bilish va o'zgarishni sezish.`,
    sources: [SSV],
  },
  {
    slug: "bachadon-boyni-skriningi",
    category: "checkups",
    title: "Bachadon bo'yni saratoni skrininggi: nima uchun va qanday",
    excerpt: "Oldini olish mumkin bo'lgan saraton. Tekshiruv qanday o'tadi, og'riydimi, qancha vaqt oladi.",
    body: `Bachadon bo'yni saratoni — oldini olish mumkin bo'lgan kam sonli saraton turlaridan biri. Sababi deyarli har doim HPV (odam papillomavirusi) infeksiyasi va u yillar davomida sekin rivojlanadi. Shuning uchun uni **saratonga aylanishidan oldin** topib, davolash mumkin.

## Tekshiruv qanday o'tadi

Ginekolog kreslosida, bir necha daqiqa. Shifokor maxsus asbob (spekulum) yordamida bachadon bo'ynini ko'radi va yumshoq cho'tka bilan bir oz hujayra oladi. Bu namuna laboratoriyaga yuboriladi.

**Og'riydimi?** Odatda yo'q. Ko'pchilik uni noqulay deb ta'riflaydi, og'riqli emas. Bir-ikki soniya davom etadi. Keyin bir kun ichida oz miqdorda qon ko'rinishi mumkin — bu normal.

**Qancha vaqt oladi?** Tekshiruvning o'zi 5 daqiqagacha. Natija odatda bir-ikki hafta ichida tayyor bo'ladi.

## Qachon qilish kerak

O'zbekiston milliy dasturi 35–55 yosh oralig'idagi ayollarni qamrab oladi. Xalqaro tavsiya esa jinsiy hayot boshlangandan keyin 21–25 yoshdan boshlashni aytadi va har 3 yilda takrorlashni tavsiya qiladi (HPV testi bilan birga bo'lsa — har 5 yilda).

Agar siz dastur yoshiga kirmagan bo'lsangiz ham, jinsiy hayot boshlangan bo'lsa — shifokor bilan maslahatlashing.

## Tayyorgarlik

- hayz kunlarida qilinmaydi — siklning o'rtasi qulay
- tekshiruvdan 2 kun oldin jinsiy aloqadan, qin shamchalari va yuvish vositalaridan saqlaning

## Natija nimani anglatadi

Ko'pchilik natija normal chiqadi. "Normal emas" degani "saraton" degani EMAS — aksariyat hollarda bu kuzatuvga yoki kichik muolajaga muhtoj o'zgarish bo'ladi. Shifokor keyingi qadamni tushuntiradi.

## HPV vaksinasi

Vaksina infeksiyaning oldini oladi va eng samarali natija jinsiy hayot boshlanishidan oldin qilinganda bo'ladi. Vaksina olgan bo'lsangiz ham skrining kerak — vaksina barcha turlarni qamramaydi.`,
    sources: [SSV, WHO_CERVICAL],
  },
  {
    slug: "kokrakni-oz-ozini-tekshirish",
    category: "checkups",
    title: "Ko'krakni o'z-o'zini tekshirish: qanday qilinadi",
    excerpt: "Oyiga bir marta, besh daqiqa. Nimaga e'tibor berish kerak va nima normal.",
    body: `Ko'krakni o'zingiz tekshirish tibbiy tekshiruvning o'rnini bosmaydi, lekin u sizga **o'z ko'kragingiz qanday ekanini** o'rgatadi. Shunda o'zgarish bo'lsa, siz birinchi bo'lib sezasiz.

## Qachon

Oyiga bir marta, hayz tugagandan keyin 3–5 kun ichida — bu paytda ko'krak eng yumshoq holatda bo'ladi. Hayz ko'rmaydigan bo'lsangiz, oyning istalgan bir kunini tanlab, har oy o'sha kuni takrorlang.

## Qanday

**Ko'zdan kechiring.** Oyna oldida, qo'llar erkin. Keyin qo'llarni ko'taring. Shaklda, terida yoki so'rg'ichda o'zgarish bormi?

**Paypaslab ko'ring.** Yotgan holatda qulayroq. Barmoqlarning yostiqchalari bilan, aylanma harakatlar qilib, butun ko'krakni va qo'ltiq ostini tekshiring. Bir tomonni tekshirayotganda o'sha tomondagi qo'lni bosh ostiga qo'ying.

## Nimaga e'tibor berish kerak

- yangi paydo bo'lgan, yo'qolmaydigan tugun yoki qattiqlik
- terining chuqurchaga tortishi yoki "apelsin po'sti" ko'rinishi
- so'rg'ichning ichkariga tortilishi yoki shaklining o'zgarishi
- so'rg'ichdan suyuqlik kelishi (ayniqsa qonli)
- qizarish, yallig'lanish yoki yo'qolmaydigan yara
- qo'ltiq ostidagi shish

## Muhim: ko'pchilik tugun xavfli emas

Ko'krak to'qimasi tabiiy ravishda notekis bo'ladi va sikl davomida o'zgaradi. Topilgan tugunlarning katta qismi xavfsiz. Lekin buni **o'zingiz hal qila olmaysiz** — yangi o'zgarish sezsangiz, shifokorga ko'rsating.

Xavotir "bekorga bezovta qilaman" degan o'ydan kuchliroq bo'lsin: erta topilgan ko'krak saratoni davolanish ehtimoli eng yuqori bo'lgan holat.`,
    sources: [WHO_BREAST],
  },
  {
    slug: "mammografiya-nima",
    category: "checkups",
    title: "Mammografiya: kimga, qachon va og'riydimi",
    excerpt: "Rentgen tekshiruvi qanday o'tadi, qancha davom etadi va kimga bepul.",
    body: `Mammografiya — ko'krakning rentgen tekshiruvi. U tugunni qo'l bilan sezish mumkin bo'lgunga qadar, ba'zan bir necha yil oldin topa oladi.

## Qanday o'tadi

Siz turgan holatda bo'lasiz. Ko'krak ikkita plastinka orasiga qo'yilib, bir necha soniyaga siqiladi — rasm aniq chiqishi va nur dozasi kam bo'lishi uchun shu kerak. Har bir ko'krakdan odatda ikkita rasm olinadi.

**Og'riydimi?** Siqilish paytida noqulaylik bo'ladi, ba'zi ayollar og'riq deb ta'riflaydi. U bir necha soniya davom etadi. Hayzdan keyingi hafta ichida qilinsa, ko'krak kamroq sezgir bo'ladi va yengilroq o'tadi.

**Qancha vaqt oladi?** Butun muolaja 15–20 daqiqa, rasm olishning o'zi bir necha daqiqa.

## Kimga va qachon

O'zbekistonda 45 yoshdan boshlab davlat dasturi doirasida bepul mammografiya mavjud. 40–44 yosh oralig'ida esa u odatda pullik bo'ladi.

Agar oilangizda ko'krak yoki tuxumdon saratoni bo'lgan bo'lsa, shifokor tekshiruvni erta boshlashni tavsiya qilishi mumkin — bu shaxsiy qaror va uni shifokor bilan birga qabul qilish kerak.

## Tayyorgarlik

- hayzdan keyingi 7–10 kun qulayroq
- o'sha kuni ko'krak va qo'ltiq ostiga dezodorant, krem yoki upa surtmang — ular rasmda dog' bo'lib chiqishi mumkin
- oldingi mammografiya rasmlaringiz bo'lsa, birga olib boring: taqqoslash muhim

## Natija

Ko'pchilik natija normal chiqadi. Qo'shimcha tekshiruvga chaqirilsangiz, bu "sizda saraton bor" degani emas — ko'p hollarda rasmni aniqlashtirish kerak bo'ladi, xolos.`,
    sources: [SSV, WHO_BREAST],
  },
  {
    slug: "endometrioz-belgilari",
    category: "cycle",
    title: "Endometrioz: og'riqqa chidash shart emas",
    excerpt: "Tashxis o'rtacha 7–8 yil kechikadi, chunki og'riq \"normal\" deb qabul qilinadi.",
    body: `Endometriozda bachadonning ichki qavatiga o'xshash to'qima undan tashqarida — tuxumdonlarda, chanoq devorida, ba'zan ichakda o'sadi. Bu to'qima ham har oy hayz kabi o'zgaradi, lekin chiqib keta olmaydi. Natijada yallig'lanish, chandiq va og'riq paydo bo'ladi.

## Asosiy belgilar

- hayz paytida kuchli og'riq, oddiy og'riq qoldiruvchi yordam bermaydi
- jinsiy aloqada og'riq
- hojat yoki siyish paytida og'riq (ayniqsa hayz kunlarida)
- doimiy charchoq
- homilador bo'lishda qiyinchilik

## Nega tashxis kech qo'yiladi

Chunki og'riq "ayollarning taqdiri" deb qabul qilinadi. Ko'p ayol shifokorga bormaydi, borganda ham "hayz og'riqli bo'ladi-da" degan javobni eshitadi. Tadqiqotlarga ko'ra tashxisgacha o'rtacha 7–8 yil o'tadi.

Shuning uchun bitta narsani aniq bilish kerak: **ishdan yoki o'qishdan qoldiradigan og'riq normal emas.** Bu shikoyat qilish uchun yetarli sabab.

## Nima qilish kerak

Ginekologga murojaat qiling va og'riqni aniq ta'riflang: qachon boshlanadi, qancha davom etadi, nima yordam beradi, nima bermaydi. Ilovada og'riqli kunlarni belgilab borsangiz, bu suhbat ancha aniqroq bo'ladi.

Shifokor chanoq a'zolari UTT'sini buyurishi mumkin. UTT hamma turdagi endometriozni ko'rsatavermaydi — ba'zan tashxis klinik belgilarga qarab qo'yiladi yoki laparoskopiya kerak bo'ladi.

## Davolash bor

Endometrioz surunkali holat, lekin boshqarib bo'ladi: og'riqni nazorat qilish, gormonal davolash, ba'zi hollarda jarrohlik. Maqsad — og'riqsiz yashash va, agar xohlasangiz, homiladorlik imkoniyatini saqlash.`,
    sources: [SSV],
  },
  {
    slug: "pcos-polikistoz",
    category: "cycle",
    title: "PCOS: nomuntazam sikl, tuklanish va vazn",
    excerpt: "Polikistoz tuxumdon sindromi — eng keng tarqalgan gormonal holat. Belgilari va nima qilish kerak.",
    body: `PCOS (polikistoz tuxumdon sindromi) — reproduktiv yoshdagi ayollarda eng ko'p uchraydigan gormonal holatlardan biri. Nomi chalg'ituvchi: bu "kistalar" kasalligi emas, balki gormonal muvozanat buzilishi.

## Belgilari

Uchta asosiy belgidan kamida ikkitasi bo'lsa, PCOS haqida o'ylanadi:

1. **Nomuntazam yoki yo'q sikl** — ovulyatsiya muntazam bo'lmaydi
2. **Androgen (erkaklik gormoni) ortiqchaligi** — yuz va tanada tuklanish, akne, soch to'kilishi
3. **UTT'da tuxumdonlarning o'ziga xos ko'rinishi**

Ko'pincha vazn ortishi, vaznni kamaytirishda qiyinchilik va homilador bo'lolmaslik ham kuzatiladi. Lekin PCOS ozg'in ayollarda ham bo'ladi.

## Nega e'tibor berish kerak

PCOS faqat sikl masalasi emas. U uzoq muddatda 2-turdagi qandli diabet, yuqori bosim va bachadon shilliq qavati muammolari xavfini oshiradi. Shuning uchun uni "shunchaki nomuntazam sikl" deb qoldirib bo'lmaydi.

## Tekshiruv

Shifokor odatda quyidagilarni buyuradi: gormonlar uchun qon tahlili, qandning darajasi va chanoq a'zolari UTT'si. Qalqonsimon bez va prolaktin ham tekshiriladi, chunki ular shunga o'xshash belgilar berishi mumkin.

## Nima yordam beradi

- **Vazn.** Ortiqcha vaznning 5–10% kamayishi ham ovulyatsiyani tiklashi mumkin — bu eng ta'sirchan qadamlardan biri.
- **Harakat va ovqatlanish.** Qand darajasini barqaror ushlash markazida.
- **Dorilar.** Gormonal kontratseptiv sikli va terini boshqarish uchun; homiladorlikni rejalashtirayotganlar uchun boshqa vositalar.

PCOS "davolanmaydi", lekin **boshqariladi**. Ko'p ayol to'g'ri yondashuv bilan muntazam sikl va homiladorlikka erishadi.`,
    sources: [SSV],
  },
  {
    slug: "kontratseptsiya-usullari",
    category: "cycle",
    title: "Kontratseptsiya: qaysi usul kimga to'g'ri keladi",
    excerpt: "Universal usul yo'q. Tanlov yoshga, sog'liqqa va rejalaringizga bog'liq.",
    body: `Himoya usulini tanlashda "eng yaxshisi" degan savol noto'g'ri — to'g'ri savol "menga qaysi biri mos keladi?".

## Asosiy turlar

**Gormonal tabletkalar.** Har kuni bir vaqtda ichiladi. To'g'ri ishlatilganda samaradorligi yuqori, lekin unutib qo'yish samarani keskin kamaytiradi. Sikl og'rig'i va akne uchun ham foyda berishi mumkin.

**Spiral (VMS).** Bachadonga qo'yiladi va 3–10 yil ishlaydi. Har kuni esda tutish shart emas — shuning uchun amaliy samaradorligi eng yuqorilaridan. Gormonli va gormonsiz (mis) turlari bor.

**Prezervativ.** Yagona usul bo'lib, u bir vaqtning o'zida **jinsiy yo'l bilan yuqadigan infeksiyalardan ham himoya qiladi**. Boshqa hech qaysi usul buni qilmaydi.

**Implant va ukol.** Uzoq muddatli, har kuni esda tutish talab qilmaydi.

**Shoshilinch kontratseptsiya.** Himoyasiz aloqadan keyin ishlatiladi. Qanchalik tez qabul qilinsa, shunchalik samarali — 72 soat ichida. Bu doimiy usul emas.

## Tanlashda nimani hisobga olish kerak

- yaqin yillarda farzand rejalashtiryapsizmi
- chekasizmi (35 yoshdan keyin chekish + gormonal tabletka xavfli birikma)
- bosimingiz, migren, qon ivishi bilan bog'liq muammolar bo'lganmi
- har kuni bir vaqtda dori ichishni eslay olasizmi

## Qachon darhol shifokorga

Gormonal tabletka fonida quyidagilar paydo bo'lsa:

- kuchli, odatdagidan boshqacha bosh og'rig'i
- oyoqda shish, og'riq yoki qizarish
- nafas qisishi yoki ko'krakda og'riq

Bular kam uchraydi, lekin jiddiy. Kutmang.

## Muhim

Noto'g'ri tanlangan usul siklni buzadi va ayolni "menga hech narsa to'g'ri kelmaydi" degan xulosaga olib keladi. Aslida bu shunchaki boshqa usulni sinash kerakligini bildiradi — ginekolog bilan maslahatlashing.`,
    sources: [WHO_CONTRACEPTION, SSV],
  },
  {
    slug: "homiladorlikka-tayyorgarlik",
    category: "pregnancy",
    title: "Homiladorlikka tayyorgarlik: uch oy oldin boshlanadi",
    excerpt: "Folat kislotasi, tekshiruvlar va nimalarni oldindan hal qilish kerak.",
    body: `Homiladorlikka tayyorgarlik homilador bo'lgandan keyin emas, undan **kamida uch oy oldin** boshlanadi. Sababi oddiy: homilaning eng muhim a'zolari siz homiladorligingizni bilgunga qadar shakllana boshlaydi.

## Folat kislotasi

Homiladorlikdan kamida 1–3 oy oldin boshlanadi va birinchi trimestr davomida davom etadi. U homilaning nerv naychasi nuqsonlari xavfini sezilarli kamaytiradi. Bu eng arzon va eng isbotlangan qadamlardan biri.

Dozani shifokor belgilaydi — ba'zi holatlarda (diabet, oldingi homiladorlikda muammo bo'lgan bo'lsa) yuqoriroq doza kerak bo'ladi.

## Oldindan tekshirilishi kerak bo'lgan narsalar

- **Qizilcha (rubella) immuniteti.** Homiladorlik paytida qizilcha jiddiy asoratlar beradi, vaksina esa homiladorlik paytida qilinmaydi. Shuning uchun oldindan tekshiriladi.
- **Qalqonsimon bez.** Uning faoliyati homila rivojlanishiga ta'sir qiladi.
- **Kamqonlik (temir darajasi).**
- **Jinsiy yo'l bilan yuqadigan infeksiyalar.**
- **Surunkali kasalliklar** — diabet, bosim: ular homiladorlikdan OLDIN barqarorlashtirilishi kerak, chunki ba'zi dorilar almashtirilishi lozim.

## Turmush tarzi

- chekishni tashlash (ikkala sherik uchun ham)
- spirtli ichimlikni to'xtatish
- vaznni me'yorga yaqinlashtirish — ortiqcha va kam vazn ikkalasi ham homiladorlikni qiyinlashtiradi
- ichayotgan dorilaringizni shifokorga ko'rsatish

## Qachon yordam so'rash kerak

Bir yil davomida muntazam va himoyasiz jinsiy hayotda homiladorlik bo'lmasa — tekshirilish vaqti. **35 yoshdan katta bo'lsangiz, olti oydan keyin.**

Sabablarning taxminan yarmi erkak tarafida bo'ladi, shuning uchun juftlik birga tekshiriladi. Bu muhim: faqat ayolni tekshirish vaqtni behuda sarflaydi.`,
    sources: [SSV, WHO_INFERTILITY],
  },
  {
    slug: "klimaks-nima-kutish",
    category: "cycle",
    title: "Klimaks: nima kutish kerak va nima yordam beradi",
    excerpt: "Issiqlik to'lqinlari, uyqu va kayfiyat. Qachon bu me'yor, qachon shifokorga.",
    body: `Klimaks — kasallik emas, hayotning tabiiy bosqichi. Lekin uning belgilari ba'zan kundalik hayotga jiddiy xalaqit beradi va bunda yordam bor.

## Qachon boshlanadi

Ko'pchilikda 45–55 yosh oralig'ida. Undan oldin bir necha yil davom etadigan **perimenopauza** bosqichi bo'ladi — sikl nomuntazam bo'lib qoladi, lekin butunlay to'xtamaydi.

Hayz 12 oy davomida umuman kelmasa, klimaks boshlangan hisoblanadi.

## Keng tarqalgan belgilar

- issiqlik to'lqinlari va tunda terlash
- uyqu buzilishi
- kayfiyat o'zgarishi, asabiylashish
- qin qurushi, jinsiy aloqada noqulaylik
- diqqatni jamlashda qiyinchilik

Bularning hammasi estrogen darajasining pasayishi bilan bog'liq.

## Nima yordam beradi

- **Turmush tarzi.** Muntazam harakat, uyqu tartibi, kofein va spirtli ichimlikni kamaytirish — issiqlik to'lqinlarini yumshatadi.
- **Qin qurushi uchun** maxsus mahalliy vositalar bor va ular yaxshi ishlaydi. Bu haqda gapirishga tortinmaslik kerak.
- **Gormonal terapiya.** Ba'zi ayollar uchun eng samarali yechim. U hammaga to'g'ri kelavermaydi va shifokor bilan birga, shaxsiy xavf-foyda tarozisida hal qilinadi.

## Klimaksdan keyin e'tibor talab qiladigan narsalar

Estrogen pasaygach, **suyak zichligi** va **yurak-qon tomir** xavfi o'zgaradi. Shuning uchun bu yoshda muntazam tekshiruvlar ayniqsa muhim.

## Qachon darhol shifokorga

**Klimaksdan keyin har qanday qonash — har doim tekshiriladi.** Bu eng muhim qoida. Ko'pincha sabab xavfsiz bo'ladi, lekin buni faqat tekshiruv aytadi.

Shuningdek: 45 yoshgacha hayz to'xtasa (erta klimaks) — bu alohida e'tibor talab qiladi, chunki uzoq muddatli ta'sirlari bor.`,
    sources: [WHO_MENOPAUSE, SSV],
  },
  {
    slug: "ginekolog-korigiga-tayyorgarlik",
    category: "checkups",
    title: "Ginekolog ko'rigi: tayyorgarlik va nima so'rash kerak",
    excerpt: "Birinchi marta boryapsizmi yoki tortinasizmi — nima bo'lishini oldindan bilish yengillashtiradi.",
    body: `Ko'p ayol ginekologga borishni kechiktiradi — bilmaganidan, tortinganidan yoki "hech narsa bezovta qilmayapti" deb. Quyida nima bo'lishini oldindan bilib qo'yish uchun.

## Qachon borish kerak

- yiliga bir marta profilaktik ko'rik uchun (hech narsa bezovta qilmasa ham)
- jinsiy hayot boshlangandan keyin
- sikl bilan bog'liq o'zgarish, og'riq yoki ajralma bo'lsa
- homiladorlikni rejalashtirayotgan bo'lsangiz

## Tayyorgarlik

- **Hayz kunlarida bormang** — sikl o'rtasi qulayroq (shoshilinch holatlar bundan mustasno)
- Bir kun oldin jinsiy aloqadan, qin shamchalari va yuvish vositalaridan saqlaning
- Oddiy gigiyena yetarli — ichkarini yuvish (dushirovka) SHART EMAS va u tekshiruv natijasini buzishi mumkin
- Yechinish oson bo'lgan kiyim qulayroq

## Nima bo'ladi

Suhbat bilan boshlanadi: oxirgi hayz sanasi, sikl uzunligi, shikoyatlar, ichayotgan dorilar. **Ilovadagi yozuvlaringizni ko'rsatsangiz, bu qism ancha aniq bo'ladi.**

Keyin ko'rik: spekulum yordamida bachadon bo'yni ko'riladi, kerak bo'lsa surtma olinadi. Ba'zan qo'l bilan paypaslab tekshirish va UTT qilinadi.

**Og'riydimi?** Odatda yo'q — noqulaylik bo'ladi. Og'riq sezsangiz, shifokorga darhol ayting: bu muhim ma'lumot, chidash kerak emas.

## Nima so'rash kerak

Savollaringizni oldindan yozib qo'ying — kabinetda esdan chiqadi:

- Menga qaysi tekshiruvlar kerak va nega?
- Natijani qachon va qanday olaman?
- Menda topilgan narsa nimani anglatadi?
- Keyingi ko'rikka qachon kelishim kerak?

## Tortinish haqida

Tortinish tabiiy va siz yolg'iz emassiz. Lekin shuni bilib qo'ying: shifokor uchun bu kundalik ish va u sizni baholamaydi. Ayol shifokor so'rasangiz ham bo'ladi.

Eng muhimi — kechiktirilgan ko'rik topilishi mumkin bo'lgan narsani kechroq topishga olib keladi.`,
    sources: [SSV],
  },
];

async function main() {
  await ensureSchema();
  console.log(WRITE ? "YOZISH rejimi\n" : "QURUQ KO'RISH — hech narsa yozilmaydi (--write bilan yoziladi)\n");

  let created = 0;
  let updated = 0;
  for (const draft of ARTICLES) {
    const existing = (await sql`SELECT id FROM articles WHERE slug = ${draft.slug}`) as unknown as { id: string }[];
    const words = draft.body.trim().split(/\s+/).length;
    console.log(`${existing.length ? "yangilanadi" : "qo'shiladi  "}  ${draft.slug.padEnd(34)} ${String(words).padStart(4)} so'z`);
    if (!WRITE) continue;

    if (existing.length) {
      await updateArticle(existing[0].id, {
        category: draft.category,
        title: draft.title,
        excerpt: draft.excerpt,
        body: draft.body,
        sources: draft.sources,
        // Shifokor ko'rigidan o'tmagan — ilovada shu ochiq aytiladi.
        isSeedData: true,
        authorName: null,
        authorCredential: null,
      });
      updated++;
    } else {
      await createArticle({
        slug: draft.slug,
        category: draft.category,
        title: draft.title,
        excerpt: draft.excerpt,
        body: draft.body,
        sources: draft.sources,
        authorName: null,
        authorCredential: null,
        isSeedData: true,
      });
      created++;
    }
  }

  const total = ARTICLES.reduce((sum, a) => sum + a.body.trim().split(/\s+/).length, 0);
  console.log(`\nJami ${ARTICLES.length} ta maqola, ${total} so'z (o'rtacha ${Math.round(total / ARTICLES.length)}).`);
  if (WRITE) console.log(`Qo'shildi: ${created}, yangilandi: ${updated}`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Maqolalarni yozishda xatolik:", error);
  process.exit(1);
});
