import { NextResponse, type NextRequest } from "next/server";
import { deleteUser, getOnboardingProfile, updateUser } from "@/server/repo";
import { jsonError, requireUser } from "@/server/api-utils";
import { SESSION_COOKIE } from "@/server/session";
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

/** Play Store "akkauntni o'chirish" talabi — foydalanuvchi o'zi va barcha
 * ma'lumotlarini (tsikl, homiladorlik, jamiyat postlari, hamkorlik...) bir
 * bosishda butunlay o'chira oladi (repo.ts:deleteUser — CASCADE orqali). */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser(request);
    await deleteUser(user.id);
    const res = NextResponse.json({ ok: true });
    res.cookies.delete(SESSION_COOKIE);
    return res;
  } catch (error) {
    return jsonError(error);
  }
}
