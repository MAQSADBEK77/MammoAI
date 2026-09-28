/**
 * PREG-RED-01 — homiladorlikdagi xavfli belgilar.
 *
 * Bu ilovadagi eng muhim ro'yxat. Qolgan hamma narsa (hafta, rasm,
 * albom) kechiktirsa bo'ladigan ma'lumot; bu esa VAQTGA bog'liq.
 * O'zbekistonda onalar o'limining katta qismi kech murojaat bilan
 * bog'liq — ayol "o'tib ketar" deb kutadi, chunki qaysi belgi
 * kutishga yaramasligini hech kim aytmagan.
 *
 * Shuning uchun har bir belgi YONIDA nima qilish kerakligi turadi.
 * "Shifokorga murojaat qiling" degan umumiy gap yetarli emas: 103 ga
 * qo'ng'iroq qilish bilan ertaga qabulga yozilish orasidagi farq shu
 * yerda aytiladi.
 */

/** Nima qilish kerak — eng shoshilinchidan boshlab. */
export type WarningAction = "emergency" | "maternity" | "today";

export interface WarningSign {
  id: string;
  action: WarningAction;
}

/** O'zbekistonda tez yordam raqami. */
export const EMERGENCY_NUMBER = "103";

export const WARNING_SIGNS: WarningSign[] = [
  { id: "heavy_bleeding", action: "emergency" },
  { id: "seizure", action: "emergency" },
  { id: "severe_abdominal_pain", action: "emergency" },
  { id: "fainting", action: "emergency" },
  { id: "breathing_chest_pain", action: "emergency" },

  { id: "reduced_movement", action: "maternity" },
  { id: "waters_breaking", action: "maternity" },
  { id: "severe_headache_vision", action: "maternity" },
  { id: "sudden_swelling", action: "maternity" },
  { id: "preterm_contractions", action: "maternity" },
  { id: "fever", action: "maternity" },
  { id: "persistent_vomiting", action: "maternity" },

  { id: "light_bleeding", action: "today" },
  { id: "itching", action: "today" },
  { id: "painful_urination", action: "today" },
  { id: "fall_or_blow", action: "today" },
];

const ORDER: Record<WarningAction, number> = { emergency: 0, maternity: 1, today: 2 };

/** Belgilarni shoshilinchlik bo'yicha guruhlab qaytaradi. */
export function warningSignsByAction(signs: WarningSign[] = WARNING_SIGNS): [WarningAction, WarningSign[]][] {
  const actions: WarningAction[] = ["emergency", "maternity", "today"];
  return actions
    .map((a) => [a, signs.filter((s) => s.action === a)] as [WarningAction, WarningSign[]])
    .filter(([, items]) => items.length > 0)
    .sort(([a], [b]) => ORDER[a] - ORDER[b]);
}
