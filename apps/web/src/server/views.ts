// API javoblari uchun "composite" ko'rinishlar — bir nechta route (GET va mutatsiyalar)
// bir xil natija shaklini qaytarishi kerak bo'lganda shu yerdan qayta ishlatiladi.

import {
  computeCycleLengths,
  deriveAdaptiveCycleSettings,
  explainPrediction,
  isCycleIrregular,
  predictCycle,
  getPregnancyStatus,
  WATER_TARGET_ML,
  forecastCycles,
  tashkentDateStr,
} from "@mammoai/shared";
import type { CycleResponse, PredictionConfidence, PregnancyResponse, WellnessResponse } from "@mammoai/shared";
import {
  getCycleSettings,
  getKicksToday,
  getLatestVitals,
  getOnboardingProfile,
  getPregnancyProfile,
  getWellnessToday,
  listCycleLogs,
  listPregnancyVisits,
  listRecentVitalsByType,
} from "./repo";

/** CYCLE-ALGO-18: kalendarda nechta sikl oldinga ko'rsatiladi — ishonch
 * darajasiga qarab. Ma'lumot qancha ko'p bo'lsa, uzoq bashorat shuncha
 * asosli. "insufficient" = hali birorta ham sikl aniqlanmagan (odatda
 * foydalanuvchi faqat onboarding'da sana kiritgan) — bunda faqat ENG YAQIN
 * sikl ko'rsatiladi. */
const FORECAST_HORIZON: Record<PredictionConfidence, number> = {
  insufficient: 1,
  low: 3,
  medium: 6,
  high: 13,
};

/** `today` — ixtiyoriy, faqat QA-001 integratsiya testi uchun (deterministik
 * sana bilan tekshirish); haqiqiy so'rovlarda hech qachon uzatilmaydi, shuning
 * uchun `predictCycle`ning o'z standart qiymati (`new Date()`) ishlatiladi. */
export async function buildCycleResponse(userId: string, today?: string): Promise<CycleResponse> {
  const settings = await getCycleSettings(userId);
  // Bashorat uchun ko'proq tarix kerak (ADAPTIVE_MAX_CYCLES ta sikl uchun
  // yetarli) — Cycle ekranida ko'rsatiladigan oxirgi loglar bilan aralashtirmaslik
  // uchun alohida so'raladi (ekranga faqat oxirgi ~180 kun yetarli bo'lsa ham).
  const [logs, historyLogs] = await Promise.all([listCycleLogs(userId), listCycleLogs(userId, 365)]);

  // Bashorat endi statik `cycle_settings`ga emas — imkon qadar haqiqiy
  // `cycle_logs` tarixidan "o'rganilgan" (adaptiv) qiymatlarga tayanadi, yetarli
  // tarix bo'lmasa foydalanuvchining o'zi kiritgan sozlamasiga tushadi.
  const adaptive = deriveAdaptiveCycleSettings(historyLogs, settings, today);
  const prediction = adaptive && predictCycle(adaptive, today);
  if (prediction && adaptive) {
    prediction.cyclesAnalyzed = adaptive.cyclesAnalyzed;
    prediction.confidence = adaptive.confidence;
    // CYCLE-ALGO-08: foydalanuvchiga "nega shunday bashorat qilindi" degan shaffof tushuntirish.
    prediction.explanationReason = explainPrediction(adaptive);
  }

  const isIrregular = isCycleIrregular(computeCycleLengths(historyLogs));

  // CYCLE-ALGO-16: kalendar uchun ko'p oylik bashorat. `adaptive` — bashorat
  // bilan AYNAN bir xil manba (o'rganilgan sikl/hayz uzunligi va shaxsiy
  // lyuteal faza), shuning uchun birinchi bashorat qilingan sikl `prediction`
  // bilan doim mos tushadi — ikkalasi boshqa-boshqa sana ko'rsatmaydi.
  // CYCLE-ALGO-17: `today` UZATILADI — tugab bo'lgan sikllar chiqarib
  // tashlanishi uchun. Sikllar `lastPeriodStart`dan sanaladi, ya'ni oxirgi
  // hayz uzoq oldin qayd etilgan (yoki faqat onboarding'da bir marta
  // kiritilgan) foydalanuvchida birinchi "bashorat"lar allaqachon o'tmishda
  // qolgan bo'lardi va kalendarda o'tib ketgan kunlar "kutilmoqda" bo'lib
  // turardi.
  //
  // CYCLE-ALGO-18: ufq ISHONCH darajasiga bog'landi. Ilgari hamma uchun 13 ta
  // sikl chiqarilardi — hatto hech qachon hayz QAYD ETMAGAN, faqat
  // onboarding'da bitta sana kiritgan foydalanuvchi uchun ham. Natijada
  // kalendar bir yillik "bashorat" bilan to'lib ketardi: har bir siklda
  // punktir hayz kunlari + ~15 kunlik unumdor oyna, hammasi xira kulrang.
  // Foydalanuvchi buni shunday ta'rifladi: "why some dates are dark and some
  // are grey". Bir martalik o'z-o'zidan aytilgan sanadan bir yil oldinga
  // bashorat qilish — soxta aniqlik. Ma'lumot ko'paygan sari ufq ham uzayadi.
  // Tartib MUHIM: avval to'liq ro'yxat yaratiladi va TUGAGANLARI tashlanadi,
  // keyin qolganidan N tasi olinadi. Teskarisida (avval N ta yaratib, keyin
  // filtrlash) oxirgi hayzi uzoq oldin bo'lgan foydalanuvchida hamma sikl
  // o'tmishda qolib, bashorat BUTUNLAY yo'qolardi — "eng yaqin 1 ta sikl"
  // o'rniga "0 ta sikl".
  const forecast = adaptive
    ? forecastCycles(adaptive, undefined, today ?? tashkentDateStr()).slice(
        0,
        FORECAST_HORIZON[adaptive.confidence]
      )
    : [];

  return { settings, logs, prediction, isIrregular, forecast };
}

/** Vazn — oldingi qayddan (yoki, birinchi qayd bo'lsa, onboarding vaznidan) farqi, kg. */
async function computeWeightDeltaKg(userId: string): Promise<number | null> {
  const recent = await listRecentVitalsByType(userId, "weight", 2);
  const latest = recent[0] ? Number(recent[0].value) : null;
  if (latest === null || Number.isNaN(latest)) return null;
  const previous = recent[1] ? Number(recent[1].value) : ((await getOnboardingProfile(userId))?.weightKg ?? null);
  if (previous === null || Number.isNaN(previous)) return null;
  return Math.round((latest - previous) * 10) / 10;
}

export async function buildPregnancyResponse(userId: string): Promise<PregnancyResponse> {
  const profile = await getPregnancyProfile(userId);
  const status = profile ? getPregnancyStatus(profile) : null;
  const [visits, kicksToday, latestVitals, weightDeltaKg] = await Promise.all([
    listPregnancyVisits(userId),
    getKicksToday(userId),
    getLatestVitals(userId),
    computeWeightDeltaKg(userId),
  ]);
  return { profile, status, visits, kicksToday, latestVitals, weightDeltaKg };
}

export async function buildWellnessResponse(userId: string): Promise<WellnessResponse> {
  const today = await getWellnessToday(userId);
  return { today, waterTargetMl: WATER_TARGET_ML };
}
