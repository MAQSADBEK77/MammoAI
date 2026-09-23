// REPORT-01 — shifokor uchun hisobot.
//
// Nega bu eng yuqori ustuvorlikdagi Premium funksiyasi:
//
// Ayol ginekolog qabuliga kiradi va birinchi savol har doim bir xil:
// "oxirgi hayzingiz qachon edi, sikllaringiz qanday?". U xotiradan
// javob berishga urinadi — noaniq, ba'zan xato. Qabul vaqti qisqa,
// yozuvlar qog'ozda. Natijada shifokor eng muhim ma'lumotsiz qaror
// qabul qiladi.
//
// Bizda bu ma'lumot ALLAQACHON bor. Uni bir sahifalik, o'qishga tayyor
// xulosaga aylantirish — eng katta qiymat beradigan eng kichik ish.
// (Flo'da ham shunday funksiya bor va u eng ko'p maqtaladiganlaridan;
// bizda esa u yanada qimmatroq, chunki bu yerda raqamli tibbiy yozuv
// tizimi yo'q.)
//
// Bu modul SOF: ma'lumotni oladi va tuzilma qaytaradi. Matn tarjimasi
// va chop etish ko'rinishi mijozda.

import type { ChecklistItem, CycleLog, InsightsSummary, OnboardingProfile, Symptom } from "../types";
import { computeCycleLengths, detectPeriodStarts } from "./cycle";

export interface DoctorReportSymptom {
  symptom: Symptom;
  /** Necha ALOHIDA kunda qayd etilgan. */
  days: number;
}

export interface DoctorReportCheckup {
  type: ChecklistItem["type"];
  status: ChecklistItem["status"];
  dueDate: string | null;
  completedAt: string | null;
}

export interface DoctorReport {
  generatedAt: string;
  /** Hisobot qamragan davr — boshi va oxiri (yozuvlar bo'yicha). */
  periodCovered: { from: string; to: string } | null;
  age: number | null;
  /** Oxirgi hayz boshlangan sana — shifokorning BIRINCHI savoli. */
  lastPeriodStart: string | null;
  /** Kuzatilgan sikl uzunliklari (kun). */
  cycleLengths: number[];
  averageCycleLength: number | null;
  /** Eng qisqa va eng uzun sikl — muntazamlikni bir qarashda ko'rsatadi. */
  shortestCycle: number | null;
  longestCycle: number | null;
  /** Qayd etilgan sikllar soni — ishonch darajasi uchun. */
  cyclesObserved: number;
  loggedDays: number;
  /** Eng ko'p uchragan simptomlar (kamayish tartibida, ko'pi bilan 8 ta). */
  topSymptoms: DoctorReportSymptom[];
  /** Ayol o'zi ko'rsatgan sog'liq holatlari. */
  healthConditions: string[];
  familyHistory: boolean | null;
  /** Muddati o'tgan va kutilayotgan tekshiruvlar — suhbat uchun ro'yxat. */
  overdueCheckups: DoctorReportCheckup[];
  completedCheckups: DoctorReportCheckup[];
  /** Ma'lumot kamligi haqida ogohlantirish kerakmi. */
  hasLimitedData: boolean;
}

const MAX_SYMPTOMS = 8;
/** Shundan kam sikl kuzatilgan bo'lsa, xulosa chiqarish erta — hisobotda
 * shu ochiq aytiladi, aks holda shifokor uni haqiqiy o'lchov deb qabul
 * qilishi mumkin. */
const MIN_CYCLES_FOR_CONFIDENCE = 3;

export interface DoctorReportInput {
  today: string;
  profile: Pick<OnboardingProfile, "age" | "healthConditions" | "familyHistory"> | null;
  logs: CycleLog[];
  checklist: ChecklistItem[];
  summary: InsightsSummary | null;
}

export function buildDoctorReport(input: DoctorReportInput): DoctorReport {
  const { today, profile, logs, checklist } = input;

  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const periodStarts = detectPeriodStarts(sorted);
  const cycleLengths = computeCycleLengths(sorted);

  const symptomDays = new Map<Symptom, number>();
  for (const log of sorted) {
    for (const symptom of log.symptoms) {
      symptomDays.set(symptom, (symptomDays.get(symptom) ?? 0) + 1);
    }
  }

  const topSymptoms = [...symptomDays.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_SYMPTOMS)
    .map(([symptom, days]) => ({ symptom, days }));

  const toReportCheckup = (item: ChecklistItem): DoctorReportCheckup => ({
    type: item.type,
    status: item.status,
    dueDate: item.dueDate,
    completedAt: item.completedAt,
  });

  const average =
    cycleLengths.length > 0 ? Math.round(cycleLengths.reduce((sum, n) => sum + n, 0) / cycleLengths.length) : null;

  return {
    generatedAt: today,
    periodCovered: sorted.length > 0 ? { from: sorted[0].date, to: sorted[sorted.length - 1].date } : null,
    age: profile?.age ?? null,
    lastPeriodStart: periodStarts.length > 0 ? periodStarts[periodStarts.length - 1] : null,
    cycleLengths,
    averageCycleLength: average,
    shortestCycle: cycleLengths.length > 0 ? Math.min(...cycleLengths) : null,
    longestCycle: cycleLengths.length > 0 ? Math.max(...cycleLengths) : null,
    cyclesObserved: cycleLengths.length,
    loggedDays: sorted.length,
    topSymptoms,
    healthConditions: profile?.healthConditions ?? [],
    familyHistory: profile?.familyHistory ?? null,
    // Muddati o'tganlar birinchi — suhbat aynan shulardan boshlanishi kerak.
    overdueCheckups: checklist.filter((i) => i.status === "overdue").map(toReportCheckup),
    completedCheckups: checklist.filter((i) => i.status === "done").map(toReportCheckup),
    hasLimitedData: cycleLengths.length < MIN_CYCLES_FOR_CONFIDENCE,
  };
}
