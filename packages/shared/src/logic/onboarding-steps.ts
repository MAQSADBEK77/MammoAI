/**
 * ONB-LANG-01 — qoralamadan tiklanadigan qadamni topish.
 *
 * Onboarding qadamlari ro'yxati o'zgaruvchan: maqsad, yosh va Telegram
 * orqali kirish ba'zi savollarni olib tashlaydi. Shuning uchun qoralamada
 * qadam INDEKSI emas, NOMI saqlanadi.
 *
 * Lekin nom ham yo'qolishi mumkin. Haqiqiy holat: ayol tilni tanlaydi,
 * `account_choice` qadamiga o'tadi, Telegram orqali kiradi — va qaytgan
 * sahifada `account_choice` umuman ko'rsatilmaydi (u Telegram
 * foydalanuvchilari uchun filtrlangan). Ilgari bunda ro'yxatning BOSHIGA
 * qaytarilardi, ya'ni ayol tilni ikkinchi marta tanlashi so'ralardi.
 *
 * To'g'ri javob — oldinga, orqaga emas: kanonik tartibda saqlangan
 * qadamdan KEYINGI birinchi mavjud qadamga o'tamiz.
 */
export function resolveRestoreStep<T extends string>(
  savedStep: T,
  steps: readonly T[],
  canonical: readonly T[]
): T | null {
  if (steps.includes(savedStep)) return savedStep;
  const at = canonical.indexOf(savedStep);
  if (at < 0) return null;
  return canonical.slice(at + 1).find((step) => steps.includes(step)) ?? null;
}
