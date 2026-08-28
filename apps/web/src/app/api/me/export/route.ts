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
    const user = requireUser(request);
    return NextResponse.json({
      user,
      onboardingProfile: getOnboardingProfile(user.id),
      cycleSettings: getCycleSettings(user.id),
      cycleLogs: listCycleLogs(user.id, 10000),
      pregnancyProfile: getPregnancyProfile(user.id),
      pregnancyVisits: listPregnancyVisits(user.id),
      checklist: listChecklistItems(user.id),
      exportedAt: new Date().toISOString(),
    });
  } catch (error) {
    return jsonError(error);
  }
}
