// Homiladorlik hisob-kitoblari — spec §3: tug'ilish sanasi kalkulyatori, joriy hafta.
// Standart tibbiy qoida: homiladorlik oxirgi hayz sanasidan (LMP) 280 kun (40 hafta) davom etadi.

import type { PregnancyProfile, VitalType } from "../types";

const PREGNANCY_DAYS = 280;

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round(
    (new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / msPerDay
  );
}

export function dueDateFromLmp(lastMenstrualPeriod: string): string {
  return addDays(lastMenstrualPeriod, PREGNANCY_DAYS);
}

export function lmpFromDueDate(dueDate: string): string {
  return addDays(dueDate, -PREGNANCY_DAYS);
}

export interface PregnancyStatus {
  dueDate: string;
  lastMenstrualPeriod: string;
  currentWeek: number; // 1-42
  currentDay: number; // shu hafta ichidagi kun, 0-6
  trimester: 1 | 2 | 3;
  daysRemaining: number;
}

export function getPregnancyStatus(
  profile: Pick<PregnancyProfile, "lastMenstrualPeriod" | "dueDate">,
  today: string = new Date().toISOString().slice(0, 10)
): PregnancyStatus | null {
  const lmp = profile.lastMenstrualPeriod ?? (profile.dueDate ? lmpFromDueDate(profile.dueDate) : null);
  const dueDate = profile.dueDate ?? (profile.lastMenstrualPeriod ? dueDateFromLmp(profile.lastMenstrualPeriod) : null);
  if (!lmp || !dueDate) return null;

  const elapsedDays = Math.max(0, daysBetween(lmp, today));
  const currentWeek = Math.min(42, Math.floor(elapsedDays / 7) + 1);
  const currentDay = elapsedDays % 7;
  const trimester: 1 | 2 | 3 = currentWeek <= 13 ? 1 : currentWeek <= 27 ? 2 : 3;
  const daysRemaining = Math.max(0, daysBetween(today, dueDate));

  return { dueDate, lastMenstrualPeriod: lmp, currentWeek, currentDay, trimester, daysRemaining };
}

// Haftalik o'lcham taqqoslash — spec §3: "bolangiz hozir limon kattaligida" formati.
// Har bir bosqich bir nechta haftani qamrab oladi (haqiqiy 40 ta noyob illyustratsiya
// o'rniga ~12 ta bosqich — placeholder, keyin dizayner tomonidan almashtiriladi).
export interface WeeklyMilestone {
  fromWeek: number;
  toWeek: number;
  sizeComparisonKey: string; // i18n kaliti, masalan "size.poppySeed"
  icon: string; // shared/illustrations dagi SVG kaliti
}

export const PREGNANCY_MILESTONES: WeeklyMilestone[] = [
  { fromWeek: 1, toWeek: 4, sizeComparisonKey: "size.poppySeed", icon: "seed" },
  { fromWeek: 5, toWeek: 8, sizeComparisonKey: "size.raspberry", icon: "raspberry" },
  { fromWeek: 9, toWeek: 12, sizeComparisonKey: "size.lime", icon: "lime" },
  { fromWeek: 13, toWeek: 16, sizeComparisonKey: "size.lemon", icon: "lemon" },
  { fromWeek: 17, toWeek: 20, sizeComparisonKey: "size.avocado", icon: "avocado" },
  { fromWeek: 21, toWeek: 24, sizeComparisonKey: "size.corn", icon: "corn" },
  { fromWeek: 25, toWeek: 28, sizeComparisonKey: "size.eggplant", icon: "eggplant" },
  { fromWeek: 29, toWeek: 32, sizeComparisonKey: "size.coconut", icon: "coconut" },
  { fromWeek: 33, toWeek: 36, sizeComparisonKey: "size.pineapple", icon: "pineapple" },
  { fromWeek: 37, toWeek: 40, sizeComparisonKey: "size.watermelon", icon: "watermelon" },
  { fromWeek: 41, toWeek: 42, sizeComparisonKey: "size.watermelon", icon: "watermelon" },
];

export function getMilestoneForWeek(week: number): WeeklyMilestone {
  return (
    PREGNANCY_MILESTONES.find((m) => week >= m.fromWeek && week <= m.toWeek) ??
    PREGNANCY_MILESTONES[PREGNANCY_MILESTONES.length - 1]
  );
}

// Haftalik o'lcham uchun AYLANTIRISH MUMKIN 3D model (foydalanuvchi so'rovi:
// "3D rasmlarni qo'yish"). Haqiqiy tibbiy-realistik embrion/fetus 3D modellari
// tekshirildi — deyarli hammasi pullik ekan (Sketchfab/CGTrader/TurboSquid
// Store), bepul topilmadi. Foydalanuvchi bilan kelishilgan holda "yumshoq/
// mehribon" uslubga o'tildi — mevalar bilan o'lcham taqqoslash (aksariyat
// homiladorlik ilovalarida mashhur naqsh), poly.pizza'dan CC-BY 3.0 litsenziyali
// (attribution: "Poly by Google") past-poligonli GLB modellar — ilova
// `apps/web/public/models/fruit/<key>.glb`'da joylashgan, WEB'da to'g'ridan-
// to'g'ri, MOBIL'da shu manzilga WebView orqali murojaat qilinadi (ikkalasi
// ham bitta joyni ishlatadi, dublikat yo'q). Har bir icon uchun ANIQ mos meva
// topilmagan joylarda (masalan "lime"/"corn"/"eggplant") o'lcham/shakl
// jihatdan eng yaqin muqobil ishlatilgan (11 ta yuklangan modeldan).
export const PREGNANCY_3D_MODEL_BY_ICON: Record<string, string> = {
  seed: "blueberries",
  raspberry: "grapes",
  lime: "orange",
  lemon: "lemon",
  avocado: "avocado",
  corn: "banana",
  eggplant: "papaya",
  coconut: "coconut",
  pineapple: "pineapple",
  watermelon: "watermelon",
};

/** GLB fayl nomi (kengaytmasiz) — platforma o'zi to'liq URL quradi: web
 * nisbiy `/models/fruit/<key>.glb` (o'z origin'idan, local dev'da ham
 * ishlaydi), mobil esa doim `https://mammo.uz/models/fruit/<key>.glb`
 * (statik fayllar faqat web ilovada joylashgan, alohida CDN yo'q). */
export function get3dModelKeyForIcon(icon: string): string {
  return PREGNANCY_3D_MODEL_BY_ICON[icon] ?? "lemon";
}

// "Sog'liq ko'rsatkichlari" — foydalanuvchi o'zi kiritgan qiymatning keng tarqalgan
// "normal" oralig'ida ekanini yumshoq ko'rsatish (tibbiy tashxis EMAS, faqat umumiy
// yo'naltiruvchi belgi — App.pdf'dagi xavf-testi bilan bir xil ehtiyotkorlik).
export type VitalTone = "normal" | "attention";

export function getVitalTone(type: VitalType, value: string): VitalTone | null {
  if (type === "weight") return null; // vazn uchun "normal/e'tibor" emas, o'zgarish (delta) ko'rsatiladi
  if (type === "heart_rate") {
    const bpm = Number(value);
    if (Number.isNaN(bpm)) return null;
    return bpm >= 60 && bpm <= 100 ? "normal" : "attention";
  }
  if (type === "temperature") {
    const c = Number(value);
    if (Number.isNaN(c)) return null;
    return c >= 36.1 && c <= 37.2 ? "normal" : "attention";
  }
  if (type === "blood_pressure") {
    const match = /^(\d{2,3})\/(\d{2,3})$/.exec(value);
    if (!match) return null;
    const sys = Number(match[1]);
    const dia = Number(match[2]);
    return sys >= 90 && sys <= 120 && dia >= 60 && dia <= 80 ? "normal" : "attention";
  }
  return null;
}
