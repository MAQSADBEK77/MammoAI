// API javoblari uchun "composite" ko'rinishlar — bir nechta route (GET va mutatsiyalar)
// bir xil natija shaklini qaytarishi kerak bo'lganda shu yerdan qayta ishlatiladi.

import { isCycleIrregular, predictCycle, getPregnancyStatus } from "@mammoai/shared";
import type { CycleResponse, PregnancyResponse } from "@mammoai/shared";
import {
  getCycleSettings,
  getKicksToday,
  getPregnancyProfile,
  listCycleLogs,
  listPregnancyVisits,
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

export function buildPregnancyResponse(userId: string): PregnancyResponse {
  const profile = getPregnancyProfile(userId);
  const status = profile ? getPregnancyStatus(profile) : null;
  return {
    profile,
    status,
    visits: listPregnancyVisits(userId),
    kicksToday: getKicksToday(userId),
  };
}
