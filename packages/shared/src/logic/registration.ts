/**
 * AUTH-04 — foydalanuvchi ro'yxatdan o'tganmi?
 *
 * Ilova endi ANONIM ishlatiladi: ayol hech narsa aytmasdan kiradi,
 * siklini belgilaydi, ko'rib chiqadi. Ayrim funksiyalar esa hisob talab
 * qiladi — ular pul turadi (AI yordamchi), moderatsiya talab qiladi
 * (jamiyatga yozish) yoki tashqi kanalga bog'langan (kunlik eslatma).
 *
 * "Ro'yxatdan o'tgan" degani — hisobga TIKLASH MUMKIN bo'lgan shaxs
 * biriktirilgan: telefon yoki Telegram. Alohida ustun ochilmadi, chunki
 * u ikkinchi haqiqat manbai bo'lardi va ikkalasi bir-biridan chetlab
 * ketishi mumkin edi.
 */

export interface RegistrationIdentity {
  phone?: string | null;
  telegramUserId?: string | null;
}

export function isRegisteredUser(user: RegistrationIdentity | null | undefined): boolean {
  if (!user) return false;
  return !!(user.phone || user.telegramUserId);
}

/** Hisob talab qiladigan funksiyalar. */
export type GatedFeature = "ai-chat" | "community-post" | "reminders" | "partner" | "doctor-report";

export const GATED_FEATURES: GatedFeature[] = [
  "ai-chat",
  "community-post",
  "reminders",
  "partner",
  "doctor-report",
];

/**
 * Funksiyani ochish mumkinmi.
 *
 * Ro'yxatda YO'Q hamma narsa ochiq — sikl kuzatuvi, kalendar,
 * homiladorlik kontenti, maqolalar, tekshiruvlar, klinikalar. Bu ataylab
 * shunday: ilovaning asosiy va'dasi hisobsiz ham ishlashi kerak.
 */
export function canUseFeature(feature: string, user: RegistrationIdentity | null | undefined): boolean {
  if (!(GATED_FEATURES as string[]).includes(feature)) return true;
  return isRegisteredUser(user);
}
