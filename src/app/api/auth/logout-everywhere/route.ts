import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { bumpTokenVersion, toPublicUser, getUserById } from "@/server/db";
import { signSession, sessionCookieOptions, SESSION_COOKIE } from "@/server/auth";
import { requireUser } from "@/server/session";
import { handleApiError } from "@/server/api-utils";

// Invalidates every session token issued before now (see token_version in
// server/db.ts / server/auth.ts), then immediately re-issues a fresh one for
// THIS session so the person who clicked the button isn't logged out too.
export async function POST() {
  try {
    const user = await requireUser();
    const newVersion = bumpTokenVersion(user.id);
    const fresh = getUserById(user.id)!;

    const token = signSession(fresh.id, newVersion);
    const store = await cookies();
    store.set(SESSION_COOKIE, token, sessionCookieOptions);

    return NextResponse.json({ user: toPublicUser(fresh) });
  } catch (err) {
    return handleApiError(err);
  }
}
