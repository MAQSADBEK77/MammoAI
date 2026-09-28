/**
 * PREG-BAG-01 — tug'ruqxona sumkasi ro'yxati.
 *
 * Nega kerak: tug'ruq boshlanganda ro'yxat tuzishga vaqt qolmaydi va
 * sumkani odatda kimdir boshqa yig'adi. Lalu va Flo'da bu bo'lim bor,
 * lekin ularning ro'yxati boshqa mamlakat uchun: bizda ALMASHINUV
 * KARTASI va analiz natijalari qog'ozda talab qilinadi, chaqaloq uchun
 * yo'rgak va pelyonka kerak bo'ladi, ko'p tug'ruqxonada esa o'z
 * shippagingiz va idish-tovog'ingiz bilan borasiz.
 *
 * Ro'yxat 34-haftada tayyor bo'lishi kerak: tug'ruqning 10% i 37-haftaga
 * qadar boshlanadi, ya'ni "oxirgi haftada yig'aman" degan reja kech.
 */

export type BagGroup = "documents" | "mother" | "baby";

export interface BagItem {
  id: string;
  group: BagGroup;
  /** Tug'ruqxonaga kirishda majburiy — belgilanmasa alohida aytiladi. */
  essential: boolean;
}

export const HOSPITAL_BAG_WEEK = 34;

export const HOSPITAL_BAG_ITEMS: BagItem[] = [
  // Hujjatlar — bularsiz qabul qilinmaydi yoki kechikish bo'ladi.
  { id: "passport", group: "documents", essential: true },
  { id: "exchange_card", group: "documents", essential: true },
  { id: "test_results", group: "documents", essential: true },
  { id: "birth_contract", group: "documents", essential: false },
  { id: "partner_tests", group: "documents", essential: false },

  // Ona uchun
  { id: "nightgown", group: "mother", essential: true },
  { id: "robe", group: "mother", essential: true },
  { id: "slippers", group: "mother", essential: true },
  { id: "towels", group: "mother", essential: true },
  { id: "postpartum_pads", group: "mother", essential: true },
  { id: "disposable_underwear", group: "mother", essential: true },
  { id: "nursing_bra", group: "mother", essential: false },
  { id: "breast_pads", group: "mother", essential: false },
  { id: "toiletries", group: "mother", essential: true },
  { id: "hair_tie", group: "mother", essential: false },
  { id: "phone_charger", group: "mother", essential: true },
  { id: "water_snacks", group: "mother", essential: false },
  { id: "dishes", group: "mother", essential: false },
  { id: "compression_socks", group: "mother", essential: false },
  { id: "going_home_outfit", group: "mother", essential: false },

  // Chaqaloq uchun
  { id: "newborn_diapers", group: "baby", essential: true },
  { id: "wet_wipes", group: "baby", essential: true },
  { id: "bodysuits", group: "baby", essential: true },
  { id: "swaddles", group: "baby", essential: true },
  { id: "baby_hat", group: "baby", essential: true },
  { id: "baby_socks", group: "baby", essential: false },
  { id: "mittens", group: "baby", essential: false },
  { id: "baby_soap", group: "baby", essential: false },
  { id: "baby_blanket", group: "baby", essential: false },
  { id: "car_seat", group: "baby", essential: false },
];

export interface BagProgress {
  checked: number;
  total: number;
  percent: number;
  /** Belgilanmagan majburiy narsalar — ro'yxat tepasida ogohlantiriladi. */
  missingEssential: string[];
  ready: boolean;
}

/**
 * Ro'yxatning holati.
 *
 * "Tayyor" faqat MAJBURIY narsalar belgilanganda beriladi, hammasi
 * belgilanganda emas: avtokreslo yoki idish-tovoq yo'qligi tug'ruqxonaga
 * borishga xalaqit bermaydi, almashinuv kartasi yo'qligi esa beradi.
 */
export function bagProgress(checkedIds: string[], items: BagItem[] = HOSPITAL_BAG_ITEMS): BagProgress {
  const checkedSet = new Set(checkedIds);
  const checked = items.filter((i) => checkedSet.has(i.id)).length;
  const missingEssential = items.filter((i) => i.essential && !checkedSet.has(i.id)).map((i) => i.id);
  const total = items.length;
  return {
    checked,
    total,
    percent: total === 0 ? 0 : Math.round((checked / total) * 100),
    missingEssential,
    ready: missingEssential.length === 0,
  };
}
