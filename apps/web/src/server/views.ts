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

export function buildCycleResponse(userId: string): CycleResponse {
  const settings = getCycleSettings(userId);
  const logs = listCycleLogs(userId);
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
function computeWeightDeltaKg(userId: string): number | null {
  const recent = listRecentVitalsByType(userId, "weight", 2);
  const latest = recent[0] ? Number(recent[0].value) : null;
  if (latest === null || Number.isNaN(latest)) return null;
  const previous = recent[1] ? Number(recent[1].value) : getOnboardingProfile(userId)?.weightKg ?? null;
  if (previous === null || Number.isNaN(previous)) return null;
  return Math.round((latest - previous) * 10) / 10;
}

export function buildPregnancyResponse(userId: string): PregnancyResponse {
  const profile = getPregnancyProfile(userId);
  const status = profile ? getPregnancyStatus(profile) : null;
  return {
    profile,
    status,
    visits: listPregnancyVisits(userId),
    kicksToday: getKicksToday(userId),
    latestVitals: getLatestVitals(userId),
    weightDeltaKg: computeWeightDeltaKg(userId),
  };
}
