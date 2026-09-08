import { getSetting, setSetting } from "./repo";
import { ApiError } from "./api-utils";

// Telegram Bot API bilan ishlash — token .env'da EMAS, `app_settings` jadvalida
// saqlanadi (admin panel orqali qayta deploy qilmasdan o'zgartirish mumkin
// bo'lishi uchun, foydalanuvchi so'rovi). Username esa tokendan `getMe` orqali
// avtomatik aniqlanadi va keshlanadi (chuqur havola — t.me/<username> — yasash
// uchun kerak).

const SETTING_TOKEN = "telegram_bot_token";
const SETTING_USERNAME = "telegram_bot_username";

export async function getTelegramBotToken(): Promise<string | null> {
  return getSetting(SETTING_TOKEN);
}

export async function getTelegramBotUsername(): Promise<string | null> {
  return getSetting(SETTING_USERNAME);
}

/** Har qanday Telegram Bot API metodini chaqiradi (joriy saqlangan token bilan). */
export async function callTelegramApi<T = unknown>(method: string, body?: Record<string, unknown>, tokenOverride?: string): Promise<T> {
  const token = tokenOverride ?? (await getTelegramBotToken());
  if (!token) throw new ApiError(500, "Telegram bot tokeni sozlanmagan — avval admin paneldan qo'shing");
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const json = (await res.json().catch(() => null)) as { ok: boolean; result?: T; description?: string } | null;
  if (!json?.ok) {
    throw new ApiError(500, json?.description ?? "Telegram API so'rovi muvaffaqiyatsiz tugadi");
  }
  return json.result as T;
}

export async function sendTelegramMessage(chatId: string, text: string, replyMarkup?: Record<string, unknown>): Promise<void> {
  await callTelegramApi("sendMessage", { chat_id: chatId, text, reply_markup: replyMarkup });
}

const BROADCAST_BATCH_SIZE = 20;
const BROADCAST_BATCH_DELAY_MS = 1000;

/** Admin panel — "hammaga xabar yuborish" (repo.ts#listTelegramBroadcastChatIds
 * ro'yxatiga). Ketma-ket emas, kichik partiyalarda (Telegram'ning umumiy
 * ~30/soniya chegarasidan xavfsiz pastda) — bitta bloklangan/o'chirilgan
 * chat butun jarayonni to'xtatmasligi uchun har bir yuborish alohida
 * xato ushlanadi (`Promise.allSettled`). */
export async function broadcastTelegramMessage(chatIds: string[], text: string): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < chatIds.length; i += BROADCAST_BATCH_SIZE) {
    const batch = chatIds.slice(i, i + BROADCAST_BATCH_SIZE);
    const results = await Promise.allSettled(batch.map((chatId) => sendTelegramMessage(chatId, text)));
    for (const result of results) {
      if (result.status === "fulfilled") sent++;
      else failed++;
    }
    if (i + BROADCAST_BATCH_SIZE < chatIds.length) {
      await new Promise((resolve) => setTimeout(resolve, BROADCAST_BATCH_DELAY_MS));
    }
  }
  return { sent, failed };
}

/** "Telefon raqamimni ulashish" tugmasi bilan klaviatura — foydalanuvchi
 * bosganda Telegram o'zi (haqiqiy, hisobga bog'langan) raqamni yuboradi. */
export function requestContactKeyboard(buttonText: string): Record<string, unknown> {
  return {
    keyboard: [[{ text: buttonText, request_contact: true }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  };
}

export function removeKeyboard(): Record<string, unknown> {
  return { remove_keyboard: true };
}

/** Xabar ostida "Ilovani ochish" tugmasi — bosilganda Mini App'ni (`url`)
 * to'g'ridan-to'g'ri ochadi (Telegram Bot API'ning `web_app` tugma turi). */
export function miniAppInlineKeyboard(buttonText: string, url: string): Record<string, unknown> {
  return { inline_keyboard: [[{ text: buttonText, web_app: { url } }]] };
}

interface TelegramBotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
}

/**
 * Chat oynasining pastki qismida, xabar yozish maydoni yonida doimiy ko'rinib
 * turadigan tugma (foydalanuvchi so'rovi — Telegram'ning "Menu Button"
 * funksiyasi, boshqa botlarda "Поиск" kabi matnli tugma sifatida ko'rinishi
 * mumkin). `chat_id` berilmasa — HAMMA foydalanuvchi uchun standart bo'lib
 * o'rnatiladi (alohida har bir chat uchun sozlash shart emas). Bosilganda
 * Mini App'ni (`/tg`) to'g'ridan-to'g'ri ochadi — "Start" bosish yoki biror
 * buyruq yozish shart emas.
 */
export async function setTelegramMenuButton(text: string, url: string, tokenOverride?: string): Promise<void> {
  await callTelegramApi("setChatMenuButton", { menu_button: { type: "web_app", text, web_app: { url } } }, tokenOverride);
}

/**
 * Yangi token saqlanganda chaqiriladi — tokenni tekshiradi (getMe), username'ni
 * keshlaydi, webhook'ni bizning API manzilimizga o'rnatadi VA pastki
 * "Menu Button"ni Mini App'ga ulaydi (foydalanuvchi qo'lda hech narsa
 * qilishi shart emas).
 */
export async function setTelegramBotToken(token: string, publicBaseUrl: string): Promise<TelegramBotInfo> {
  const info = await callTelegramApi<TelegramBotInfo>("getMe", undefined, token);
  await setSetting(SETTING_TOKEN, token);
  await setSetting(SETTING_USERNAME, info.username);
  await callTelegramApi("setWebhook", { url: `${publicBaseUrl}/api/telegram/webhook` }, token);
  await setTelegramMenuButton("📲 Ilovani ochish", `${publicBaseUrl}/tg`, token);
  return info;
}

export async function getTelegramBotDescription(): Promise<string> {
  const result = await callTelegramApi<{ description: string }>("getMyDescription");
  return result.description;
}

export async function getTelegramBotShortDescription(): Promise<string> {
  const result = await callTelegramApi<{ short_description: string }>("getMyShortDescription");
  return result.short_description;
}

export async function setTelegramBotName(name: string): Promise<void> {
  await callTelegramApi("setMyName", { name });
}

export async function setTelegramBotDescription(description: string): Promise<void> {
  await callTelegramApi("setMyDescription", { description });
}

export async function setTelegramBotShortDescription(shortDescription: string): Promise<void> {
  await callTelegramApi("setMyShortDescription", { short_description: shortDescription });
}
