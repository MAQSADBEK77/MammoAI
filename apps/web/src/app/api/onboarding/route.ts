import { NextResponse, type NextRequest } from "next/server";
import type { OnboardingProfile } from "@mammoai/shared";
import { jsonError, requireUser } from "@/server/api-utils";
import { getOnboardingProfile, saveOnboardingProfile, updateUser } from "@/server/repo";
import { syncChecklistForUser } from "@/server/checklist-sync";

type OnboardingBody = Omit<OnboardingProfile, "userId"> & { notificationsEnabled: boolean };

/**
 * Onboarding so'rovnomasini yakunlaydi — App.pdf §2 bo'yicha akkaunt allaqachon
 * `/api/auth/start`da yaratilgan/topilgan, bu route faqat profilni to'ldiradi.
 */
export async function POST(request: NextRequest) {
  try {
    const user = requireUser(request);
    const body = (await request.json()) as OnboardingBody;
    if (!body.age || body.age < 13 || body.age > 100) {
      return NextResponse.json({ error: "Yosh noto'g'ri kiritildi (kamida 13 bo'lishi kerak)" }, { status: 400 });
    }

    const profile: OnboardingProfile = { userId: user.id, ...body };
    saveOnboardingProfile(profile);
    updateUser(user.id, { name: body.name, notificationsEnabled: body.notificationsEnabled });
    syncChecklistForUser(user.id);

    return NextResponse.json({
      user: { ...user, name: body.name, notificationsEnabled: body.notificationsEnabled },
      onboardingProfile: getOnboardingProfile(user.id),
    });
  } catch (error) {
    return jsonError(error);
  }
}
