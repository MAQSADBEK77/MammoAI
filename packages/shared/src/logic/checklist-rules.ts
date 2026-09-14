// Tekshiruv ro'yxati qoidalar jadvali — spec §4: "oddiy qoidalar jadvali (yosh ×
// xavf omillari × homiladorlik holati → tekshiruv ro'yxati), ML kerak emas."
//
// FIX-CHECKUPS (2026-09): eski 7 turlik oddiy jadval o'rniga real manbaga
// asoslangan (O'zbekiston SSV milliy dasturi + uzaig.uz milliy klinik
// protokollari + xususiy klinika amaliyoti + JSSST) ancha boyroq jadval bilan
// almashtirildi. Ikki bosqichli ma'lumot bor joyda ("davlat dasturi bo'yicha
// majburiy" vs "tavsiya etilgan"): bu funksiya HAR DOIM "tavsiya etilgan"
// bosqich bo'yicha muddat hisoblaydi (davlat dasturi ko'pincha yosh
// foydalanuvchilarni butunlay tashqarida qoldiradi — masalan bachadon bo'yni
// skrininggi rasman 35 yoshdan boshlanadi, lekin 18 yoshdan tavsiya etiladi);
// "davlat dasturi" ma'lumoti faqat CHECKUP_OFFICIAL_TRACK orqali, UI'da alohida
// belgi sifatida ko'rsatiladi, muddat hisobiga ta'sir qilmaydi.

import type { ChecklistCategory, ChecklistItemType, Goal } from "../types";

export interface ChecklistRuleInput {
  age: number;
  familyHistory: boolean;
  isPregnant: boolean;
  cycleIrregular: boolean;
  /** FIX-CHECKUPS: yangi — `familyHistory` bilan bir xil naqsh (onboarding
   * "bilmayman" varianti saqlashda `false`ga yig'iladi). */
  sexuallyActive: boolean;
  /** FIX-CHECKUPS: homiladorlik haftasi (getPregnancyStatus().currentWeek) —
   * homiladorlik skrininggi bosqichlari shunga qarab hisoblanadi. */
  pregnancyWeek: number | null;
  /** FIX-CHECKUPS: tug'ruqdan keyingi ~42 kunlik oyna ichidami. */
  isPostpartum: boolean;
  /** FIX-CHECKUPS: primaryGoal === "perimenopause". */
  isPerimenopause: boolean;
  /** FIX-CHECKUPS: primaryGoal === "planning_pregnancy". */
  isTryingToConceive: boolean;
}

export interface GeneratedChecklistItem {
  type: ChecklistItemType;
  /** null — muddat yo'q (masalan homiladorlik tashrifi qo'lda qo'shiladi), kunlar sonida hisoblanadi. */
  dueInDays: number | null;
  /** FIX-CHECKUPS: davriy (masalan yillik) tekshiruvlar uchun — item 'done'
   * bo'lgach, shuncha kun o'tgandan keyin qayta 'pending'ga qaytariladi
   * (ensureChecklistItem, repo.ts). `undefined` — bir martalik: bajarilgach
   * abadiy 'done' qoladi (masalan vaksinatsiya, homiladorlik tashrifi). */
  recurrenceDays?: number;
}

/** Homiladorlik haftasiga bog'langan bandlar uchun — nishon haftagacha
 * qolgan kunlar (agar allaqachon shu hafta ichida/o'tib ketgan bo'lsa — 0,
 * ya'ni "hozir kerak"). */
function daysUntilPregnancyWeek(currentWeek: number, targetWeek: number): number {
  return currentWeek >= targetWeek ? 0 : (targetWeek - currentWeek) * 7;
}

// Haftaga bog'langan skrining oynasidan qancha oldin ko'rsatila boshlaydi
// (butun homiladorlik davomida bitta band emas, oldindan ogohlantirish
// sifatida — lekin haftalar hali yiroq bo'lsa ekranni to'ldirmasin).
const PREGNANCY_LOOKAHEAD_WEEKS = 6;

function isPregnancyWindowRelevant(currentWeek: number | null, windowStart: number, windowEnd: number): boolean {
  return currentWeek === null || (currentWeek >= windowStart - PREGNANCY_LOOKAHEAD_WEEKS && currentWeek <= windowEnd);
}

export function generateChecklist(input: ChecklistRuleInput): GeneratedChecklistItem[] {
  const items: GeneratedChecklistItem[] = [];
  const isSexuallyActive = input.sexuallyActive;

  // --- Homiladorlik: alohida oqim, umumiy profilaktikadan ustuvor ---
  // (eski pregnancy_first_visit/pregnancy_trimester_checkup o'rniga —
  // haqiqiy SSV 3-bosqichli skrining jadvali bilan almashtirildi)
  if (input.isPregnant) {
    const week = input.pregnancyWeek;
    if (isPregnancyWindowRelevant(week, 10, 14)) items.push({ type: "prenatal_screening_stage1", dueInDays: week === null ? 0 : daysUntilPregnancyWeek(week, 10) });
    if (isPregnancyWindowRelevant(week, 16, 20)) items.push({ type: "prenatal_screening_stage1b", dueInDays: week === null ? 0 : daysUntilPregnancyWeek(week, 16) });
    if (isPregnancyWindowRelevant(week, 28, 32)) items.push({ type: "prenatal_screening_stage1c", dueInDays: week === null ? 0 : daysUntilPregnancyWeek(week, 28) });
    if (isPregnancyWindowRelevant(week, 35, 37)) items.push({ type: "group_b_strep_screening", dueInDays: week === null ? 0 : daysUntilPregnancyWeek(week, 35) });
    if (isPregnancyWindowRelevant(week, 12, 32)) {
      const dueInDays = week === null ? 0 : week < 12 ? daysUntilPregnancyWeek(week, 12) : daysUntilPregnancyWeek(week, 32);
      items.push({ type: "pregnancy_patronage_visit", dueInDays });
    }
    if (week === null || week <= 13) items.push({ type: "bv_targeted_screening", dueInDays: 14 });
    if (input.age >= 18 && input.age <= 45) items.push({ type: "torch_panel", dueInDays: 14 });
    return items; // homilador bo'lsa boshqa umumiy profilaktika oqimi ishga tushmaydi
  }

  if (input.isPostpartum) {
    // Uch tashrif (3/15/30-kun) checklist_items(user_id,type) UNIQUE
    // cheklovi sabab bitta band sifatida birlashtirilgan — izoh uchun
    // dict.checklist.items.postpartum_home_visit.
    items.push({ type: "postpartum_home_visit", dueInDays: 0 });
  }

  // --- Homiladorlikni rejalashtirish ---
  if (input.isTryingToConceive) {
    if (input.age >= 18 && input.age <= 45 && isSexuallyActive) items.push({ type: "preconception_checkup", dueInDays: 14 });
    if (input.age >= 18 && input.age <= 45) items.push({ type: "torch_panel", dueInDays: 14 });
    items.push({ type: "bv_targeted_screening", dueInDays: 14 });
  }

  // --- Perimenopauza/menopauza ---
  if (input.isPerimenopause && input.age >= 45) {
    items.push({ type: "menopause_checkup", dueInDays: 365, recurrenceDays: 365 });
  }

  // --- Umumiy profilaktika (general_prevention) — asosiy yosh-bog'liq jadval ---
  if (input.age >= 15 && input.age <= 49) {
    items.push({ type: "annual_preventive_exam", dueInDays: 365, recurrenceDays: 365 });
  }
  // FIX3-03: manbada annual_preventive_exam 49 yoshda tugaydi va
  // menopause_checkup faqat "perimenopauza" MAQSADI tanlangan
  // foydalanuvchilarga chiqadi — natijada 50+ yoshli, lekin boshqa
  // maqsad (masalan "tekshiruvlar"/"farovonlik") tanlagan foydalanuvchi
  // UMUMAN hech qanday umumiy konsultatsiya bandini olmasdi. Perimenopauza
  // maqsadidagilar allaqachon menopause_checkup oladi — faqat QOLGANLARI
  // uchun annual_preventive_exam davom ettiriladi.
  if (input.age >= 50 && !input.isPerimenopause) {
    items.push({ type: "annual_preventive_exam", dueInDays: 365, recurrenceDays: 365 });
  }
  if (input.age >= 14 && input.age <= 18) {
    items.push({ type: "first_gyn_visit", dueInDays: 30, recurrenceDays: 365 });
  }
  if (input.age >= 9 && input.age <= 45) {
    items.push({ type: "hpv_vaccination", dueInDays: 30 });
  }
  // FIX3-06: ilgari `sexually_active_required: false`ni "cheklanmagan"
  // (hammaga tegishli) deb noto'g'ri talqin qilingan edi — natijada
  // spekulyum bilan INVAZIV tekshiruv jinsiy faol BO'LMAGAN 18-65 yoshli
  // barcha ayollarga ham yiliga tavsiya qilinardi, bu odatiy klinik
  // amaliyotga zid (spekulyum bilan ko'rik odatda jinsiy faol
  // bemorlarga qo'llaniladi). Endi `pelvic_exam_speculum` ham
  // `isSexuallyActive`ga bog'liq. `flora_smear` (surtma) — kamroq
  // invaziv, tashqi/boshqa usul bilan ham olinishi mumkin — cheklanmagan
  // holicha qoladi.
  if (input.age >= 18 && input.age <= 65 && isSexuallyActive) {
    items.push({ type: "pelvic_exam_speculum", dueInDays: 365, recurrenceDays: 365 });
  }
  if (input.age >= 18 && input.age <= 65) {
    items.push({ type: "flora_smear", dueInDays: 365, recurrenceDays: 365 });
  }
  if (input.age >= 18 && input.age <= 65 && isSexuallyActive) {
    items.push({ type: "cervical_cancer_screening", dueInDays: 365, recurrenceDays: 365 });
  }
  if (input.age >= 18) {
    items.push({ type: "pelvic_ultrasound", dueInDays: 365, recurrenceDays: 365 });
  }
  if (input.age >= 18) {
    items.push({ type: "breast_self_exam", dueInDays: 30, recurrenceDays: 30 });
  }
  if (input.age >= 20) {
    items.push({ type: "clinical_breast_exam", dueInDays: 365, recurrenceDays: 365 });
  }
  // Ko'krak bezi saratoni skrininggi — oilada tarixi bo'lsa 30 yoshdan,
  // aks holda 40 yoshdan (dual_track: rasmiy dastur 45-65, 2 yilda 1 marta —
  // CHECKUP_OFFICIAL_TRACK'da, muddat hisobiga kirmaydi).
  if (input.familyHistory && input.age >= 30) {
    items.push({ type: "breast_cancer_screening_mammography", dueInDays: 365, recurrenceDays: 365 });
  } else if (input.age >= 40) {
    items.push({ type: "breast_cancer_screening_mammography", dueInDays: 365, recurrenceDays: 365 });
  }
  if (input.age >= 15 && isSexuallyActive) {
    items.push({ type: "sti_panel", dueInDays: 365, recurrenceDays: 365 });
  }
  if (input.age >= 15 && input.age <= 49 && isSexuallyActive) {
    items.push({ type: "contraception_counseling", dueInDays: 365, recurrenceDays: 365 });
  }

  // Tsikl 3+ oy tartibsiz — checklist'ga ko'prik (spec §2) — bu bandning
  // o'ziga xos ilova-ichi mantig'i, gov.uz/uzaig manbalarida yo'q, o'zgarishsiz qoladi.
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
  annual_preventive_exam: true,
  first_gyn_visit: true,
  hpv_vaccination: false,
  pelvic_exam_speculum: true,
  flora_smear: true,
  cervical_cancer_screening: false, // 18-34 yosh uchun rasmiy dastur qamramaydi (18-64: 35-55 oralig'ida bepul)
  pelvic_ultrasound: false,
  breast_self_exam: true, // uy sharoitida, pullik/bepul degan tushuncha yo'q
  clinical_breast_exam: true,
  breast_cancer_screening_mammography: false, // 40-44 oralig'ida davlat dasturi qamramaydi (45+ bepul)
  sti_panel: false,
  contraception_counseling: true,
  preconception_checkup: false,
  prenatal_screening_stage1: true,
  prenatal_screening_stage1b: true,
  prenatal_screening_stage1c: true,
  pregnancy_patronage_visit: true,
  postpartum_home_visit: true,
  menopause_checkup: false,
  torch_panel: false,
  group_b_strep_screening: false,
  bv_targeted_screening: false,
};

// FIX-CHECKUPS: Tekshiruvlar ekranida bo'limlarga guruhlash uchun.
export const CHECKUP_CATEGORY: Record<ChecklistItemType, ChecklistCategory> = {
  gyn_annual_checkup: "consultation",
  pap_test: "screening",
  mammography_screening: "imaging",
  free_mammography_45: "imaging",
  cycle_irregularity_followup: "consultation",
  pregnancy_first_visit: "pregnancy",
  pregnancy_trimester_checkup: "pregnancy",
  annual_preventive_exam: "consultation",
  first_gyn_visit: "consultation",
  hpv_vaccination: "vaccination",
  pelvic_exam_speculum: "screening",
  flora_smear: "lab",
  cervical_cancer_screening: "screening",
  pelvic_ultrasound: "imaging",
  breast_self_exam: "self_exam",
  clinical_breast_exam: "consultation",
  breast_cancer_screening_mammography: "imaging",
  sti_panel: "lab",
  contraception_counseling: "consultation",
  preconception_checkup: "consultation",
  prenatal_screening_stage1: "pregnancy",
  prenatal_screening_stage1b: "pregnancy",
  prenatal_screening_stage1c: "pregnancy",
  pregnancy_patronage_visit: "pregnancy",
  postpartum_home_visit: "postpartum",
  menopause_checkup: "consultation",
  torch_panel: "lab",
  group_b_strep_screening: "lab",
  bv_targeted_screening: "lab",
};

/** UI'ning `dict.checklist.frequencyLabels`idan tarjima qilinadi — statik
 * matn emas, kalit (badge 3 tilda to'g'ri chiqishi uchun). */
export type OfficialTrackFrequency = "every_2_years" | "every_3_years";

export interface OfficialTrack {
  minAge: number;
  maxAge: number;
  frequency: OfficialTrackFrequency;
}

// FIX-CHECKUPS: faqat manbada `dual_track: true` deb belgilangan ikkita band
// uchun — davlat dasturi ma'lumoti (UI'da alohida belgi, muddat hisobiga
// ta'sir qilmaydi — funksiya boshidagi izohga qarang).
export const CHECKUP_OFFICIAL_TRACK: Partial<Record<ChecklistItemType, OfficialTrack>> = {
  cervical_cancer_screening: { minAge: 35, maxAge: 55, frequency: "every_3_years" },
  breast_cancer_screening_mammography: { minAge: 45, maxAge: 65, frequency: "every_2_years" },
};

/** `primaryGoal`dan checklist mantig'i kerak bo'ladigan hosila bayroqlarni
 * hisoblaydi — checklist-sync.ts shu yerdan chaqiradi. */
export function isTryingToConceiveGoal(goal: Goal): boolean {
  return goal === "planning_pregnancy";
}

export function isPerimenopauseGoal(goal: Goal): boolean {
  return goal === "perimenopause";
}
