import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "./session";
import { getUserById } from "./repo";
import type { User } from "@mammoai/shared";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function jsonError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return NextResponse.json({ error: "Serverda kutilmagan xatolik" }, { status: 500 });
}

/** Cookie (veb) yoki "Authorization: Bearer" (mobil) orqali joriy foydalanuvchini oladi. */
export async function getAuthenticatedUser(request: NextRequest): Promise<(User & { tokenVersion: number }) | null> {
  let token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) token = authHeader.slice("Bearer ".length);
  }
  if (!token) return null;

  const payload = verifySession(token);
  if (!payload) return null;

  const user = await getUserById(payload.sub);
  if (!user || user.tokenVersion !== payload.tokenVersion) return null;
  return user;
}

export async function requireUser(request: NextRequest): Promise<User & { tokenVersion: number }> {
  const user = await getAuthenticatedUser(request);
  if (!user) throw new ApiError(401, "Sessiya topilmadi — onboarding'dan qayta o'ting");
  return user;
}
