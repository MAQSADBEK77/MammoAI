import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import {
  getCycleSettings,
  getOnboardingProfile,
  getPregnancyProfile,
  listChecklistItems,
  listCycleLogs,
  listPregnancyVisits,
} from "@/server/repo";

/** Profil §6 "Ma'lumotlarni eksport qilish" — foydalanuvchi o'z ma'lumotlarini JSON holda oladi. */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const [onboardingProfile, cycleSettings, cycleLogs, pregnancyProfile, pregnancyVisits, checklist] = await Promise.all([
      getOnboardingProfile(user.id),
      getCycleSettings(user.id),
      listCycleLogs(user.id, 10000),
      getPregnancyProfile(user.id),
      listPregnancyVisits(user.id),
      listChecklistItems(user.id),
    ]);
    return NextResponse.json({
      user,
      onboardingProfile,
      cycleSettings,
      cycleLogs,
      pregnancyProfile,
      pregnancyVisits,
      checklist,
      exportedAt: new Date().toISOString(),
    });
  } catch (error) {
    return jsonError(error);
  }
}
