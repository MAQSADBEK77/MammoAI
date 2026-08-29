// Tsikl fazasi — Figma "Make" manbasida ko'rilgan "Follikul fazasi" / "Ovulyatsiya
// bo'ldi" kabi faza kartalari uchun sof funksiya. ML kerak emas — oddiy kun-oralig'i
// qoidasi (predictCycle bilan bir xil mantiq: ovulyatsiya taxminan tsikl oxiridan
// 14 kun oldin).

export type CyclePhase = "menstrual" | "follicular" | "ovulation" | "luteal";

export type FertilityLevel = "low" | "medium" | "high";

/**
 * @param dayInCycle 1-based kun raqami (1 = oxirgi hayzning birinchi kuni).
 * @param cycleLength o'rtacha tsikl uzunligi (kun).
 * @param periodLength o'rtacha hayz davomiyligi (kun).
 */
export function getCyclePhase(dayInCycle: number, cycleLength: number, periodLength: number): CyclePhase {
  if (dayInCycle <= periodLength) return "menstrual";

  const ovulationDay = cycleLength - 14;
  if (dayInCycle >= ovulationDay - 1 && dayInCycle <= ovulationDay + 1) return "ovulation";

  if (dayInCycle < ovulationDay) return "follicular";
  return "luteal";
}

export function getFertilityLevel(phase: CyclePhase): FertilityLevel {
  switch (phase) {
    case "ovulation":
      return "high";
    case "follicular":
      return "medium";
    default:
      return "low";
  }
}
