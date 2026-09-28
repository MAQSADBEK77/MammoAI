// ART-01 — maqola kartasidagi rasm.
//
// Nega surat emas, illyustratsiya: bizda allaqachon o'sha uslubda
// (200x200, pastel doira foni, tekis shakllar) to'plam bor; stok
// fotolar esa o'zbek auditoriyasi uchun begona ko'rinadi va
// litsenziya masalasini keltirib chiqaradi.
//
// Nega SLUG bo'yicha, kategoriya bo'yicha emas: kategoriya atigi uchta,
// ya'ni 14 ta maqolada bitta rasm 5 marta takrorlanardi. Takrorlangan
// rasm — bezak emas, shovqin: ayol kartalarni bir-biridan ajrata
// olmaydi. Shuning uchun avval ANIQ maqolaga qaraymiz, mos rasm
// bo'lmagandagina kategoriyaga tushamiz.

import type { ArticleCategory } from "../types";

/** Kategoriya uchun oxirgi chora — aniq mos rasm topilmaganda. */
const CATEGORY_ART: Record<ArticleCategory, string> = {
  cycle: "/goal-icons/track_period.svg",
  pregnancy: "/goal-icons/track_pregnancy.svg",
  checkups: "/goal-icons/checkups.svg",
};

/** Maqolaning o'ziga tegishli rasm. Kalit — `articles.slug`. */
const SLUG_ART: Record<string, string> = {
  "hayz-sikli-fazalari": "/article-art/cycle-phases.svg",
  "hayz-sikli-nima-normal": "/goal-icons/track_period.svg",
  "unumdor-kunlar-nima": "/article-art/fertile-days.svg",
  "endometrioz-belgilari": "/condition-icons/endometrioz.svg",
  "pcos-polikistoz": "/condition-icons/pcos.svg",
  "kontratseptsiya-usullari": "/article-art/contraception.svg",
  "klimaks-nima-kutish": "/goal-icons/perimenopause.svg",
  "birinchi-trimestr": "/goal-icons/track_pregnancy.svg",
  "homiladorlikda-ovqatlanish": "/article-art/nutrition.svg",
  "homiladorlikka-tayyorgarlik": "/goal-icons/get_pregnant.svg",
  "bachadon-boyni-skriningi": "/article-art/cervical-screening.svg",
  "kokrakni-oz-ozini-tekshirish": "/article-art/breast-self-exam.svg",
  "mammografiya-nima": "/article-art/mammography.svg",
  "ginekolog-korigiga-tayyorgarlik": "/goal-icons/checkups.svg",
};

/**
 * Kartada ko'rsatiladigan rasm yo'li. Noma'lum slug (admin panelda
 * qo'lda yozilgan yangi maqola) hech qachon "bo'sh joy" bermaydi —
 * kategoriya rasmi bilan qoplanadi.
 */
export function articleArtPath(slug: string, category: ArticleCategory): string {
  return SLUG_ART[slug] ?? CATEGORY_ART[category];
}

// Fon ATAYLAB neytral (`bg-surface-muted`), kategoriya rangi EMAS.
// Ilgari kategoriya bo'yicha bo'yalgan edi, lekin `--color-primary`
// REJIMGA qarab o'zgaradi va ba'zi rejimlarda `--color-accent` bilan
// aynan bir xil (#0d9488) bo'lib qoladi — ya'ni "hayz sikli" va
// "tekshiruvlar" bir xil ko'rinardi. Rangni endi illyustratsiyaning
// o'zi beradi, u esa har maqolada boshqacha.
