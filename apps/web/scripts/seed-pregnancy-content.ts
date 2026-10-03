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

// PREG-I18N — 42 haftaning rus va ingliz tilidagi varianti.
//
// Manba — yuqoridagi WEEKS (o'zbekcha). Tarjima SO'ZMA-SO'Z emas, MA'NOGA
// sodiq: tibbiy atamalar (surfaktant, lanugo, Braxton-Hiks, GBS) rasmiy
// nomi bilan, maslahatlar esa o'sha tilda tabiiy eshitiladigan qilib
// berilgan. Mazmun o'zgartirilmagan — hech qaerda yangi tibbiy da'vo
// qo'shilmagan yoki olib tashlanmagan.
interface WeekTranslation {
  sizeLabel: string;
  babyDevelopment: string;
  motherChanges: string;
}

export const TRANSLATIONS: Record<number, { ru: WeekTranslation; en: WeekTranslation }> = {
  1: {
    ru: { sizeLabel: "оплодотворения ещё нет", babyDevelopment: "Отсчёт идёт с первого дня последней менструации, поэтому на этой неделе эмбриона ещё нет. Организм начинает готовить яйцеклетку, а слизистая матки обновляется.", motherChanges: "На этой неделе идёт менструация. Если вы планируете беременность, начните принимать фолиевую кислоту (400 мкг в день) уже сейчас: нервная трубка закрывается раньше, чем вы узнаете о беременности. Отказ от курения и алкоголя тоже важен на этом этапе." },
    en: { sizeLabel: "no conception yet", babyDevelopment: "Counting starts from the first day of your last period, so there is no embryo yet this week. Your body begins maturing an egg and the uterine lining renews itself.", motherChanges: "Your period comes this week. If you are planning a pregnancy, start folic acid (400 mcg a day) now: the neural tube closes before you even know you are pregnant. Giving up smoking and alcohol matters at this stage too." },
  },
  2: {
    ru: { sizeLabel: "зёрнышко мунга", babyDevelopment: "В яичнике созревает фолликул, и к концу недели происходит овуляция. Оплодотворения ещё не было, но именно на этот период приходятся фертильные дни.", motherChanges: "Выделения могут стать более жидкими и прозрачными, а после овуляции базальная температура слегка поднимается. Некоторые чувствуют лёгкое покалывание в области яичника." },
    en: { sizeLabel: "a mung bean", babyDevelopment: "A follicle matures in the ovary and ovulation happens towards the end of the week. Fertilisation hasn't occurred yet, but these are your fertile days.", motherChanges: "Discharge may become thinner and clearer, and basal body temperature rises slightly after ovulation. Some women feel a mild twinge near an ovary." },
  },
  3: {
    ru: { sizeLabel: "песчинка", babyDevelopment: "Происходит оплодотворение. Делящееся скопление клеток движется по маточной трубе к матке и к концу недели начинает прикрепляться к её стенке.", motherChanges: "Большинство пока ничего не чувствует. У некоторых при имплантации бывает пара капель крови или лёгкое потягивание — это гораздо слабее и короче менструации." },
    en: { sizeLabel: "a grain of sand", babyDevelopment: "Fertilisation takes place. The dividing cluster of cells travels down the fallopian tube to the uterus and starts to implant in the wall by the end of the week.", motherChanges: "Most women feel nothing yet. Some have a drop or two of blood or mild cramping at implantation — much lighter and shorter than a period." },
  },
  4: {
    ru: { sizeLabel: "зёрнышко мунга", babyDevelopment: "Эмбрион полностью прикрепляется к стенке матки. Закладываются основы плаценты и плодного пузыря; клетки разделяются на три слоя, из которых разовьются нервная система, внутренние органы и опорно-двигательный аппарат.", motherChanges: "Менструация задерживается, тест может показать положительный результат. Грудь становится чувствительной, появляются усталость и перепады настроения. С этого момента любые лекарства принимайте только по согласованию с врачом." },
    en: { sizeLabel: "a mung bean", babyDevelopment: "The embryo implants fully into the uterine wall. The foundations of the placenta and amniotic sac are laid; cells separate into three layers that will become the nervous system, the internal organs and the musculoskeletal system.", motherChanges: "Your period is late and a test may come back positive. Breasts feel tender, fatigue and mood swings appear. From now on, take any medication only after discussing it with your doctor." },
  },
  5: {
    ru: { sizeLabel: "семечко кунжута", babyDevelopment: "Сердечная трубка начинает биться, нервная трубка закрывается — это основа головного и спинного мозга. Эмбрион около 2 мм, но самые важные органы закладываются именно в эти недели.", motherChanges: "Тошнота, чувствительность к запахам и усталость усиливаются. Хорошее время записаться на первый приём: встать на учёт рекомендуется до 12 недель." },
    en: { sizeLabel: "a sesame seed", babyDevelopment: "The heart tube starts to beat and the neural tube closes — the basis of the brain and spinal cord. The embryo is about 2 mm, yet the most important organs are built in exactly these weeks.", motherChanges: "Nausea, sensitivity to smells and fatigue increase. A good time to book your first appointment: registering care before 12 weeks is recommended." },
  },
  6: {
    ru: { sizeLabel: "горошина", babyDevelopment: "Сердцебиение уже можно увидеть на УЗИ. Появляются зачатки рук и ног, а также первые структуры глаз и ушей.", motherChanges: "Утренняя тошнота приближается к пику. Ешьте понемногу и часто; некоторым помогает сухой хлеб или несколько орехов ещё до того, как встать с постели." },
    en: { sizeLabel: "a pea", babyDevelopment: "The heartbeat may already be visible on an ultrasound. Arm and leg buds appear, along with the first structures of the eyes and ears.", motherChanges: "Morning sickness is nearing its peak. Eat small amounts often; some women find dry bread or a few nuts before getting out of bed helps." },
  },
  7: {
    ru: { sizeLabel: "голубика", babyDevelopment: "Мозг растёт очень быстро, нервные клетки прибавляются тысячами в минуту. Начинают проступать зачатки пальцев и ноздри.", motherChanges: "Частое мочеиспускание и усталость становятся обычным делом. Пейте достаточно жидкости: обезвоживание усиливает тошноту." },
    en: { sizeLabel: "a blueberry", babyDevelopment: "The brain grows very quickly, adding thousands of nerve cells a minute. Finger buds and nostrils begin to show.", motherChanges: "Frequent urination and tiredness become routine. Drink enough fluids: dehydration makes nausea worse." },
  },
  8: {
    ru: { sizeLabel: "малина", babyDevelopment: "Пальцы начинают разделяться, все основные органы уже на своих местах. Плод около 1,5 см и уже двигается — эти движения пока не ощущаются.", motherChanges: "Матка растёт и может давать лёгкое потягивание в пояснице и внизу живота. Размер груди меняется, понадобится удобное бельё." },
    en: { sizeLabel: "a raspberry", babyDevelopment: "Fingers start to separate and all the main organs are in place. The fetus is about 1.5 cm and already moving — you can't feel it yet.", motherChanges: "The growing uterus can cause mild pulling in your lower back and abdomen. Breast size changes, so comfortable underwear helps." },
  },
  9: {
    ru: { sizeLabel: "виноградина", babyDevelopment: "Теперь это уже не эмбрион, а плод. Руки и ноги сгибаются, формируются веки, сердце разделяется на четыре камеры.", motherChanges: "Уровень гормонов достигает пика: перепады настроения и слезливость чаще всего приходятся на этот период. Это временно." },
    en: { sizeLabel: "a grape", babyDevelopment: "It is now called a fetus rather than an embryo. Arms and legs bend, eyelids form and the heart divides into four chambers.", motherChanges: "Hormone levels peak: mood swings and tearfulness most often fall in this period. It is temporary." },
  },
  10: {
    ru: { sizeLabel: "киви", babyDevelopment: "Все жизненно важные органы сформированы — дальше они растут и дозревают. Появляются зачатки ногтей, суставы сгибаются.", motherChanges: "Пора записаться на первый скрининг (11–13 недель). У большинства тошнота достигает максимума примерно на этой неделе, а затем ослабевает." },
    en: { sizeLabel: "a kiwi", babyDevelopment: "All vital organs are formed — from here they grow and mature. Nail buds appear and joints bend.", motherChanges: "Time to book the first screening (weeks 11–13). For most women nausea peaks around this week and then eases." },
  },
  11: {
    ru: { sizeLabel: "инжир", babyDevelopment: "Тело плода выпрямляется, голова пока относительно большая. Кости начинают твердеть, закладываются зачатки молочных зубов.", motherChanges: "С этой недели проводят УЗИ и анализ крови первого скрининга: измеряют толщину воротникового пространства (ТВП). Скрининг — не диагноз, он оценивает только вероятность." },
    en: { sizeLabel: "a fig", babyDevelopment: "The body straightens out, though the head is still relatively large. Bones start to harden and the buds of the milk teeth form.", motherChanges: "The first-screening ultrasound and blood test start this week: nuchal translucency (NT) is measured. Screening is not a diagnosis — it only estimates probability." },
  },
  12: {
    ru: { sizeLabel: "лимон", babyDevelopment: "Плод глотает, сжимает пальцы, может икать. Почки начинают вырабатывать мочу.", motherChanges: "Первый триместр завершается: у большинства тошнота уменьшается, риск выкидыша заметно снижается. Матка поднимается выше лобковой кости." },
    en: { sizeLabel: "a lemon", babyDevelopment: "The fetus swallows, clenches its fingers and may hiccup. The kidneys start producing urine.", motherChanges: "The first trimester is ending: nausea eases for most women and the risk of miscarriage drops noticeably. The uterus rises above the pubic bone." },
  },
  13: {
    ru: { sizeLabel: "персик", babyDevelopment: "Формируются голосовые связки и половые органы. Кожа пока тонкая и прозрачная, сквозь неё видны сосуды.", motherChanges: "Энергия возвращается — многие называют второй триместр самым комфортным периодом. Вес начинает прибавляться постепенно." },
    en: { sizeLabel: "a peach", babyDevelopment: "Vocal cords and the genitals form. The skin is still thin and translucent, with blood vessels showing through.", motherChanges: "Your energy returns — many women call the second trimester the most comfortable stretch. Weight starts to go on gradually." },
  },
  14: {
    ru: { sizeLabel: "апельсин", babyDevelopment: "Работают мышцы лица: плод хмурится и вытягивает губы. Шея удлиняется, и голова чётко отделяется от туловища.", motherChanges: "Живот начинает проступать. Может появиться тянущая боль внизу (боль круглой связки) — это растяжение связок, удерживающих матку." },
    en: { sizeLabel: "an orange", babyDevelopment: "Facial muscles work: the fetus frowns and purses its lips. The neck lengthens and the head is clearly separate from the body.", motherChanges: "Your bump starts to show. You may feel pulling low down (round ligament pain) — the ligaments holding the uterus are stretching." },
  },
  15: {
    ru: { sizeLabel: "яблоко", babyDevelopment: "Плод воспринимает свет и начинает реагировать на звуки. Кости крепнут, кожу покрывает тонкий пушок (лануго).", motherChanges: "Часто бывают заложенность носа и кровоточивость дёсен — это связано с увеличением объёма крови. Пользуйтесь мягкой зубной щёткой." },
    en: { sizeLabel: "an apple", babyDevelopment: "The fetus senses light and starts responding to sound. Bones strengthen and fine hair (lanugo) covers the skin.", motherChanges: "A blocked nose and bleeding gums are common — they come from the increased blood volume. Use a soft toothbrush." },
  },
  16: {
    ru: { sizeLabel: "авокадо", babyDevelopment: "Мышцы крепнут, плод активно двигается. Некоторые женщины чувствуют первые шевеления на этих неделях; при первой беременности это обычно происходит позже.", motherChanges: "Время второго скрининга (16–18 недель). Живот уже заметен, понадобятся удобная одежда и обувь." },
    en: { sizeLabel: "an avocado", babyDevelopment: "Muscles strengthen and the fetus moves actively. Some women feel the first movements around now; with a first pregnancy it usually comes later.", motherChanges: "Time for the second screening (weeks 16–18). Your bump is visible and comfortable clothes and shoes start to matter." },
  },
  17: {
    ru: { sizeLabel: "груша", babyDevelopment: "Под кожей начинает откладываться жир — после рождения он помогает удерживать тепло. Развивается слуховая система.", motherChanges: "Аппетит усиливается. Хорошо, когда вес прибавляется равномерно: и резкий скачок, и полная остановка — повод поговорить с врачом." },
    en: { sizeLabel: "a pear", babyDevelopment: "Fat begins to build up under the skin — after birth it helps keep the baby warm. The hearing system develops.", motherChanges: "Your appetite grows. Steady weight gain is what you want: both a sharp jump and a complete stop are worth raising with your doctor." },
  },
  18: {
    ru: { sizeLabel: "болгарский перец", babyDevelopment: "Плод слышит звуки: сердцебиение, работу кишечника и ваш голос. Уши уже на своём месте.", motherChanges: "Большинство женщин на этих неделях отчётливо чувствуют шевеления. Если кружится голова лёжа на спине, повернитесь на бок — матка пережимает крупную вену." },
    en: { sizeLabel: "a bell pepper", babyDevelopment: "The fetus hears sounds: your heartbeat, your digestion and your voice. The ears are in their final position.", motherChanges: "Most women clearly feel movements by now. If you feel dizzy lying on your back, turn onto your side — the uterus presses on a large vein." },
  },
  19: {
    ru: { sizeLabel: "помидор", babyDevelopment: "Кожу покрывает первородная смазка (vernix) — защитный жировой слой. В мозге формируются центры чувств.", motherChanges: "Кожа живота и груди растягивается и может зудеть, помогает увлажняющий крем. А вот сильный зуд ладоней и стоп — отдельный признак: скажите об этом врачу." },
    en: { sizeLabel: "a tomato", babyDevelopment: "Vernix — a greasy protective layer — covers the skin. Sensory centres form in the brain.", motherChanges: "The skin on your abdomen and breasts stretches and may itch; moisturiser helps. Intense itching of the palms and soles is different: tell your doctor about it." },
  },
  20: {
    ru: { sizeLabel: "банан", babyDevelopment: "Половина беременности позади. В этот период делают подробное УЗИ: проверяют органы, расположение плаценты и количество вод.", motherChanges: "Шевеления становятся более регулярными. Дно матки поднимается до уровня пупка; при болях в пояснице обратите внимание на осанку и обувь." },
    en: { sizeLabel: "a banana", babyDevelopment: "You are halfway. The detailed anomaly scan is done around now: organs, the position of the placenta and the amount of fluid are all checked.", motherChanges: "Movements become more regular. The top of the uterus reaches your navel; if your back aches, look at your posture and footwear." },
  },
  21: {
    ru: { sizeLabel: "морковь", babyDevelopment: "Плод глотает околоплодные воды и начинает различать вкус — вкус съеденной вами еды переходит в воды.", motherChanges: "На ногах могут расширяться вены и появляться отёки. Избегайте долгого стояния, отдыхайте с приподнятыми ногами." },
    en: { sizeLabel: "a carrot", babyDevelopment: "The fetus swallows amniotic fluid and begins to taste — the flavour of what you eat passes into the fluid.", motherChanges: "Veins in your legs may widen and swelling can appear. Avoid standing for long periods and rest with your legs raised." },
  },
  22: {
    ru: { sizeLabel: "огурец", babyDevelopment: "Брови и ресницы сформированы. Плод ощупывает своё лицо и пуповину, весит примерно 430 г.", motherChanges: "Могут начаться схватки Брэкстона-Хикса: они безболезненные, нерегулярные и проходят сами. Если они регулярные и болезненные — обратитесь к врачу." },
    en: { sizeLabel: "a cucumber", babyDevelopment: "Eyebrows and eyelashes are formed. The fetus touches its own face and the umbilical cord, and weighs about 430 g.", motherChanges: "Braxton Hicks contractions may start: painless, irregular and they pass on their own. If they become regular and painful, contact your doctor." },
  },
  23: {
    ru: { sizeLabel: "баклажан", babyDevelopment: "В лёгких начинает вырабатываться сурфактант — вещество, необходимое для самостоятельного дыхания. Кожа ещё морщинистая, слой жира тонкий.", motherChanges: "Вес прибавляется быстрее. Приближается скрининг на гестационный диабет (24–28 недель), запишитесь на приём заранее." },
    en: { sizeLabel: "an aubergine", babyDevelopment: "The lungs start producing surfactant — the substance needed to breathe independently. The skin is still wrinkled and the fat layer thin.", motherChanges: "Weight goes on faster now. Gestational diabetes screening (weeks 24–28) is coming up, so book your appointment." },
  },
  24: {
    ru: { sizeLabel: "кукуруза", babyDevelopment: "Плод достигает порога жизнеспособности: ребёнок, родившийся после этого срока, может выжить при современной помощи. Внутреннее ухо работает полностью, появляется чувство равновесия.", motherChanges: "В этот период рекомендуется обследование на гестационный диабет. На коже живота могут появиться растяжки — это зависит от структуры кожи." },
    en: { sizeLabel: "an ear of corn", babyDevelopment: "The fetus reaches the threshold of viability: a baby born after this point can survive with modern care. The inner ear works fully and a sense of balance appears.", motherChanges: "Gestational diabetes testing is recommended around now. Stretch marks may appear on your abdomen — this depends on your skin." },
  },
  25: {
    ru: { sizeLabel: "кочан цветной капусты", babyDevelopment: "Кожа разглаживается, слой жира становится толще. Кисти рук работают полностью, плод сжимает кулачок.", motherChanges: "Из груди может выделяться первая жидкость (молозиво). Если сон нарушен, удобнее спать на боку с подушкой между коленями." },
    en: { sizeLabel: "a head of cauliflower", babyDevelopment: "The skin smooths out and the fat layer thickens. The hands work fully and the fetus makes a fist.", motherChanges: "Your breasts may leak the first fluid (colostrum). If sleep is disturbed, lying on your side with a pillow between your knees is more comfortable." },
  },
  26: {
    ru: { sizeLabel: "кочан капусты", babyDevelopment: "Глаза открываются и реагируют на свет. Мозговые волны начинают откликаться на слух и зрение.", motherChanges: "Может усилиться одышка — матка давит на диафрагму. Отдыхайте, дыша чаще и неглубоко." },
    en: { sizeLabel: "a head of cabbage", babyDevelopment: "The eyes open and respond to light. Brain waves begin to react to hearing and sight.", motherChanges: "Breathlessness may increase as the uterus presses on your diaphragm. Rest, taking smaller, more frequent breaths." },
  },
  27: {
    ru: { sizeLabel: "цветная капуста", babyDevelopment: "Начинается третий триместр. У плода есть циклы сна и бодрствования, он икает — вы ощущаете это как ритмичные медленные толчки.", motherChanges: "Обследования становятся чаще. Судороги в ногах и боль в пояснице встречаются часто: помогают еда, богатая кальцием и магнием, и лёгкая растяжка." },
    en: { sizeLabel: "a cauliflower", babyDevelopment: "The third trimester begins. The fetus has sleep and wake cycles and hiccups — you feel this as rhythmic, slow nudges.", motherChanges: "Appointments become more frequent. Leg cramps and back pain are common: food rich in calcium and magnesium plus gentle stretching help." },
  },
  28: {
    ru: { sizeLabel: "большой баклажан", babyDevelopment: "Ресницы сформированы, плод моргает. Вес около 1 кг, и с этого момента он быстро растёт.", motherChanges: "Рекомендуется считать шевеления каждый день. Если у вас резус-отрицательная кровь, в этот период вводят анти-D иммуноглобулин — спросите об этом врача." },
    en: { sizeLabel: "a large aubergine", babyDevelopment: "Eyelashes are formed and the fetus blinks. It weighs about 1 kg and grows quickly from here.", motherChanges: "Counting movements every day is recommended. If your blood is Rh negative, anti-D immunoglobulin is given around now — ask your doctor." },
  },
  29: {
    ru: { sizeLabel: "небольшая тыква", babyDevelopment: "Кости крепнут, потребность в кальции растёт. Плод начинает сам удерживать температуру тела.", motherChanges: "Запор и изжога могут усилиться: ешьте небольшими порциями и не ложитесь сразу после еды." },
    en: { sizeLabel: "a small pumpkin", babyDevelopment: "Bones strengthen and the need for calcium rises. The fetus starts to hold its own body temperature.", motherChanges: "Constipation and heartburn may worsen: eat smaller portions and avoid lying down straight after a meal." },
  },
  30: {
    ru: { sizeLabel: "большая капуста", babyDevelopment: "Извилины мозга углубляются, развивается зрение. Количество околоплодных вод близко к максимуму.", motherChanges: "Усталость возвращается. Пора подумать о декретном отпуске и выборе роддома; начните собирать сумку." },
    en: { sizeLabel: "a large cabbage", babyDevelopment: "The folds of the brain deepen and vision develops. The volume of amniotic fluid is close to its peak.", motherChanges: "Tiredness returns. Time to think about maternity leave and choosing where to give birth; start packing your bag." },
  },
  31: {
    ru: { sizeLabel: "кокос", babyDevelopment: "Работают все пять чувств. Плод различает знакомые голоса и может отвечать на них затиханием.", motherChanges: "Схватки Брэкстона-Хикса учащаются. Дыхательные упражнения и курсы подготовки к родам в этот период особенно полезны." },
    en: { sizeLabel: "a coconut", babyDevelopment: "All five senses work. The fetus recognises familiar voices and may respond by settling.", motherChanges: "Braxton Hicks contractions come more often. Breathing exercises and antenatal classes are especially useful now." },
  },
  32: {
    ru: { sizeLabel: "ананас", babyDevelopment: "Обычно плод разворачивается головой вниз. Ногти доходят до кончиков пальцев, лануго постепенно выпадает.", motherChanges: "Проводят УЗИ третьего скрининга (32–34 недели): оценивают рост плода, состояние плаценты и количество вод." },
    en: { sizeLabel: "a pineapple", babyDevelopment: "The fetus usually turns head down. Nails reach the fingertips and the lanugo gradually sheds.", motherChanges: "The third-trimester scan (weeks 32–34) is done: the baby's growth, the placenta and the amount of fluid are assessed." },
  },
  33: {
    ru: { sizeLabel: "большой ананас", babyDevelopment: "Кости черепа ещё мягкие и подвижные — это нужно, чтобы пройти родовые пути. От матери передаются защитные антитела.", motherChanges: "Давление под рёбрами и одышка могут усилиться. Заранее обсудите с врачом признаки родов и то, когда ехать в роддом." },
    en: { sizeLabel: "a large pineapple", babyDevelopment: "The skull bones are still soft and mobile — needed to pass through the birth canal. Protective antibodies pass from you to the baby.", motherChanges: "Pressure under the ribs and breathlessness may increase. Agree with your doctor in advance on the signs of labour and when to go in." },
  },
  34: {
    ru: { sizeLabel: "дыня", babyDevelopment: "Лёгкие почти созрели, подкожный жир становится толще — кожа разглаживается и розовеет.", motherChanges: "Пусть сумка будет готова: около 10 процентов родов начинаются до 37 недели. Следите за отёками и артериальным давлением." },
    en: { sizeLabel: "a melon", babyDevelopment: "The lungs are nearly mature and the fat under the skin thickens — the skin smooths and turns pink.", motherChanges: "Keep your hospital bag ready: about 10 per cent of births start before 37 weeks. Keep an eye on swelling and blood pressure." },
  },
  35: {
    ru: { sizeLabel: "большая дыня", babyDevelopment: "Почки и печень работают полностью. Места становится меньше: движения сильные, но не такие размашистые — их КОЛИЧЕСТВО уменьшаться не должно.", motherChanges: "Анализ на стрептококк группы B (GBS) обычно берут на 35–37 неделе. Голова опускается, и частое мочеиспускание возвращается." },
    en: { sizeLabel: "a large melon", babyDevelopment: "The kidneys and liver work fully. Space is tighter: movements are strong but less sweeping — their NUMBER should not drop.", motherChanges: "The group B strep (GBS) swab is usually taken at 35–37 weeks. As the head drops, frequent urination returns." },
  },
  36: {
    ru: { sizeLabel: "салат ромен", babyDevelopment: "Головка начинает опускаться в таз. Вес прибавляется примерно на 200 г в неделю.", motherChanges: "Визиты становятся еженедельными. Когда живот опускается, дышать легче, но давление на мочевой пузырь растёт." },
    en: { sizeLabel: "a romaine lettuce", babyDevelopment: "The head starts to settle into the pelvis. Weight goes on at roughly 200 g a week.", motherChanges: "Appointments become weekly. As the bump drops, breathing gets easier but pressure on the bladder increases." },
  },
  37: {
    ru: { sizeLabel: "лук-порей", babyDevelopment: "Начинается «ранний доношенный» срок: органы готовы, плод в основном набирает вес.", motherChanges: "Знайте признаки родов: регулярные нарастающие схватки, отхождение вод, отхождение слизистой пробки. При любом кровотечении обращайтесь немедленно." },
    en: { sizeLabel: "a leek", babyDevelopment: "\"Early term\" begins: the organs are ready and the baby mainly puts on weight.", motherChanges: "Know the signs of labour: regular, strengthening contractions, waters breaking, the mucus plug coming away. With any bleeding, seek help immediately." },
  },
  38: {
    ru: { sizeLabel: "небольшая дыня", babyDevelopment: "Волосы на голове могут быть 3–5 см. В кишечнике накапливается первый стул — меконий.", motherChanges: "Ожидание утомляет, и это нормально. Многих успокаивает подсчёт шевелений несколько раз в день." },
    en: { sizeLabel: "a small melon", babyDevelopment: "Hair on the head may be 3–5 cm long. The first stool, meconium, builds up in the bowel.", motherChanges: "The waiting is tiring, and that is normal. Many women find counting movements a few times a day reassuring." },
  },
  39: {
    ru: { sizeLabel: "небольшой арбуз", babyDevelopment: "Полный срок. Лёгкие накапливают последний запас сурфактанта, кожа гладкая, слой жира достаточный.", motherChanges: "Документы и сумка пусть стоят у двери. Если схватки идут каждые пять минут, длятся по минуте и так в течение часа — отправляйтесь в роддом." },
    en: { sizeLabel: "a small watermelon", babyDevelopment: "Full term. The lungs build their final store of surfactant, the skin is smooth and the fat layer sufficient.", motherChanges: "Keep your documents and bag by the door. If contractions come every five minutes, last a minute, and keep that up for an hour — go in." },
  },
  40: {
    ru: { sizeLabel: "арбуз", babyDevelopment: "Предполагаемая дата родов. Лишь около 5 процентов детей рождаются именно в этот день, поэтому роды на неделю раньше или позже — тоже норма.", motherChanges: "Врач наблюдает за положением плода и количеством вод. Если шевелений стало меньше — не ждите, обращайтесь сразу." },
    en: { sizeLabel: "a watermelon", babyDevelopment: "Your due date. Only about 5 per cent of babies arrive on it, so being a week early or late is also normal.", motherChanges: "Your doctor monitors the baby's position and the amount of fluid. If movements decrease — don't wait, seek help straight away." },
  },
  41: {
    ru: { sizeLabel: "большой арбуз", babyDevelopment: "Плод продолжает расти, ногти удлиняются. Работа плаценты может замедляться, поэтому нужно наблюдение.", motherChanges: "Наблюдение становится чаще (КТГ, УЗИ). Врач может обсудить с вами стимуляцию родов." },
    en: { sizeLabel: "a large watermelon", babyDevelopment: "The baby keeps growing and the nails lengthen. The placenta may start working less efficiently, so monitoring matters.", motherChanges: "Monitoring becomes more frequent (CTG, ultrasound). Your doctor may discuss inducing labour." },
  },
  42: {
    ru: { sizeLabel: "большой арбуз", babyDevelopment: "Переношенная беременность. За состоянием плаценты и количеством вод следят особенно внимательно.", motherChanges: "На этом сроке обычно рекомендуют стимуляцию родов. Не откладывайте наблюдение и оставайтесь на связи со своим врачом." },
    en: { sizeLabel: "a large watermelon", babyDevelopment: "Post-term pregnancy. The condition of the placenta and the amount of fluid are watched especially closely.", motherChanges: "Inducing labour is usually recommended at this stage. Don't delay monitoring and stay in touch with your doctor." },
  },
};

async function main() {
  await ensureSchema();
  if (!WRITE) {
    // Bazaga yozish PRODUCTION ma'lumotiga tegadi, shuning uchun
    // standart holatda faqat ko'rsatiladi. Yozish uchun --write kerak.
    for (const w of WEEKS) {
      console.log(`${w.week}-hafta (${w.sizeLabel}): ${w.babyDevelopment.length}+${w.motherChanges.length} belgi`);
    }
    const avg = Math.round(WEEKS.reduce((s, w) => s + w.babyDevelopment.length + w.motherChanges.length, 0) / WEEKS.length);
    const missing = WEEKS.filter((w) => !TRANSLATIONS[w.week]).map((w) => w.week);
    console.log(`\n${WEEKS.length} ta hafta tayyor, o'rtacha ${avg} belgi.`);
    console.log(
      missing.length === 0
        ? "Barcha haftalar uchun ru va en tarjimasi bor."
        : `TARJIMASI YO'Q haftalar: ${missing.join(", ")}`
    );
    console.log("Yozish uchun: -- --write");
    process.exit(0);
  }
  for (const w of WEEKS) {
    const t = TRANSLATIONS[w.week];
    await upsertPregnancyWeekContent(w.week, {
      sizeLabel: w.sizeLabel,
      babyDevelopment: w.babyDevelopment,
      motherChanges: w.motherChanges,
      ru: t?.ru ?? null,
      en: t?.en ?? null,
    });
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
