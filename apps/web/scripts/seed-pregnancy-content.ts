// CONTENT-001 — homiladorlikning 42 haftasi uchun boshlang'ich kontent.
// `articles`/`clinics` kabi bu ham keyinchalik to'liq admin panel orqali
// (/admin/pregnancy-content) tahrirlanadi — bu skript faqat bo'sh jadvalni
// boshlang'ich, umumiy va tibbiy jihatdan ehtiyotkor matn bilan to'ldiradi.
// Matn umumiy ma'lumot uchun — tashxis yoki shaxsiy tibbiy maslahat EMAS.
//
// Ishga tushirish: npm run seed:pregnancy-content --workspace=apps/web

import { ensureSchema } from "../src/server/db";
import { upsertPregnancyWeekContent } from "../src/server/repo";

interface WeekSeed {
  week: number;
  sizeLabel: string;
  babyDevelopment: string;
  motherChanges: string;
}

const WEEKS: WeekSeed[] = [
  { week: 1, sizeLabel: "hali otalanmagan", babyDevelopment: "Homiladorlik sanasi an'anaviy ravishda oxirgi hayzning birinchi kunidan hisoblanadi — bu haftada urug'lantirish hali sodir bo'lmagan.", motherChanges: "Tana odatdagidek — hali homiladorlikka xos hech qanday belgi kutilmaydi." },
  { week: 2, sizeLabel: "moshdona urug'i", babyDevelopment: "Ovulyatsiya shu hafta atrofida sodir bo'ladi — tuxum hujayra urug'lantirishga tayyorlanmoqda.", motherChanges: "Ba'zilar shu davrda unumdorlik belgilarini (masalan shilliq qavat o'zgarishi) sezishi mumkin." },
  { week: 3, sizeLabel: "qum zarrachasi", babyDevelopment: "Urug'lantirish sodir bo'ladi va zigota bachadon nayidan bachadon tomon harakatlana boshlaydi, hujayralar bo'linishda davom etadi.", motherChanges: "Bu bosqichda homiladorlikning tashqi belgilari deyarli sezilmaydi." },
  { week: 4, sizeLabel: "moshdona", babyDevelopment: "Embrion bachadon devoriga implantatsiya qiladi — bu keyinchalik yo'ldosh va amniotik pufakchaga aylanadigan tuzilmalar shakllana boshlaydi.", motherChanges: "Ba'zi ayollar implantatsiya bilan bog'liq yengil tomchilashni yoki charchoqni sezishi mumkin." },
  { week: 5, sizeLabel: "kunjut urug'i", babyDevelopment: "Yurak, miya va orqa miyaning dastlabki asoslari shakllana boshlaydi — bu davr organ rivojlanishi uchun juda muhim.", motherChanges: "Gormon darajasi ko'tarila boshlaydi — ko'ngil aynishi, charchoq va ko'krak sezuvchanligi paydo bo'lishi mumkin." },
  { week: 6, sizeLabel: "no'xat donasi", babyDevelopment: "Yurak urishi boshlanadi (ba'zan UTT'da ko'rinishi mumkin), qo'l va oyoq kurtaklari paydo bo'ladi.", motherChanges: "Ertalabki ko'ngil aynishi va hidlarga sezgirlik ko'pchilikda shu haftalarda kuchayadi." },
  { week: 7, sizeLabel: "ko'k moviz", babyDevelopment: "Miya tez sur'atda rivojlanmoqda, yuz xususiyatlari (ko'z, burun) asta shakllanmoqda.", motherChanges: "Charchoq va tez-tez siyish hissi ko'payishi mumkin — bachadon o'sib, siydik pufagiga bosim tushiradi." },
  { week: 8, sizeLabel: "malina", babyDevelopment: "Barmoqlar shakllana boshlaydi, asosiy ichki organlar allaqachon o'z o'rnida — hozircha juda kichik.", motherChanges: "Kayfiyat o'zgarishi va ko'krak sezuvchanligi gormonal o'zgarishlar bilan bog'liq bo'lishi mumkin." },
  { week: 9, sizeLabel: "uzum", babyDevelopment: "Barcha asosiy organlar mavjud — shu haftadan boshlab \"embrion\" emas, \"fetus\" (homila) deb ataladi.", motherChanges: "Kiyimlar birozgina qulayroq his qilinishi mumkin, garchi qorin hali sezilarli darajada kattalashmagan bo'lsa ham." },
  { week: 10, sizeLabel: "kivi", babyDevelopment: "Bo'g'imlar harakatlana boshlaydi, garchi bu hali sezilmasa ham — suyak to'qimasi shakllanishda davom etmoqda.", motherChanges: "Ko'pchilikda birinchi trimestrning kuchli belgilari (ko'ngil aynishi) shu davrda cho'qqisiga chiqadi." },
  { week: 11, sizeLabel: "anjir", babyDevelopment: "Suyaklar asta qattiqlasha boshlaydi, boshning tanaga nisbati hali katta.", motherChanges: "Ba'zi ayollarda energiya darajasi asta tiklana boshlaydi." },
  { week: 12, sizeLabel: "limon", babyDevelopment: "Reflekslar rivojlanadi (masalan barmoqlarni siqish) — birinchi trimestr yakunlanmoqda.", motherChanges: "Ko'ngil aynishi ko'pchilikda shu hafta atrofida asta kamayadi, garchi bu individual bo'lsa ham." },
  { week: 13, sizeLabel: "shaftoli", babyDevelopment: "Jinsiy a'zolar shakllanmoqda (garchi UTT'da hali aniq ko'rinmasligi mumkin), ovoz tizimi asoslari paydo bo'ladi.", motherChanges: "Ikkinchi trimestrga o'tish bilan ko'pchilik o'zini energikroq his qila boshlaydi." },
  { week: 14, sizeLabel: "apelsin", babyDevelopment: "Yuz mushaklari rivojlanadi — homila endi qovog'ini qisish, tirjayish kabi ifodalarni \"mashq qilishi\" mumkin.", motherChanges: "Qorin asta ko'rinarli bo'la boshlaydi." },
  { week: 15, sizeLabel: "olma", babyDevelopment: "Suyak to'qimasi mustahkamlanishda davom etadi, quloqlar o'z joyiga yaqinlashmoqda.", motherChanges: "Orqa og'rig'i yoki bo'g'im bo'shashishi ba'zi ayollarda shu davrda boshlanishi mumkin." },
  { week: 16, sizeLabel: "avokado", babyDevelopment: "Ba'zi onalar shu hafta atrofida ilk harakatlarni (\"tipirchilash\") sezishi mumkin, garchi bu birinchi homiladorlikda ko'pincha keyinroq bo'ladi.", motherChanges: "Qorin ko'rinishi kundan-kunga sezilarli bo'lib bormoqda." },
  { week: 17, sizeLabel: "nok", babyDevelopment: "Terini himoya qiluvchi yog' to'plami (jag'-yostiqcha) shakllana boshlaydi, qon aylanish tizimi rivojlanmoqda.", motherChanges: "Vazn oshishi barqarorlashadi — bu davrda muvozanatli ovqatlanish tavsiya etiladi." },
  { week: 18, sizeLabel: "bolgar qalampiri", babyDevelopment: "Quloqlar o'z o'rniga to'liq joylashgan — homila ayrim ovozlarni his qila boshlashi mumkin.", motherChanges: "Ko'pchilik shu davrda ilk aniq harakatlarni sezadi." },
  { week: 19, sizeLabel: "pomidor", babyDevelopment: "Teri himoya qatlami (vernix) shakllanadi — bu teri suyuqlikda uzoq muddat bo'lishdan himoya qiladi.", motherChanges: "Qorin terisining tortilishi bilan bog'liq qichishish ba'zilarda kuzatiladi." },
  { week: 20, sizeLabel: "banan", babyDevelopment: "Homiladorlikning taxminan yarmi — ko'pchilik klinikada shu davrda batafsil UTT o'tkaziladi.", motherChanges: "Harakatlar muntazamroq his qilina boshlaydi." },
  { week: 21, sizeLabel: "sabzi", babyDevelopment: "Harakatlar kuchayadi va ko'proq sezila boshlaydi, ovqat hazm qilish tizimi rivojlanmoqda.", motherChanges: "Orqa og'rig'i yoki oyoq tomirlarining kattalashishi (varikoz) ba'zilarda boshlanishi mumkin." },
  { week: 22, sizeLabel: "bodring", babyDevelopment: "Qoshlar va ko'z qovoqlari shakllangan, lablar aniqroq ko'rinadi.", motherChanges: "Qorin kattalashishi bilan tana muvozanati o'zgarishi mumkin." },
  { week: 23, sizeLabel: "baqlajon", babyDevelopment: "Teri ostida qon tomirlari ko'rinib turadi — teri hali yupqa va yarim shaffof.", motherChanges: "Braxton-Hiks qisqarishlari (bachadonning yengil, og'riqsiz \"mashq\" qisqarishlari) ba'zilarda boshlanishi mumkin." },
  { week: 24, sizeLabel: "makkajo'xori", babyDevelopment: "O'pkalar rivojlanishda muhim bosqichga yetadi — bu vaqtdan boshlab erta tug'ilgan chaqaloqning tibbiy yordam bilan omon qolish ehtimoli oshadi.", motherChanges: "Qandli diabet skriningi odatda shu davr atrofida tavsiya etiladi — shifokoringiz bilan maslahatlashing." },
  { week: 25, sizeLabel: "gulkaram boshi", babyDevelopment: "Sochlar rangi va teksturasi shakllana boshlaydi, homila teri ostida yog' to'plamoqda.", motherChanges: "Uyqu sifati qorin kattaligi tufayli o'zgarishi mumkin — yon tomonda yotish ko'pincha qulayroq." },
  { week: 26, sizeLabel: "karam boshi", babyDevelopment: "Ko'zlar asta ochila boshlaydi, yorug'likka reaksiya rivojlanmoqda.", motherChanges: "Nafas qisilishi bachadonning diafragmaga bosimi tufayli sezilishi mumkin." },
  { week: 27, sizeLabel: "gul karam", babyDevelopment: "Miya faol rivojlanmoqda, uyqu-uyg'onish sikllari shakllana boshlaydi — bu uchinchi trimestrning boshlanishi.", motherChanges: "Orqa og'rig'i va oyoq shishishi ko'proq sezilishi mumkin." },
  { week: 28, sizeLabel: "katta baqlajon", babyDevelopment: "Uxlash-uyg'onish davri aniqroq bo'ladi, ko'z pilkalari mavjud.", motherChanges: "Ko'pchilik klinikada shu davrdan boshlab tekshiruvlar tez-tezroq (har 2 haftada) tavsiya etiladi." },
  { week: 29, sizeLabel: "kichik qovoq", babyDevelopment: "Mushaklar va o'pkalar rivojlanishda davom etadi, bosh o'sishi tezlashadi.", motherChanges: "Charchoq qaytadan kuchayishi mumkin — tana kattalashgan yukka moslashmoqda." },
  { week: 30, sizeLabel: "katta karam", babyDevelopment: "Miya tez o'sib bormoqda, amniotik suyuqlik miqdori ko'pincha shu davrda eng yuqori darajaga yetadi.", motherChanges: "Nafas qisilishi va tez-tez siyish hissi davom etishi mumkin." },
  { week: 31, sizeLabel: "kokos yong'og'i", babyDevelopment: "Barcha besh sezgi a'zosi faol — homila yorug'lik, ovoz va ta'mga (amniotik suyuqlik orqali) reaksiya bildiradi.", motherChanges: "Uyqu qulayligi uchun qo'shimcha yostiqlar foydali bo'lishi mumkin." },
  { week: 32, sizeLabel: "ananas", babyDevelopment: "Tirnoqlar barmoq uchlariga yetib boradi, teri silliqlasha boshlaydi.", motherChanges: "Braxton-Hiks qisqarishlari tez-tezroq sezilishi mumkin." },
  { week: 33, sizeLabel: "katta ananas", babyDevelopment: "Bosh suyagi suyaklari hali yumshoq va harakatchan qoladi — bu tug'ruq jarayoni uchun zarur.", motherChanges: "Bel og'rig'i va uyquga qiynalish ko'pchilikda kuzatiladi." },
  { week: 34, sizeLabel: "qovun", babyDevelopment: "O'pkalar yetilishda davom etadi, teri ostidagi yog' qatlami qalinlashmoqda.", motherChanges: "Qorin pastga tushishi (\"yengillashish\") ba'zilarda shu davrda boshlanadi." },
  { week: 35, sizeLabel: "katta qovun", babyDevelopment: "Buyraklar to'liq rivojlangan, jigar ham asosiy vazifalarni bajarishga tayyor.", motherChanges: "Tez-tez siyish hissi kuchayishi mumkin — bosh pastga tushib, siydik pufagiga bosim oshadi." },
  { week: 36, sizeLabel: "romaine salat", babyDevelopment: "Homila odatda tug'ruqqa tayyorgarlik ko'rib, bosh pastga tomon joylasha boshlaydi.", motherChanges: "Klinikaga tashriflar odatda haftalik bo'lib qoladi — shifokor tavsiyalariga amal qiling." },
  { week: 37, sizeLabel: "pichan (leek)", babyDevelopment: "\"Erta muddat\" boshlanadi — o'pkalar va boshqa organlar deyarli to'liq tayyor.", motherChanges: "Tug'ruq belgilariga (muntazam qisqarishlar, suv ketishi) e'tiborli bo'lish tavsiya etiladi." },
  { week: 38, sizeLabel: "kichik qovun", babyDevelopment: "Barcha organlar tug'ilishga tayyor, homila tug'ruq kanaliga tushishi mumkin.", motherChanges: "Kutish bilan bog'liq hayajon va bezovtalik — bu davr uchun tabiiy holat." },
  { week: 39, sizeLabel: "kichik tarvuz", babyDevelopment: "\"To'liq muddat\" hisoblanadi — teri silliq, yog' qatlami tug'ilgandan keyingi issiqlikni saqlash uchun yetarli.", motherChanges: "Tug'ruq har qanday kun boshlanishi mumkin — sumka va hujjatlarni tayyor tutish tavsiya etiladi." },
  { week: 40, sizeLabel: "tarvuz", babyDevelopment: "Kutilayotgan tug'ilish sanasi — lekin haqiqiy tug'ruq sanasidan bir necha kun oldin yoki keyin bo'lishi ham me'yorda.", motherChanges: "Shifokor bilan muntazam aloqada bo'lish va tug'ruq belgilarini kuzatish muhim." },
  { week: 41, sizeLabel: "katta tarvuz", babyDevelopment: "Ba'zi homiladorliklar 40 haftadan tabiiy ravishda uzoqroq davom etadi.", motherChanges: "Shifokor odatda bu davrda homila holatini kuzatish uchun qo'shimcha tekshiruvlar tavsiya qiladi." },
  { week: 42, sizeLabel: "katta tarvuz", babyDevelopment: "\"Muddatidan keyingi\" homiladorlik deb hisoblanadi — yo'ldosh funksiyasi kuzatilishi muhim.", motherChanges: "Shifokoringiz tug'ruqni sun'iy chaqirish yoki qo'shimcha kuzatuv haqida maslahat berishi mumkin." },
];

async function main() {
  await ensureSchema();
  for (const w of WEEKS) {
    await upsertPregnancyWeekContent(w.week, { sizeLabel: w.sizeLabel, babyDevelopment: w.babyDevelopment, motherChanges: w.motherChanges });
    console.log(`✓ ${w.week}-hafta yozildi`);
  }
  console.log(`\n${WEEKS.length} ta hafta muvaffaqiyatli yozildi.`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Xatolik:", error);
  process.exit(1);
});
