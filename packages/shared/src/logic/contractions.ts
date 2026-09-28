// PREG-LABOR-01 — shvat (tug'ruq qisqarishlari) sanagichi.
//
// Nega bu shunchaki taymer emas: ayolga kerak bo'lgan javob "nechta
// qisqarish bo'ldi" emas, "QACHON tug'ruqxonaga borish kerak". Bu savolga
// tibbiyotda aniq javob bor va u 5-1-1 qoidasi deb ataladi:
//
//   qisqarishlar HAR 5 DAQIQADA bir marta,
//   har biri KAMIDA 1 DAQIQA davom etadi,
//   va bu holat KAMIDA 1 SOAT davom etadi.
//
// Shu uchtasi birga bajarilsa — shifokorga murojaat qilish vaqti.
// Manba: ACOG ko'rsatmalari asosidagi keng qo'llaniladigan qoida.
// https://www.goldcoastdoulas.com/the-5-1-1-rule-explained-signs-you-should-head-to-the-hospital/
//
// MUHIM: bu tashxis emas va tug'ruq boshlanganini TASDIQLAMAYDI. U faqat
// "endi kutmang, bog'laning" degan chegarani belgilaydi. Ekranda ham
// shunday yoziladi.

export interface Contraction {
  /** Boshlanish vaqti, ISO. */
  startedAt: string;
  /** Tugash vaqti, ISO. Hali davom etayotgan bo'lsa `null`. */
  endedAt: string | null;
}

export interface ContractionSummary {
  /** So'nggi bir soatdagi tugagan qisqarishlar soni. */
  count: number;
  /** O'rtacha davomiylik, soniya. Ma'lumot yetmasa `null`. */
  averageDurationSec: number | null;
  /** Boshlanishlar orasidagi o'rtacha oraliq, daqiqa. Ma'lumot yetmasa `null`. */
  averageIntervalMin: number | null;
  /** 5-1-1 qoidasi bajarildimi. */
  meetsRule: boolean;
}

/** Qoidaning uchta qismi — chaqiruvchi ularni matnda ishlatishi uchun. */
export const LABOR_RULE_INTERVAL_MIN = 5;
export const LABOR_RULE_DURATION_SEC = 60;
export const LABOR_RULE_WINDOW_MIN = 60;

/**
 * So'nggi bir soatdagi qisqarishlarni baholaydi.
 *
 * `now` — test qilinishi uchun tashqaridan beriladi.
 */
export function summarizeContractions(list: readonly Contraction[], now: Date = new Date()): ContractionSummary {
  const windowStart = now.getTime() - LABOR_RULE_WINDOW_MIN * 60_000;

  // Faqat TUGAGAN va oyna ichida boshlangan qisqarishlar. Davom etayotgani
  // hisobga olinmaydi — uning davomiyligi hali noma'lum.
  const recent = list
    .filter((c) => c.endedAt !== null && Date.parse(c.startedAt) >= windowStart)
    .sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt));

  if (recent.length === 0) {
    return { count: 0, averageDurationSec: null, averageIntervalMin: null, meetsRule: false };
  }

  const durations = recent.map((c) => (Date.parse(c.endedAt!) - Date.parse(c.startedAt)) / 1000);
  const averageDurationSec = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);

  // Oraliq — BOSHLANISHLAR orasida (tibbiyotda shunday o'lchanadi,
  // tugashdan keyingi tanaffus emas).
  let averageIntervalMin: number | null = null;
  if (recent.length >= 2) {
    const gaps: number[] = [];
    for (let i = 1; i < recent.length; i++) {
      gaps.push((Date.parse(recent[i].startedAt) - Date.parse(recent[i - 1].startedAt)) / 60_000);
    }
    averageIntervalMin = Math.round((gaps.reduce((a, b) => a + b, 0) / gaps.length) * 10) / 10;
  }

  // Qoida uchun namuna KAMIDA BIR SOATNI qoplashi kerak. Aks holda
  // "20 daqiqada to'rtta qisqarish" ham qoidani bajargandek ko'rinardi,
  // holbuki qoida aynan davomiylikni talab qiladi.
  const spanMin = (Date.parse(recent[recent.length - 1].startedAt) - Date.parse(recent[0].startedAt)) / 60_000;
  const meetsRule =
    averageIntervalMin !== null &&
    averageIntervalMin <= LABOR_RULE_INTERVAL_MIN &&
    averageDurationSec >= LABOR_RULE_DURATION_SEC &&
    spanMin >= LABOR_RULE_WINDOW_MIN - 5;

  return { count: recent.length, averageDurationSec, averageIntervalMin, meetsRule };
}
