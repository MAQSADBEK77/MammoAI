// Node's bundled ICU data doesn't always carry full month names for "uz-UZ",
// which makes Intl.DateTimeFormat fall back to terse "M08"-style tokens.
// Spelling the months out ourselves keeps the date readable everywhere.
const UZ_MONTHS = [
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
];

export function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}-${UZ_MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
}

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${formatDate(iso)}, ${hh}:${mm}`;
}
