// COMM-001 — jamiyat postlarida tibbiy-shoshilinch ko'rinishdagi matnlarni
// aniqlash. Tashxis EMAS, avtomatik yashirish/bloklash HAM emas — faqat (1)
// postning o'zida "shifokorga murojaat qiling" ogohlantirishini ko'rsatish va
// (2) admin moderatsiya navbatida shu turdagi postlarni ustuvor qilish uchun
// yumshoq signal. Soxta-musbat (false positive) xavfsiz — ortiqcha
// ogohlantirish zararli emas, aksincha soxta-manfiy (ko'zdan qochirish)dan
// ko'ra yaxshiroq, shuning uchun ro'yxat ataylab kengroq.
const MEDICAL_CONCERN_KEYWORDS = [
  "qon ketmoqda",
  "qon ketyapti",
  "qattiq og'ri",
  "kuchli og'ri",
  "chidab bo'lmas",
  "shifokorga",
  "tez yordam",
  "homiladorlikda dori",
  "dori ichsam",
  "hayzim yo'q",
  "hayz kelmayapti",
  "3 oy hayz",
  "necha oy hayz",
  "bachadonda",
  "homila harakat qilmayapti",
  "erta tug'ruq",
  "tuxumdon",
  "saraton",
  "o'lgim kelyapti",
  "yashashni xohlamayman",
];

export function detectsMedicalConcern(text: string): boolean {
  const lower = text.toLowerCase();
  return MEDICAL_CONCERN_KEYWORDS.some((kw) => lower.includes(kw));
}
