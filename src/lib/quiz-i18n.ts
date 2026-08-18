import { latinToCyrillicUz } from "./transliterate";
import type { Language } from "./i18n/types";
import type { QuizQuestion } from "./types";

/** The question text in the given language, falling back to the base (uz) text. */
export function localizedQuestionText(q: QuizQuestion, lang: Language): string {
  if (lang === "uz") return q.text;
  // Cyrillic isn't a separate admin-authored translation — it's the same
  // uz text, converted script (see lib/transliterate.ts).
  if (lang === "uz-cyrl") return latinToCyrillicUz(q.text);
  return q.translations?.[lang]?.text?.trim() || q.text;
}

/** An option's text in the given language, falling back to the base (uz) text. */
export function localizedOptionText(q: QuizQuestion, optionId: string, baseText: string, lang: Language): string {
  if (lang === "uz") return baseText;
  if (lang === "uz-cyrl") return latinToCyrillicUz(baseText);
  return q.translations?.[lang]?.options?.[optionId]?.trim() || baseText;
}
