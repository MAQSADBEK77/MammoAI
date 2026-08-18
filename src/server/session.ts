import { cookies } from "next/headers";
import { getUserById, toPublicUser, type UserRow } from "./db";
import { verifySession, SESSION_COOKIE } from "./auth";
import { ApiError } from "./api-utils";
import type { User } from "@/lib/types";

export async function getSessionUserRow(): Promise<UserRow | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = verifySession(token);
  if (!payload) return null;
  const row = getUserById(payload.userId);
  if (!row) return null;
  // A "log out of all devices" bump makes every token signed before it stale.
  if (row.tokenVersion !== payload.tokenVersion) return null;
  return row;
}

export async function getSessionUser(): Promise<User | null> {
  const row = await getSessionUserRow();
  return row ? toPublicUser(row) : null;
}

/** Throws a 401 ApiError if nobody is logged in. */
export async function requireUser(): Promise<UserRow> {
  const row = await getSessionUserRow();
  if (!row) throw new ApiError(401, "Avval tizimga kiring.");
  return row;
}

/** Throws a 401/403 ApiError unless the caller is a logged-in admin (full write access). */
export async function requireAdmin(): Promise<UserRow> {
  const row = await requireUser();
  if (row.role !== "admin") {
    throw new ApiError(403, "Bu amal faqat administrator uchun ruxsat etilgan.");
  }
  return row;
}

/** Admin panel read access — admins and moderators alike. Moderators can view but not change/delete. */
export async function requireAdminOrModerator(): Promise<UserRow> {
  const row = await requireUser();
  if (row.role !== "admin" && row.role !== "moderator") {
    throw new ApiError(403, "Bu amal faqat administrator uchun ruxsat etilgan.");
  }
  return row;
}
