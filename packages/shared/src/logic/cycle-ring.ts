import { daysBetween } from "./cycle";

/**
 * CYCLE-RING-01 — bosh ekrandagi sikl halqasi.
 *
 * Nega kerak: hozir hero'ning o'rtasida faqat ikki qator matn turadi
 * ("Keyingi hayz: 3 kun") va uning atrofida ~500 px BO'SH joy qoladi.
 * Referenslarning uchalasida ham (Flo, Lalu, Mom+) aynan shu joyda
 * halqa turadi va u bitta raqamdan ko'ra ko'proq narsa aytadi: ayol
 * siklning QAYERIDA turganini, hayz va unumdor kunlar qachonligini
 * bir qarashda ko'radi.
 *
 * Bu modul faqat GEOMETRIYA bilan shug'ullanadi — rang va o'lchamlar
 * komponentda. Sababi oddiy: burchak hisobi xato bo'lsa, u jimgina
 * noto'g'ri kun ko'rsatadi, shuning uchun u testlar bilan qoplanadi.
 */

export interface CycleRingInput {
  today: string;
  lastPeriodStart: string;
  cycleLength: number;
  periodLength: number;
  fertileWindowStart: string;
  fertileWindowEnd: string;
  ovulationDay: string;
}

export interface RingSegment {
  kind: "period" | "fertile";
  /** Halqa bo'ylab 0..1 (0 — siklning 1-kuni, soat 12 yo'nalishi). */
  from: number;
  to: number;
}

export interface CycleRing {
  /** Siklning nechanchi kuni (1 dan boshlanadi). */
  cycleDay: number;
  cycleLength: number;
  /** Joriy kunning halqadagi o'rni, 0..1. */
  progress: number;
  segments: RingSegment[];
  /** Ovulyatsiya kunining halqadagi o'rni, 0..1 (bilinmasa null). */
  ovulationAt: number | null;
  /** Sikl kutilganidan uzoq davom etyapti — halqa to'liq aylangan. */
  overdue: boolean;
}

/** Kun raqamini (1 dan) halqadagi 0..1 o'rniga aylantiradi. */
function dayToFraction(day: number, cycleLength: number): number {
  return Math.max(0, Math.min(1, (day - 1) / cycleLength));
}

export function buildCycleRing(input: CycleRingInput): CycleRing | null {
  const cycleLength = Math.round(input.cycleLength);
  if (!Number.isFinite(cycleLength) || cycleLength < 15 || cycleLength > 60) return null;

  const dayIndex = daysBetween(input.lastPeriodStart, input.today);
  if (!Number.isFinite(dayIndex) || dayIndex < 0) return null;

  // Kechikkan siklda halqa oxirida TURADI, boshiga qaytmaydi: aks holda
  // 3 kun kechikkan ayol o'zini siklning boshida ko'rib, hammasi
  // joyidadek tuyulardi.
  const overdue = dayIndex + 1 > cycleLength;
  const cycleDay = dayIndex + 1;
  const progress = overdue ? 1 : dayToFraction(cycleDay, cycleLength);

  const segments: RingSegment[] = [];

  const periodLength = Math.max(1, Math.round(input.periodLength));
  segments.push({ kind: "period", from: 0, to: dayToFraction(periodLength + 1, cycleLength) });

  // Unumdor oyna sanalar orqali beriladi (bashorat bilan bir manbadan),
  // shuning uchun u kun raqamiga qaytariladi — halqa va kalendar bir xil
  // gapirishi uchun.
  const fertileFromDay = daysBetween(input.lastPeriodStart, input.fertileWindowStart) + 1;
  const fertileToDay = daysBetween(input.lastPeriodStart, input.fertileWindowEnd) + 1;
  if (fertileToDay >= fertileFromDay && fertileFromDay >= 1 && fertileFromDay <= cycleLength) {
    segments.push({
      kind: "fertile",
      from: dayToFraction(fertileFromDay, cycleLength),
      to: dayToFraction(Math.min(fertileToDay + 1, cycleLength + 1), cycleLength),
    });
  }

  const ovulationDayNumber = daysBetween(input.lastPeriodStart, input.ovulationDay) + 1;
  const ovulationAt =
    ovulationDayNumber >= 1 && ovulationDayNumber <= cycleLength
      ? dayToFraction(ovulationDayNumber, cycleLength)
      : null;

  return { cycleDay, cycleLength, progress, segments, ovulationAt, overdue };
}
