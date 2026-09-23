// CONCERN-01 — "Muammolar" katalogi: ayolni BEZOVTA QILAYOTGAN narsadan
// kerakli tekshiruvga va shifokorga olib boradigan kirish nuqtasi.
//
// Manba: loyiha shifokori bergan ro'yxat — u amaliyotda eng ko'p
// uchraydigan 12 ta yo'nalishni sanab bergan. Ro'yxat BIZ o'ylab topgan
// emas, shu sabab u haqiqiy murojaat sabablarini aks ettiradi.
//
// Nega alohida qatlam kerak: tekshiruvlar ro'yxati "NIMA qilish kerak"ka
// javob beradi, lekin ayol odatda tekshiruv nomi bilan emas, MUAMMO bilan
// keladi ("hayzim kechikyapti", "homilador bo'lolmayapman"). Bu modul shu
// ikkisini bog'laydi: muammo → tegishli tekshiruvlar → mutaxassis.
//
// MUHIM chegara: bu tashxis qo'yish vositasi EMAS va hech qachon bo'lmaydi.
// Har bir yozuv faqat (a) muammo nima ekanini tushuntiradi, (b) qaysi
// tekshiruvlar shu savolga javob beradi, (c) qaysi mutaxassisga borish
// kerak, (d) qachon KECHIKTIRMASDAN murojaat qilish shart. Matnlar i18n'da
// (dict.concerns) — bu yerda faqat tuzilma va tanlash mantig'i.

import type { ChecklistItemType, ClinicSpecialty, CycleRegularity, HealthCondition } from "../types";

export type HealthConcernId =
  | "cycle_disorders" // 1. Hayz buzilishlari
  | "infertility" // 2. Bepushtlik
  | "hormonal_imbalance" // 3. Gormonlar almashinuvi buzilishi
  | "obesity" // 4. Semizlik
  | "endometriosis" // 5. Endometrioz holatlari
  | "contraception" // 6. Kontratseptsiya muammolari
  | "intimate_hygiene" // 7. Jinsiy hayot gigiyenasi
  | "pregnancy_complications" // 8. Homiladorlik patologiyalari
  | "pregnancy_comorbidity" // 9. Homila davridagi hamroh kasalliklar
  | "breastfeeding" // 10. Emizish tartibi va qoidalari
  | "early_menopause" // 11. Erta va og'ir o'tuvchi klimaks
  | "menopause_later_life"; // 12. Klimaks va keksa yoshdagi kasalliklar (prolaps, siydik tuta olmaslik)

export interface HealthConcernRule {
  id: HealthConcernId;
  /** Qaysi mutaxassisga yo'naltiriladi — klinika qidiruvida shu ishlatiladi. */
  specialist: ClinicSpecialty;
  /** Shu muammoga javob beradigan tekshiruvlar (mavjud checklist turlaridan). */
  relatedCheckups: ChecklistItemType[];
  minAge: number;
  maxAge: number;
  /** Faqat homiladorlik davrida ma'noga ega. */
  pregnancyOnly?: boolean;
  /** Homiladorlik davrida ko'rsatilmaydi (mavzu hozir tegishli emas). */
  hideWhenPregnant?: boolean;
}

/** Kanonik tartib — shifokor bergan ro'yxat tartibi. Ahamiyat bo'yicha
 * saralash TENG bo'lganda shu tartib saqlanadi. */
export const HEALTH_CONCERNS: HealthConcernRule[] = [
  {
    id: "cycle_disorders",
    specialist: "gynecology",
    relatedCheckups: ["cycle_irregularity_followup", "pelvic_ultrasound", "thyroid_function_test", "gyn_annual_checkup"],
    minAge: 12,
    maxAge: 60,
    hideWhenPregnant: true,
  },
  {
    id: "infertility",
    specialist: "reproductology",
    relatedCheckups: ["preconception_checkup", "pelvic_ultrasound", "thyroid_function_test", "sti_panel", "rubella_immunity_check"],
    minAge: 18,
    maxAge: 45,
    hideWhenPregnant: true,
  },
  {
    id: "hormonal_imbalance",
    specialist: "endocrinology",
    relatedCheckups: ["thyroid_function_test", "pelvic_ultrasound", "cycle_irregularity_followup", "annual_preventive_exam"],
    minAge: 14,
    maxAge: 70,
  },
  {
    id: "obesity",
    specialist: "endocrinology",
    relatedCheckups: ["annual_preventive_exam", "thyroid_function_test", "colorectal_cancer_screening"],
    minAge: 14,
    maxAge: 80,
  },
  {
    id: "endometriosis",
    specialist: "gynecology",
    relatedCheckups: ["gyn_annual_checkup", "pelvic_ultrasound", "pelvic_exam_speculum"],
    minAge: 14,
    maxAge: 55,
    hideWhenPregnant: true,
  },
  {
    id: "contraception",
    specialist: "gynecology",
    relatedCheckups: ["contraception_counseling", "gyn_annual_checkup", "sti_panel"],
    minAge: 15,
    maxAge: 50,
    hideWhenPregnant: true,
  },
  {
    id: "intimate_hygiene",
    specialist: "gynecology",
    relatedCheckups: ["flora_smear", "sti_panel", "bv_targeted_screening", "cervical_cancer_screening", "hpv_vaccination"],
    minAge: 15,
    maxAge: 70,
  },
  {
    id: "pregnancy_complications",
    specialist: "gynecology",
    relatedCheckups: ["pregnancy_first_visit", "pregnancy_trimester_checkup", "prenatal_screening_stage1", "pregnancy_patronage_visit"],
    minAge: 14,
    maxAge: 50,
    pregnancyOnly: true,
  },
  {
    id: "pregnancy_comorbidity",
    specialist: "general",
    relatedCheckups: ["gestational_diabetes_screening", "thyroid_function_test", "torch_panel", "group_b_strep_screening"],
    minAge: 14,
    maxAge: 50,
    pregnancyOnly: true,
  },
  {
    id: "breastfeeding",
    specialist: "gynecology",
    relatedCheckups: ["postpartum_6week_checkup", "postpartum_home_visit", "postpartum_depression_screening"],
    minAge: 14,
    maxAge: 50,
  },
  {
    id: "early_menopause",
    specialist: "gynecology",
    relatedCheckups: ["menopause_checkup", "thyroid_function_test", "pelvic_ultrasound", "annual_preventive_exam"],
    minAge: 30,
    maxAge: 55,
    hideWhenPregnant: true,
  },
  {
    id: "menopause_later_life",
    specialist: "gynecology",
    relatedCheckups: ["menopause_checkup", "gyn_annual_checkup", "breast_cancer_screening_mammography", "colorectal_cancer_screening"],
    minAge: 45,
    maxAge: 100,
    hideWhenPregnant: true,
  },
];

export interface HealthConcernRelevanceInput {
  age: number;
  isPregnant: boolean;
  cycleRegularity: CycleRegularity;
  healthConditions: HealthCondition[];
  /** Emizish mavzusi faqat tug'gan ayolda o'zidan-o'zi tepaga chiqadi. */
  hasGivenBirth: boolean | null;
  hormonalContraception: boolean | null;
  /** Tana massasi indeksi — bo'y/vazn kiritilgan bo'lsa. */
  bmi: number | null;
}

export interface RankedHealthConcern {
  rule: HealthConcernRule;
  /** 0 — umumiy ro'yxatda; >0 — foydalanuvchi ma'lumotiga ko'ra tegishliroq. */
  score: number;
  /** `true` bo'lsa ekranda "Sizga tegishli bo'lishi mumkin" deb belgilanadi. */
  highlighted: boolean;
}

/** JSST chegarasi — semizlik TMI ≥ 30. Ortiqcha vazn (25-29.9) alohida
 * toifa va bu yerda ataylab ALOHIDA emas: ilova tashxis qo'ymaydi, faqat
 * mavzuni ro'yxat tepasiga ko'taradi. */
const OBESITY_BMI = 30;
const HIGHLIGHT_THRESHOLD = 2;

/**
 * Muammolar ro'yxatini foydalanuvchiga moslab saralaydi.
 *
 * Hech qanday muammo YASHIRILMAYDI (faqat yoshi/homiladorlik holatiga ko'ra
 * umuman ma'nosiz bo'lganlaridan tashqari) — ayol o'zi xohlagan mavzuni
 * o'qiy olishi kerak. Saralash faqat TARTIBGA ta'sir qiladi: unga
 * tegishliroq bo'lishi mumkin bo'lgan mavzular yuqorida turadi.
 */
export function rankHealthConcerns(input: HealthConcernRelevanceInput): RankedHealthConcern[] {
  const conditions = new Set(input.healthConditions);

  const applicable = HEALTH_CONCERNS.filter((rule) => {
    if (input.age < rule.minAge || input.age > rule.maxAge) return false;
    if (rule.pregnancyOnly && !input.isPregnant) return false;
    if (rule.hideWhenPregnant && input.isPregnant) return false;
    return true;
  });

  const ranked = applicable.map((rule, index) => {
    let score = 0;

    switch (rule.id) {
      case "cycle_disorders":
        if (input.cycleRegularity === "irregular") score += 3;
        if (conditions.has("pcos")) score += 2;
        break;
      case "hormonal_imbalance":
        if (conditions.has("pcos")) score += 3;
        if (input.cycleRegularity === "irregular") score += 1;
        break;
      case "endometriosis":
        if (conditions.has("endometriosis")) score += 3;
        break;
      case "obesity":
        if (input.bmi !== null && input.bmi >= OBESITY_BMI) score += 3;
        break;
      case "contraception":
        if (input.hormonalContraception === true) score += 2;
        break;
      case "intimate_hygiene":
        if (conditions.has("bacterial_vaginosis") || conditions.has("yeast_infection") || conditions.has("uti")) score += 2;
        break;
      case "breastfeeding":
        // Emizish — tug'gandan keyingi mavzu. Tug'magan (yoki noma'lum)
        // ayolda ro'yxatning pastida qoladi, lekin OLIB TASHLANMAYDI:
        // rejalashtirayotgan ayol ham o'qishni xohlashi mumkin.
        if (input.hasGivenBirth === true) score += 3;
        break;
      case "infertility":
        if (conditions.has("pcos") || conditions.has("endometriosis")) score += 2;
        break;
      case "pregnancy_complications":
      case "pregnancy_comorbidity":
        // Bu ikkisi homiladorlikda allaqachon filtrdan o'tgan — demak
        // hozir eng tegishli mavzu.
        score += 3;
        break;
      case "early_menopause":
        // Erta klimaks — 45 yoshgacha bo'lgan ayolda hayz buzilishi bilan
        // birga kelsa e'tiborga loyiq.
        if (input.age < 45 && input.cycleRegularity === "irregular") score += 2;
        break;
      case "menopause_later_life":
        if (input.age >= 50) score += 2;
        break;
    }

    return { rule, score, highlighted: score >= HIGHLIGHT_THRESHOLD, index };
  });

  return ranked
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ rule, score, highlighted }) => ({ rule, score, highlighted }));
}

/** Bo'y/vazndan TMI — profilda ikkalasi ham bo'lsa. Alohida funksiya:
 * `rankHealthConcerns` sof qoladi va chaqiruvchi qayerdan olishini o'zi
 * hal qiladi. */
export function bmiFrom(heightCm: number | null, weightKg: number | null): number | null {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null;
  const m = heightCm / 100;
  return weightKg / (m * m);
}
