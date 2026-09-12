// App.pdf §5 — foydalanuvchi tanlagan maqsadga qarab qaysi asosiy bo'limga
// yo'naltirilishi kerakligini aniqlaydi. Platformaga xos yo'l emas, mavhum
// "tab" qaytaradi — web/mobil har biri o'z yo'liga map qiladi.

import type { CommunityTag, Goal } from "../types";

export type LandingTab = "cycle" | "pregnancy" | "checkups" | "partner";

export function goalToLandingTab(goal: Goal): LandingTab {
  if (goal === "partner_tracking") return "partner";
  if (goal === "pregnancy" || goal === "planning_pregnancy") return "pregnancy";
  if (goal === "checkups") return "checkups";
  return "cycle"; // cycle, wellbeing, understand_body, skin, perimenopause
}

/** 18+ va <18 uchun alohida maqsad ro'yxati (App.pdf §5). `partner_tracking`
 * faqat 18+ uchun — shaxsan hayz ko'rmaydigan (odatda erkak) foydalanuvchi
 * Hamkor orqali ulangan ayolini kuzatadi. `perimenopause` ham faqat 18+
 * ro'yxatida (yosh chegarasi qattiq tekshirilmaydi, lekin mazmuni 40+ uchun
 * mo'ljallangan — partner_tracking bilan bir xil yondashuv). */
export const ADULT_GOALS: Goal[] = ["cycle", "pregnancy", "planning_pregnancy", "wellbeing", "checkups", "partner_tracking", "perimenopause"];
export const MINOR_GOALS: Goal[] = ["cycle", "understand_body", "skin"];

export function isPregnancyGoal(goal: Goal): boolean {
  return goal === "pregnancy";
}

export function needsHeightWeight(goal: Goal): boolean {
  return goal === "pregnancy" || goal === "planning_pregnancy";
}

/** `perimenopause` uchun ham FALSE — sikl uzunligi/oxirgi hayz sanasi kabi
 * bashorat-yo'naltirilgan savollar endi ma'noli emas (tsikl tabiiy ravishda
 * tartibsizlashadi). Simptom savoli (typical_symptoms) BUNDAN MUSTAQIL
 * ravishda perimenopauza uchun ham so'raladi — onboarding/page.tsx'dagi
 * `steps` massivida alohida shart bilan (needsCycleInfo'ga qo'shilmagan). */
export function needsCycleInfo(goal: Goal): boolean {
  return goal !== "pregnancy" && goal !== "partner_tracking" && goal !== "perimenopause";
}

/** `partner_tracking` uchun shaxsiy sog'liq savollari (oilaviy tarix, oxirgi
 * tekshiruv) ham ma'nosiz — bular foydalanuvchining O'ZI haqida, u esa hamkorini
 * kuzatadi. `perimenopause` uchun esa BU savollar AKSINCHA ayniqsa muhim
 * (40+ yosh — saraton skrining/oilaviy tarix xavf omillari kuchayadi). */
export function needsPersonalHealthQuestions(goal: Goal): boolean {
  return goal !== "partner_tracking";
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
  // Perimenopauza — qolgan rejimlardan (pushti/binafsha/teal) ATAYLAB farqli,
  // iliq kumush-amber ("hikmat"ni anglatuvchi, tibbiy-sovuq emas) rang.
  if (goal === "perimenopause") {
    return { primary: "#D97706", primaryDark: "#92400E", primaryLight: "#FDE68A" };
  }
  return { primary: "#F43F7F", primaryDark: "#D62A63", primaryLight: "#FFB3CB" };
}

/** Jamiyat (community) ekrani ochilganda avval qaysi teg tanlangan holda
 * ko'rsatilishi — foydalanuvchi so'roviga ko'ra: "o'z rejimiga mos guruh
 * BIRINCHI ko'rinsin, keyin o'zi o'zgartira olsin" (hammaga "Barchasi"
 * emas). MUHIM: `planning_pregnancy` ATAYLAB "pregnancy"ga EMAS,
 * "general"ga tushadi — bu hali homilador emas, tayyorgarlik ko'rayotgan
 * rejim, alohida community teg yo'q ekan (4 tasi: cycle/pregnancy/
 * checkups/general), shuning uchun uni "Homiladorlik" tegiga aralashtirib
 * yubormaslik kerak (foydalanuvchi aynan shu xatoni ko'rsatdi). */
export function goalToDefaultCommunityTag(goal: Goal): CommunityTag {
  if (goal === "pregnancy") return "pregnancy";
  if (goal === "checkups") return "checkups";
  if (goal === "cycle" || goal === "wellbeing" || goal === "understand_body" || goal === "skin") return "cycle";
  // planning_pregnancy, partner_tracking, perimenopause — mos aniq teg yo'q.
  return "general";
}
