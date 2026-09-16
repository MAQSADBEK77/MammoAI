// Bosh sahifadagi (login talab qilmaydigan) ochiq kalkulyatorlar — LANDING-CALC
// ishi (2026-09-16). lalu.uz'dagi "ro'yxatdan o'tmasdan ishlaydigan" 4 ta
// kalkulyator (tug'ilish sanasi, ovulyatsiya, haftadan oyga, XGCH) MammoAI'da
// ilova ichida FAQAT haqiqiy foydalanuvchi ma'lumotiga bog'liq holda ishlaydi
// (predictCycle/getPregnancyStatus). Bu fayl ular bilan bir xil standart
// akusherlik arifmetikasidan foydalanadigan, lekin hech qanday saqlangan
// tarixga muhtoj bo'lmagan, mustaqil (stateless) versiyalarini beradi —
// faqat bosh sahifa uchun, ilova ichidagi haqiqiy bashorat pipeline'iga
// (cycle.ts#predictCycle) taʼsir qilmaydi va undan foydalanmaydi.
//
// MUHIM: bularning barchasi umumiy tibbiy formulalar/ma'lumotnoma jadvallar —
// tashxis EMAS. Har bir natija UIда aniq ogohlantirish bilan ko'rsatilishi kerak.

import { addDays, daysBetween, DEFAULT_CYCLE_LENGTH, DEFAULT_LUTEAL_PHASE_DAYS } from "./cycle";
import { dueDateFromLmp, getPregnancyStatus } from "./pregnancy";

// ---------------------------------------------------------------------------
// 1) Tug'ilish sanasi — oxirgi hayz sanasidan (LMP) standart 280 kun qoidasi
//    (pregnancy.ts'dagi bilan bir xil formula, faqat "joriy holat" uchun
//    saqlangan profil emas, xom sana kiritiladi).
// ---------------------------------------------------------------------------
export interface DueDateEstimate {
  dueDate: string;
  currentWeek: number;
  trimester: 1 | 2 | 3;
  daysRemaining: number;
}

export function calcDueDateEstimate(lastMenstrualPeriod: string, today: string): DueDateEstimate | null {
  if (!lastMenstrualPeriod) return null;
  const status = getPregnancyStatus({ lastMenstrualPeriod, dueDate: dueDateFromLmp(lastMenstrualPeriod) }, today);
  if (!status) return null;
  return { dueDate: status.dueDate, currentWeek: status.currentWeek, trimester: status.trimester, daysRemaining: status.daysRemaining };
}

// ---------------------------------------------------------------------------
// 2) Ovulyatsiya va unumdor oyna — standart "orqaga hisoblash" qoidasi:
//    ovulyatsiya = keyingi hayz sanasi − lyuteal faza (odatda 14 kun),
//    unumdor oyna = ovulyatsiyadan 5 kun oldin — 1 kun keyin (spermaning ~5
//    kunlik va tuxum hujayraning ~24 soatlik yashash muddatiga asoslangan,
//    xuddi cycle.ts#predictCycle'dagi bilan bir xil andozadan foydalanadi).
// ---------------------------------------------------------------------------
export interface OvulationEstimate {
  ovulationDate: string;
  fertileWindowStart: string;
  fertileWindowEnd: string;
  nextPeriodDate: string;
}

export function calcOvulationEstimate(
  lastPeriodStart: string,
  cycleLength: number = DEFAULT_CYCLE_LENGTH,
  lutealPhaseDays: number = DEFAULT_LUTEAL_PHASE_DAYS
): OvulationEstimate | null {
  if (!lastPeriodStart || cycleLength < 15 || cycleLength > 60) return null;
  const nextPeriodDate = addDays(lastPeriodStart, cycleLength);
  const ovulationDate = addDays(nextPeriodDate, -lutealPhaseDays);
  return {
    ovulationDate,
    fertileWindowStart: addDays(ovulationDate, -5),
    fertileWindowEnd: addDays(ovulationDate, 1),
    nextPeriodDate,
  };
}

// ---------------------------------------------------------------------------
// 3) Haftadan oyga — homiladorlik haftasini "oy"ga (ko'pchilik ota-onalar
//    uchun tushunarliroq birlik) aylantirish. Yagona rasmiy tibbiy standart
//    yo'q — bu yerda eng keng tarqalgan, sodda qoida ishlatilgan: har 4 hafta
//    = 1 oy (10-oy = 37-40 hafta). Faqat umumiy yo'naltiruvchi, aniq
//    kalendar oyi emas.
// ---------------------------------------------------------------------------
export function calcPregnancyMonth(week: number): number {
  const clamped = Math.min(42, Math.max(1, Math.round(week)));
  return Math.min(10, Math.ceil(clamped / 4));
}

// ---------------------------------------------------------------------------
// 4) XGCH (hCG) ma'lumotnoma jadvali — LMP'dan hisoblangan hafta bo'yicha
//    qonda kutilgan hCG darajasining KENG tarqalgan diapazoni. Manba:
//    American Pregnancy Association'ning ommaviy nashr etilgan hCG jadvali
//    (mIU/mL) — laboratoriyadan-laboratoriyaga sezilarli farq qilishi
//    mumkin bo'lgan JUDA keng oraliq, tashxis uchun EMAS.
// ---------------------------------------------------------------------------
export interface HcgReferenceRow {
  minWeek: number;
  maxWeek: number;
  weekLabel: string;
  min: number;
  max: number;
}

export const HCG_REFERENCE_TABLE: HcgReferenceRow[] = [
  { minWeek: 3, maxWeek: 3, weekLabel: "3 hafta", min: 5, max: 50 },
  { minWeek: 4, maxWeek: 4, weekLabel: "4 hafta", min: 5, max: 426 },
  { minWeek: 5, maxWeek: 5, weekLabel: "5 hafta", min: 19, max: 7340 },
  { minWeek: 6, maxWeek: 6, weekLabel: "6 hafta", min: 1080, max: 56500 },
  { minWeek: 7, maxWeek: 8, weekLabel: "7–8 hafta", min: 7650, max: 229000 },
  { minWeek: 9, maxWeek: 12, weekLabel: "9–12 hafta", min: 25700, max: 288000 },
  { minWeek: 13, maxWeek: 16, weekLabel: "13–16 hafta", min: 13300, max: 254000 },
  { minWeek: 17, maxWeek: 24, weekLabel: "17–24 hafta", min: 4060, max: 165400 },
  { minWeek: 25, maxWeek: 42, weekLabel: "25+ hafta", min: 3640, max: 117000 },
];

export function getHcgReferenceRange(week: number): HcgReferenceRow | null {
  return HCG_REFERENCE_TABLE.find((row) => week >= row.minWeek && week <= row.maxWeek) ?? null;
}

/** LMP sanasidan hozirgi haftani hisoblab, mos hCG qatorini qaytaradi. */
export function calcHcgEstimateFromLmp(lastMenstrualPeriod: string, today: string): (HcgReferenceRow & { currentWeek: number }) | null {
  if (!lastMenstrualPeriod) return null;
  const elapsedDays = daysBetween(lastMenstrualPeriod, today);
  if (elapsedDays < 0) return null;
  const currentWeek = Math.floor(elapsedDays / 7) + 1;
  const row = getHcgReferenceRange(currentWeek);
  return row ? { ...row, currentWeek } : null;
}
