// Tekshiruv ro'yxati qoidalar jadvali — spec §4: "oddiy qoidalar jadvali (yosh × xavf
// omillari × homiladorlik holati → tekshiruv ro'yxati), ML kerak emas."

import type { ChecklistItemType } from "../types";

export interface ChecklistRuleInput {
  age: number;
  familyHistory: boolean;
  isPregnant: boolean;
  cycleIrregular: boolean;
}

export interface GeneratedChecklistItem {
  type: ChecklistItemType;
  /** null — muddat yo'q (masalan homiladorlik tashrifi qo'lda qo'shiladi), kunlar sonida hisoblanadi. */
  dueInDays: number | null;
}

export function generateChecklist(input: ChecklistRuleInput): GeneratedChecklistItem[] {
  const items: GeneratedChecklistItem[] = [];

  if (input.isPregnant) {
    items.push({ type: "pregnancy_first_visit", dueInDays: 7 });
    items.push({ type: "pregnancy_trimester_checkup", dueInDays: 90 });
    return items; // spec: homilador bo'lsa boshqa oqim ustuvor
  }

  // 20-30 yosh: yillik ginekologik ko'rik, 3 yilda bir marta pap-test
  if (input.age >= 20) {
    items.push({ type: "gyn_annual_checkup", dueInDays: 365 });
    items.push({ type: "pap_test", dueInDays: 365 * 3 });
  }

  // 40 yosh: mammografiya skrining qo'shiladi
  if (input.age >= 40 && input.age < 45) {
    items.push({ type: "mammography_screening", dueInDays: 365 * 2 });
  }

  // 45+: bepul mammografiya skrining (davlat dasturi) — alohida ta'kidlanadi
  if (input.age >= 45) {
    items.push({ type: "free_mammography_45", dueInDays: 365 * 2 });
  }

  // Oilada saraton/ginekologik kasallik tarixi bo'lsa — mammografiya erta boshlanadi
  if (input.familyHistory && input.age >= 30 && input.age < 40) {
    items.push({ type: "mammography_screening", dueInDays: 365 });
  }

  // Tsikl 3+ oy tartibsiz — checklist'ga ko'prik (spec §2)
  if (input.cycleIrregular) {
    items.push({ type: "cycle_irregularity_followup", dueInDays: 14 });
  }

  return items;
}

// App.pdf §16 — har bir tekshiruv turi bepulmi (davlat dasturi/oddiy poliklinika)
// yoki pullikmi (xususiy/qo'shimcha tekshiruv). Statik jadval — ChecklistItem'ni
// o'qishda shu yerdan qo'shiladi (repo.ts), alohida DB ustuni kerak emas.
export const CHECKLIST_ITEM_IS_FREE: Record<ChecklistItemType, boolean> = {
  gyn_annual_checkup: true, // davlat poliklinikasida standart ko'rik
  pap_test: true,
  mammography_screening: false, // 40-45 yosh oralig'ida davlat dasturi qamramaydi
  free_mammography_45: true, // spec: alohida "bepul" deb ta'kidlangan
  cycle_irregularity_followup: true,
  pregnancy_first_visit: true,
  pregnancy_trimester_checkup: true,
};
