import type { OnboardingProfile } from "@mammoai/shared";
import { computeCycleLengths, generateChecklist, isCycleIrregular } from "@mammoai/shared";
import { ensureChecklistItem, getOnboardingProfile, getPregnancyProfile, listCycleLogs } from "./repo";

const addDays = (dateStr: string, days: number) => {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/**
 * Onboarding profiliga va joriy holatga qarab checklist bandlarini yaratadi/yangilaydi.
 * Oddiy qoidalar jadvali — ML kerak emas (spec §4).
 *
 * MUHIM (tezlik): avval hammasi ketma-ket `await` qilinar edi (profil + 3 ta
 * mustaqil o'qish + har bir checklist bandi uchun alohida so'rov) — Supavisor
 * pooler orqali bu 10+ ketma-ket tarmoq safariga aylanib, onboarding tugatishni
 * bir necha soniyaga (ba'zan undan ko'proqqa) cho'zar edi ("tahlil qilinmoqda"da
 * osilib qolgandek tuyulish sababi shu edi). Endi mustaqil so'rovlar parallel.
 * `knownProfile` — chaqiruvchida profil allaqachon bor bo'lsa (onboarding submit),
 * qayta o'qib o'tirmaslik uchun.
 */
export async function syncChecklistForUser(userId: string, knownProfile?: OnboardingProfile): Promise<void> {
  const profile = knownProfile ?? (await getOnboardingProfile(userId));
  if (!profile) return;

  // 12 emas, 365 — sikl uzunligi tartibsizligini haqiqatan aniqlash uchun
  // bir nechta TO'LIQ sikl kerak (12 kunlik log 1 ta hayzning o'zi bo'lishi
  // mumkin, tartibsizlikni umuman ko'rsata olmasdi — avvalgi xato shu edi:
  // `isCycleIrregular` doim BIR XIL statik qiymatga tekshirilib, hech qachon
  // tartibsiz deb chiqmasdi).
  const [recentLogs, pregnancy] = await Promise.all([listCycleLogs(userId, 365), getPregnancyProfile(userId)]);
  const cycleIrregular = profile.cycleRegularity === "irregular" || isCycleIrregular(computeCycleLengths(recentLogs));
  const isPregnant = profile.isPregnant || !!pregnancy?.dueDate;

  const generated = generateChecklist({
    age: profile.age,
    familyHistory: profile.familyHistory,
    isPregnant,
    cycleIrregular,
  });

  const today = new Date().toISOString().slice(0, 10);
  await Promise.all(
    generated.map((item) => ensureChecklistItem(userId, item.type, item.dueInDays != null ? addDays(today, item.dueInDays) : null))
  );
}
