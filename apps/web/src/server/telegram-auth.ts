import { createHmac, timingSafeEqual } from "node:crypto";

// Telegram Mini App autentifikatsiyasi — client `window.Telegram.WebApp.initData`
// (query-string ko'rinishidagi imzolangan foydalanuvchi ma'lumoti) yuboradi, biz
// buni bot tokenimiz bilan HMAC-SHA256 orqali tasdiqlaymiz. Algoritm rasmiy
// hujjatdan: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app

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
