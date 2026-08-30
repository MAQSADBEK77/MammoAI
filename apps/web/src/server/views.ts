// API javoblari uchun "composite" ko'rinishlar — bir nechta route (GET va mutatsiyalar)
// bir xil natija shaklini qaytarishi kerak bo'lganda shu yerdan qayta ishlatiladi.

import { isCycleIrregular, predictCycle, getPregnancyStatus } from "@mammoai/shared";
import type { CycleResponse, PregnancyResponse } from "@mammoai/shared";
import {
  getCycleSettings,
  getKicksToday,
  getLatestVitals,
  getOnboardingProfile,
  getPregnancyProfile,
  listCycleLogs,
  listPregnancyVisits,
  listRecentVitalsByType,
} from "./repo";

export async function buildCycleResponse(userId: string): Promise<CycleResponse> {
  const settings = await getCycleSettings(userId);
  const logs = await listCycleLogs(userId);
  const prediction = predictCycle(settings);

  const periodStarts = logs
    .filter((l) => l.flow)
    .map((l) => l.date)
    .sort();
  const lengths: number[] = [];
  for (let i = 1; i < periodStarts.length; i++) {
    const days = Math.round(
      (new Date(periodStarts[i]).getTime() - new Date(periodStarts[i - 1]).getTime()) / 86400000
    );
    if (days > 10) lengths.push(days);
  }

  return { settings, logs, prediction, isIrregular: isCycleIrregular(lengths) };
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
