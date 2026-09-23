import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import jwt from "jsonwebtoken";

// Anonim-birinchi sessiya — spec: "User anonim bo'lishi mumkin", onboarding parolsiz.
// Web'da httpOnly cookie, mobilda "Authorization: Bearer" tokeni orqali (bitta backend,
// ikkala platforma ham shu tokendan foydalanadi).

export const SESSION_COOKIE = "mammoai_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 yil — anonim hisob uzoq yashaydi

function ensureSessionSecret(): string {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;

  // SESSION-SECRET-01: production'da bu holat JIDDIY nosozlik, lekin ilgari
  // butunlay jim o'tardi. Oqibati: har bir server nusxasi o'z TASODIFIY
  // sirini yaratadi, ya'ni
  //   • har deployda hamma foydalanuvchi tizimdan chiqib ketadi;
  //   • deploysiz ham chiqib ketadi — bir nusxa imzolagan cookie'ni
  //     boshqa nusxa rad etadi (yuklama bir necha nusxaga taqsimlanadi).
  //
  // ATAYLAB `throw` QILINMAYDI: agar o'zgaruvchi hozir qo'yilmagan bo'lsa,
  // xato tashlash butun saytni darhol o'chirib qo'yardi — ya'ni tuzatish
  // muammodan battar bo'lardi. Buning o'rniga baland ovozda log yoziladi
  // va holat /api/version orqali tashqaridan ko'rinadi.
  if (process.env.NODE_ENV === "production") {
    console.error(
      "[SESSION-SECRET-01] JIDDIY: SESSION_SECRET muhit o'zgaruvchisi qo'yilmagan. " +
        "Har bir server nusxasi tasodifiy sir yaratadi — foydalanuvchilar tizimdan " +
        "o'z-o'zidan chiqib ketadi. Vercel → Settings → Environment Variables'ga qo'shing."
    );
  }

  const envPath = path.join(process.cwd(), ".env.local");
  const generated = randomBytes(48).toString("hex");

  try {
    const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
    if (!/^SESSION_SECRET=/m.test(existing)) {
      const prefix = existing && !existing.endsWith("\n") ? "\n" : "";
      fs.writeFileSync(
        envPath,
        `${existing}${prefix}# Avtomatik yaratilgan — sirni saqlang, commit qilmang.\nSESSION_SECRET=${generated}\n`
      );
    }
  } catch {
    // Faylga yozib bo'lmadi (masalan faqat-o'qish fayl tizimi) — xotiradagi qiymat bilan
    // davom etamiz. Sessiyalar server qayta ishga tushganda saqlanmaydi.
  }

  process.env.SESSION_SECRET = process.env.SESSION_SECRET ?? generated;
  return process.env.SESSION_SECRET;
}

const SECRET = ensureSessionSecret();

export interface SessionPayload {
  sub: string; // user id
  tokenVersion: number;
}

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: SESSION_MAX_AGE_SECONDS });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, SECRET);
    if (typeof decoded === "string") return null;
    if (typeof decoded.sub !== "string" || typeof decoded.tokenVersion !== "number") return null;
    return { sub: decoded.sub, tokenVersion: decoded.tokenVersion };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: SESSION_MAX_AGE_SECONDS,
  path: "/",
};
