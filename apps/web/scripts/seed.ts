// Namunaviy klinikalar bazasi — spec §5: "Yandex Maps'dan ko'chirish tavsiya etilmaydi".
// Bu haqiqiy hamkorlik ma'lumoti EMAS — jamoa 50-100 ta haqiqiy klinika bilan almashtirishi
// kerak bo'lgan demo yozuvlar (shuning uchun umumiy, tavsifiy nomlar ishlatilgan).

import { randomUUID } from "node:crypto";
import { db } from "../src/server/db";
import type { ClinicSpecialty } from "@mammoai/shared";

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

const existing = db.prepare("SELECT COUNT(*) as count FROM clinics").get() as { count: number };
if (existing.count > 0) {
  console.log(`Klinikalar jadvalida allaqachon ${existing.count} ta yozuv bor — seed o'tkazib yuborildi.`);
  process.exit(0);
}

const insert = db.prepare(
  `INSERT INTO clinics (id, name, address, region, lat, lng, phone, specialties, free_screening)
   VALUES (@id, @name, @address, @region, @lat, @lng, @phone, @specialties, @freeScreening)`
);

const insertMany = db.transaction((clinics: SeedClinic[]) => {
  for (const c of clinics) {
    insert.run({
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

insertMany(SEED_CLINICS);
console.log(`${SEED_CLINICS.length} ta namunaviy klinika qo'shildi.`);
