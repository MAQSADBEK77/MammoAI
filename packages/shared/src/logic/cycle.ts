// Hayz tsikli bashorati — spec §2: "ilova keyingi tsiklni bashorat qiladi".
// Oddiy arifmetika, ML kerak emas.

import type { CycleLog, CycleSettings, FlowLevel, Symptom } from "../types";
import { tashkentDateStr } from "../date";

export const DEFAULT_CYCLE_LENGTH = 28;
export const DEFAULT_PERIOD_LENGTH = 5;
/** 3+ oy tartibsizlik — checklist'ga ko'prik (spec §2). */
export const IRREGULARITY_MONTHS_THRESHOLD = 3;

// Adaptiv hisoblash sozlamalari — haqiqiy `cycle_logs` tarixidan sikl
// uzunligini "o'rganish" uchun (bir marta onboarding'da kiritilgan statik
// qiymatga abadiy tayanish o'rniga — Flo/Clue kabi ilovalar shunday ishlaydi).
const CYCLE_GAP_DAYS = 2; // shuncha kun flow'siz o'tsa, keyingi flow kuni yangi sikl boshlanishi hisoblanadi
const ADAPTIVE_MAX_CYCLES = 6; // o'rtacha shu oxirgi N ta sikldan hisoblanadi (juda eski ma'lumot og'irlik qilmasin)
// CYCLE-ALGO-04: eski ADAPTIVE_MIN_CYCLES=2 QATTIQ chegarasi o'rniga —
// "2 ta bo'lsa to'liq shaxsiy o'rtacha" degan keskin sakrashni Bayesian
// shrinkage bilan almashtiradi (pastda, deriveAdaptiveCycleSettings ichida).
// "3 ta siklga teng ishonch og'irligi" — n=SHRINKAGE_K'da shaxsiy va umumiy
// (prior) taxminan teng og'irlikda bo'ladi (n/(n+k) = 3/6 = 50%).
const SHRINKAGE_K = 3;
// CYCLE-ALGO-07: bashorat DIAPAZONI shakllanadigan standart og'ish — n<2'da
// (ishonchli namuna og'ishini hisoblab bo'lmaydigan holatlarda) ishlatiladi.
// 4 kun — "past ishonch" darajasiga mos keladigan, taxminiy tarqalishni aks
// ettiruvchi oqilona standart qiymat.
const DEFAULT_STD_DEV_DAYS = 4;
// isCycleIrregular=true bo'lganda diapazon KENGROQ bo'lishi kerak (talab 6b:
// "masalan ±1.5 std dev, ±1 emas").
const IRREGULAR_STD_DEV_MULTIPLIER = 1.5;
const MIN_SANE_CYCLE_LENGTH = 15;
const MAX_SANE_CYCLE_LENGTH = 60;
const MIN_SANE_PERIOD_LENGTH = 1;
const MAX_SANE_PERIOD_LENGTH = 10;

// CYCLE-ALGO-01: eksport qilingan — cycle-backtest.ts (backtest harness) shu
// ikkalasini qayta ishlatadi, sana matematikasini uchinchi marta yozmaslik uchun.
export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round(
    (new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / msPerDay
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// CYCLE-ALGO-02: RECENCY_DECAY — eksponensial pasayuvchi og'irlik bazasi.
// 0.7 tanlangan sabab: N=6 (ADAPTIVE_MAX_CYCLES) oynada eng eski sikl
// (weight=0.7^5≈0.168) eng yangisiga (weight=1) nisbatan ~1/6 ta'sirga ega
// bo'ladi — foydali "yaqinroq tarix ko'proq ahamiyatli" xatti-harakatni
// beradi, lekin haddan tashqari tor emas (masalan 0.5 bo'lganda eng eski
// sikl deyarli hech qanday og'irlikka ega bo'lmas edi).
const RECENCY_DECAY = 0.7;

/**
 * CYCLE-ALGO-02: eksponensial pasayuvchi og'irlikli o'rtacha — oddiy (tekis)
 * o'rtacha o'rniga, eng so'nggi qiymat eng ko'p ta'sir qiladi (tana holati,
 * yosh, stress darajasi vaqt bilan o'zgaradi — 6 oy oldingi sikl bugungi
 * bashoratga bugungiga teng darajada ta'sir qilmasligi kerak).
 * `values[0]` ENG ESKI, `values[N-1]` ENG YANGI deb qabul qilinadi (chaqiruvchi
 * shu tartibda uzatishi SHART — cycle.ts'dagi barcha massivlar allaqachon
 * shu tartibda: `starts`/`lengths` doim xronologik o'sish tartibida).
 * `weight_i = decay^(N-1-i)`, `weightedAvg = Σ(value_i·weight_i) / Σ(weight_i)`.
 * Bitta yordamchi funksiya — averageCycleLength VA averagePeriodLength
 * ikkalasida ham ishlatiladi.
 */
export function computeWeightedAverage(values: number[], decay = RECENCY_DECAY): number {
  if (values.length === 0) return 0;
  const n = values.length;
  let weightedSum = 0;
  let weightTotal = 0;
  for (let i = 0; i < n; i++) {
    const weight = decay ** (n - 1 - i);
    weightedSum += values[i] * weight;
    weightTotal += weight;
  }
  return weightedSum / weightTotal;
}

/** CYCLE-ALGO-03: medianani hisoblaydi (mean bilan parallel, outlier-filtrlash
 * chegaralari uchun ishlatiladi). */
export function computeMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** CYCLE-ALGO-09: NAMUNA standart og'ishi (Bessel tuzatishi, `n-1`ga
 * bo'linadi) — ILGARI populyatsiya formulasi (`n`ga bo'linadi) ishlatilgan
 * edi, lekin bu yerdagi maqsad — KELAJAKDAGI (hali kuzatilmagan) sikl
 * uzunligini bashorat qilishdagi noaniqlikni baholash, ya'ni klassik
 * "namuna"dan populyatsiyani baholash muammosi (`values` — foydalanuvchining
 * BARCHA siklari emas, balki uning HAQIQIY, cheksiz "haqiqiy" tarqalishidan
 * olingan cheklangan namuna). Populyatsiya formulasi noaniqlikni tizimli
 * ravishda KAMROQ ko'rsatadi (n=2'da ~41%, n=6'da ~9.5% kam baholaydi) —
 * bu esa CYCLE-ALGO-07ning o'z maqsadiga ("soxta aniqlik taassurotini
 * bermaslik") ZID edi: diapazon kerakligidan TORROQ chiqardi, ayniqsa kam
 * ma'lumotli foydalanuvchilarda (aynan ular uchun bu eng muhim). n<2'da hali
 * ham 0 qaytaradi — chaqiruvchi bu holatda alohida DEFAULT_STD_DEV_DAYS
 * bilan almashtiradi (bitta nuqtaning "og'ishi" 0 emas, NOMA'LUM;
 * Bessel tuzatishi n=1'da 0ga bo'lishga olib kelardi). */
export function computeStdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/** Standart Tukey kvartil usuli (median-orqali-bo'lish): pastki/yuqori
 * yarmilarning medianasi — mediana o'zi hech qaysi yarimga kirmaydi (N toq
 * bo'lsa). N juda kichik (<4) bo'lganda kvartillar tabiiy ravishda keng
 * bo'ladi — bu to'g'ri, chunki kam ma'lumotda hech narsani ishonchli
 * "outlier" deb bo'lmaydi. */
function computeQuartiles(values: number[]): { q1: number; q3: number } {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const lowerHalf = sorted.slice(0, mid);
  const upperHalf = sorted.length % 2 === 0 ? sorted.slice(mid) : sorted.slice(mid + 1);
  return { q1: computeMedian(lowerHalf), q3: computeMedian(upperHalf) };
}

// CYCLE-ALGO-03: "median'dan ±1.5×IQR" so'zma-so'z emas, standart Tukey
// "fence" formulasi ishlatiladi — [Q1 - k·IQR, Q3 + k·IQR] — chunki bu
// statistik jihatda to'g'ri/qabul qilingan usul (mediana atrofida simmetrik
// chegara chayqoq taqsimotlarda noto'g'ri natija berardi). `isIrregular`
// bo'lsa chegara kengroq (2.5×) — PCOS kabi tabiiy katta tarqalishni
// noto'g'ri "xato" deb chiqarib tashlamaslik uchun.
const OUTLIER_IQR_MULTIPLIER = 1.5;
const OUTLIER_IQR_MULTIPLIER_IRREGULAR = 2.5;

export interface OutlierFilterResult {
  filtered: number[];
  outliers: number[];
  median: number;
}

/** CYCLE-ALGO-03: bitta g'ayrioddiy sikl (kasallik, stress, dori o'zgarishi,
 * homiladorlikni yo'qotish) butun o'rtachani og'ishtirib yubormasligi uchun —
 * IQR-chegaradan tashqaridagi qiymatlar ASOSIY o'rtachadan chiqarib
 * tashlanadi (lekin alohida `outliers`da qaytariladi — UI'da "bir marta
 * g'ayrioddiy sikl kuzatildi" kabi shaffof tushuntirish uchun foydali,
 * CYCLE-ALGO-08). Filtrlash BARCHA nuqtalarni chiqarib tashlasa (juda
 * ekstremal holat, deyarli imkonsiz lekin nazariy), xavfsizlik uchun asl
 * massiv qaytariladi — bo'sh massivdan o'rtacha olib bo'lmaydi. */
export function filterOutliers(values: number[], isIrregular: boolean): OutlierFilterResult {
  const median = computeMedian(values);
  if (values.length < 4) return { filtered: values, outliers: [], median }; // N<4'da kvartil ishonchsiz — filtrlanmaydi
  const { q1, q3 } = computeQuartiles(values);
  const iqr = q3 - q1;
  const k = isIrregular ? OUTLIER_IQR_MULTIPLIER_IRREGULAR : OUTLIER_IQR_MULTIPLIER;
  const lowerBound = q1 - k * iqr;
  const upperBound = q3 + k * iqr;
  const filtered = values.filter((v) => v >= lowerBound && v <= upperBound);
  const outliers = values.filter((v) => v < lowerBound || v > upperBound);
  if (filtered.length === 0) return { filtered: values, outliers: [], median };
  return { filtered, outliers, median };
}

/** Saralangan sanalarni ketma-ket (CYCLE_GAP_DAYS ichida) "streak"larga
 * guruhlaydi — bitta kunlik bo'shliq (unutilgan yozuv) butun hayzni ikkiga
 * bo'lib yubormasligi uchun. `detectPeriodStarts` VA `computePeriodLength`
 * bir xil bo'shliq-toqat mantig'iga tayanishi uchun BITTA joyda yozilgan
 * (FIX2-17: ilgari ikkalasi mos kelmaydigan mantiqqa ega edi). */
function groupIntoStreaks(sortedDates: string[]): string[][] {
  const streaks: string[][] = [];
  for (const date of sortedDates) {
    const current = streaks[streaks.length - 1];
    if (current && daysBetween(current[current.length - 1], date) <= CYCLE_GAP_DAYS) {
      current.push(date);
    } else {
      streaks.push([date]);
    }
  }
  return streaks;
}

/** Kunlik loglar ichida "sikl boshlanishi" kunlarini aniqlaydi: ketma-ket
 * (CYCLE_GAP_DAYS ichida) flow kunlari bitta "streak"ka guruhlanadi, streak
 * ichidan birinchi kun — potentsial boshlanish. Oddiy streak-detection —
 * server/insights.ts'dagi Statistika bilan BIR XIL mantiq (bir marta shu yerda
 * yozilib, ikkalasida ham shu funksiya ishlatiladi).
 *
 * MUHIM: faqat KAMIDA BITTA haqiqiy (spotting BO'LMAGAN) oqim kuni bor
 * streaklar "hayz boshlanishi" deb hisoblanadi. Aks holda tarqoq, yakka
 * "spotting" kunlari (ovulyatsiya qon tomchilashi, implantatsiya, stress —
 * hammasi keng tarqalgan va hayz EMAS) yangi sikl deb noto'g'ri hisoblanib,
 * o'rtacha sikl uzunligini (demak — bashoratni) buzib yuborardi. Streak
 * spotting bilan boshlanib, keyin haqiqiy oqimga o'tsa (real holat) — baribir
 * hisoblanadi, boshlanish sanasi o'zgarmaydi. */
export function detectPeriodStarts(logs: Pick<CycleLog, "date" | "flow">[]): string[] {
  const flowByDate = new Map<string, FlowLevel>();
  for (const l of logs) if (l.flow) flowByDate.set(l.date, l.flow);
  const flowDates = [...flowByDate.keys()].sort();
  const streaks = groupIntoStreaks(flowDates);

  return streaks.filter((streak) => streak.some((d) => flowByDate.get(d) !== "spotting")).map((streak) => streak[0]);
}

/** Aniqlangan sikl boshlanishlari orasidagi kunlar farqi (oxirgi `limit` tasi). */
export function computeCycleLengths(logs: Pick<CycleLog, "date" | "flow">[], limit = ADAPTIVE_MAX_CYCLES): number[] {
  const starts = detectPeriodStarts(logs);
  const lengths: number[] = [];
  for (let i = 1; i < starts.length; i++) lengths.push(daysBetween(starts[i - 1], starts[i]));
  return lengths.slice(-limit);
}

/** Berilgan sana bilan boshlangan hayzning uzunligi — `detectPeriodStarts`
 * bilan BIR XIL bo'shliq-toqat (CYCLE_GAP_DAYS) mantig'i orqali guruhlanadi,
 * shuning uchun bitta kunlik unutilgan yozuv haqiqiy uzunlikni kamaytirib
 * yubormaydi (FIX2-17: ilgari BIR KUNLIK bo'shliqqa ham toqat qilmasdi,
 * garchi `detectPeriodStarts` xuddi shu davrni "bitta hayz" deb hisoblasa
 * ham). Davom etayotgan (hali tugamagan) hayz uchun `null` qaytaradi. */
export function computePeriodLength(logs: Pick<CycleLog, "date" | "flow">[], periodStart: string, today: string): number | null {
  const flowDates = [...new Set(logs.filter((l) => l.flow).map((l) => l.date))].sort().filter((d) => d >= periodStart);
  const streak = groupIntoStreaks(flowDates).find((s) => s[0] === periodStart);
  if (!streak) return null;

  const lastDate = streak[streak.length - 1];
  // Agar oxirgi qayd etilgan kundan "bugun"gacha bo'lgan farq hali
  // CYCLE_GAP_DAYS ichida bo'lsa — keyingi kunlarda yana davom etishi
  // mumkin (detectPeriodStarts ham xuddi shunday tolerantlik bilan
  // guruhlagan bo'lardi), shuning uchun hali yakunlangan emas.
  if (daysBetween(lastDate, today) <= CYCLE_GAP_DAYS) return null;
  return daysBetween(periodStart, lastDate) + 1;
}

// CYCLE-ALGO-05: kamida shuncha sikl ovulyatsiya signali bilan mos kelmasa,
// shaxsiy lyuteal-faza hisoblanmaydi — bitta yakka belgi (masalan
// noto'g'ri qayd etilgan simptom) shovqin bo'lishi mumkin, kamida 2 ta
// mustaqil sikl kerak.
const MIN_LUTEAL_SIGNAL_CYCLES = 2;
// Fiziologik jihatdan oqilona chegara — talab matnida aytilganidek, lyuteal
// faza odatda 11-17 kun oralig'ida; biroz kengroq (9-17) olindi, chunki
// simptom-asoslangan aniqlash BBT/LH-testga qaraganda shovqinliroq.
const MIN_SANE_LUTEAL_PHASE_DAYS = 9;
const MAX_SANE_LUTEAL_PHASE_DAYS = 17;
/** Standart (shaxsiylashtirilmagan) lyuteal faza — ovulyatsiya signali
 * bo'lmaganda ishlatiladigan klinik faraz (ilgari HAR DOIM shu ishlatilardi). */
export const DEFAULT_LUTEAL_PHASE_DAYS = 14;

// CYCLE-ALGO-12: "ovulation_pain" (mittelschmerz) ayollarning taxminan
// ~20% ichida his qilinadi va his qilganlar ham uni har doim qayd
// qilavermaydi — shuning uchun ikki-fazali lyuteal model (CYCLE-ALGO-05)
// amalda ko'pchilik foydalanuvchida ishga tushmay qolardi.
// "cervical_mucus_change" (Billings/servikal shilliq usuli) ANCHA KENG
// TARQALGAN/ishonchli ikkinchi signal sifatida qo'shildi.
const OVULATION_SIGNAL_SYMPTOMS: Symptom[] = ["ovulation_pain", "cervical_mucus_change"];

/** CYCLE-ALGO-05/12: ovulyatsiya SIGNALI hisoblangan simptomlar (hozircha
 * "ovulation_pain" va "cervical_mucus_change") qayd etilgan kunlarni
 * qaytaradi — ikki-fazali lyuteal model uchun. Alohida funksiya sifatida
 * ajratilgan — kelajakda BBT (bazal tana harorati) yoki LH-test natijasi
 * kabi yangi signal manbalari qo'shilganda, faqat shu funksiya ichki
 * mantig'i kengaytiriladi (signature/chaqiruvchilar o'zgarmaydi). Hozircha
 * `CycleLog`da BBT/LH maydonlari yo'q — shu bosqichda faqat simptomlar
 * orqali aniqlash qo'shildi (talab: "hoziroq to'liq BBT UI qurish shart
 * emas, faqat funksiya signature va joy tayyorlab qo'y"). */
export function detectOvulationSignals(logs: (Pick<CycleLog, "date"> & Partial<Pick<CycleLog, "symptoms">>)[]): string[] {
  return [...new Set(logs.filter((l) => l.symptoms?.some((s) => OVULATION_SIGNAL_SYMPTOMS.includes(s))).map((l) => l.date))].sort();
}

// CYCLE-ALGO-15: klassik "harorat sakrashi" (temperature shift/coverline)
// usuli — tibbiy jihatdan simptomdan ANCHA ishonchli, chunki HIS-TUYG'UGA
// emas, RAQAMGA asoslangan. Standart tavsiya: oxirgi 6 kunlik BBT
// o'rtachasidan keyingi kamida 3 kun ketma-ket 0.2°C+ yuqori bo'lsa,
// ovulyatsiya sodir bo'lgan (progesteron BBT'ni ko'taradi). Indeks-asoslangan
// oyna (kalendar kun EMAS) ishlatiladi — real foydalanuvchi har kuni
// o'lchamasligi mumkin, "oxirgi 6 ta O'LCHOV" degani "oxirgi 6 kalendar
// kun" emas, mavjud bo'shliqlarga chidamli.
const BBT_BASELINE_WINDOW = 6;
const BBT_CONFIRM_DAYS = 3;
const BBT_SHIFT_THRESHOLD_C = 0.2;

/** CYCLE-ALGO-15: bazal tana harorati (BBT) o'lchovlaridan ovulyatsiya
 * kunini aniqlaydi — `detectOvulationSignals`ning "yangi signal manbai"
 * uchun oldindan tayyorlangan kengaytmasi (o'sha funksiyaning izohida
 * aytilganidek). Qaytarilgan sana — 3 kunlik ko'tarilishning BIRINCHI
 * kuni (aynan shu kun ovulyatsiya kuni deb belgilanadi — standart, keng
 * tan olingan qoida). Bir nechta sikl uchun bir nechta sana qaytarishi
 * mumkin (har bir haqiqiy sakrash — bitta natija); chaqiruvchi
 * (`computePersonalLutealPhaseDays`) har bir sikl oynasida FAQAT birinchi
 * mos sanani oladi, shuning uchun bitta sakrash atrofidagi qo'shimcha
 * "tasdiqlovchi" kunlar (agar bo'lsa) zararsiz. */
export function detectOvulationFromBbt(logs: (Pick<CycleLog, "date"> & Partial<Pick<CycleLog, "basalBodyTemp">>)[]): string[] {
  const readings = logs
    .filter((l): l is typeof l & { basalBodyTemp: number } => l.basalBodyTemp != null)
    .map((l) => ({ date: l.date, temp: l.basalBodyTemp }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const ovulationDates: string[] = [];
  for (let i = BBT_BASELINE_WINDOW; i <= readings.length - BBT_CONFIRM_DAYS; i++) {
    const baseline = readings.slice(i - BBT_BASELINE_WINDOW, i).reduce((sum, r) => sum + r.temp, 0) / BBT_BASELINE_WINDOW;
    const confirmWindow = readings.slice(i, i + BBT_CONFIRM_DAYS);
    const allElevated = confirmWindow.every((r) => r.temp >= baseline + BBT_SHIFT_THRESHOLD_C);
    if (allElevated) ovulationDates.push(readings[i].date);
  }
  return ovulationDates;
}

/** CYCLE-ALGO-05: har bir aniqlangan sikl uchun (sikl boshlanishi → keyingi
 * sikl boshlanishi oralig'ida) ovulyatsiya signali bor-yo'qligini tekshiradi.
 * Topilsa, o'sha sikldagi LYUTEAL faza uzunligi = ovulyatsiya kunidan
 * KEYINGI sikl boshlanishigacha (follikulyar faza EMAS — talab: "har bir
 * ayolda follikulyar faza ancha o'zgaruvchan, lyuteal faza nisbatan
 * barqaror", shuning uchun aynan lyuteal fazani "o'rganamiz").
 * `personalLutealPhase = median(shu qiymatlar)` — kamida
 * MIN_LUTEAL_SIGNAL_CYCLES ta sikl uchun signal topilgandagina hisoblanadi;
 * aks holda `null` (chaqiruvchi standart DEFAULT_LUTEAL_PHASE_DAYS'ga
 * tushadi — REGRESSIYA emas, faqat YAXSHILANISH: signal yo'q bo'lsa xatti-
 * harakat ilgarigidek qoladi).
 * CYCLE-ALGO-15: BBT signali (mavjud bo'lsa) ENG ISHONCHLI manba sifatida
 * HAR BIR sikl oynasida ALOHIDA-ALOHIDA simptomdan USTUN qo'yiladi — bitta
 * foydalanuvchida ba'zi sikllarda BBT bo'lib, ba'zilarida bo'lmasligi
 * mumkin (masalan faqat ba'zi oylarda o'lchagan), shuning uchun tanlov
 * har bir sikl uchun mustaqil qilinadi, global emas. */
function computePersonalLutealPhaseDays(
  logs: (Pick<CycleLog, "date"> & Partial<Pick<CycleLog, "symptoms" | "basalBodyTemp">>)[],
  starts: string[]
): number | null {
  const bbtOvulationDates = detectOvulationFromBbt(logs);
  const symptomOvulationDates = detectOvulationSignals(logs);
  if (bbtOvulationDates.length === 0 && symptomOvulationDates.length === 0) return null;

  const lutealLengths: number[] = [];
  for (let i = 0; i < starts.length - 1; i++) {
    const cycleStart = starts[i];
    const nextStart = starts[i + 1];
    const bbtDate = bbtOvulationDates.find((d) => d >= cycleStart && d < nextStart);
    const ovulationInThisCycle = bbtDate ?? symptomOvulationDates.find((d) => d >= cycleStart && d < nextStart);
    if (!ovulationInThisCycle) continue;
    lutealLengths.push(daysBetween(ovulationInThisCycle, nextStart));
  }
  if (lutealLengths.length < MIN_LUTEAL_SIGNAL_CYCLES) return null;

  return clamp(Math.round(computeMedian(lutealLengths)), MIN_SANE_LUTEAL_PHASE_DAYS, MAX_SANE_LUTEAL_PHASE_DAYS);
}

/** Bashorat qanchalik ishonchli ekanligini ko'rsatadi — foydalanuvchiga aniq
 * sanani tibbiy haqiqat sifatida emas, turli aniqlikdagi taxmin sifatida
 * ko'rsatish uchun (CYCLE-002). `insufficient` — hali haqiqiy sikl tarixi yo'q,
 * faqat foydalanuvchi kiritgan/standart taxminga tayanilgan. */
export type PredictionConfidence = "high" | "medium" | "low" | "insufficient";

/** `isCycleIrregular`dagi bilan bir xil "eng katta va eng kichik farqi" mezoni —
 * lekin tartibsizlik ogohlantirishidan farqli o'laroq, bu doim (kamida 1 ta
 * aniqlangan sikl bo'lsagina) qandaydir ishonch darajasini qaytaradi. */
export function getPredictionConfidence(cyclesAnalyzed: number, recentCycleLengths: number[]): PredictionConfidence {
  if (cyclesAnalyzed === 0) return "insufficient";
  if (cyclesAnalyzed < 3) return "low";
  const relevant = recentCycleLengths.slice(-cyclesAnalyzed);
  const spread = Math.max(...relevant) - Math.min(...relevant);
  // CYCLE-ALGO-06: tartibsiz (isCycleIrregular) foydalanuvchiga HECH QACHON
  // "high" ishonch bermaymiz — tartibsizlik davomida haqiqatan yuqori ishonch
  // matematik jihatdan noto'g'ri xabar bo'lardi. ESLATMA: bugungi aniq
  // konstantalar bilan (IRREGULARITY chegarasi=7 kun > "high" chegarasi=4
  // kun) bu holat allaqachon bilvosita kafolatlangan edi (isCycleIrregular
  // oxirgi 3 tasining tarqalishini tekshiradi, bu doim TO'LIQ tarqalishdan
  // kichik yoki teng) — lekin aniq himoya qo'shildi, chunki bu ikki
  // konstanta MUSTAQIL sozlanadi va kelajakda birortasi o'zgarsa, bilvosita
  // kafolat sinishi mumkin edi.
  if (isCycleIrregular(recentCycleLengths)) {
    return spread <= 9 ? "medium" : "low";
  }
  if (spread <= 4) return "high";
  if (spread <= 9) return "medium";
  return "low";
}

export interface AdaptiveCycleSettings {
  lastPeriodStart: string;
  averageCycleLength: number;
  averagePeriodLength: number;
  /** Necha ta haqiqiy (loglardan aniqlangan) sikl asosida hisoblangani —
   * 0 bo'lsa, foydalanuvchining bir martalik sozlamasiga tayanilgan. */
  cyclesAnalyzed: number;
  /** getPredictionConfidence(cyclesAnalyzed, lengths) — shu yerda hisoblab
   * qo'yiladi, chunki `lengths` faqat shu funksiya ichida mavjud. */
  confidence: PredictionConfidence;
  /** CYCLE-ALGO-05: foydalanuvchi tarixidan chiqarilgan shaxsiy lyuteal-faza
   * uzunligi (kun) — faqat ovulyatsiya signali (masalan "ovulation_pain"
   * simptomi) mavjud sikllardan hisoblanadi. `null` bo'lsa, `predictCycle`
   * standart DEFAULT_LUTEAL_PHASE_DAYS (14)ni ishlatadi. */
  personalLutealPhase: number | null;
  /** CYCLE-ALGO-07: bashorat diapazonining yarim-kengligi (kun) —
   * `predictCycle`ga to'g'ridan-to'g'ri uzatiladi. Tartibsiz (isCycleIrregular)
   * foydalanuvchilar uchun KENGROQ (talab 6b). */
  stdDevDays: number;
  /** CYCLE-ALGO-08: filterOutliers() aniqlagan (ASOSIY o'rtachadan chiqarib
   * tashlangan) g'ayrioddiy sikl uzunliklari — bo'sh bo'lsa, hech qanday
   * outlier topilmagan. `explainPrediction()` shaffof tushuntirish uchun
   * ishlatadi. */
  cycleLengthOutliers: number[];
}

// CYCLE-ALGO-14: uchta asosiy sozlash-parametri (RECENCY_DECAY/SHRINKAGE_K/
// ADAPTIVE_MAX_CYCLES) ilgari faqat qo'lda o'ylab topilgan sintetik
// stsenariylarga qarab tanlangan edi. Endi production'da haqiqiy
// `cycle_logs` mavjud — `scripts/backtest-real-users.ts` shu real tarixga
// qarshi turli qiymat kombinatsiyalarini o'lchab, ENG KAM `avgErrorDays`
// beradiganini tanlaydi. Bu ixtiyoriy `tunables` parametri FAQAT shu
// o'lchov-skripti uchun — hech qanday CHAQIRUVCHI uni bermasa (butun
// production kodi ham shunday), xatti-harakat 100% ILGARIGIDEK qoladi
// (standart qiymatlar aynan hozirgi konstantalarga teng).
export interface CycleAlgoTunables {
  recencyDecay: number;
  shrinkageK: number;
  adaptiveMaxCycles: number;
}

const DEFAULT_TUNABLES: CycleAlgoTunables = {
  recencyDecay: RECENCY_DECAY,
  shrinkageK: SHRINKAGE_K,
  adaptiveMaxCycles: ADAPTIVE_MAX_CYCLES,
};

/**
 * `cycle_settings`dagi statik qiymat o'rniga, imkon qadar haqiqiy `cycle_logs`
 * tarixidan (oxirgi ADAPTIVE_MAX_CYCLES ta aniqlangan sikldan) o'rtacha sikl/
 * hayz uzunligini va ENG SO'NGGI haqiqiy boshlanish sanasini hisoblaydi — shu
 * orqali bashorat vaqt o'tishi bilan foydalanuvchining haqiqiy holatiga
 * moslasha boradi. Yetarli tarix (2+ aniqlangan sikl) bo'lmasa, foydalanuvchi
 * qo'lda kiritgan/tanlagan `fallback` sozlamalariga tushadi (`cyclesAnalyzed: 0`).
 */
export function deriveAdaptiveCycleSettings(
  // CYCLE-ALGO-05/15: "symptoms"/"basalBodyTemp" qo'shildi — personalLutealPhase
  // hisoblash uchun kerak (detectOvulationSignals/detectOvulationFromBbt).
  // Mavjud chaqiruvchilar to'liq CycleLog[] uzatadi, shuning uchun bu keng
  // qamrov ORQAGA MOSLIKni buzmaydi.
  logs: (Pick<CycleLog, "date" | "flow"> & Partial<Pick<CycleLog, "symptoms" | "basalBodyTemp">>)[],
  fallback: Pick<CycleSettings, "lastPeriodStart" | "averageCycleLength" | "averagePeriodLength">,
  today: string = tashkentDateStr(),
  // CYCLE-ALGO-14: qarang yuqoridagi izoh — faqat backtest-skripti uzatadi.
  tunables: CycleAlgoTunables = DEFAULT_TUNABLES
): AdaptiveCycleSettings | null {
  const starts = detectPeriodStarts(logs);
  const lengths = computeCycleLengths(logs, tunables.adaptiveMaxCycles);

  // CYCLE-ALGO-04: `lengths.length === 0` (0 yoki 1 ta aniqlangan sikl
  // boshlanishi — gap hisoblab bo'lmaydi) hali ham TO'LIQ fallback'ga
  // tushadi, chunki hech qanday shaxsiy SIKL UZUNLIGI ma'lumoti yo'q (eski
  // "starts.length < ADAPTIVE_MIN_CYCLES" sharti bilan MANTIQAN AYNAN BIR
  // XIL edi — ikkalasi ham starts.length<=1'da ishga tushardi — shuning
  // uchun ADAPTIVE_MIN_CYCLES konstantasi shunchaki olib tashlandi, xatti-
  // harakat bu yerda o'zgarmagan).
  if (lengths.length === 0) {
    // CYCLE-ALGO-20: sikl UZUNLIGI hali noma'lum (gap hisoblash uchun kamida
    // ikkita boshlanish kerak), lekin bitta haqiqiy hayz QAYD ETILGAN bo'lsa,
    // hech bo'lmaganda LANGAR shundan olinadi.
    //
    // Ilgari bu shoxda doim `fallback.lastPeriodStart` — ya'ni onboarding'dagi
    // "oxirgi marta qachon hayz ko'rgansiz?" javobi — ishlatilardi. O'sha
    // qiymat `cycle_settings`da saqlanadi va hayz belgilanganda ham,
    // o'chirilganda ham HECH QACHON yangilanmaydi (repo.ts faqat
    // `cycle_logs`ga yozadi). Natijada birinchi hayzini sidqidildan qayd
    // qilgan ayolning bashorati baribir eski onboarding sanasiga bog'langan
    // bo'lib qolardi — qayd qilish HECH NARSANI o'zgartirmasdi. Bu butun
    // "ma'lumot yig'ish" halqasining uzilgan joyi edi.
    //
    // Endi tartib: HAQIQIY qayd > onboarding javobi. Barcha qaydlar
    // o'chirilsa, `starts` bo'shaydi va onboarding javobiga qaytiladi — u ham
    // ayolning o'z gapi, shuning uchun uni tashlab yuborish noto'g'ri bo'lardi.
    const lastStart = starts[starts.length - 1] ?? fallback.lastPeriodStart;
    if (!lastStart) return null;
    // DAVOMIYLIK bu yerda qaydlardan OLINMAYDI — ataylab. Bitta qayd etilgan
    // hayzdan uzunlik chiqarish ishonchsiz: ayollar ko'pincha faqat BIRINCHI
    // kunni belgilab, keyin belgilashni unutadi, va "hayzi 1 kun" degan
    // xulosa ahvolni yomonlashtirardi. Uzunlik pastdagi asosiy shoxda —
    // bir necha sikl bo'yicha o'rtacha sifatida — o'rganiladi.
    return {
      lastPeriodStart: lastStart,
      averageCycleLength: fallback.averageCycleLength || DEFAULT_CYCLE_LENGTH,
      averagePeriodLength: fallback.averagePeriodLength || DEFAULT_PERIOD_LENGTH,
      cyclesAnalyzed: 0,
      confidence: "insufficient",
      personalLutealPhase: null,
      stdDevDays: DEFAULT_STD_DEV_DAYS,
      cycleLengthOutliers: [],
    };
  }

  // CYCLE-ALGO-03: o'rtachani hisoblashdan OLDIN g'ayrioddiy (outlier) sikllarni
  // chiqarib tashlaymiz (bitta kasallik/stress/dori o'zgarishi/homiladorlikni
  // yo'qotish tufayli bo'lgan sikl butun o'rtachani og'ishtirib yubormasin) —
  // `isCycleIrregular` true bo'lsa chegara kengroq (haqiqiy PCOS naqshini
  // "xato" deb hisoblamaslik uchun). MUHIM: `getPredictionConfidence` pastda
  // hali ham XOM (filtrlanmagan) `lengths`ni ishlatadi — outlier chiqarib
  // tashlangani ISHONCH darajasini sun'iy oshirmasligi kerak, chunki outlier
  // borligining o'zi haqiqiy noaniqlik signali.
  const cycleIsIrregular = isCycleIrregular(lengths);
  const { filtered: cycleLengthsForAvg, outliers: cycleLengthOutliers } = filterOutliers(lengths, cycleIsIrregular);
  // CYCLE-ALGO-02: oddiy (tekis) o'rtacha o'rniga og'irlik-asoslangan —
  // barcha 6 ta sikl bir xil og'irlikda bo'lgan ilgarigi mantiq eng so'nggi
  // (haqiqatan foydali) o'zgarishlarni eski ma'lumot bilan "suyultirib"
  // yuborardi.
  const personalCycleAvg = computeWeightedAverage(cycleLengthsForAvg, tunables.recencyDecay);
  // CYCLE-ALGO-04: Bayesian shrinkage — "2 tadan kam aniqlangan sikl = to'liq
  // fallback, 2+ = to'liq shaxsiy o'rtacha" qattiq sakrashi o'rniga YUMSHOQ
  // o'tish: `finalCycleLength = (n·personalAvg + k·populationPrior) / (n+k)`.
  // n o'sgan sari shaxsiy ma'lumot asta-sekin ustunlik qila boshlaydi, hech
  // qanday keskin chegara yo'q. `populationPrior` — foydalanuvchining o'zi
  // onboarding'da kiritgan/tanlagan boshlang'ich qiymat (`fallback`), 28 emas
  // — bu real, foydalanuvchiga xos boshlang'ich taxmin, umumiy populyatsiya
  // o'rtachasidan ko'ra yaxshiroq boshlanish nuqtasi.
  const populationPrior = fallback.averageCycleLength || DEFAULT_CYCLE_LENGTH;
  // CYCLE-ALGO-10: shrinkage'ning "n"i — XOM `lengths.length` EMAS,
  // `cycleLengthsForAvg.length` (FILTRLANGAN, ya'ni `personalCycleAvg`
  // haqiqatan shundan hisoblangan nuqtalar soni). Ilgari `lengths.length`
  // ishlatilardi — masalan 6 tadan 2 tasi outlier deb chiqarib tashlangan
  // bo'lsa, formula "6 ta ishonchli ma'lumot bor" deb hisoblab,
  // personalCycleAvg'ga (aslida faqat 4 ta nuqta qo'llab-quvvatlaydigan
  // darajadan) ORTIQ ishonch berardi.
  const shrinkageN = cycleLengthsForAvg.length;
  const shrunkCycleLength = (shrinkageN * personalCycleAvg + tunables.shrinkageK * populationPrior) / (shrinkageN + tunables.shrinkageK);
  const avgCycleLength = clamp(Math.round(shrunkCycleLength), MIN_SANE_CYCLE_LENGTH, MAX_SANE_CYCLE_LENGTH);
  const lastStart = starts[starts.length - 1];
  // FIX2-19: nomi va hujjati "oxirgi bir necha davrdan o'rtacha" deydi (xuddi
  // averageCycleLength kabi), lekin ilgari faqat ENG SO'NGGI davr uzunligi
  // olinardi — agar oxirgi hayz odatiydan qisqaroq/uzunroq (masalan spotting
  // bilan tugagan) bo'lsa, bashorat noto'g'ri xato uzunlikka tayanardi. Endi
  // averageCycleLength bilan bir xil oynadan (oxirgi ADAPTIVE_MAX_CYCLES ta
  // aniqlangan davr) o'rtacha olinadi; hali tugamagan (null) davrlar
  // e'tiborga olinmaydi.
  const recentPeriodLengths = starts
    .slice(-tunables.adaptiveMaxCycles)
    .map((start) => computePeriodLength(logs, start, today))
    .filter((n): n is number => n !== null);
  // CYCLE-ALGO-02: xuddi avgCycleLength kabi — og'irlik-asoslangan o'rtacha.
  const periodLength =
    recentPeriodLengths.length > 0
      ? Math.round(computeWeightedAverage(recentPeriodLengths, tunables.recencyDecay))
      : (fallback.averagePeriodLength ?? DEFAULT_PERIOD_LENGTH);

  // CYCLE-ALGO-07: bashorat diapazoni — haqiqiy namuna og'ishi (n>=2'da) yoki
  // DEFAULT_STD_DEV_DAYS (n<2'da, og'ishni ishonchli hisoblab bo'lmaydi).
  // isCycleIrregular=true bo'lsa KENGROQ (talab 6b: "masalan ±1.5 std dev").
  const rawStdDev = cycleLengthsForAvg.length >= 2 ? computeStdDev(cycleLengthsForAvg) : DEFAULT_STD_DEV_DAYS;
  const stdDevDays = cycleIsIrregular ? rawStdDev * IRREGULAR_STD_DEV_MULTIPLIER : rawStdDev;

  return {
    lastPeriodStart: lastStart,
    averageCycleLength: avgCycleLength,
    averagePeriodLength: clamp(periodLength, MIN_SANE_PERIOD_LENGTH, MAX_SANE_PERIOD_LENGTH),
    cyclesAnalyzed: lengths.length,
    confidence: getPredictionConfidence(lengths.length, lengths),
    stdDevDays,
    personalLutealPhase: computePersonalLutealPhaseDays(logs, starts),
    cycleLengthOutliers,
  };
}

/** CYCLE-ALGO-08: foydalanuvchiga "nega shunday bashorat qildik" degan
 * qisqa, shaffof tushuntirish (loyihaning o'z shaffoflik tamoyili —
 * CYCLE-002 — bilan mos, va ML-quti (black-box) bilan qiyin bo'lgan narsa).
 * Til-agnostik "sabab kodi" qaytaradi (UI/i18n xom matnni tanlaydi) —
 * `dict.cycle.predictionExplanation`dagi bilan bir xil turdagi kalitlar. */
export type PredictionExplanationReason =
  | { type: "no_data" }
  | { type: "limited_data"; cyclesAnalyzed: number }
  | { type: "outliers_excluded"; cyclesAnalyzed: number; outlierCount: number }
  | { type: "standard"; cyclesAnalyzed: number };

export function explainPrediction(settings: AdaptiveCycleSettings): PredictionExplanationReason {
  if (settings.cyclesAnalyzed === 0) return { type: "no_data" };
  // CYCLE-ALGO-04: SHRINKAGE_K'dan kam sikl bo'lsa, natija hali sezilarli
  // darajada umumiy o'rtachaga (prior) "tortilgan" — foydalanuvchiga buni
  // aytish kerak, aks holda "shaxsiy" raqam sifatida noto'g'ri tushunilishi
  // mumkin.
  if (settings.cyclesAnalyzed < SHRINKAGE_K) return { type: "limited_data", cyclesAnalyzed: settings.cyclesAnalyzed };
  if (settings.cycleLengthOutliers.length > 0) {
    return { type: "outliers_excluded", cyclesAnalyzed: settings.cyclesAnalyzed, outlierCount: settings.cycleLengthOutliers.length };
  }
  return { type: "standard", cyclesAnalyzed: settings.cyclesAnalyzed };
}

// Kechikish shundan ko'p kun davom etsa, "N kun kechikmoqda" degan o'sib
// boruvchi son endi foydali emas — bu holatda ko'proq ehtimol foydalanuvchi
// uzoq vaqt (bir necha oy) hech narsa qayd etmagan (oxirgi hayz sanasi
// eskirgan) yoki haqiqatan boshqa holat (homiladorlik, uzoq tartibsizlik) yuz
// bergan. Real qurilmada ko'rilgan haqiqiy holat: "226 kun kechikmoqda" —
// bu raqamning o'zi to'g'ri hisoblangan (predictCycle mantiqi buzilmagan),
// lekin FOYDALANUVCHIGA bu holda ko'rsatilishi kerak bo'lgan narsa boshqa:
// "ma'lumot eskirgan, yangilang" — cheksiz o'sib boruvchi kechikish soni emas.
export const STALE_PREDICTION_DAYS = 90; // ~3 ta o'rtacha sikl

export interface CyclePrediction {
  nextPeriodStart: string;
  /** CYCLE-ALGO-07: `nextPeriodStart` — eng ehtimolli (nuqta) taxmin, hali
   * ham UI'da asosiy sana sifatida ko'rsatiladi. `nextPeriodStartEarliest`/
   * `Latest` — haqiqiy noaniqlikni aks ettiruvchi diapazon (CYCLE-002: aniq
   * sana tibbiy haqiqat sifatida emas, taxmin sifatida ko'rsatilishi kerak).
   * Kenglik `stdDevDays`ga asoslangan — past ishonchda kengroq, yuqori
   * ishonchda torroq (deyarli nuqtaga teng). */
  nextPeriodStartEarliest: string;
  nextPeriodStartLatest: string;
  nextPeriodEnd: string;
  fertileWindowStart: string;
  fertileWindowEnd: string;
  ovulationDay: string;
  daysUntilNextPeriod: number;
  /** CYCLE-ALGO-19: bashorat ASOSIDAGI hayz davomiyligi — mavjud bo'lsa
   * `cycle_logs`dan O'RGANILGAN qiymat, aks holda foydalanuvchi onboarding'da
   * kiritgani. UI shu qiymatga tayanishi kerak, `cycle_settings`dagi xom
   * qiymatga emas: `cycle_settings` onboarding'dan keyin HECH QACHON
   * yangilanmaydi (repo.ts faqat `cycle_logs`ga yozadi), ya'ni hayzi odatda
   * 6 kun davom etadigan ayolda ham u abadiy 5 bo'lib qolardi. */
  averagePeriodLength: number;
  /** Necha ta haqiqiy sikl asosida hisoblangani — 0 bo'lsa, taxminiy (sozlamaga
   * asoslangan) bashorat. UI'da "so'nggi N ta sikl asosida" kabi shaffoflik uchun. */
  cyclesAnalyzed: number;
  /** `daysUntilNextPeriod` STALE_PREDICTION_DAYS'dan ko'proq manfiy bo'lsa —
   * UI o'sib boruvchi kechikish soni o'rniga "ma'lumot eskirgan, oxirgi
   * hayz sanasini yangilang" holatini ko'rsatishi kerak. */
  isStale: boolean;
  /** UI'da aniq sanani tibbiy haqiqat sifatida emas, shaffof taxmin sifatida
   * ko'rsatish uchun (CYCLE-002). Chaqiruvchi (buildCycleResponse) adaptiv
   * qiymat bilan qayta belgilaydi — xuddi cyclesAnalyzed kabi. */
  confidence: PredictionConfidence;
  /** CYCLE-ALGO-08: "nega shunday bashorat qilindi" — chaqiruvchi
   * (buildCycleResponse) `explainPrediction(adaptive)` orqali qayta
   * belgilaydi, xuddi cyclesAnalyzed/confidence kabi. */
  explanationReason: PredictionExplanationReason;
}

export function predictCycle(
  settings: Pick<CycleSettings, "lastPeriodStart" | "averageCycleLength" | "averagePeriodLength"> & {
    /** CYCLE-ALGO-05: berilmasa (yoki `null`), standart DEFAULT_LUTEAL_PHASE_DAYS
     * (14) ishlatiladi — ilgarigi (o'zgarishsiz) xatti-harakat. */
    personalLutealPhase?: number | null;
    /** CYCLE-ALGO-07: bashorat diapazonining yarim-kengligi (kun) — berilmasa,
     * DEFAULT_STD_DEV_DAYS ishlatiladi (ma'lumot yo'qligini aks ettiruvchi
     * "keng" standart qiymat). */
    stdDevDays?: number;
  },
  today: string = tashkentDateStr()
): CyclePrediction | null {
  if (!settings.lastPeriodStart) return null;
  const cycleLength = settings.averageCycleLength || DEFAULT_CYCLE_LENGTH;
  const periodLength = settings.averagePeriodLength || DEFAULT_PERIOD_LENGTH;

  // Bashorat DOIM eng oxirgi tasdiqlangan boshlanishdan bitta cycleLength
  // keyingi sanani ko'rsatadi — necha kun o'tganidan qat'iy nazar. ILGARI: necha
  // "sikl o'tdi" deb hisoblab, kechikkanda bashoratni bir butun sikl OLDINGA
  // "sakratib" yuborardi (masalan 28 kunlik siklda 1 kun kechiksa ham, ilova
  // 27 kun qoldi deb ko'rsatardi — chunki keyingi-keyingi siklga sakrab
  // ketardi). Bu haqiqiy kechikishni yashirib, foydalanuvchiga noto'g'ri
  // xotirjamlik berardi — aslida "hayz kechikayapti" degan holat sikl
  // kuzatuvida eng muhim signallardan biri. Endi yangi haqiqiy hayz
  // `cycle_logs`ga kiritilmaguncha "kutilgan sana" o'zgarmaydi;
  // `daysUntilNextPeriod` shunchaki MANFIY bo'lib, kechikish sifatida
  // ko'rsatiladi (UI: dict.cycle.nextPeriodIn, dict.reminders.periodLate).
  const nextPeriodStart = addDays(settings.lastPeriodStart, cycleLength);
  const nextPeriodEnd = addDays(nextPeriodStart, periodLength - 1);

  // CYCLE-ALGO-07: ILGARI bashorat FAQAT bitta aniq sana edi — bu haqiqiy
  // noaniqlikni yashirib, soxta aniqlik taassurotini berardi. Endi
  // `stdDevDays` (chaqiruvchi — deriveAdaptiveCycleSettings — tomonidan
  // hisoblangan, tartibsiz foydalanuvchilar uchun kengaytirilgan) asosida
  // diapazon ham qaytariladi. `nextPeriodStart` hali ham asosiy (nuqta)
  // taxmin sifatida saqlanadi — UI past/o'rta ishonchda diapazonni, yuqori
  // ishonchda nuqtaga yaqinroq tor diapazonni ko'rsatishi mumkin.
  const rangeDays = Math.max(1, Math.round(settings.stdDevDays ?? DEFAULT_STD_DEV_DAYS));
  const nextPeriodStartEarliest = addDays(nextPeriodStart, -rangeDays);
  const nextPeriodStartLatest = addDays(nextPeriodStart, rangeDays);

  // CYCLE-ALGO-05: ILGARI ovulyatsiya DOIM "cycleLength - 14" (lyuteal faza
  // qat'iy 14 kun deb faraz qilingan) edi. Haqiqatda follikulyar faza ancha
  // o'zgaruvchan, lyuteal faza esa har bir ayolda nisbatan BARQAROR — shuning
  // uchun standart faraz o'rniga foydalanuvchining o'zi tarixidan chiqarilgan
  // ShAXSIY lyuteal-faza uzunligi (agar ovulyatsiya belgisi — masalan
  // "ovulation_pain" simptomi — orqali aniqlangan bo'lsa) ishlatiladi.
  // Xavfsizlik: lyuteal faza butun sikl uzunligidan oshib ketmasligi kerak
  // (nazariy holat — juda qisqa sikl + juda uzun shaxsiy lyuteal faza).
  const lutealPhaseDays = Math.min(settings.personalLutealPhase ?? DEFAULT_LUTEAL_PHASE_DAYS, cycleLength - 1);
  const ovulationDay = addDays(nextPeriodStart, -lutealPhaseDays);
  const fertileWindowStart = addDays(ovulationDay, -5);
  const fertileWindowEnd = addDays(ovulationDay, 1);

  const daysUntilNextPeriod = daysBetween(today, nextPeriodStart);

  return {
    nextPeriodStart,
    nextPeriodStartEarliest,
    nextPeriodStartLatest,
    nextPeriodEnd,
    fertileWindowStart,
    fertileWindowEnd,
    ovulationDay,
    daysUntilNextPeriod,
    averagePeriodLength: periodLength,
    cyclesAnalyzed: 0, // chaqiruvchi (buildCycleResponse) adaptiv qiymat bilan qayta belgilaydi
    isStale: daysUntilNextPeriod < -STALE_PREDICTION_DAYS,
    confidence: "insufficient", // chaqiruvchi adaptiv qiymat bilan qayta belgilaydi
    explanationReason: { type: "no_data" }, // chaqiruvchi adaptiv qiymat bilan qayta belgilaydi
  };
}

/** So'nggi tsikl uzunliklaridan tartibsizlik borligini aniqlaydi (standart og'ish katta bo'lsa). */
export function isCycleIrregular(recentCycleLengths: number[]): boolean {
  if (recentCycleLengths.length < IRREGULARITY_MONTHS_THRESHOLD) return false;
  const relevant = recentCycleLengths.slice(-IRREGULARITY_MONTHS_THRESHOLD);
  const max = Math.max(...relevant);
  const min = Math.min(...relevant);
  return max - min > 7; // 7 kundan katta farq — tartibsiz deb hisoblanadi
}

/* ------------------------------------------------------------------ *
 * CYCLE-ALGO-16 — KO'P OYLIK bashorat va uning NOANIQLIGI.
 *
 * MUAMMO. `predictCycle` faqat BITTA keyingi siklni qaytarardi, shuning
 * uchun kalendarda bir oydan nariga hech narsa chiqmasdi. Foydalanuvchi esa
 * bir necha oy oldinga rejalashtiradi (safar, tibbiy ko'rik, homiladorlikka
 * tayyorgarlik).
 *
 * ASOSIY G'OYA. Sikl uzunligi — qat'iy son emas, o'rtachasi μ va standart
 * og'ishi σ bo'lgan TASODIFIY miqdor (ikkalasi ham foydalanuvchining o'z
 * tarixidan: deriveAdaptiveCycleSettings). n-chi kelgusi hayz n ta shunday
 * siklning YIG'INDISIDAN keyin boshlanadi:
 *
 *     boshlanish_n = oxirgi_boshlanish + n·μ
 *
 * Mustaqil miqdorlar yig'indisida DISPERSIYALAR qo'shiladi, standart
 * og'ishlar emas — demak:
 *
 *     σ_n = σ·√n        (σ·n EMAS)
 *
 * Bu amaliy farq: σ=2 kun bo'lsa, 4 oydan keyingi xato ±8 kun emas, ±4 kun.
 * Chiziqli o'sish noaniqlikni HADDAN TASHQARI oshirib ko'rsatib, uzoq
 * bashoratni foydasiz qilib qo'yardi; umuman kengaytmaslik esa aksincha —
 * soxta aniqlik berardi. √n — matematik jihatdan to'g'ri o'rta yo'l.
 *
 * OVULYATSIYA. "14-kun" qoidasi EMAS. Reproduktiv fiziologiyada follikulyar
 * faza (hayzdan ovulyatsiyagacha) ancha o'zgaruvchan, LYUTEAL faza
 * (ovulyatsiyadan keyingi hayzgacha) esa har bir ayolda nisbatan BARQAROR —
 * 12–14 kun. Shuning uchun ovulyatsiya OLDINGA emas, KEYINGI hayzdan
 * ORQAGA sanaladi:
 *
 *     ovulyatsiya_n = boshlanish_n − lyuteal_faza
 *
 * Lyuteal faza foydalanuvchining o'z signallaridan (BBT sakrashi yoki
 * ovulyatsiya og'rig'i/shilliq o'zgarishi) o'rganiladi; signal bo'lmasa 14
 * kun. Natijada ovulyatsiyaning noaniqligi hayz boshlanishining noaniqligi
 * bilan bir xil — σ_n.
 *
 * UNUMDOR OYNA. Biologik asos: spermatozoid ayol tanasida 5 kungacha yashay
 * oladi, tuxum hujayra ~24 soat. Demak ovulyatsiya kunidan 5 kun oldin va 1
 * kun keyin. LEKIN ovulyatsiya kunining o'zi ±σ_n kunga noaniq bo'lsa,
 * amaliy oyna ham shuncha kengayishi kerak — aks holda homiladorlikka
 * tayyorgarlik ko'rayotgan foydalanuvchi haqiqiy oynani o'tkazib yuboradi.
 * Shuning uchun oyna σ_n ga kengaytiriladi (ma'noli chegara bilan).
 *
 * NIMA QILINMADI. Qisqa tarixdan "trend" (sikl uzayyapti/qisqaryapti)
 * chiqarish ATAYLAB yo'q: 3–6 nuqtadan trend chiqarish statistik jihatdan
 * asossiz va tibbiy mazmundagi ilovada zararli bo'lardi.
 * ------------------------------------------------------------------ */

export interface ForecastedCycle {
  /** 1 — keyingi sikl, 2 — undan keyingisi va h.k. */
  index: number;
  periodStart: string;
  periodEnd: string;
  /** Noaniqlik diapazoni: σ·√index (kun). Uzoqlashgan sari kengayadi. */
  periodStartEarliest: string;
  periodStartLatest: string;
  ovulationDay: string;
  fertileWindowStart: string;
  fertileWindowEnd: string;
  /** Shu siklning noaniqligi, kun (± ). UI uzoq bashoratlarni xiraroq
   * ko'rsatishi yoki "taxminan" deb belgilashi uchun. */
  uncertaintyDays: number;
}

/** Nechta sikl oldinga bashorat qilinadi — ~1 yil. */
export const FORECAST_CYCLES = 13;

/** Noaniqlik shundan oshsa, bashorat amalda ma'nosiz — UI uni "taxminiy"
 * sifatida ko'rsatishi kerak. Kengaytirishning o'zi ham shu bilan
 * chegaralanadi (aks holda uzoq oylarda butun oy "unumdor" bo'lib qolardi). */
export const MAX_FORECAST_UNCERTAINTY_DAYS = 10;

export function forecastCycles(
  settings: Pick<CycleSettings, "lastPeriodStart" | "averageCycleLength" | "averagePeriodLength"> & {
    personalLutealPhase?: number | null;
    /** Sikl uzunligining standart og'ishi — berilmasa, ma'lumot yo'qligini
     * aks ettiruvchi keng standart qiymat. */
    stdDevDays?: number;
  },
  count: number = FORECAST_CYCLES,
  /** CYCLE-ALGO-17: berilgan bo'lsa — TUGAB BO'LGAN sikllar chiqarib
   * tashlanadi. Sikllar `lastPeriodStart`dan sanaladi, ya'ni oxirgi hayz
   * uzoq oldin bo'lsa birinchi "bashorat"lar allaqachon O'TMISHDA qoladi.
   * Foydalanuvchi ekranida bu "15–19 sentabr kutilmoqda" (bugun 22-sentabr)
   * ko'rinishida chiqardi — o'tib ketgan kunni kutish mumkin emas. */
  today?: string
): ForecastedCycle[] {
  if (!settings.lastPeriodStart) return [];
  const cycleLength = settings.averageCycleLength || DEFAULT_CYCLE_LENGTH;
  const periodLength = settings.averagePeriodLength || DEFAULT_PERIOD_LENGTH;
  const lutealPhaseDays = Math.min(settings.personalLutealPhase ?? DEFAULT_LUTEAL_PHASE_DAYS, cycleLength - 1);
  const stdDev = settings.stdDevDays ?? DEFAULT_STD_DEV_DAYS;

  const out: ForecastedCycle[] = [];
  for (let i = 1; i <= count; i++) {
    const periodStart = addDays(settings.lastPeriodStart, cycleLength * i);
    const ovulationDay = addDays(periodStart, -lutealPhaseDays);

    // σ_n = σ·√n — dispersiyalar qo'shiladi, standart og'ishlar emas.
    const uncertaintyDays = Math.min(Math.round(stdDev * Math.sqrt(i)), MAX_FORECAST_UNCERTAINTY_DAYS);
    const periodStartLatest = addDays(periodStart, uncertaintyDays);

    // Diapazonning ENG KECH ehtimoli ham o'tib ketgan bo'lsa — bu bashorat
    // emas, o'tmish. `periodStartLatest` bo'yicha tekshiriladi (`periodEnd`
    // emas): noaniqlik oynasi hali ochiq ekan, hayz boshlanishi mumkin.
    if (today && addDays(periodStart, periodLength - 1) < today && periodStartLatest < today) continue;

    out.push({
      index: i,
      periodStart,
      periodEnd: addDays(periodStart, periodLength - 1),
      periodStartEarliest: addDays(periodStart, -uncertaintyDays),
      periodStartLatest,
      ovulationDay,
      // Biologik oyna (−5…+1) ovulyatsiya kunining O'Z noaniqligiga
      // kengaytiriladi — aks holda tayyorgarlik ko'rayotgan foydalanuvchi
      // haqiqiy oynani o'tkazib yuborishi mumkin.
      fertileWindowStart: addDays(ovulationDay, -(5 + uncertaintyDays)),
      fertileWindowEnd: addDays(ovulationDay, 1 + uncertaintyDays),
      uncertaintyDays,
    });
  }
  return out;
}
