/**
 * APPREVIEW-01 — App Store tekshiruvchisi uchun Telegram'siz kirish kodi.
 *
 * Nima uchun: ro'yxatdan o'tish faqat Telegram orqali ishlaydi — telefon
 * kodi ham SMS emas, Telegram botga keladi. Apple tekshiruvchisida bizning
 * botimiz yo'q, ya'ni u hisob talab qiladigan bo'limlarni (AI yordamchi,
 * jamiyatga yozish, eslatmalar, hamkor, hisobot) umuman ko'ra olmasdi —
 * 2.1 "Information Needed" rad etishining aynan shu sababi.
 *
 * Yechim: `is_test_account` bayrog'i qo'yilgan akkaunt uchun kod Telegram
 * o'rniga muhit o'zgaruvchisidan (`REVIEW_LOGIN_CODE`) olinadi. Kod
 * berilmagan yoki formati noto'g'ri bo'lsa — yo'l butunlay yopiq, ya'ni
 * o'zgaruvchini o'chirishning o'zi bu imkoniyatni bekor qiladi.
 */
export function parseReviewLoginCode(raw: string | null | undefined): string | null {
  const code = raw?.trim() ?? "";
  // Kirish ekranidagi kod maydoni faqat 6 ta raqam qabul qiladi
  // (apps/web/src/app/kirish/page.tsx) — boshqa uzunlikdagi kodni
  // tekshiruvchi umuman kirita olmasdi.
  return /^\d{6}$/.test(code) ? code : null;
}
