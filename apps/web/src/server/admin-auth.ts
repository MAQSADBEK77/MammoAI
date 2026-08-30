import { randomBytes, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";
import { ApiError } from "./api-utils";

// Admin panel — oddiy foydalanuvchi sessiyasidan butunlay ALOHIDA autentifikatsiya
// (bitta parol, ADMIN_PASSWORD muhit o'zgaruvchisi). Bu App.pdf spesifikatsiyasida
// yo'q, lekin loyiha egasi uchun boshqaruv paneli — shuning uchun mustaqil, sodda,
// lekin xavfsiz (timing-safe parol solishtirish, imzolangan JWT cookie) qilib qurildi.

export const ADMIN_SESSION_COOKIE = "mammoai_admin_session";
const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 kun

function getAdminSecret(): string {
  // Alohida sir bo'lmasa, mavjud SESSION_SECRET'dan foydalanamiz (u ham tasodifiy
  // va maxfiy) — faqat JWT imzolash uchun, parolning o'zi emas.
  const secret = process.env.ADMIN_SESSION_SECRET ?? process.env.SESSION_SECRET;
  if (!secret) {
    // Ikkalasi ham yo'q bo'lishi amalda deyarli mumkin emas (session.ts SESSION_SECRET'ni
    // avtomatik yaratadi), lekin xavfsizlik uchun tasodifiy qiymat bilan davom etamiz.
    return randomBytes(48).toString("hex");
  }
  return secret;
}

/** Vaqt-hujumiga chidamli parol solishtirish (oddiy `===` emas). */
export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !password) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function signAdminSession(): string {
  return jwt.sign({ role: "admin" }, getAdminSecret(), { expiresIn: ADMIN_SESSION_MAX_AGE_SECONDS });
}

export function verifyAdminSession(token: string): boolean {
  try {
    const decoded = jwt.verify(token, getAdminSecret());
    return typeof decoded === "object" && decoded !== null && (decoded as { role?: string }).role === "admin";
  } catch {
    return false;
  }
}

export const adminSessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  path: "/",
};

/** Admin API route'lari uchun himoya — sessiya bo'lmasa yoki noto'g'ri bo'lsa 401. */
export function requireAdmin(request: NextRequest): void {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token || !verifyAdminSession(token)) {
    throw new ApiError(401, "Admin sessiyasi topilmadi — qayta kiring");
  }
}
