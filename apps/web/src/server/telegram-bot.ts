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

export async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
  await callTelegramApi("sendMessage", { chat_id: chatId, text });
}

interface TelegramBotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
}

/**
 * Yangi token saqlanganda chaqiriladi — tokenni tekshiradi (getMe), username'ni
 * keshlaydi va webhook'ni bizning API manzilimizga o'rnatadi (foydalanuvchi
 * qo'lda hech narsa qilishi shart emas).
 */
export async function setTelegramBotToken(token: string, publicBaseUrl: string): Promise<TelegramBotInfo> {
  const info = await callTelegramApi<TelegramBotInfo>("getMe", undefined, token);
  await setSetting(SETTING_TOKEN, token);
  await setSetting(SETTING_USERNAME, info.username);
  await callTelegramApi("setWebhook", { url: `${publicBaseUrl}/api/telegram/webhook` }, token);
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
