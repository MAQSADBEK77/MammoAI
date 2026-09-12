// API javoblari uchun "composite" ko'rinishlar — bir nechta route (GET va mutatsiyalar)
// bir xil natija shaklini qaytarishi kerak bo'lganda shu yerdan qayta ishlatiladi.

import { computeCycleLengths, deriveAdaptiveCycleSettings, isCycleIrregular, predictCycle, getPregnancyStatus, WATER_TARGET_ML } from "@mammoai/shared";
import type { CycleResponse, PregnancyResponse, WellnessResponse } from "@mammoai/shared";
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

export async function buildCycleResponse(userId: string): Promise<CycleResponse> {
  const settings = await getCycleSettings(userId);
  // Bashorat uchun ko'proq tarix kerak (ADAPTIVE_MAX_CYCLES ta sikl uchun
  // yetarli) — Cycle ekranida ko'rsatiladigan oxirgi loglar bilan aralashtirmaslik
  // uchun alohida so'raladi (ekranga faqat oxirgi ~180 kun yetarli bo'lsa ham).
  const [logs, historyLogs] = await Promise.all([listCycleLogs(userId), listCycleLogs(userId, 365)]);

  // Bashorat endi statik `cycle_settings`ga emas — imkon qadar haqiqiy
  // `cycle_logs` tarixidan "o'rganilgan" (adaptiv) qiymatlarga tayanadi, yetarli
  // tarix bo'lmasa foydalanuvchining o'zi kiritgan sozlamasiga tushadi.
  const adaptive = deriveAdaptiveCycleSettings(historyLogs, settings);
  const prediction = adaptive && predictCycle(adaptive);
  if (prediction && adaptive) prediction.cyclesAnalyzed = adaptive.cyclesAnalyzed;

  const isIrregular = isCycleIrregular(computeCycleLengths(historyLogs));

  return { settings, logs, prediction, isIrregular };
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
