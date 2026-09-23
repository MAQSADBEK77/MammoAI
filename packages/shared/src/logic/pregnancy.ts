// Homiladorlik hisob-kitoblari — spec §3: tug'ilish sanasi kalkulyatori, joriy hafta.
// Standart tibbiy qoida: homiladorlik oxirgi hayz sanasidan (LMP) 280 kun (40 hafta) davom etadi.

import type { PregnancyProfile, VitalType } from "../types";
import { tashkentDateStr } from "../date";
import { addDays, daysBetween } from "./cycle";

const PREGNANCY_DAYS = 280;

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
  today: string = tashkentDateStr()
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

// ---------------------------------------------------------------------------
// PREG-STATE-01 — "Ayol hozir homiladormi?" savoliga YAGONA javob manbai.
//
// Topilgan xato: `pregnancy_profiles` jadvalidagi qator "homilador" degani
// deb qabul qilinardi. Aslida u — tug'ilish sanasi KALKULYATORINING
// saqlangan kiritmasi: homiladorlikni REJALASHTIRAYOTGAN ayol ham uni
// to'ldiradi, keyin rejimni almashtirgan ayolda ham qatorlar qolib ketadi.
//
// Production o'lchovi (2026-09-23): 14 ta homiladorlik yozuvining 11 tasi
// homilador BO'LMAGAN ayollarga tegishli edi (5 tasi — "homiladorlikni
// rejalashtirish" rejimida). Oqibatlari uch joyda ko'rindi:
//   1. AI yordamchi ularga "siz homiladorsiz, 1-hafta" deb aytardi;
//   2. tekshiruvlar ro'yxatiga homiladorlik bandlari qo'shilardi;
//   3. kundalik eslatmalar BUTUNLAY to'xtardi (jimgina).
//
// Yagona haqiqat manbai — ayolning O'ZI profilda belgilagan holati
// (`onboarding_profiles.is_pregnant`, "Rejim" tanlovi bilan birga
// o'rnatiladi). Production'da bu bayroq to'liq izchil: `true` faqat
// `primary_goal = 'pregnancy'` bo'lganlarda.
// ---------------------------------------------------------------------------

/** Tug'ruqdan keyingi davr — taxminiy sanadan keyingi 42 kun. */
export const POSTPARTUM_WINDOW_DAYS = 42;
/** Taxminiy sanadan keyin homiladorlik bandlari darhol yo'qolmasligi uchun
 * "sabr oynasi" — haqiqiy tug'ruq taxminiy sanadan bir necha kun/hafta
 * kechikishi tabiiy hol. */
export const POSTPARTUM_GRACE_DAYS = 14;

export interface PregnancyStateInput {
  /** Ayolning O'ZI belgilagan holat (profil/rejim tanlovi). */
  declaredPregnant: boolean;
  /** Tug'ilish sanasi kalkulyatorining saqlangan kiritmasi — bu O'Z-O'ZIDAN
   * homiladorlik belgisi EMAS. */
  profile: Pick<PregnancyProfile, "lastMenstrualPeriod" | "dueDate"> | null;
}

export interface PregnancyState {
  /** Homiladorlik bandlarini/kontekstini yoqadigan yagona bayroq. */
  isPregnant: boolean;
  isPostpartum: boolean;
  /** Taxminiy sanadan o'tgan kunlar (manfiy — hali yetib kelmagan). */
  daysSinceDue: number | null;
  /** Hafta/trimestr — FAQAT `isPregnant` true bo'lganda to'ldiriladi. */
  status: PregnancyStatus | null;
}

export function resolvePregnancyState(input: PregnancyStateInput, today: string = tashkentDateStr()): PregnancyState {
  const { declaredPregnant, profile } = input;
  const dueDate = profile?.dueDate ?? (profile?.lastMenstrualPeriod ? dueDateFromLmp(profile.lastMenstrualPeriod) : null);
  const daysSinceDue = dueDate ? daysBetween(dueDate, today) : null;

  // Tug'ruqdan keyingi davr ATAYLAB `declaredPregnant`ga bog'lanmagan:
  // tug'ib bo'lgan ayol rejimini almashtirgan bo'lsa ham, unga tug'ruqdan
  // keyingi tekshiruvlar (6-haftalik ko'rik, depressiya skrininggi) kerak
  // bo'lib qolaveradi.
  const isPostpartum = daysSinceDue !== null && daysSinceDue > POSTPARTUM_GRACE_DAYS && daysSinceDue <= POSTPARTUM_WINDOW_DAYS;

  const isPregnant = declaredPregnant && !isPostpartum;
  return {
    isPregnant,
    isPostpartum,
    daysSinceDue,
    status: isPregnant && profile ? getPregnancyStatus(profile, today) : null,
  };
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

// Haftalik rasm — foydalanuvchi o'zi AI orqali generatsiya qilgan, har hafta
// uchun alohida embrion/fetus rasmi (huquqi o'zida — avval tekshirilgan
// litsenziyali/pullik 3D model va noma'lum manbali internet-rasm variantlari
// rad etilgandan keyin shu yechimga kelindi). `week2` fayli yo'q (to'plamda
// yetishmaydi) — eng yaqin haftaga (1) tushadi. Fayllar
// `apps/web/public/embryo/week<N>.jpg`'da, WEB'da to'g'ridan-to'g'ri,
// MOBIL'da `https://mammo.uz/embryo/week<N>.jpg` orqali (statik fayllar
// faqat web ilovada joylashgan, alohida CDN yo'q — 3D meva modellari bilan
// bir xil naqsh).
const EMBRYO_MISSING_WEEKS: Record<number, number> = { 2: 1 };

/** 1-42 oralig'iga qisqartiradi va yo'q haftani eng yaqiniga almashtiradi —
 * chaqiruvchi hech qachon mavjud bo'lmagan fayl nomini olmasligi kafolatlanadi. */
export function getEmbryoImageWeek(week: number): number {
  const clamped = Math.min(42, Math.max(1, Math.round(week)));
  return EMBRYO_MISSING_WEEKS[clamped] ?? clamped;
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
