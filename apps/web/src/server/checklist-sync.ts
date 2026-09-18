import type { OnboardingProfile } from "@mammoai/shared";
import {
  addDays,
  computeCycleLengths,
  daysBetween,
  generateChecklist,
  getPregnancyStatus,
  isCycleIrregular,
  isPerimenopauseGoal,
  isTryingToConceiveGoal,
  tashkentDateStr,
} from "@mammoai/shared";
import { ensureChecklistItem, getOnboardingProfile, getPregnancyProfile, listCycleLogs } from "./repo";

// FIX-CHECKUPS: tug'ruqdan keyingi standart kuzatuv oynasi.
const POSTPARTUM_WINDOW_DAYS = 42;
// FIX3-01: taxminiy tug'ilish sanasidan darhol postpartum'ga o'tmaslik
// uchun — pregnancy.ts#getPregnancyStatus bilan bir xil "hali homilador"
// chegarasi (42-hafta = taxminiy sanadan 14 kun keyingacha).
const POSTPARTUM_GRACE_DAYS = 14;

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

  // FIX-CHECKUPS/FIX3-01: tug'ruqdan keyingi ~42 kunlik oyna — bu davrda
  // foydalanuvchi endi "homilador" emas, "postpartum" hisoblanadi. ILGARI
  // `daysSinceDue > 0` edi — taxminiy sanadan ATIGI 1 kun o'tishi bilan
  // homiladorlik bandlarini butunlay yo'qotardi, holbuki haqiqiy tug'ruq
  // taxminiy sanadan bir necha kun/hafta kechikishi tabiiy hol —
  // POSTPARTUM_GRACE_DAYS shu oynani hisobga oladi.
  const daysSinceDue = pregnancy?.dueDate ? daysBetween(pregnancy.dueDate, today) : null;
  const isPostpartum = daysSinceDue !== null && daysSinceDue > POSTPARTUM_GRACE_DAYS && daysSinceDue <= POSTPARTUM_WINDOW_DAYS;
  const isPregnant = (profile.isPregnant || !!pregnancy?.dueDate) && !isPostpartum;
  const pregnancyWeek = isPregnant && pregnancy ? (getPregnancyStatus(pregnancy, today)?.currentWeek ?? null) : null;

  const generated = generateChecklist({
    age: profile.age,
    familyHistory: profile.familyHistory,
    isPregnant,
    cycleIrregular,
    sexuallyActive: profile.sexuallyActive,
    pregnancyWeek,
    isPostpartum,
    isPerimenopause: isPerimenopauseGoal(profile.primaryGoal),
    isTryingToConceive: isTryingToConceiveGoal(profile.primaryGoal),
  });

  await Promise.all(
    generated.map((item) =>
      ensureChecklistItem(userId, item.type, item.dueInDays != null ? addDays(today, item.dueInDays) : null, item.recurrenceDays)
    )
  );
}
