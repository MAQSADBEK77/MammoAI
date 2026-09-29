/**
 * SIZE-ART-01 — "chaqaloq qanday kattalikda" rasmlari.
 *
 * Ekranda "Bolangiz hozir qovun kattaligida" deb yoziladi. Yonidagi
 * belgi esa EMOJI edi va u ikki sababga ko'ra to'g'ri kelmasdi:
 *
 *   1. Emoji to'plami atigi 10 ta mevani qoplaydi, bazada esa har hafta
 *      uchun alohida nom bor (41 ta). "moshdona", "romaine salat",
 *      "pichan", "anor" uchun mos emoji YO'Q.
 *   2. Nom bazadan (hafta aniqligida), emoji esa 4 haftalik jadvaldan
 *      kelardi — 34-haftada "qovun kattaligida" deb yozilib, yonida
 *      ANANAS turardi.
 *
 * Endi rasm NOMGA bog'langan: bitta manba, bitta haqiqat. Rasmlar —
 * `apps/web/public/size/<slug>.svg` (qo'lda chizilgan, yagona uslubda).
 *
 * Nom admin panelda o'zgartirilishi mumkin, shuning uchun moslik
 * qat'iy emas: topilmasa `null` qaytadi va ilova avvalgidek ishlaydi.
 */

/** O'zbekcha nom -> rasm fayli (kengaytmasiz). */
const SIZE_ART: Record<string, string> = {
  "hali otalanmagan": "poppyseed",
  "moshdona urugi": "mungseed",
  "qum zarrachasi": "sand",
  moshdona: "mungseed",
  "kunjut urugi": "sesame",
  "noxat donasi": "pea",
  "kok moviz": "blueberry",
  malina: "malina",
  uzum: "grapes",
  kivi: "kiwi",
  anjir: "fig",
  anor: "pomegranate",
  limon: "lemon",
  laym: "lemon",
  shaftoli: "peach",
  apelsin: "orange",
  olma: "apple",
  avokado: "avocado",
  nok: "pear",
  "bolgar qalampiri": "bellpepper",
  pomidor: "tomato",
  banan: "banan",
  sabzi: "carrot",
  bodring: "cucumber",
  baqlajon: "eggplant",
  "katta baqlajon": "eggplant",
  makkajoxori: "corn",
  "gulkaram boshi": "cauliflower",
  "karam boshi": "cabbage",
  "katta karam": "cabbage",
  "gul karam": "romanesco",
  "kichik qovoq": "pumpkin",
  "kokos yongogi": "coconut",
  ananas: "pineapple",
  "katta ananas": "pineapple",
  qovun: "qovun",
  "katta qovun": "qovun",
  "kichik qovun": "qovun",
  "romaine salat": "lettuce",
  "pichan (leek)": "leek",
  pichan: "leek",
  "kichik tarvuz": "watermelon-small",
  tarvuz: "watermelon",
  "katta tarvuz": "watermelon",
};

/**
 * Nomni solishtirishga tayyorlaydi.
 *
 * O'zbek lotinida apostrof bir necha xil yoziladi ("moshdona urug'i",
 * "urugʻi", "urug`i") va nom admin panelda qo'lda kiritiladi. Apostrof
 * shakli tufayli rasm yo'qolib qolmasligi uchun ularning hammasi
 * olib tashlanadi.
 */
function normalize(label: string): string {
  return label
    .toLowerCase()
    .replace(/[ʻʼ‘’'`´]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Nomga mos rasm fayli yoki `null`. */
export function sizeArtSlug(label: string | null | undefined): string | null {
  if (!label) return null;
  return SIZE_ART[normalize(label)] ?? null;
}
