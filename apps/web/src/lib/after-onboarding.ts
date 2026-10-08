/**
 * PARTNER-LINK-01 — onboardingdan KEYIN qaytiladigan manzil.
 *
 * Taklif havolasini bosgan hamkor deyarli har doim yangi foydalanuvchi
 * bo'ladi: /tg uni onboardingga yuboradi va `?next=` (ichida taklif kodi)
 * yo'qolardi. Bu esa taklifning ASOSIY holati edi.
 *
 * `sessionStorage` tanlandi: ma'lumot bitta seansga tegishli va keyingi
 * safar qolib ketmasligi kerak.
 */
export const AFTER_ONBOARDING_KEY = "mammoai_after_onboarding";

/** O'qiydi VA o'chiradi — bir martalik topshiriq. */
export function takeAfterOnboardingPath(): string | null {
  try {
    const value = sessionStorage.getItem(AFTER_ONBOARDING_KEY);
    if (value) sessionStorage.removeItem(AFTER_ONBOARDING_KEY);
    // Faqat shu saytdagi nisbiy yo'l — ochiq-yo'naltirishdan himoya
    // (/tg dagi bilan bir xil qoida).
    return value && value.startsWith("/") && !value.startsWith("//") ? value : null;
  } catch {
    return null;
  }
}
