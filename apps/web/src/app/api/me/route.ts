import { NextResponse, type NextRequest } from "next/server";
import { getOnboardingProfile, updateUser } from "@/server/repo";
import { jsonError, requireUser } from "@/server/api-utils";
import type { User } from "@mammoai/shared";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    return NextResponse.json({ user, onboardingProfile: await getOnboardingProfile(user.id) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const patch = (await request.json()) as Partial<
      Pick<User, "name" | "phone" | "language" | "fontScale" | "highContrast" | "notificationsEnabled" | "avatarUrl">
    >;
    const updated = await updateUser(user.id, patch);
    return NextResponse.json({ user: updated, onboardingProfile: await getOnboardingProfile(user.id) });
  } catch (error) {
    return jsonError(error);
  }
}
