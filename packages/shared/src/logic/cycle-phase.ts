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
export function getCyclePhase(
  dayInCycle: number,
  cycleLength: number,
  periodLength: number,
  /** CYCLE-ALGO-24: ovulyatsiyadan keyingi (lyuteal) faza uzunligi. Ilgari bu
   * yerda 14 QAT'IY yozilgan edi, `forecastCycles` esa foydalanuvchining
   * SHAXSIY lyuteal fazasini (BBT/simptomlardan o'rganilgan) ishlatardi —
   * ya'ni kalendardagi ovulyatsiya belgisi va shu funksiya aytadigan faza
   * bir-biriga to'g'ri kelmasligi mumkin edi. Standart qiymat o'zgarmadi,
   * shuning uchun uzatmaydigan chaqiruvchilar uchun hech narsa o'zgarmaydi. */
  lutealPhaseDays: number = 14
): CyclePhase {
  // FIX2-18: ilgari "hayz" sharti ("dayInCycle <= periodLength") HAR DOIM
  // birinchi tekshirilardi — agar periodLength katta bo'lsa (masalan
  // cycleLength=21, periodLength=8 — ikkalasi ham to'liq normal qiymatlar),
  // ovulyatsiya oynasi (kun 6-8) TO'LIQ hayz oralig'iga tushib qolib,
  // "follikulyar"/"ovulyatsiya" hech qachon qaytmasdi. Endi ovulyatsiya
  // oynasi periodLength'dan MUSTAQIL, birinchi navbatda tekshiriladi.
  const ovulationDay = cycleLength - lutealPhaseDays;
  if (dayInCycle >= ovulationDay - 1 && dayInCycle <= ovulationDay + 1) return "ovulation";

  if (dayInCycle <= periodLength) return "menstrual";
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
