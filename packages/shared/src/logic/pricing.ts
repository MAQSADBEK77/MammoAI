/**
 * PRICE-SIGNAL-01 — Premium narxi va "to'lashga tayyorlik" o'lchovi.
 *
 * Muammo (production, 2026-10-08):
 *   - Paywall UCHTA joyda bor: AI yordamchi (5 ta bepul xabardan keyin),
 *     /statistika va /hisobot. Uchalasi ham 402 qaytaradi.
 *   - To'lash YO'LI YO'Q: Payme/Click integratsiyasi yozilmagan, `subscriptions`
 *     jadvalidagi 4 ta "premium" qatorning hammasi admin qo'li bilan berilgan.
 *   - Narx HECH QAYERDA ko'rsatilmagan. Ayol "Premium kerak" degan yozuvni
 *     ko'radi, lekin qancha turishini bilmaydi. Yagona yozilgan so'rov matni
 *     shunday edi: "Premium kk".
 *   - 50 ayoldan 12 tasi 5 ta bepul xabar devoriga yetib kelgan (24%).
 *
 * Shuning uchun to'lov integratsiyasidan OLDIN arzonroq savol beriladi:
 *   narxni KO'RSATAMIZ va ayol o'zi tanlaydi — oylik, yillik yoki "qimmat".
 *
 * Nega avval shu: to'lov integratsiyasi yuridik shaxs va merchant shartnomasi
 * talab qiladi. Agar narxni ko'rgan ayollarning deyarli hammasi "qimmat" desa,
 * o'sha shartnomani boshlashdan oldin narxni o'zgartirgan ma'qul.
 *
 * MUHIM: bu yerdagi raqamlar o'lchov EMAS, taxmin. Flo yiliga $39.99 oladi —
 * bazamizdagi 227 anketadan 182 tasi 25 yoshgacha bo'lgan auditoriya uchun bu
 * real emas. Shuning uchun past narxdan boshlanadi va javob ma'lumot bilan
 * aniqlanadi.
 */

/** Oylik obuna narxi (so'm). */
export const PREMIUM_MONTHLY_UZS = 9900;

/** Yillik obuna narxi (so'm) — oylikka nisbatan chegirma bilan. */
export const PREMIUM_YEARLY_UZS = 79000;

/** Ayol paywallda nima tanlagani. */
export type PremiumInterestChoice = "monthly" | "yearly" | "too_expensive";

export const PREMIUM_INTEREST_CHOICES: readonly PremiumInterestChoice[] = [
  "monthly",
  "yearly",
  "too_expensive",
];

/**
 * Paywall QAYERDA ko'rsatilgani. Narx bitta bo'lsa ham, javob joyga qarab
 * farq qilishi mumkin: suhbatni davom ettirish uchun to'lash bilan bir marta
 * hisobot olish uchun to'lash — bir xil qaror emas.
 */
export type PremiumInterestSource = "chat_wall" | "statistics" | "doctor_report" | "profile";

export const PREMIUM_INTEREST_SOURCES: readonly PremiumInterestSource[] = [
  "chat_wall",
  "statistics",
  "doctor_report",
  "profile",
];

export function isPremiumInterestChoice(value: unknown): value is PremiumInterestChoice {
  return typeof value === "string" && (PREMIUM_INTEREST_CHOICES as readonly string[]).includes(value);
}

export function isPremiumInterestSource(value: unknown): value is PremiumInterestSource {
  return typeof value === "string" && (PREMIUM_INTEREST_SOURCES as readonly string[]).includes(value);
}

/**
 * So'm summasini o'qiladigan ko'rinishga keltiradi: 9900 -> "9 900".
 *
 * Ajratuvchi — oddiy bo'shliq emas, UZUNLIKSIZ bo'shliq (U+00A0): raqam
 * satr oxirida ikkiga bo'linib ketmasin.
 */
export function formatUzs(amount: number): string {
  const rounded = Math.round(Math.abs(amount));
  const digits = String(rounded);
  const groups: string[] = [];
  for (let end = digits.length; end > 0; end -= 3) {
    groups.unshift(digits.slice(Math.max(0, end - 3), end));
  }
  const body = groups.join(" ");
  return amount < 0 ? `-${body}` : body;
}

/**
 * Yillik obuna oylikka nisbatan necha foiz arzon.
 *
 * Hisoblanadi, qo'lda yozilmaydi — narx o'zgarganda matn o'z-o'zidan
 * to'g'ri qoladi. Ilgari shunga o'xshash raqamlar qo'lda yozilib, narx
 * o'zgargach yolg'onga aylanardi.
 */
export function yearlySavingsPercent(
  monthly: number = PREMIUM_MONTHLY_UZS,
  yearly: number = PREMIUM_YEARLY_UZS
): number {
  const fullYear = monthly * 12;
  if (fullYear <= 0) return 0;
  return Math.max(0, Math.round(((fullYear - yearly) / fullYear) * 100));
}

/** Yillik obunaning bir oyga tushadigan narxi — taqqoslash uchun. */
export function yearlyPerMonthUzs(yearly: number = PREMIUM_YEARLY_UZS): number {
  return Math.round(yearly / 12);
}
