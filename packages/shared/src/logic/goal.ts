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

export interface ModeAccentColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
}

/**
 * Rejim (goal) bo'yicha brend rangi — Figma referens: mode almashganda butun
 * ilova rangi butunlay boshqa rangga o'tadi. Qiymatlar yangi palitra emas —
 * design-tokens.ts'dagi mavjud secondary/accent ranglaridan olingan, faqat
 * qaysi biri "primary" bo'lishi rejimga qarab almashadi.
 */
export function getModeAccentColors(goal: Goal): ModeAccentColors {
  const tab = goalToLandingTab(goal);
  if (tab === "pregnancy") {
    if (goal === "planning_pregnancy") {
      return { primary: "#0D9488", primaryDark: "#0F766E", primaryLight: "#5EEAD4" };
    }
    return { primary: "#7C3AED", primaryDark: "#4C1D95", primaryLight: "#C4B5FD" };
  }
  return { primary: "#F43F7F", primaryDark: "#D62A63", primaryLight: "#FFB3CB" };
}
