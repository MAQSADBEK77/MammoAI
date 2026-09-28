/**
 * ONB-NOTIF-02 — onboardingdagi bildirishnoma tanlovi.
 *
 * Nega bu alohida funksiya: bu yerda bitta belgi butun mahsulotning
 * va'dasini o'chirib qo'yardi. Sahifada `!!survey.notificationsEnabled`
 * turardi, ya'ni TANLANMAGAN holat (`null`) ham FALSE bo'lib ketardi.
 *
 * O'lchandi (production, 2026-09-28):
 *   onboardingni tugatgan 147 ayol — 28 tasida eslatma yoqilgan,
 *   119 tasida o'chiq;
 *   onboardingni tugatmagan 40 ayol — 40 tasida ham yoqilgan.
 *
 * Ya'ni onboardingdan o'tish eslatmani O'CHIRARDI, o'tmaslik esa yo'q.
 * Buning sababi mana shu bitta ikki belgi edi.
 *
 * Qoida oddiy: faqat ANIQ rad javobi o'chiradi. Tanlov qilinmagan
 * bo'lsa hisobning standart qiymati (yoqilgan) saqlanadi — ayol uni
 * profilda istalgan vaqtda o'chira oladi.
 */
export function resolveNotificationsChoice(choice: boolean | null | undefined): boolean {
  return choice ?? true;
}
