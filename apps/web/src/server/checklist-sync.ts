import { generateChecklist, isCycleIrregular } from "@mammoai/shared";
import { ensureChecklistItem, getCycleSettings, getOnboardingProfile, getPregnancyProfile, listCycleLogs } from "./repo";

const addDays = (dateStr: string, days: number) => {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/**
 * Onboarding profiliga va joriy holatga qarab checklist bandlarini yaratadi/yangilaydi.
 * Oddiy qoidalar jadvali — ML kerak emas (spec §4).
 */
export async function syncChecklistForUser(userId: string): Promise<void> {
  const profile = await getOnboardingProfile(userId);
  if (!profile) return;

  const cycleSettings = await getCycleSettings(userId);
  const recentLogs = await listCycleLogs(userId, 12);
  const cycleIrregular =
    profile.cycleRegularity === "irregular" || isCycleIrregular(recentLogs.map(() => cycleSettings.averageCycleLength));

  const pregnancy = await getPregnancyProfile(userId);
  const isPregnant = profile.isPregnant || !!pregnancy?.dueDate;

  const generated = generateChecklist({
    age: profile.age,
    familyHistory: profile.familyHistory,
    isPregnant,
    cycleIrregular,
  });

  const today = new Date().toISOString().slice(0, 10);
  for (const item of generated) {
    await ensureChecklistItem(userId, item.type, item.dueInDays != null ? addDays(today, item.dueInDays) : null);
  }
}
