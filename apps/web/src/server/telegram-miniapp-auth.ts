import { createHmac, timingSafeEqual } from "node:crypto";
import { ApiError } from "./api-utils";
import { getTelegramBotToken } from "./telegram-bot";

// Telegram Mini App autentifikatsiyasi — client `window.Telegram.WebApp.initData`
// (query-string ko'rinishidagi imzolangan foydalanuvchi ma'lumoti) yuboradi, biz
// buni bot tokenimiz bilan HMAC-SHA256 orqali tasdiqlaymiz. Algoritm rasmiy
// hujjatdan: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
//
// Bot tokeni env o'zgaruvchisidan EMAS — admin panelda saqlangan (app_settings,
// server/telegram-bot.ts:getTelegramBotToken) — chaqiruvchi shu funksiyaga uzatadi.

export interface TelegramInitDataUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

/**
 * `initData`ni tasdiqlaydi va ichidagi foydalanuvchi ma'lumotini qaytaradi.
 * Imzo noto'g'ri, `auth_date` juda eski (standart — 24 soat) yoki `user` maydoni
 * yo'q bo'lsa `null` qaytadi.
 */
export function verifyTelegramInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds = 60 * 60 * 24
): TelegramInitDataUser | null {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(initData);
  } catch {
    return null;
  }

  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const computedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  const computedBuf = Buffer.from(computedHash, "hex");
  const givenBuf = Buffer.from(hash, "hex");
  if (computedBuf.length !== givenBuf.length || !timingSafeEqual(computedBuf, givenBuf)) return null;

  const authDate = Number(params.get("auth_date"));
  if (!authDate || Date.now() / 1000 - authDate > maxAgeSeconds) return null;

  const userJson = params.get("user");
  if (!userJson) return null;
  try {
    const user = JSON.parse(userJson) as TelegramInitDataUser;
    return typeof user.id === "number" ? user : null;
  } catch {
    return null;
  }
}

/** API route'lar uchun qulaylik — bot tokenini o'zi oladi va tasdiqlaydi,
 * muvaffaqiyatsiz bo'lsa aniq xato bilan `ApiError` tashlaydi. */
export async function requireVerifiedTelegramUser(initData: string | undefined): Promise<TelegramInitDataUser> {
  if (!initData) throw new ApiError(400, "initData yo'q — bu sahifa faqat Telegram Mini App ichida ishlaydi");
  const botToken = await getTelegramBotToken();
  if (!botToken) throw new ApiError(500, "Telegram bot sozlanmagan — admin panelda token qo'shing");
  const tgUser = verifyTelegramInitData(initData, botToken);
  if (!tgUser) throw new ApiError(401, "Telegram ma'lumoti tasdiqlanmadi");
  return tgUser;
}
