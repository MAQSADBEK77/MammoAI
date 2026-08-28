import { NextResponse, type NextRequest } from "next/server";
import type { OnboardingProfile } from "@mammoai/shared";
import { jsonError } from "@/server/api-utils";
import { createAnonymousUser, saveOnboardingProfile, getUserById } from "@/server/repo";
import { signSession, SESSION_COOKIE, sessionCookieOptions } from "@/server/session";
import { syncChecklistForUser } from "@/server/checklist-sync";

interface OnboardingBody {
  age: number;
  isPregnant: boolean;
  cycleRegularity: OnboardingProfile["cycleRegularity"];
  familyHistory: boolean;
  lastCheckup: OnboardingProfile["lastCheckup"];
  primaryGoal: OnboardingProfile["primaryGoal"];
  language: "uz" | "ru";
}

/**
 * Onboarding so'rovnomasi tugagach chaqiriladi — anonim foydalanuvchi va sessiya shu
 * yerda yaratiladi (spec: "User anonim bo'lishi mumkin", onboarding parolsiz, ~2 daqiqa).
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as OnboardingBody;
    if (!body.age || body.age < 10 || body.age > 100) {
      return NextResponse.json({ error: "Yosh noto'g'ri kiritildi" }, { status: 400 });
    }

    const { user, tokenVersion } = createAnonymousUser(body.language ?? "uz");

    const profile: OnboardingProfile = {
      userId: user.id,
      age: body.age,
      isPregnant: !!body.isPregnant,
      cycleRegularity: body.cycleRegularity,
      familyHistory: !!body.familyHistory,
      lastCheckup: body.lastCheckup,
      primaryGoal: body.primaryGoal,
    };
    saveOnboardingProfile(profile);
    syncChecklistForUser(user.id);

    const token = signSession({ sub: user.id, tokenVersion });
    const freshUser = getUserById(user.id)!;

    const res = NextResponse.json({
      user: freshUser,
      onboardingProfile: profile,
      token, // mobil shu tokenni SecureStore'ga saqlaydi
    });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return res;
  } catch (error) {
    return jsonError(error);
  }
}
