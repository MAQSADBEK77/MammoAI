import type { OnboardingProfile } from "@mammoai/shared";
import {
  addDays,
  computeCycleLengths,
  daysBetween,
  generateChecklist,
  isCycleIrregular,
  isPerimenopauseGoal,
  isTryingToConceiveGoal,
  resolvePregnancyState,
  tashkentDateStr,
} from "@mammoai/shared";
import { ensureChecklistItem, getOnboardingProfile, getPregnancyProfile, listCycleLogs } from "./repo";

// FIX-CHECKUPS: tug'ruqdan keyingi standart kuzatuv oynasi.
// PREG-STATE-01: POSTPARTUM_* konstantalari endi packages/shared'da
// (resolvePregnancyState bilan bir joyda) — bu yerdagi nusxalar olib
// tashlandi, ikki joyda turishi ularning ajralib ketishiga olib kelardi.

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
  // "Hamkorimni kuzataman" — bu foydalanuvchining O'ZIGA tegishli tibbiy
  // tekshiruv checklist'i ma'nosiz (u o'zining emas, hamkorining ma'lumotini
  // ko'radi) — checklist umuman yaratilmaydi.
  if (profile.primaryGoal === "partner_tracking") return;

  // 12 emas, 365 — sikl uzunligi tartibsizligini haqiqatan aniqlash uchun
  // bir nechta TO'LIQ sikl kerak (12 kunlik log 1 ta hayzning o'zi bo'lishi
  // mumkin, tartibsizlikni umuman ko'rsata olmasdi — avvalgi xato shu edi:
  // `isCycleIrregular` doim BIR XIL statik qiymatga tekshirilib, hech qachon
  // tartibsiz deb chiqmasdi).
  const [recentLogs, pregnancy] = await Promise.all([listCycleLogs(userId, 365), getPregnancyProfile(userId)]);
  const cycleIrregular = profile.cycleRegularity === "irregular" || isCycleIrregular(computeCycleLengths(recentLogs));

  // FIX2-23: xuddi shu UTC/Toshkent bug'i (localDateStr()dagi izohga qarang)
  // — due_date hisob-kitobi ertalabki soatlarda bir kun orqada chiqishi mumkin edi.
  const today = tashkentDateStr();

  // PREG-STATE-01: ilgari shu yerda `profile.isPregnant || !!pregnancy?.dueDate`
  // yozilgan edi — ya'ni tug'ilish sanasi KALKULYATORINI to'ldirgan ayol
  // homilador deb hisoblanardi. Production'da 11 ta ayol (jumladan
  // homiladorlikni REJALASHTIRAYOTGAN 5 tasi) shu sababli o'ziga tegishli
  // bo'lmagan homiladorlik bandlarini olgan. Endi yagona manba —
  // resolvePregnancyState (packages/shared), ayolning o'z belgisi.
  const { isPregnant, isPostpartum, daysSinceDue, status: pregnancyStatus } = resolvePregnancyState(
    { declaredPregnant: profile.isPregnant, profile: pregnancy },
    today
  );
  const pregnancyWeek = pregnancyStatus?.currentWeek ?? null;

  const generated = generateChecklist({
    age: profile.age,
    familyHistory: profile.familyHistory,
    isPregnant,
    cycleIrregular,
    sexuallyActive: profile.sexuallyActive,
    pregnancyWeek,
    isPostpartum,
    // CHECKUP-02: tug'ruqdan keyingi bandlar ANIQ kunlarga bog'langan
    // (6-haftalik tekshiruv = 42-kun), shuning uchun bitta bayroq yetarli emas.
    daysSinceDue,
    isPerimenopause: isPerimenopauseGoal(profile.primaryGoal),
    isTryingToConceive: isTryingToConceiveGoal(profile.primaryGoal),
    // PLAN-01: bu ikkalasi onboarding'da SO'RALARDI, lekin rejaga umuman
    // ta'sir qilmasdi — qarang: checklist-rules.ts izohlari.
    lastCheckup: profile.lastCheckup,
    healthConditions: profile.healthConditions,
    hpvVaccinated: profile.hpvVaccinated,
  });

  await Promise.all(
    generated.map((item) =>
      ensureChecklistItem(userId, item.type, item.dueInDays != null ? addDays(today, item.dueInDays) : null, item.recurrenceDays)
    )
  );
}
