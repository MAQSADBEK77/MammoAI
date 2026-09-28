// Kunlik eslatmalar — Telegram bog'langan foydalanuvchilarga bot orqali (+
// ilova ichidagi bildirishnoma) yuboriladi. Vercel Cron orqali kuniga bir marta
// chaqiriladi (apps/web/src/app/api/cron/daily-reminders/route.ts, vercel.json).
//
// MUHIM QOIDA: faqat MAZMUNLI bo'lganda yuboriladi — har kuni bir xil xabar
// bilan zerikarli qilib yubormaslik uchun (foydalanuvchi so'rovi bilan
// kelishilgan). Ustuvorlik: hayz/unumdor kun yaqinlashgani > bugun hali
// belgilanmagani. Ikkalasi ham yo'q bo'lsa — hech narsa yuborilmaydi.

import { deriveAdaptiveCycleSettings, dictionaries, predictCycle, resolvePregnancyState, resolveReminder, tashkentDateStr } from "@mammoai/shared";
import type { Language } from "@mammoai/shared";
import {
  createSystemNotification,
  getCycleSettings,
  getOnboardingProfile,
  getPregnancyProfile,
  hasLoggedToday,
  countOverdueChecklistItems,
  countRemindersSent,
  daysSinceCheckupNudge,
  hasSentDailyReminderRecently,
  listCycleLogs,
  listUsersForDailyReminders,
} from "./repo";
import { miniAppInlineKeyboard, sendTelegramMessage } from "./telegram-bot";
import { sendExpoPushNotification } from "./push-notifications";

const REMINDER_PUSH_TITLE = "MammoAI 🌸";

// DEEPLINK-01: eslatma ostidagi tugma ilovani TO'G'RIDAN qayd oynasida
// ochadi. Ilgari eslatma faqat matn edi — ayol xabarni o'qib, ilovani o'zi
// topib, keyin kerakli tugmani izlashi kerak edi. Har bir qo'shimcha qadam
// yo'lda odam yo'qotadi, ayniqsa kunlik odat shakllantirmoqchi bo'lganda.
//
// Manzil `/tg` orqali o'tadi — Telegram `web_app` tugmasi Mini App
// autentifikatsiya sahifasiga ishora qilishi kerak, u esa `?next=` bo'yicha
// kerakli ekranga o'tkazadi.
const MINI_APP_BASE_URL = "https://mammo.uz";
const LOG_DEEP_LINK = `${MINI_APP_BASE_URL}/tg?next=${encodeURIComponent("/asosiy?log=1")}`;
// REMIND-02: sozlashni tugatmaganlar uchun tugma qayd oynasini emas,
// onboardingni ochadi — ular uchun "belgilash" oynasining o'zi ma'nosiz.
const SETUP_DEEP_LINK = `${MINI_APP_BASE_URL}/tg?next=${encodeURIComponent("/onboarding")}`;
// SCREEN-01: tekshiruv eslatmasi ayolni to'g'ridan tekshiruvlar ro'yxatiga
// olib boradi — u yerda har band ostida "Klinika topish" tugmasi turadi.
const CHECKUP_DEEP_LINK = `${MINI_APP_BASE_URL}/tg?next=${encodeURIComponent("/tekshiruvlar")}`;



interface ReminderPlan {
  text: string;
  /** Tugma matni va manzili — holatga qarab farq qiladi. */
  buttonLabel: string;
  deepLink: string;
  /** Ilova ichidagi yozuv turi. Standart — kunlik eslatma. */
  notificationType?: "daily_reminder" | "checkup_reminder";
}

/**
 * Ma'lumot yig'adi va QARORNI `resolveReminder`ga (packages/shared)
 * topshiradi — u yerda sof funksiya sifatida testlar bilan qoplangan.
 * Bu yerda faqat tarjima va tugma qo'shiladi.
 */
async function buildReminderPlan(userId: string, language: Language): Promise<ReminderPlan | null> {
  const dict = dictionaries[language];
  const log = (text: string): ReminderPlan => ({ text, buttonLabel: dict.reminders.logButton, deepLink: LOG_DEEP_LINK });

  const [onboarding, pregnancyProfile] = await Promise.all([getOnboardingProfile(userId), getPregnancyProfile(userId)]);
  const pregnancy = resolvePregnancyState({ declaredPregnant: onboarding?.isPregnant ?? false, profile: pregnancyProfile });

  // Sozlashni tugatmaganlar uchun sikl ma'lumotini umuman so'ramaymiz —
  // ularda u yo'q, va bu har kecha 39 ta ortiqcha so'rov degani edi.
  const needsCycleData = !!onboarding && !pregnancy.isPregnant;
  const [loggedToday, remindersSentSoFar, settings, logs, overdueCheckups, checkupNudgeAge] = await Promise.all([
    onboarding ? hasLoggedToday(userId) : Promise.resolve(false),
    onboarding ? Promise.resolve(0) : countRemindersSent(userId),
    needsCycleData ? getCycleSettings(userId) : Promise.resolve(null),
    needsCycleData ? listCycleLogs(userId, 365) : Promise.resolve([]),
    needsCycleData ? countOverdueChecklistItems(userId) : Promise.resolve(0),
    needsCycleData ? daysSinceCheckupNudge(userId) : Promise.resolve(null),
  ]);

  const adaptive = needsCycleData && settings ? deriveAdaptiveCycleSettings(logs, settings) : null;
  const prediction = adaptive ? predictCycle(adaptive) : null;

  const decision = resolveReminder({
    today: tashkentDateStr(),
    hasOnboarding: !!onboarding,
    remindersSentSoFar,
    isPregnant: pregnancy.isPregnant,
    pregnancyWeek: pregnancy.status?.currentWeek ?? null,
    loggedToday,
    overdueCheckups,
    daysSinceCheckupNudge: checkupNudgeAge,
    prediction: prediction
      ? {
          daysUntilNextPeriod: prediction.daysUntilNextPeriod,
          fertileWindowStart: prediction.fertileWindowStart,
          fertileWindowEnd: prediction.fertileWindowEnd,
        }
      : null,
  });

  switch (decision.kind) {
    case "finish-setup":
      return { text: dict.reminders.finishSetup, buttonLabel: dict.reminders.finishSetupButton, deepLink: SETUP_DEEP_LINK };
    case "pregnancy-week":
      return log(dict.reminders.pregnancyWeek(decision.week));
    case "pregnancy-log":
      return log(dict.reminders.pregnancyLogToday);
    case "checkup-overdue":
      return {
        text: dict.reminders.checkupOverdue(decision.count),
        buttonLabel: dict.reminders.checkupButton,
        deepLink: CHECKUP_DEEP_LINK,
        // Alohida tur — takrorlanish oralig'i shu yozuvlar bo'yicha hisoblanadi.
        notificationType: "checkup_reminder",
      };
    case "period-today":
      return log(dict.reminders.periodToday);
    case "period-tomorrow":
      return log(dict.reminders.periodTomorrow);
    case "period-soon":
      return log(dict.reminders.periodSoon(decision.days));
    case "period-late":
      return log(dict.reminders.periodLate(decision.days));
    case "fertile-window":
      return log(dict.reminders.fertileWindow);
    case "log-today":
      return log(dict.reminders.logToday);
    case "none":
      return null;
  }
}

export interface DailyReminderResult {
  userId: string;
  sent: boolean;
  message: string | null;
  error?: string;
}

/** Har bir foydalanuvchini ko'rib chiqadi — bitta foydalanuvchidagi xato
 * boshqalarni to'xtatmasligi uchun har biri alohida try/catch bilan o'raladi.
 * Bot xabari yuborilmasa ham (masalan Telegram vaqtincha ishlamasa), ilova
 * ichidagi bildirishnoma baribir yaratilishga harakat qilinadi — qisman
 * yetkazish yo'qdan ko'ra yaxshiroq. Ketma-ket (parallel emas) — Telegram
 * API'ga bir vaqtda ko'p so'rov yubormaslik uchun, joriy miqyosda yetarli tezlik. */
export async function runDailyReminders(): Promise<DailyReminderResult[]> {
  const users = await listUsersForDailyReminders();
  const results: DailyReminderResult[] = [];

  for (const user of users) {
    // FIX2-25: cron ikki marta chaqirilsa (retry, qo'lda qayta ishga
    // tushirish), idempotentlik tekshiruvi yo'qligi sabab HAR BIR
    // foydalanuvchiga xabar IKKI MARTA yuborilardi.
    if (await hasSentDailyReminderRecently(user.id)) {
      results.push({ userId: user.id, sent: false, message: null });
      continue;
    }

    let plan: ReminderPlan | null = null;
    try {
      plan = await buildReminderPlan(user.id, user.language);
    } catch (error) {
      results.push({ userId: user.id, sent: false, message: null, error: `build: ${error instanceof Error ? error.message : String(error)}` });
      continue;
    }
    if (!plan) {
      results.push({ userId: user.id, sent: false, message: null });
      continue;
    }
    const message = plan.text;

    let telegramSent = false;
    let pushSent = false;
    let deliveryError: string | undefined;
    if (user.telegramUserId) {
      try {
        await sendTelegramMessage(user.telegramUserId, message, miniAppInlineKeyboard(plan.buttonLabel, plan.deepLink));
        telegramSent = true;
      } catch (error) {
        deliveryError = error instanceof Error ? error.message : String(error);
      }
    }
    if (user.expoPushToken) {
      try {
        await sendExpoPushNotification(user.expoPushToken, { title: REMINDER_PUSH_TITLE, body: message });
        pushSent = true;
      } catch (error) {
        // Telegram xatosi ustidan yozib yubormaslik uchun — faqat ikkalasi ham
        // muvaffaqiyatsiz bo'lsagina saqlanadi.
        if (!telegramSent) deliveryError = error instanceof Error ? error.message : String(error);
      }
    }
    try {
      await createSystemNotification(user.id, plan.notificationType ?? "daily_reminder", message);
    } catch {
      // Ilova ichidagi yozuv muvaffaqiyatsiz bo'lsa ham — boshqa kanallar
      // (agar yuborilgan bo'lsa) baribir foydalanuvchiga yetgan.
    }
    results.push({ userId: user.id, sent: telegramSent || pushSent, message, error: telegramSent || pushSent ? undefined : deliveryError });
  }

  return results;
}
