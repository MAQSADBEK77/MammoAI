/**
 * PHONE-02 — telefon raqami: O'zbekiston va Qirg'iziston.
 *
 * Ilgari modul faqat +998 bilan ishlardi va prefiks matnga "pishirilgan"
 * edi. Qirg'izistonlik foydalanuvchi ro'yxatdan o'ta olmasdi: uning
 * raqami hech qachon to'liq hisoblanmasdi va tugma abadiy o'chiq
 * turardi — sababi esa ekranda aytilmasdi.
 *
 * Ikkala mamlakatda ham milliy raqam 9 xonali, shuning uchun guruhlash
 * bir xil: "## ### ## ##".
 */

export interface PhoneCountry {
  /** ISO kodi — bayroq va tanlov uchun. */
  code: "UZ" | "KG";
  /** Xalqaro prefiks, "+" bilan. */
  dial: string;
  /** Milliy qism uzunligi. */
  digits: number;
  /** Bayroq emojisi — tanlagichda. */
  flag: string;
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: "UZ", dial: "+998", digits: 9, flag: "\u{1F1FA}\u{1F1FF}" },
  { code: "KG", dial: "+996", digits: 9, flag: "\u{1F1F0}\u{1F1EC}" },
];

export const DEFAULT_PHONE_COUNTRY = PHONE_COUNTRIES[0];

export function phoneCountryByCode(code: string | null | undefined): PhoneCountry {
  return PHONE_COUNTRIES.find((c) => c.code === code) ?? DEFAULT_PHONE_COUNTRY;
}

/**
 * Raqamning O'ZIDAN mamlakatni aniqlaydi.
 *
 * Kerak, chunki raqam bazadan ham keladi (+996...), tanlov esa
 * saqlanmagan. Topilmasa — null, ya'ni chaqiruvchi taxmin qilmaydi.
 */
export function phoneCountryOfNumber(e164: string | null | undefined): PhoneCountry | null {
  if (!e164) return null;
  const digits = e164.replace(/\D/g, "");
  return PHONE_COUNTRIES.find((c) => digits.startsWith(c.dial.slice(1))) ?? null;
}

/** Faqat milliy qismning raqamlari (prefikssiz, kesilgan). */
function nationalDigits(raw: string, country: PhoneCountry): string {
  let digits = raw.replace(/\D/g, "");
  const dial = country.dial.slice(1);
  // Foydalanuvchi prefiksni o'zi ham yozishi mumkin ("+996 555..." yoki
  // "996555..."), va joylashtirganda u ikki marta tushib qolardi.
  if (digits.startsWith(dial)) digits = digits.slice(dial.length);
  return digits.slice(0, country.digits);
}

/**
 * Xom matnni "+998 XX XXX XX XX" ko'rinishiga o'giradi.
 *
 * Mamlakat berilmasa O'zbekiston — eski chaqiruvlar o'zgarishsiz
 * ishlashi uchun.
 */
export function formatPhoneInput(raw: string, country: PhoneCountry = DEFAULT_PHONE_COUNTRY): string {
  const digits = nationalDigits(raw, country);
  let out = country.dial;
  if (digits.length > 0) out += " " + digits.slice(0, 2);
  if (digits.length > 2) out += " " + digits.slice(2, 5);
  if (digits.length > 5) out += " " + digits.slice(5, 7);
  if (digits.length > 7) out += " " + digits.slice(7, 9);
  return out;
}

/**
 * To'liq kiritilgan bo'lsa E.164 ("+996555123456"), aks holda `null`.
 */
export function extractPhoneDigits(masked: string, country: PhoneCountry = DEFAULT_PHONE_COUNTRY): string | null {
  const digits = nationalDigits(masked, country);
  if (digits.length !== country.digits) return null;
  return `${country.dial}${digits}`;
}

/**
 * Qaysi mamlakat ekanini bilmagan holda tekshiradi — server uchun.
 *
 * Server mijozning tanloviga ISHONMASLIGI kerak: raqam bazaga yozilishidan
 * oldin qo'llab-quvvatlanadigan kodlardan biriga mos kelishi shart.
 */
export function normalizeKnownPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  for (const c of PHONE_COUNTRIES) {
    const dial = c.dial.slice(1);
    if (digits.startsWith(dial) && digits.length === dial.length + c.digits) {
      return `+${digits}`;
    }
  }
  return null;
}

/** @deprecated `formatPhoneInput` ishlating — mamlakat tanlovi bilan. */
export function formatUzPhoneInput(raw: string): string {
  return formatPhoneInput(raw, DEFAULT_PHONE_COUNTRY);
}

/** @deprecated `extractPhoneDigits` ishlating — mamlakat tanlovi bilan. */
export function extractUzPhoneDigits(masked: string): string | null {
  return extractPhoneDigits(masked, DEFAULT_PHONE_COUNTRY);
}
