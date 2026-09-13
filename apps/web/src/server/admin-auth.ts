import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";
import { ApiError } from "./api-utils";
import { adminUserExistsById } from "./repo";

// Admin panel — oddiy foydalanuvchi sessiyasidan butunlay ALOHIDA autentifikatsiya.
// ADMIN-001: ilgari bitta umumiy parol (ADMIN_PASSWORD) — kim nima qilgani
// aniqlanmasdi. Endi har bir admin o'z email+paroli bilan kiradi (repo.ts:
// admin_users jadvali), harakatlar admin_audit_log'ga yoziladi. ADMIN_PASSWORD
// ATAYLAB o'chirilmaydi — "root" (favqulodda kirish) sifatida saqlanadi, shunda
// admin_users jadvali bo'sh/hisob unutilgan holatda ham kirish imkoniyati
// yo'qolmaydi.

export const ADMIN_SESSION_COOKIE = "mammoai_admin_session";
const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 kun
const ROOT_ADMIN_LABEL = "Root (umumiy parol)";

export interface AdminIdentity {
  /** `null` — "root" (ADMIN_PASSWORD) orqali kirilgan, haqiqiy admin_users yozuvi yo'q. */
  adminId: string | null;
  adminLabel: string;
}

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

/** Vaqt-hujumiga chidamli parol solishtirish (oddiy `===` emas) — faqat "root" login uchun. */
export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !password) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Alohida admin hisoblari uchun parol xeshi — yangi dependency (bcrypt)
 * qo'shmaslik uchun Node'ning o'z `scrypt`idan foydalanamiz. Format:
 * `<tuz>:<xesh>`, ikkalasi ham hex. */
export function hashAdminPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyAdminPasswordHash(password: string, stored: string): boolean {
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const candidate = scryptSync(password, salt, 64);
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

export function signAdminSession(identity: AdminIdentity): string {
  return jwt.sign({ role: "admin", ...identity }, getAdminSecret(), { expiresIn: ADMIN_SESSION_MAX_AGE_SECONDS });
}

/** "Root" (ADMIN_PASSWORD) sessiyasi uchun qulay yordamchi. */
export function signRootAdminSession(): string {
  return signAdminSession({ adminId: null, adminLabel: ROOT_ADMIN_LABEL });
}

/** FIX-10: ADMIN-001'dan OLDIN chiqarilgan sessiyalarda `adminLabel` maydoni
 * umuman yo'q edi ({role:"admin"} formatida, 7 kungacha amal qiladi). Bunday
 * eski formatdagi (lekin imzosi haqiqiy) token ilgari HAM to'liq admin
 * huquqi berardi — shuning uchun uni endi ROOT_ADMIN_LABEL'ga fallback qilib
 * qabul qilish xavfsizlikni PASAYTIRMAYDI (eski ishonch darajasi bilan bir
 * xil), faqat foydalanuvchini ogohlantirishsiz 401'ga chiqarib
 * yubormaslikni ta'minlaydi — keyingi qayta kirishda yangi (adminLabel'li)
 * sessiya normal chiqariladi. */
export function verifyAdminSession(token: string): AdminIdentity | null {
  try {
    const decoded = jwt.verify(token, getAdminSecret());
    if (typeof decoded !== "object" || decoded === null) return null;
    const payload = decoded as { role?: string; adminId?: string | null; adminLabel?: string };
    if (payload.role !== "admin") return null;
    if (typeof payload.adminLabel === "string") {
      return { adminId: payload.adminId ?? null, adminLabel: payload.adminLabel };
    }
    return { adminId: null, adminLabel: ROOT_ADMIN_LABEL };
  } catch {
    return null;
  }
}

export const adminSessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  path: "/",
};

/** Admin API route'lari uchun himoya — sessiya bo'lmasa yoki noto'g'ri bo'lsa 401.
 * Kim ekanini qaytaradi — audit-jurnalga yozish kerak bo'lgan route'lar shundan
 * foydalanadi.
 *
 * FIX-03: ilgari faqat JWT imzosi tekshirilardi, admin_users jadvalida hisob
 * hali mavjudligi TEKSHIRILMASDI — o'chirilgan adminning eski sessiya
 * cookie'si (7 kungacha amal qiladi) hali ham to'liq huquq berardi.
 * Endi async — barcha chaqiruvchi joylar `await requireAdmin(request)`ga
 * o'tkazildi (requireUser'dagi bilan bir xil pattern). "Root" (adminId: null)
 * sessiyalar admin_users'da yozuvga ega emas — ular uchun bu tekshiruv
 * o'tkazib yuboriladi (ADMIN_PASSWORD hali ham to'g'ridan-to'g'ri kirish). */
export async function requireAdmin(request: NextRequest): Promise<AdminIdentity> {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const identity = token ? verifyAdminSession(token) : null;
  if (!identity) {
    throw new ApiError(401, "Admin sessiyasi topilmadi — qayta kiring");
  }
  if (identity.adminId && !(await adminUserExistsById(identity.adminId))) {
    throw new ApiError(401, "Admin hisobingiz o'chirilgan — qayta kiring");
  }
  return identity;
}
