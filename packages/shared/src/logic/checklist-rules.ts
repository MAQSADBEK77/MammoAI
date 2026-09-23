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
  /** CHECKUP-02: taxminiy tug'ruq sanasidan necha kun o'tgani. Tug'ruqdan
   * keyingi bandlar ANIQ kunlarga bog'langan (6-haftalik tekshiruv = 42-kun),
   * shuning uchun bitta `isPostpartum` bayrog'i yetarli emas edi. `null` —
   * homiladorlik sanasi ma'lum emas. */
  daysSinceDue: number | null;
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
    // CHECKUP-02: milliy klinik protokol "Гестационный сахарный диабет"
    // (uzaig.uz) — 24-28 haftada glyukoza tolerantlik testi. Bu oyna
    // o'tkazib yuborilsa, aniqlanmagan gestatsion diabet katta homila va
    // og'ir tug'ruq xavfini oshiradi, holbuki oyna ichida parhez/kuzatuv
    // bilan boshqarish mumkin.
    if (isPregnancyWindowRelevant(week, 24, 28)) {
      items.push({ type: "gestational_diabetes_screening", dueInDays: week === null ? 0 : daysUntilPregnancyWeek(week, 24) });
    }
    // WEB3-04: ilgari 12-haftadan keyin maqsad 32-haftaga "sakrardi" —
    // dueInDays 11-haftada 7 (hozir kerak) dan 12-haftada BIRDANIGA 140ga
    // (~20 hafta keyin kerak) o'zgarardi, aynan shu bandning o'zi "hozir
    // dolzarb" deb belgilagan 12-31 hafta oynasining BOSHIDA. Boshqa
    // barcha oyna-asosli bandlar kabi (stage1/1b/1c/group_b_strep —
    // barchasi FAQAT windowStart'ga qarab hisoblaydi, windowEnd faqat
    // isPregnancyWindowRelevant'da dolzarblik oynasi uchun ishlatiladi),
    // bu ham endi doim windowStart=12'ga barqaror qoladi — 12-haftadan
    // 32-haftagacha butun oyna davomida dueInDays=0 ("hozir kerak").
    if (isPregnancyWindowRelevant(week, 12, 32)) {
      items.push({ type: "pregnancy_patronage_visit", dueInDays: week === null ? 0 : daysUntilPregnancyWeek(week, 12) });
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
    // CHECKUP-02: rasmiy uy tashriflari jadvali 30-kunda TUGAYDI. 6-haftalik
    // tekshiruv va depressiya skrininggi esa aynan shundan keyin keladi —
    // va manba bo'yicha bu ikkalasi eng ko'p o'tkazib yuboriladigan
    // bandlar, chunki ona jismonan "tuzalib" qolgan bo'ladi.
    const untilDay = (target: number) =>
      input.daysSinceDue === null ? 0 : Math.max(0, target - input.daysSinceDue);
    items.push({ type: "postpartum_6week_checkup", dueInDays: untilDay(42) });
    items.push({ type: "postpartum_depression_screening", dueInDays: untilDay(30) });
  }

  // --- Homiladorlikni rejalashtirish ---
  if (input.isTryingToConceive) {
    if (input.age >= 18 && input.age <= 45 && isSexuallyActive) items.push({ type: "preconception_checkup", dueInDays: 14 });
    if (input.age >= 18 && input.age <= 45) items.push({ type: "torch_panel", dueInDays: 14 });
    items.push({ type: "bv_targeted_screening", dueInDays: 14 });
    // CHECKUP-02: qizamiqcha (rubella) immuniteti — bu band ATAYLAB
    // homiladorlikdan OLDIN turadi: vaktsina homilador bo'lgach QILIB
    // BO'LMAYDI, ya'ni keyin tuzatib bo'lmaydigan yagona band.
    items.push({ type: "rubella_immunity_check", dueInDays: 14 });
    if (input.age >= 25) items.push({ type: "thyroid_function_test", dueInDays: 30 });
  }

  // --- Perimenopauza/menopauza ---
  if (input.isPerimenopause && input.age >= 45) {
    items.push({ type: "menopause_checkup", dueInDays: 365, recurrenceDays: 365 });
    // CHECKUP-02: qalqonsimon bez buzilishi perimenopauzada ko'p uchraydi va
    // uning belgilari menopauza belgilariga O'XSHAB ketadi — tekshirilmasa,
    // davolash mumkin bo'lgan holat "tabiiy o'zgarish" deb o'tkazib
    // yuboriladi.
    items.push({ type: "thyroid_function_test", dueInDays: 365, recurrenceDays: 365 });
  }

  // --- Umumiy profilaktika (general_prevention) — asosiy yosh-bog'liq jadval ---
  // WEB3-05: FIX3-03 shu istisnoni FAQAT 50+ filialiga (pastda) qo'shgan edi —
  // 45-49 yoshli, isPerimenopause=true foydalanuvchi yuqoridagi
  // menopause_checkup'ni OLGAN holda, bu yerdan ham annual_preventive_exam
  // olardi (ikkalasi ham umumiy konsultatsiya turi, takrorlanish). Endi bu
  // filial ham 50+ filiali bilan bir xil istisnoga bo'ysunadi.
  if (input.age >= 15 && input.age <= 49 && !input.isPerimenopause) {
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
  // CHECKUP-02: ginekologik emas, lekin 45+ uchun xalqaro standart skrining.
  // Foydalanuvchi shu yoshdagi boshqa bandlar uchun allaqachon ilovada
  // bo'lgani uchun uni shu ro'yxatga qo'shish tabiiy.
  if (input.age >= 45 && input.age <= 75) {
    items.push({ type: "colorectal_cancer_screening", dueInDays: 365, recurrenceDays: 365 });
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
  // CHECKUP-02: homiladorlik davridagi bandlar milliy antenatal protokolga
  // kiradi — davlat poliklinikasida qamraladi.
  gestational_diabetes_screening: true,
  postpartum_6week_checkup: true,
  postpartum_depression_screening: true,
  // Quyidagilar davlat dasturida alohida ko'rsatilmagan — xususiy/pullik.
  thyroid_function_test: false,
  rubella_immunity_check: false,
  colorectal_cancer_screening: false,
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
  gestational_diabetes_screening: "lab",
  postpartum_6week_checkup: "postpartum",
  postpartum_depression_screening: "postpartum",
  thyroid_function_test: "lab",
  rubella_immunity_check: "lab",
  colorectal_cancer_screening: "screening",
};

/**
 * CHECKUP-02 — har bir bandning MANBASI.
 *
 * Loyiha egasining talabi: "faqat rasmiy manbalardan foydalaning". Buni
 * tekshirib bo'ladigan qilish uchun manba kodda, har bandning yonida
 * turadi — keyin kimdir "bu tavsiya qayerdan?" deb so'rasa, javob
 * izlab yurish shart emas.
 *
 * Bu shunchaki hujjat emas: protokol yangilansa, qaysi bandlar qayta
 * ko'rib chiqilishi kerakligi shu jadvaldan darhol ko'rinadi.
 */
export type CheckupSource =
  /** gov.uz/oz/ssv — yosh guruhlari bo'yicha patronaj va skrining dasturi. */
  | "uz_moh_women"
  /** gov.uz/oz/ssv — uch bosqichli prenatal skrining. */
  | "uz_moh_pregnancy"
  /** uzaig.uz — RSNPMTsZMiR milliy klinik protokollari. */
  | "uz_clinical_protocol"
  /** JSST tavsiyalari. */
  | "who"
  /** Xalqaro standart amaliyot (milliy protokolda alohida yo'q). */
  | "international_practice"
  /** O'zbekistondagi xususiy klinika amaliyoti. */
  | "private_clinic_practice";

export const CHECKUP_SOURCE: Record<ChecklistItemType, CheckupSource[]> = {
  // Eski (spec davridagi) turlar — yangi jadval bilan almashtirilgan,
  // yangi foydalanuvchilarda ishlab chiqarilmaydi.
  gyn_annual_checkup: ["private_clinic_practice"],
  pap_test: ["uz_clinical_protocol"],
  mammography_screening: ["uz_moh_women"],
  free_mammography_45: ["uz_moh_women"],
  cycle_irregularity_followup: ["private_clinic_practice"],
  pregnancy_first_visit: ["uz_moh_pregnancy"],
  pregnancy_trimester_checkup: ["uz_moh_pregnancy"],

  annual_preventive_exam: ["uz_moh_women"],
  first_gyn_visit: ["private_clinic_practice", "who"],
  hpv_vaccination: ["private_clinic_practice", "who"],
  pelvic_exam_speculum: ["private_clinic_practice"],
  flora_smear: ["private_clinic_practice"],
  // Milliy protokol: "Скрининг рака шейки матки, диагностика и тактика
  // ведения интраэпителиальной цервикальной неоплазии".
  cervical_cancer_screening: ["uz_clinical_protocol", "uz_moh_women", "private_clinic_practice"],
  pelvic_ultrasound: ["private_clinic_practice"],
  breast_self_exam: ["private_clinic_practice"],
  clinical_breast_exam: ["private_clinic_practice"],
  breast_cancer_screening_mammography: ["uz_moh_women", "private_clinic_practice"],
  sti_panel: ["private_clinic_practice"],
  // Milliy protokol: "Национальное клиническое руководство по планированию семьи".
  contraception_counseling: ["uz_clinical_protocol"],
  preconception_checkup: ["private_clinic_practice", "international_practice"],
  prenatal_screening_stage1: ["uz_moh_pregnancy"],
  prenatal_screening_stage1b: ["uz_moh_pregnancy"],
  prenatal_screening_stage1c: ["uz_moh_pregnancy"],
  pregnancy_patronage_visit: ["uz_moh_women"],
  postpartum_home_visit: ["uz_moh_women"],
  // Milliy protokol: "Менопаузальные и перименопаузальные расстройства".
  menopause_checkup: ["uz_clinical_protocol", "private_clinic_practice"],
  torch_panel: ["international_practice"],
  group_b_strep_screening: ["international_practice"],
  // Milliy protokol: "Бактериальный вагиноз".
  bv_targeted_screening: ["uz_clinical_protocol", "private_clinic_practice"],

  // Milliy protokol: "Гестационный сахарный диабет".
  gestational_diabetes_screening: ["uz_clinical_protocol", "international_practice"],
  // Milliy protokol: "Ведение нормального послеродового периода" —
  // rasmiy uy tashriflari 30-kunda tugaydi, 6-haftalik tekshiruv esa
  // xalqaro amaliyotdan.
  postpartum_6week_checkup: ["uz_clinical_protocol", "international_practice"],
  postpartum_depression_screening: ["who", "international_practice"],
  thyroid_function_test: ["international_practice"],
  rubella_immunity_check: ["international_practice"],
  colorectal_cancer_screening: ["international_practice"],
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
