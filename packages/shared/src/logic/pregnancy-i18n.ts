/**
 * PREG-I18N — homiladorlik haftasi matnini foydalanuvchining tilida tanlash.
 *
 * Nega alohida sof funksiya: qoida ko'rinishidan oddiy ("tarjima bo'lsa
 * olamiz"), lekin ichida uchta alohida qaror bor va ularning har biri
 * noto'g'ri bajarilsa ayol buzuq ekran ko'radi:
 *
 *   1. Tarjima yo'q bo'lsa — O'ZBEKCHA beriladi, bo'sh satr emas.
 *   2. Har bir maydon ALOHIDA tanlanadi: tarjima qisman to'ldirilgan
 *      bo'lsa, to'ldirilgan qismi o'z tilida, qolgani o'zbekcha chiqadi.
 *      Butun qatorni rad etish ayoldan tayyor tarjimani ham yashirardi.
 *   3. Faqat bo'shliqdan iborat matn ham "yo'q" deb hisoblanadi — admin
 *      maydonni tozalaganda tarjima o'chadi, lekin ekran buzilmaydi.
 *
 * uz-cyrl bu yerda YO'Q: kirill matni lotinchadan avtomatik o'giriladi
 * (i18n/transliterate.ts), ya'ni bazada ikkinchi nusxa saqlanmaydi.
 */

export interface PregnancyText {
  sizeLabel: string;
  babyDevelopment: string;
  motherChanges: string;
}

export type PregnancyContentLanguage = "uz" | "uz-cyrl" | "ru" | "en";

export interface PregnancyTextSource {
  uz: PregnancyText;
  ru?: Partial<PregnancyText> | null;
  en?: Partial<PregnancyText> | null;
}

function pick(translated: string | null | undefined, fallback: string): string {
  const value = translated?.trim();
  return value ? value : fallback;
}

export function resolvePregnancyText(source: PregnancyTextSource, language: PregnancyContentLanguage): PregnancyText {
  const t = language === "ru" ? source.ru : language === "en" ? source.en : null;
  if (!t) return source.uz;
  return {
    sizeLabel: pick(t.sizeLabel, source.uz.sizeLabel),
    babyDevelopment: pick(t.babyDevelopment, source.uz.babyDevelopment),
    motherChanges: pick(t.motherChanges, source.uz.motherChanges),
  };
}
