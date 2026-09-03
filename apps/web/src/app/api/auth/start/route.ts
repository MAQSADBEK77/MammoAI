import { NextResponse, type NextRequest } from "next/server";
import type { Language } from "@mammoai/shared";
import { jsonError } from "@/server/api-utils";
import { createUserWithIdentifier, findUserByIdentifier, getOnboardingProfile } from "@/server/repo";
import { signSession, SESSION_COOKIE, sessionCookieOptions } from "@/server/session";

interface AuthStartBody {
  identifier: string;
  language: Language;
}

const PHONE_RE = /^\+?[0-9][0-9\s-]{6,14}$/;

/**
 * Akkaunt yaratish yoki mavjudiga kirish — faqat telefon raqam orqali (email
 * qo'llab-quvvatlanmaydi), SMS-kod yoki parol yo'q (tez, lekin ongli ravishda
 * past xavfsizlik).
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AuthStartBody;
    const identifier = body.identifier?.trim();

    if (!identifier || !PHONE_RE.test(identifier)) {
      return NextResponse.json({ error: "To'g'ri telefon raqam kiriting" }, { status: 400 });
    }

    const existing = await findUserByIdentifier(identifier);
    const { user, tokenVersion } = existing
      ? { user: existing, tokenVersion: existing.tokenVersion }
      : await createUserWithIdentifier(identifier, body.language ?? "uz");

    const token = signSession({ sub: user.id, tokenVersion });
    const res = NextResponse.json({
      user,
      onboardingProfile: await getOnboardingProfile(user.id),
      token,
      isNewAccount: !existing,
    });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return res;
  } catch (error) {
    return jsonError(error);
  }
}
