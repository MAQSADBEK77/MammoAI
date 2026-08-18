import { getAllLinkedTelegramChatIds, getLinkedAdminTelegramChatIds, getSetting, setSetting } from "./db";

// Talks to the Telegram Bot API. The bot's own long-poll loop lives in
// scripts/telegram-bot.mjs (a separate pm2-managed process, run
// independently of the Next.js server) — this module is what the admin
// settings page and the API routes use to read/write the configured bot and
// send one-off messages (reminders).

const TOKEN_KEY = "telegram_bot_token";
const USERNAME_KEY = "telegram_bot_username";

export function isTelegramConfigured(): boolean {
  return Boolean(getSetting(TOKEN_KEY) && getSetting(USERNAME_KEY));
}

export function getTelegramBotUsername(): string | null {
  return getSetting(USERNAME_KEY);
}

export function getTelegramBotToken(): string | null {
  return getSetting(TOKEN_KEY);
}

/** Calls Telegram's getMe to validate a token and discover the bot's own username, then saves both. */
export async function verifyAndSaveTelegramBot(token: string): Promise<string> {
  const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok || !data.result?.username) {
    throw new Error("Bot token noto'g'ri yoki Telegram bilan bog'lanib bo'lmadi.");
  }
  setSetting(TOKEN_KEY, token);
  setSetting(USERNAME_KEY, data.result.username);
  return data.result.username as string;
}

export function disconnectTelegramBot() {
  setSetting(TOKEN_KEY, null);
  setSetting(USERNAME_KEY, null);
}

export async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  const token = getTelegramBotToken();
  if (!token) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Sends the same text to every user who has ever linked the Telegram bot. Used by the admin "broadcast" tool. */
export async function broadcastTelegramMessage(text: string): Promise<{ sent: number; failed: number }> {
  const chatIds = getAllLinkedTelegramChatIds();
  let sent = 0;
  let failed = 0;
  for (const chatId of chatIds) {
    const ok = await sendTelegramMessage(chatId, text);
    if (ok) sent += 1;
    else failed += 1;
  }
  return { sent, failed };
}

/**
 * Notifies every admin who has linked Telegram — used for "something needs
 * your attention" events (new feedback, an unexpected server error). Never
 * throws: a failed/unconfigured bot should never break the caller's own
 * request, so every failure is swallowed here.
 */
export async function notifyAdmins(text: string): Promise<void> {
  if (!isTelegramConfigured()) return;
  try {
    const chatIds = getLinkedAdminTelegramChatIds();
    for (const chatId of chatIds) await sendTelegramMessage(chatId, text);
  } catch {
    // best-effort — see comment above
  }
}
