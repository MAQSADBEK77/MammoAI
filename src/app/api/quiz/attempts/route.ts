import { NextResponse } from "next/server";
import { getAttemptsForUser, getFamilyMemberById, submitAttempt } from "@/server/db";
import { requireUser } from "@/server/session";
import { ApiError, handleApiError } from "@/server/api-utils";

// The current user's own attempt history (not family members' — see
// /api/family-members/[id]/attempts for those).
export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({ attempts: getAttemptsForUser(user.id) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { answers, familyMemberId } = (await request.json()) ?? {};
    if (!Array.isArray(answers) || answers.length === 0) {
      throw new ApiError(400, "Javoblar topilmadi.");
    }
    if (familyMemberId) {
      const member = getFamilyMemberById(familyMemberId);
      if (!member || member.ownerUserId !== user.id) {
        throw new ApiError(403, "Bu profil sizga tegishli emas.");
      }
    }
    const attempt = submitAttempt(user.id, answers, familyMemberId || null);
    return NextResponse.json({ attempt });
  } catch (err) {
    return handleApiError(err);
  }
}
