// App.pdf §5 — foydalanuvchi tanlagan maqsadga qarab qaysi asosiy bo'limga
// yo'naltirilishi kerakligini aniqlaydi. Platformaga xos yo'l emas, mavhum
// "tab" qaytaradi — web/mobil har biri o'z yo'liga map qiladi.

import type { Goal } from "../types";

export type LandingTab = "cycle" | "pregnancy" | "checkups";

export function goalToLandingTab(goal: Goal): LandingTab {
  if (goal === "pregnancy" || goal === "planning_pregnancy") return "pregnancy";
  if (goal === "checkups") return "checkups";
  return "cycle"; // cycle, wellbeing, understand_body, skin
}

/** 18+ va <18 uchun alohida maqsad ro'yxati (App.pdf §5). */
export const ADULT_GOALS: Goal[] = ["cycle", "pregnancy", "planning_pregnancy", "wellbeing", "checkups"];
export const MINOR_GOALS: Goal[] = ["cycle", "understand_body", "skin"];

export function isPregnancyGoal(goal: Goal): boolean {
  return goal === "pregnancy";
}

export function needsHeightWeight(goal: Goal): boolean {
  return goal === "pregnancy" || goal === "planning_pregnancy";
}

export function needsCycleInfo(goal: Goal): boolean {
  return goal !== "pregnancy";
}
