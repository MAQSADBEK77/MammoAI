/**
 * MENO-01 — klimaks rejimining o'zagi.
 *
 * Nega alohida rejim kerak: hozir `perimenopause` maqsadi bor, lekin u
 * amalda "sikl narsalarini yashirish"dan iborat — ya'ni ayolga nimadir
 * BERILMAYDI, faqat olib tashlanadi. Holbuki bu davr 7-10 yil davom
 * etadi va aynan shu yoshda skrining (mammografiya, suyak zichligi,
 * bosim, xolesterin) hayot saqlaydi.
 *
 * Ikkita narsa bu yerda hal qilinadi:
 *   1. BOSQICH — ayol qayerda turibdi (perimenopauza / menopauza /
 *      postmenopauza). Bu rasmiy ta'rifga (STRAW+10) tayanadi: oxirgi
 *      hayzdan 12 oy o'tgan bo'lsa — menopauza.
 *   2. SIMPTOM OG'IRLIGI — Menopause Rating Scale (MRS) bo'yicha.
 *      MRS tanlandi, chunki u xalqaro validatsiyadan o'tgan, 11 ta
 *      savoldan iborat va shifokor tushunadigan tilda natija beradi.
 *      O'zimiz shkala o'ylab topish — raqam ko'rinishidagi taxmin
 *      bo'lardi.
 */

export type MenopauseStage = "premenopause" | "perimenopause" | "menopause" | "postmenopause";

/** Oxirgi hayzdan shuncha oy o'tsa — menopauza (STRAW+10). */
export const MENOPAUSE_MONTHS_WITHOUT_PERIOD = 12;
/** Menopauzadan shuncha yil o'tsa — postmenopauza deb yuritamiz. */
const POSTMENOPAUSE_YEARS = 5;

export interface StageInput {
  age: number | null;
  /** Oxirgi hayzdan beri o'tgan oylar. Hech qachon bo'lmagan bo'lsa null. */
  monthsSinceLastPeriod: number | null;
  /** Ayolning o'zi "sikllarim o'zgardi/tartibsiz" deganmi. */
  cyclesIrregular: boolean;
}

/**
 * Bosqichni aniqlaydi.
 *
 * Yoshning O'ZI hech qachon yetarli emas: 45 yoshda ham muntazam sikl
 * bo'lishi mumkin, 38 yoshda esa erta menopauza. Shuning uchun asosiy
 * belgi — hayzning o'zi.
 */
export function resolveMenopauseStage(input: StageInput): MenopauseStage {
  const { age, monthsSinceLastPeriod, cyclesIrregular } = input;

  if (monthsSinceLastPeriod !== null && monthsSinceLastPeriod >= MENOPAUSE_MONTHS_WITHOUT_PERIOD) {
    const yearsSince = monthsSinceLastPeriod / 12;
    return yearsSince >= POSTMENOPAUSE_YEARS + 1 ? "postmenopause" : "menopause";
  }

  // Sikl hali bor. Tartibsizlik + yosh — perimenopauzaning asosiy belgisi.
  if (cyclesIrregular && age !== null && age >= 40) return "perimenopause";
  // 45 dan keyin sikl o'zgarishi juda keng tarqalgan, hatto ayol buni
  // "tartibsiz" deb atamasa ham.
  if (age !== null && age >= 45) return "perimenopause";
  return "premenopause";
}

/**
 * Rejimni TAKLIF qilish kerakmi.
 *
 * Majburan ko'chirmaymiz: ayol o'zini qanday his qilishini o'zi biladi
 * va "siz klimaksdasiz" degan avtomatik qaror haqoratli bo'lishi
 * mumkin. Shuning uchun bu faqat taklif uchun signal.
 */
export function shouldSuggestMenopauseMode(input: StageInput): boolean {
  const stage = resolveMenopauseStage(input);
  return stage === "perimenopause" || stage === "menopause" || stage === "postmenopause";
}

/** MRS savollari — uch domen, jami 11 ta. */
export const MRS_ITEMS = [
  { id: "hot_flashes", domain: "somatic" },
  { id: "heart_discomfort", domain: "somatic" },
  { id: "sleep_problems", domain: "somatic" },
  { id: "joint_muscle", domain: "somatic" },
  { id: "depressive_mood", domain: "psychological" },
  { id: "irritability", domain: "psychological" },
  { id: "anxiety", domain: "psychological" },
  { id: "exhaustion", domain: "psychological" },
  { id: "sexual_problems", domain: "urogenital" },
  { id: "bladder_problems", domain: "urogenital" },
  { id: "vaginal_dryness", domain: "urogenital" },
] as const;

export type MrsItemId = (typeof MRS_ITEMS)[number]["id"];
export type MrsDomain = (typeof MRS_ITEMS)[number]["domain"];

/** Har bir savol 0 (yo'q) dan 4 (juda og'ir) gacha baholanadi. */
export type MrsScore = Partial<Record<MrsItemId, number>>;

export type MrsSeverity = "none" | "mild" | "moderate" | "severe";

export interface MrsResult {
  total: number;
  byDomain: Record<MrsDomain, number>;
  severity: MrsSeverity;
  /** Javob berilmagan savollar soni — natija to'liqmi. */
  unanswered: number;
}

/**
 * MRS natijasi.
 *
 * Chegaralar MRS qo'llanmasidan: 0-4 belgisiz, 5-8 yengil,
 * 9-16 o'rtacha, 17+ og'ir.
 */
export function scoreMrs(score: MrsScore): MrsResult {
  const byDomain: Record<MrsDomain, number> = { somatic: 0, psychological: 0, urogenital: 0 };
  let total = 0;
  let unanswered = 0;

  for (const item of MRS_ITEMS) {
    const raw = score[item.id];
    if (raw === undefined || raw === null) {
      unanswered++;
      continue;
    }
    const v = Math.max(0, Math.min(4, Math.round(raw)));
    byDomain[item.domain] += v;
    total += v;
  }

  const severity: MrsSeverity = total >= 17 ? "severe" : total >= 9 ? "moderate" : total >= 5 ? "mild" : "none";
  return { total, byDomain, severity, unanswered };
}

/**
 * Shifokorga murojaat qilish tavsiya etiladimi.
 *
 * MUHIM: bu tashxis emas. Lekin og'ir simptomlar davolanadi va ayol
 * ko'pincha "bu yoshning gashti, chidash kerak" deb o'ylab yuradi —
 * aynan shu ishonch tufayli yillab azob chekadi.
 */
export function shouldSeeDoctorForMenopause(result: MrsResult): boolean {
  return result.severity === "moderate" || result.severity === "severe";
}

/**
 * Menopauzadan keyin HAR QANDAY qon ketish — shoshilinch belgi.
 *
 * Buni alohida funksiya qilib qo'yish shart: postmenopauzal qon ketish
 * bachadon saratonining eng erta va eng muhim belgisi, va u 90%
 * hollarda aniqlanadi. Ilovada bu hech qachon "normal" deb
 * ko'rsatilmasligi kerak.
 */
export function isPostmenopausalBleeding(stage: MenopauseStage, hasBleeding: boolean): boolean {
  return hasBleeding && (stage === "menopause" || stage === "postmenopause");
}
