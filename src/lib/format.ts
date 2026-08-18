import type { Language } from "./i18n/types";

// Node's bundled ICU data doesn't always carry full month names for these
// locales, which makes Intl.DateTimeFormat fall back to terse "M08"-style
// tokens. Spelling the months out ourselves keeps the date readable
// everywhere, in every supported language.
const MONTHS: Record<Language, string[]> = {
  uz: [
    "yanvar",
    "fevral",
    "mart",
    "aprel",
    "may",
    "iyun",
    "iyul",
    "avgust",
    "sentabr",
    "oktabr",
    "noyabr",
    "dekabr",
  ],
  "uz-cyrl": [
    "январ",
    "феврал",
    "март",
    "апрел",
    "май",
    "июн",
    "июл",
    "август",
    "сентабр",
    "октабр",
    "ноябр",
    "декабр",
  ],
  ru: [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ],
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
};

export function formatDate(iso: string, lang: Language = "uz") {
  const d = new Date(iso);
  const day = d.getDate();
  const month = MONTHS[lang][d.getMonth()];
  const year = d.getFullYear();
  if (lang === "en") return `${month} ${day}, ${year}`;
  if (lang === "ru") return `${day} ${month} ${year}`;
  return `${day}-${month}, ${year}`;
}

/** Same as formatDate but without the year — for compact chart/axis labels. */
export function formatDateShort(iso: string, lang: Language = "uz") {
  const d = new Date(iso);
  const day = d.getDate();
  const month = MONTHS[lang][d.getMonth()];
  if (lang === "en") return `${month} ${day}`;
  if (lang === "ru") return `${day} ${month}`;
  return `${day}-${month}`;
}

export function formatDateTime(iso: string, lang: Language = "uz") {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${formatDate(iso, lang)}, ${hh}:${mm}`;
}
