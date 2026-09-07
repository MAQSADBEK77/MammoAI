// Kunlik eslatmalar — Telegram bog'langan foydalanuvchilarga bot orqali (+
// ilova ichidagi bildirishnoma) yuboriladi. Vercel Cron orqali kuniga bir marta
// chaqiriladi (apps/web/src/app/api/cron/daily-reminders/route.ts, vercel.json).
//
// MUHIM QOIDA: faqat MAZMUNLI bo'lganda yuboriladi — har kuni bir xil xabar
// bilan zerikarli qilib yubormaslik uchun (foydalanuvchi so'rovi bilan
// kelishilgan). Ustuvorlik: hayz/unumdor kun yaqinlashgani > bugun hali
// belgilanmagani. Ikkalasi ham yo'q bo'lsa — hech narsa yuborilmaydi.

import { deriveAdaptiveCycleSettings, dictionaries, predictCycle } from "@mammoai/shared";
import type { Language } from "@mammoai/shared";
import { createSystemNotification, getCycleSettings, hasLoggedToday, listCycleLogs, listUsersForDailyReminders } from "./repo";
import { sendTelegramMessage } from "./telegram-bot";

const PERIOD_SOON_DAYS_AHEAD = 2; // shuncha kun (yoki kamroq) qolganda "yaqinlashmoqda" xabari beriladi

async function buildReminderMessage(userId: string, language: Language): Promise<string | null> {
  const dict = dictionaries[language];
  const [loggedToday, settings, logs] = await Promise.all([
    hasLoggedToday(userId),
    getCycleSettings(userId),
    listCycleLogs(userId, 365),
  ]);

  const adaptive = deriveAdaptiveCycleSettings(logs, settings);
  const prediction = adaptive ? predictCycle(adaptive) : null;

  if (prediction) {
    const today = new Date().toISOString().slice(0, 10);
    if (prediction.daysUntilNextPeriod === 0) return dict.reminders.periodToday;
    if (prediction.daysUntilNextPeriod === 1) return dict.reminders.periodTomorrow;
    if (prediction.daysUntilNextPeriod > 1 && prediction.daysUntilNextPeriod <= PERIOD_SOON_DAYS_AHEAD) {
      return dict.reminders.periodSoon(prediction.daysUntilNextPeriod);
    }
    if (today >= prediction.fertileWindowStart && today <= prediction.fertileWindowEnd) {
      return dict.reminders.fertileWindow;
    }
  }

  if (!loggedToday) return dict.reminders.logToday;
  return null;
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
    let message: string | null = null;
    try {
      message = await buildReminderMessage(user.id, user.language);
    } catch (error) {
      results.push({ userId: user.id, sent: false, message: null, error: `build: ${error instanceof Error ? error.message : String(error)}` });
      continue;
    }
    if (!message) {
      results.push({ userId: user.id, sent: false, message: null });
      continue;
    }

    let telegramSent = false;
    let telegramError: string | undefined;
    try {
      await sendTelegramMessage(user.telegramUserId, message);
      telegramSent = true;
    } catch (error) {
      telegramError = error instanceof Error ? error.message : String(error);
    }
    try {
      await createSystemNotification(user.id, "daily_reminder", message);
    } catch {
      // Ilova ichidagi yozuv muvaffaqiyatsiz bo'lsa ham — bot xabari
      // (agar yuborilgan bo'lsa) baribir foydalanuvchiga yetgan.
    }
    results.push({ userId: user.id, sent: telegramSent, message, error: telegramError });
  }

  return results;
}
