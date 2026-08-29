// Namunaviy klinikalar bazasi — spec §5: "Yandex Maps'dan ko'chirish tavsiya etilmaydi".
// Bu haqiqiy hamkorlik ma'lumoti EMAS — jamoa 50-100 ta haqiqiy klinika bilan almashtirishi
// kerak bo'lgan demo yozuvlar (shuning uchun umumiy, tavsifiy nomlar ishlatilgan).

import { randomUUID } from "node:crypto";
import { db } from "../src/server/db";
import type { ArticleCategory, ClinicSpecialty } from "@mammoai/shared";

interface SeedClinic {
  name: string;
  address: string;
  region: string;
  lat: number;
  lng: number;
  phone: string;
  specialties: ClinicSpecialty[];
  freeScreening: boolean;
}

const SEED_CLINICS: SeedClinic[] = [
  {
    name: "Toshkent Ayollar Salomatligi Markazi",
    address: "Toshkent sh., Chilonzor tumani, Bunyodkor shoh ko'chasi 12",
    region: "Toshkent",
    lat: 41.2856,
    lng: 69.2034,
    phone: "+998712001122",
    specialties: ["gynecology", "general"],
    freeScreening: false,
  },
  {
    name: "Respublika Onkologiya va Radiologiya Ilmiy Markazi",
    address: "Toshkent sh., Yunusobod tumani, Farobiy ko'chasi 383",
    region: "Toshkent",
    lat: 41.3486,
    lng: 69.2875,
    phone: "+998712463588",
    specialties: ["oncology", "radiology"],
    freeScreening: true,
  },
  {
    name: "Mahalla Poliklinikasi №14 (Ginekologiya bo'limi)",
    address: "Toshkent sh., Mirzo Ulug'bek tumani, Amir Temur shoh ko'chasi 88",
    region: "Toshkent",
    lat: 41.3222,
    lng: 69.2895,
    phone: "+998712345678",
    specialties: ["gynecology"],
    freeScreening: true,
  },
  {
    name: "Diagnostika va Mammografiya Markazi",
    address: "Toshkent sh., Shayxontohur tumani, Navoiy ko'chasi 7",
    region: "Toshkent",
    lat: 41.3275,
    lng: 69.2401,
    phone: "+998712001199",
    specialties: ["radiology", "oncology"],
    freeScreening: false,
  },
  {
    name: "Farg'ona Viloyat Perinatal Markazi",
    address: "Farg'ona sh., Al-Farg'oniy ko'chasi 21",
    region: "Farg'ona",
    lat: 40.3894,
    lng: 71.7854,
    phone: "+998732441122",
    specialties: ["gynecology", "general"],
    freeScreening: false,
  },
  {
    name: "Farg'ona Onkologiya Dispanseri",
    address: "Farg'ona sh., Mustaqillik ko'chasi 45",
    region: "Farg'ona",
    lat: 40.3781,
    lng: 71.7843,
    phone: "+998732441234",
    specialties: ["oncology", "radiology"],
    freeScreening: true,
  },
  {
    name: "Marg'ilon Tuman Poliklinikasi",
    address: "Marg'ilon sh., Bobur ko'chasi 3",
    region: "Farg'ona",
    lat: 40.4713,
    lng: 71.7247,
    phone: "+998732881122",
    specialties: ["gynecology", "general"],
    freeScreening: true,
  },
  {
    name: "Samarqand Ayollar Konsultatsiyasi",
    address: "Samarqand sh., Registon ko'chasi 15",
    region: "Samarqand",
    lat: 39.6542,
    lng: 66.9597,
    phone: "+998662331122",
    specialties: ["gynecology"],
    freeScreening: false,
  },
  {
    name: "Samarqand Viloyat Onkologiya Markazi",
    address: "Samarqand sh., Amir Temur ko'chasi 62",
    region: "Samarqand",
    lat: 39.6270,
    lng: 66.9749,
    phone: "+998662331199",
    specialties: ["oncology", "radiology"],
    freeScreening: true,
  },
  {
    name: "Buxoro Diagnostika Klinikasi",
    address: "Buxoro sh., Bahouddin Naqshband ko'chasi 9",
    region: "Buxoro",
    lat: 39.7747,
    lng: 64.4286,
    phone: "+998652221122",
    specialties: ["radiology", "general"],
    freeScreening: false,
  },
  {
    name: "Andijon Onalar va Bolalar Sog'lig'i Markazi",
    address: "Andijon sh., Bobur shoh ko'chasi 100",
    region: "Andijon",
    lat: 40.7821,
    lng: 72.3442,
    phone: "+998742221122",
    specialties: ["gynecology", "general"],
    freeScreening: true,
  },
  {
    name: "Namangan Viloyat Ko'p Tarmoqli Klinikasi",
    address: "Namangan sh., Uychi ko'chasi 55",
    region: "Namangan",
    lat: 40.9983,
    lng: 71.6726,
    phone: "+998692221122",
    specialties: ["gynecology", "oncology", "radiology", "general"],
    freeScreening: false,
  },
];

const clinicsCount = db.prepare("SELECT COUNT(*) as count FROM clinics").get() as { count: number };
if (clinicsCount.count > 0) {
  console.log(`Klinikalar jadvalida allaqachon ${clinicsCount.count} ta yozuv bor — seed o'tkazib yuborildi.`);
} else {
  const insertClinic = db.prepare(
    `INSERT INTO clinics (id, name, address, region, lat, lng, phone, specialties, free_screening)
     VALUES (@id, @name, @address, @region, @lat, @lng, @phone, @specialties, @freeScreening)`
  );
  const insertClinics = db.transaction((clinics: SeedClinic[]) => {
    for (const c of clinics) {
      insertClinic.run({
        id: randomUUID(),
        name: c.name,
        address: c.address,
        region: c.region,
        lat: c.lat,
        lng: c.lng,
        phone: c.phone,
        specialties: JSON.stringify(c.specialties),
        freeScreening: c.freeScreening ? 1 : 0,
      });
    }
  });
  insertClinics(SEED_CLINICS);
  console.log(`${SEED_CLINICS.length} ta namunaviy klinika qo'shildi.`);
}

// ---------------------------------------------------------------------------
// Maqolalar — App.pdf §20. Umumiy ta'limiy matn, haqiqiy tibbiy kontent manbai
// EMAS — jamoa buni keyinroq professional tibbiy kontent bilan almashtirishi kerak.
// ---------------------------------------------------------------------------

interface SeedArticle {
  slug: string;
  category: ArticleCategory;
  title: string;
  excerpt: string;
  body: string;
}

const SEED_ARTICLES: SeedArticle[] = [
  {
    slug: "hayz-sikli-fazalari",
    category: "cycle",
    title: "Hayz sikli fazalari haqida oddiy tushuncha",
    excerpt: "Sikl nima uchun har oy o'zgaradi va bu nimani anglatadi?",
    body: "Hayz sikli to'rtta asosiy fazadan iborat: hayz, follikulyar faza, ovulyatsiya va lyuteal faza. Har bir faza gormonlar ta'sirida davom etadi va tananing turli o'zgarishlariga sabab bo'ladi. Sikl uzunligi ayoldan ayolga farq qiladi — 21 kundan 35 kungacha bo'lishi normal hisoblanadi. Agar sikllingiz doimiy ravishda 3 oydan ortiq tartibsiz bo'lsa, ginekolog bilan maslahatlashish tavsiya etiladi.",
  },
  {
    slug: "unumdor-kunlar-nima",
    category: "cycle",
    title: "Unumdor kunlar oynasi qanday hisoblanadi?",
    excerpt: "Homilador bo'lish ehtimoli eng yuqori bo'lgan kunlar haqida.",
    body: "Unumdor oyna — ovulyatsiyadan besh kun oldin va bir kun keyingi davrni o'z ichiga oladi, chunki erkak hujayralari ayol tanasida bir necha kun yashashi mumkin. Bu davrni aniq bilish homiladorlikni rejalashtirishda yoki, aksincha, undan saqlanishda foydali bo'lishi mumkin — lekin yagona ishonchli usul emas.",
  },
  {
    slug: "birinchi-trimestr",
    category: "pregnancy",
    title: "Birinchi trimestrda nimalarga e'tibor berish kerak",
    excerpt: "Homiladorlikning dastlabki 12 haftasida tana qanday o'zgaradi.",
    body: "Birinchi trimestr — homila uchun eng muhim rivojlanish davri. Bu davrda ko'ngil aynishi, charchoq va kayfiyat o'zgarishlari odatiy hol. Folat kislotasi qabul qilish, zararli odatlardan voz kechish va birinchi ko'rikka o'z vaqtida borish tavsiya etiladi. Har qanday og'riq yoki qon ketish alomati bo'lsa, darhol shifokorga murojaat qiling.",
  },
  {
    slug: "homiladorlikda-ovqatlanish",
    category: "pregnancy",
    title: "Homiladorlikda muvozanatli ovqatlanish",
    excerpt: "Ona va bola salomatligi uchun asosiy tamoyillar.",
    body: "Homiladorlik davrida ovqatlanish sifatiga e'tibor berish miqdoridan ko'ra muhimroq. Temir, kaltsiy va folat kislotasiga boy oziq-ovqatlar tavsiya etiladi. Xom baliq, pasterizatsiya qilinmagan mahsulotlar va ortiqcha kofeindan saqlanish kerak. Aniq dietani shifokoringiz bilan kelishib oling.",
  },
  {
    slug: "mammografiya-nima-uchun-kerak",
    category: "checkups",
    title: "Mammografiya skrining nima uchun muhim?",
    excerpt: "Ko'krak saratonini erta aniqlash hayot saqlab qoladi.",
    body: "Mammografiya — ko'krak to'qimasini rentgen nurlari yordamida tekshirish usuli bo'lib, saratonni klinik alomatlar paydo bo'lishidan ancha oldin aniqlashga yordam beradi. 40 yoshdan katta ayollarga muntazam skrining tavsiya etiladi, 45 yoshdan katta ayollar uchun ko'plab davlatlarda bu bepul dastur orqali taqdim etiladi.",
  },
  {
    slug: "ginekolog-korikka-tayyorgarlik",
    category: "checkups",
    title: "Ginekolog ko'rigiga qanday tayyorlanish kerak",
    excerpt: "Birinchi marta boradiganlar uchun oddiy maslahatlar.",
    body: "Ko'rikdan oldin qamish/dush ishlatmaslik, so'nggi hayz sanasini eslab qolish va savollaringizni oldindan yozib qo'yish foydali. Ko'rik odatda tez va og'riqsiz o'tadi. Har qanday noqulaylik yoki savolingiz bo'lsa, shifokoringizga ochiq gapirishdan tortinmang — bu ularning kundalik ishi.",
  },
];

const articlesCount = db.prepare("SELECT COUNT(*) as count FROM articles").get() as { count: number };
if (articlesCount.count > 0) {
  console.log(`Maqolalar jadvalida allaqachon ${articlesCount.count} ta yozuv bor — seed o'tkazib yuborildi.`);
} else {
  const insertArticle = db.prepare(
    `INSERT INTO articles (id, slug, category, title, excerpt, body) VALUES (@id, @slug, @category, @title, @excerpt, @body)`
  );
  const insertArticles = db.transaction((articles: SeedArticle[]) => {
    for (const a of articles) insertArticle.run({ id: randomUUID(), ...a });
  });
  insertArticles(SEED_ARTICLES);
  console.log(`${SEED_ARTICLES.length} ta namunaviy maqola qo'shildi.`);
}
