import { cookies } from "next/headers";
import { getUserById, toPublicUser, type UserRow } from "./db";
import { verifySession, SESSION_COOKIE } from "./auth";
import { ApiError } from "./api-utils";
import type { User } from "@/lib/types";

export async function getSessionUserRow(): Promise<UserRow | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const userId = verifySession(token);
  if (!userId) return null;
  return getUserById(userId) ?? null;
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

/** Throws a 401/403 ApiError unless the caller is a logged-in admin. */
export async function requireAdmin(): Promise<UserRow> {
  const row = await requireUser();
  if (row.role !== "admin") {
    throw new ApiError(403, "Bu amal faqat administrator uchun ruxsat etilgan.");
  }
  return row;
}
