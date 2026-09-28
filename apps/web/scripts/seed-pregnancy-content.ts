// CONTENT-001 / CONTENT-04 — homiladorlikning 42 haftasi uchun kontent.
//
// CONTENT-04 (qayta yozildi): avvalgi matnlar har hafta uchun BITTA
// jumla edi (o'rtacha 90 belgi). "Batafsil" ekrani ochilganda ayol
// ikkita yarim qator ko'rardi va boshqa hech narsa — Lalu va Flo'da
// esa bu joyda to'liq xatboshi turadi. Endi har hafta chaqaloq va ona
// uchun alohida, amaliy maslahati bilan yoziladi (o'rtacha ~250 belgi).
//
// Matn umumiy ma'lumot uchun — tashxis yoki shaxsiy tibbiy maslahat
// EMAS. Shifokor ko'rib chiqqach, admin panelda tasdiqlanadi.
//
// Ishga tushirish:
//   npm run seed:pregnancy-content --workspace=apps/web          (ko'rish)
//   npm run seed:pregnancy-content --workspace=apps/web -- --write (yozish)

import { ensureSchema } from "../src/server/db";
import { upsertPregnancyWeekContent } from "../src/server/repo";

const WRITE = process.argv.includes("--write");

interface WeekSeed {
  week: number;
  sizeLabel: string;
  babyDevelopment: string;
  motherChanges: string;
}

export const WEEKS: WeekSeed[] = [
  { week: 1, sizeLabel: "hali otalanmagan", babyDevelopment: "Hisob oxirgi hayzning birinchi kunidan yuritiladi, shuning uchun bu haftada homila hali yo'q. Tanangiz tuxum hujayrani yetiltirishga kirishadi va bachadon shilliq qavati yangilanadi.", motherChanges: "Bu haftada hayz ketadi. Homiladorlikni rejalashtirayotgan bo'lsangiz, folat kislotasini (kuniga 400 mkg) shu paytdan boshlang: asab naychasi siz homiladorlikni bilishingizdan oldin yopiladi. Chekish va alkogoldan voz kechish ham shu bosqichda muhim." },
  { week: 2, sizeLabel: "moshdona urug'i", babyDevelopment: "Tuxumdonda follikula yetiladi va hafta oxirida ovulyatsiya bo'ladi. Urug'lanish hali sodir bo'lmagan, lekin unumdor kunlar aynan shu davrga to'g'ri keladi.", motherChanges: "Ajralmalar suyuqroq va tiniqroq bo'lishi, ovulyatsiyadan keyin bazal harorat biroz ko'tarilishi mumkin. Ba'zilar tuxumdon sohasida yengil sanchiqni sezadi." },
  { week: 3, sizeLabel: "qum zarrachasi", babyDevelopment: "Urug'lanish sodir bo'ladi. Bo'linayotgan hujayralar to'plami bachadon nayidan bachadonga qarab harakatlanadi va hafta oxirida devorga o'rnasha boshlaydi.", motherChanges: "Ko'pchilik hali hech narsa sezmaydi. Ba'zi ayollarda o'rnashish paytida bir-ikki tomchi qon yoki yengil tortishuv bo'ladi — bu hayzdan ancha kam va qisqa." },
  { week: 4, sizeLabel: "moshdona", babyDevelopment: "Embrion bachadon devoriga to'liq o'rnashadi. Yo'ldosh va homila pufagining asosi qo'yiladi; hujayralar uch qavatga ajraladi — asab tizimi, ichki organlar va suyak-mushak tizimi shu qavatlardan rivojlanadi.", motherChanges: "Hayz kechikadi va test ijobiy chiqishi mumkin. Ko'krak sezuvchan bo'ladi, charchoq va kayfiyat o'zgarishi paydo bo'ladi. Shu paytdan boshlab har qanday dorini faqat shifokor bilan kelishib iching." },
  { week: 5, sizeLabel: "kunjut urug'i", babyDevelopment: "Yurak naychasi urishni boshlaydi va asab naychasi yopiladi — bu miya va orqa miyaning asosi. Homila taxminan 2 mm, lekin eng muhim organlar aynan shu haftalarda quriladi.", motherChanges: "Ko'ngil aynishi, hidlarga sezgirlik va charchoq kuchayadi. Birinchi qabulga yozilish uchun yaxshi payt: hisobga turish 12-haftagacha tavsiya etiladi." },
  { week: 6, sizeLabel: "no'xat donasi", babyDevelopment: "Yurak urishi UTTda ko'rinishi mumkin. Qo'l va oyoq kurtaklari, ko'z hamda quloqning dastlabki tuzilmalari paydo bo'ladi.", motherChanges: "Ertalabki ko'ngil aynishi cho'qqisiga yaqinlashadi. Kam-kam, tez-tez ovqatlaning; o'rindan turishdan oldin quruq non yoki bir necha dona yong'oq yeyish ba'zilarga yordam beradi." },
  { week: 7, sizeLabel: "ko'k moviz", babyDevelopment: "Miya juda tez o'sadi, asab hujayralari daqiqasiga minglab ko'payadi. Barmoq kurtaklari va burun teshiklari ko'rina boshlaydi.", motherChanges: "Tez-tez siyish va charchoq odatiy holga aylanadi. Suyuqlikni yetarli iching: suvsizlanish ko'ngil aynishini kuchaytiradi." },
  { week: 8, sizeLabel: "malina", babyDevelopment: "Barmoqlar ajrala boshlaydi, asosiy organlarning hammasi o'z o'rnida. Homila taxminan 1,5 sm va allaqachon harakatlanadi — bu harakatlar hali sezilmaydi.", motherChanges: "Bachadon kattalashib, bel va qorinda yengil tortishuv berishi mumkin. Ko'krak o'lchami o'zgaradi, qulay ich kiyim kerak bo'ladi." },
  { week: 9, sizeLabel: "uzum", babyDevelopment: "Endi u embrion emas, homila deb ataladi. Qo'l va oyoqlar bukiladi, ko'z qovoqlari shakllanadi, yurak to'rt bo'lmaga ajraladi.", motherChanges: "Gormon darajasi eng yuqori nuqtaga chiqadi: kayfiyat o'zgarishi va yig'loqilik ko'pincha shu davrga to'g'ri keladi. Bu vaqtinchalik." },
  { week: 10, sizeLabel: "kivi", babyDevelopment: "Barcha hayotiy organlar shakllangan — endi ular o'sib, yetilib boradi. Tirnoq kurtaklari paydo bo'ladi, bo'g'imlar bukiladi.", motherChanges: "Birinchi skrining (11–13 hafta) uchun yozilish payti. Ko'ngil aynishi ko'pchilikda shu hafta atrofida eng kuchli bo'lib, so'ng yengillashadi." },
  { week: 11, sizeLabel: "anjir", babyDevelopment: "Homila tanasi tikkalashadi, bosh hali nisbatan katta. Suyaklar qattiqlasha boshlaydi, sut tishlarining kurtaklari paydo bo'ladi.", motherChanges: "Birinchi skrining UTTsi va qon tahlili shu haftadan boshlanadi: bo'yin burmasi (NT) o'lchanadi. Skrining tashxis emas — u faqat ehtimolni baholaydi." },
  { week: 12, sizeLabel: "limon", babyDevelopment: "Homila yutinadi, barmoqlarini siqadi, hiqichoq tutishi mumkin. Buyraklar siydik ishlab chiqara boshlaydi.", motherChanges: "Birinchi trimestr yakunlanmoqda: ko'ngil aynishi ko'pchilikda kamayadi, tushish xavfi sezilarli pasayadi. Bachadon qov suyagidan yuqoriga ko'tariladi." },
  { week: 13, sizeLabel: "shaftoli", babyDevelopment: "Ovoz paychalari va jinsiy a'zolar shakllanadi. Teri hali yupqa va shaffof, qon tomirlari ko'rinib turadi.", motherChanges: "Energiya qaytadi — ko'pchilik ikkinchi trimestrni eng qulay davr deb ataydi. Vazn asta-sekin qo'shila boshlaydi." },
  { week: 14, sizeLabel: "apelsin", babyDevelopment: "Yuz mushaklari ishlaydi: homila qovog'ini uyadi, lablarini cho'chchaytiradi. Bo'yin uzayib, bosh tanadan aniq ajraladi.", motherChanges: "Qorin ko'rina boshlaydi. Bel ostida tortishuv (yumaloq boylam og'rig'i) paydo bo'lishi mumkin — bu bachadonni ushlab turuvchi boylamlarning cho'zilishi." },
  { week: 15, sizeLabel: "olma", babyDevelopment: "Homila yorug'likni sezadi va tovushlarga javob bera boshlaydi. Suyaklar mustahkamlanadi, teri ustini mayin tuklar (lanugo) qoplaydi.", motherChanges: "Burun bitishi va milk qonashi ko'p uchraydi — bu qon aylanishining ko'payishi bilan bog'liq. Yumshoq tish cho'tkasidan foydalaning." },
  { week: 16, sizeLabel: "avokado", babyDevelopment: "Mushaklar kuchayadi, homila faol harakatlanadi. Ba'zi ayollar ilk harakatlarni shu haftalarda sezadi; birinchi homiladorlikda bu odatda kechroq bo'ladi.", motherChanges: "Ikkinchi skrining (16–18 hafta) uchun payt. Qorin yaqqol ko'rinadi, qulay kiyim va poyabzal kerak bo'ladi." },
  { week: 17, sizeLabel: "nok", babyDevelopment: "Teri ostida yog' to'plana boshlaydi — u tug'ilgandan keyin issiqlikni saqlashga yordam beradi. Eshitish tizimi rivojlanmoqda.", motherChanges: "Ishtaha ochiladi. Vazn bir tekis qo'shilgani yaxshi: keskin sakrash ham, butunlay to'xtab qolish ham shifokor bilan gaplashish uchun sabab." },
  { week: 18, sizeLabel: "bolgar qalampiri", babyDevelopment: "Homila ovozlarni eshitadi: yurak urishi, ichak tovushlari va sizning ovozingizni. Quloqlar o'z joyiga joylashgan.", motherChanges: "Ko'pchilik shu haftalarda harakatlarni aniq sezadi. Chalqancha yotganda bosh aylansa, yon tomonga o'giriling — bachadon yirik venani bosadi." },
  { week: 19, sizeLabel: "pomidor", babyDevelopment: "Terini vernix — moysimon himoya qatlami qoplaydi. Miyada sezgi markazlari shakllanmoqda.", motherChanges: "Qorin va ko'krak terisi cho'zilib qichishishi mumkin, namlovchi krem yordam beradi. Kaft va tovonning qattiq qichishishi esa alohida belgi: shifokorga ayting." },
  { week: 20, sizeLabel: "banan", babyDevelopment: "Homiladorlikning yarmi. Batafsil UTT shu davrda o'tkaziladi: organlar, yo'ldosh joylashuvi va suv miqdori tekshiriladi.", motherChanges: "Harakatlar muntazamroq bo'ladi. Bachadon tubi kindik darajasiga chiqadi; bel og'rig'i paydo bo'lsa, qaddi-qomat va poyabzalga e'tibor bering." },
  { week: 21, sizeLabel: "sabzi", babyDevelopment: "Homila amniotik suyuqlikni yutadi va ta'mni farqlay boshlaydi — siz yegan taomning ta'mi suyuqlikka o'tadi.", motherChanges: "Oyoqda tomirlar kengayishi va shish paydo bo'lishi mumkin. Uzoq tik turishdan saqlaning, oyoqni baland qo'yib dam oling." },
  { week: 22, sizeLabel: "bodring", babyDevelopment: "Qosh va kipriklar shakllangan. Homila o'z yuzini va kindik tanasini paypaslaydi, vazni taxminan 430 g.", motherChanges: "Braxton-Hiks qisqarishlari boshlanishi mumkin: ular og'riqsiz, notekis va o'tib ketadi. Muntazam va og'riqli bo'lsa — shifokorga murojaat qiling." },
  { week: 23, sizeLabel: "baqlajon", babyDevelopment: "O'pkada surfaktant ishlab chiqarila boshlaydi — bu modda mustaqil nafas olish uchun zarur. Teri hali burushgan, yog' qatlami yupqa.", motherChanges: "Vazn tezroq qo'shiladi. Gestatsion diabet skriningi (24–28 hafta) yaqinlashmoqda, qabulga yozilib qo'ying." },
  { week: 24, sizeLabel: "makkajo'xori", babyDevelopment: "Homila hayotchanlik chegarasiga yetadi: shu muddatdan keyin tug'ilgan chaqaloq zamonaviy yordam bilan omon qolishi mumkin. Ichki quloq to'liq ishlaydi, muvozanat sezgisi paydo bo'ladi.", motherChanges: "Gestatsion diabetga tekshiruv shu davrda tavsiya etiladi. Qorin terisida chiziqlar (striyalar) paydo bo'lishi mumkin — bu teri tuzilishiga bog'liq." },
  { week: 25, sizeLabel: "gulkaram boshi", babyDevelopment: "Teri tekislanadi, yog' qatlami qalinlashadi. Qo'l panjalari to'liq ishlaydi, homila musht tugadi.", motherChanges: "Ko'krakdan ilk suyuqlik (og'iz suti) chiqishi mumkin. Uyqu buzilsa, yon tomonda, tizza orasiga yostiq qo'yib yotish qulayroq." },
  { week: 26, sizeLabel: "karam boshi", babyDevelopment: "Ko'zlar ochiladi va yorug'likka javob beradi. Miya to'lqinlari eshitish hamda ko'rishga reaksiya ko'rsata boshlaydi.", motherChanges: "Nafas qisilishi kuchayishi mumkin — bachadon diafragmaga bosim beradi. Tez-tez, kichik nafas olib dam oling." },
  { week: 27, sizeLabel: "gul karam", babyDevelopment: "Uchinchi trimestr boshlanadi. Homila uyqu va uyg'oqlik sikliga ega, hiqichoq tutadi — siz buni bir maromdagi sekin turtkilar sifatida sezasiz.", motherChanges: "Tekshiruvlar tez-tezlashadi. Oyoq tirishishi va bel og'rig'i ko'p uchraydi: kaltsiy va magniyga boy ovqat hamda yengil cho'zilish mashqlari yordam beradi." },
  { week: 28, sizeLabel: "katta baqlajon", babyDevelopment: "Ko'z pilklari shakllangan, homila ko'zini pirpiratadi. Vazni taxminan 1 kg va hozirdan boshlab u tez o'sadi.", motherChanges: "Harakatlarni har kuni sanash tavsiya etiladi. Qoningiz Rh-manfiy bo'lsa, shu davrda anti-D immunoglobulin qilinadi — shifokordan so'rang." },
  { week: 29, sizeLabel: "kichik qovoq", babyDevelopment: "Suyaklar mustahkamlanadi va kaltsiyga ehtiyoj ortadi. Homila tana haroratini o'zi ushlab tura boshlaydi.", motherChanges: "Qabziyat va jig'ildon qaynashi kuchayishi mumkin: kichik porsiyalarda ovqatlaning va ovqatdan keyin darrov yotmang." },
  { week: 30, sizeLabel: "katta karam", babyDevelopment: "Miya burmalari chuqurlashadi, ko'rish qobiliyati rivojlanadi. Amniotik suyuqlik miqdori eng yuqori darajaga yaqin.", motherChanges: "Charchoq qaytadi. Dekret ta'tili va tug'ruqxona tanlovi haqida o'ylash payti; tug'ruqxona sumkasini yig'a boshlang." },
  { week: 31, sizeLabel: "kokos yong'og'i", babyDevelopment: "Beshala sezgi ham ishlaydi. Homila tanish ovozlarni farqlaydi va ularga tinchlanish bilan javob berishi mumkin.", motherChanges: "Braxton-Hiks qisqarishlari tez-tezlashadi. Nafas mashqlari va tug'ruqqa tayyorgarlik kurslari shu davrda foydali." },
  { week: 32, sizeLabel: "ananas", babyDevelopment: "Homila odatda bosh bilan pastga o'giriladi. Tirnoqlar barmoq uchiga yetadi, lanugo asta to'kila boshlaydi.", motherChanges: "Uchinchi skrining UTT (32–34 hafta) o'tkaziladi: homilaning o'sishi, yo'ldosh holati va suv miqdori baholanadi." },
  { week: 33, sizeLabel: "katta ananas", babyDevelopment: "Bosh suyagi hali yumshoq va harakatchan — bu tug'ruq kanalidan o'tish uchun kerak. Onadan himoya antitanalari o'tadi.", motherChanges: "Qovurg'a ostida bosim va nafas qisilishi kuchayishi mumkin. Tug'ruq belgilari va tug'ruqxonaga qachon borish haqida shifokor bilan oldindan kelishib oling." },
  { week: 34, sizeLabel: "qovun", babyDevelopment: "O'pkalar deyarli yetilgan, teri ostidagi yog' qalinlashadi — teri silliqlashib, pushti tus oladi.", motherChanges: "Sumka tayyor bo'lsin: tug'ruqning taxminan 10 foizi 37-haftagacha boshlanadi. Shish va qon bosimini kuzatib boring." },
  { week: 35, sizeLabel: "katta qovun", babyDevelopment: "Buyrak va jigar to'liq ishlaydi. Homilaga joy torayadi: harakatlar kuchli, lekin kengroq emas — ularning SONI kamaymasligi kerak.", motherChanges: "B guruh streptokokk (GBS) tahlili odatda 35–37 haftada olinadi. Bosh pastga tushgani uchun tez-tez siyish qaytadi." },
  { week: 36, sizeLabel: "romaine salat", babyDevelopment: "Bosh chanoqqa joylasha boshlaydi. Vazn haftasiga taxminan 200 g qo'shiladi.", motherChanges: "Tashriflar haftalik bo'ladi. Qorin pastga tushsa nafas olish yengillashadi, lekin siydik pufagiga bosim ortadi." },
  { week: 37, sizeLabel: "pichan (leek)", babyDevelopment: "\"Erta to'liq muddat\" boshlanadi: organlar tayyor, homila asosan vazn yig'adi.", motherChanges: "Tug'ruq belgilarini biling: muntazam kuchayib boruvchi qisqarishlar, suv ketishi, shilliq tiqinning chiqishi. Har qanday qon ketishida darhol murojaat qiling." },
  { week: 38, sizeLabel: "kichik qovun", babyDevelopment: "Bosh sochlari 3–5 sm bo'lishi mumkin. Ichakda birinchi axlat — mekoniy to'planadi.", motherChanges: "Kutish charchatadi va bu normal. Kuniga bir necha marta harakatlarni sanash ko'pchilikni tinchlantiradi." },
  { week: 39, sizeLabel: "kichik tarvuz", babyDevelopment: "To'liq muddat. O'pkalar oxirgi surfaktant zaxirasini to'playdi, teri silliq va yog' qatlami yetarli.", motherChanges: "Hujjatlar va sumka eshik oldida tursin. Qisqarishlar besh daqiqada bir, bir daqiqadan, bir soat davom etsa — tug'ruqxonaga boring." },
  { week: 40, sizeLabel: "tarvuz", babyDevelopment: "Kutilgan sana. Chaqaloqlarning atigi 5 foizi aynan shu kuni tug'iladi, shuning uchun bir hafta oldin yoki keyin tug'ilish ham me'yor.", motherChanges: "Shifokor homila holatini va suv miqdorini kuzatadi. Harakatlar kamaysa — kutmang, darhol murojaat qiling." },
  { week: 41, sizeLabel: "katta tarvuz", babyDevelopment: "Homila o'sishda davom etadi, tirnoqlar uzayadi. Yo'ldosh ishi sekinlashishi mumkin, shuning uchun kuzatuv zarur.", motherChanges: "Kuzatuv tez-tezlashadi (KTG, UTT). Shifokor tug'ruqni sun'iy chaqirish haqida gaplashishi mumkin." },
  { week: 42, sizeLabel: "katta tarvuz", babyDevelopment: "Muddatdan keyingi homiladorlik. Yo'ldosh holati va suv miqdori diqqat bilan kuzatiladi.", motherChanges: "Bu bosqichda odatda tug'ruqni chaqirish tavsiya etiladi. Kuzatuvni kechiktirmang va shifokoringiz bilan doimiy aloqada bo'ling." },
];

async function main() {
  await ensureSchema();
  if (!WRITE) {
    // Bazaga yozish PRODUCTION ma'lumotiga tegadi, shuning uchun
    // standart holatda faqat ko'rsatiladi. Yozish uchun --write kerak.
    for (const w of WEEKS) {
      console.log(`${w.week}-hafta (${w.sizeLabel}): ${w.babyDevelopment.length}+${w.motherChanges.length} belgi`);
    }
    const avg = Math.round(WEEKS.reduce((s, w) => s + w.babyDevelopment.length + w.motherChanges.length, 0) / WEEKS.length);
    console.log(`\n${WEEKS.length} ta hafta tayyor, o'rtacha ${avg} belgi. Yozish uchun: -- --write`);
    process.exit(0);
  }
  for (const w of WEEKS) {
    await upsertPregnancyWeekContent(w.week, { sizeLabel: w.sizeLabel, babyDevelopment: w.babyDevelopment, motherChanges: w.motherChanges });
    console.log(`\u2713 ${w.week}-hafta yozildi`);
  }
  console.log(`\n${WEEKS.length} ta hafta muvaffaqiyatli yozildi.`);
  process.exit(0);
}

// To'g'ridan-to'g'ri `tsx` bilan ishga tushirilgandagina avtomatik ishlaydi —
// boshqa skript `WEEKS`ni import qilsa, qayta ishga tushib ketmasligi uchun.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Xatolik:", error);
    process.exit(1);
  });
}
