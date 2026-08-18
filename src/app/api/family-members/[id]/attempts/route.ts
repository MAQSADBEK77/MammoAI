import { NextResponse } from "next/server";
import { getAttemptsForFamilyMember, getFamilyMemberById } from "@/server/db";
import { requireUser } from "@/server/session";
import { ApiError, handleApiError } from "@/server/api-utils";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const member = getFamilyMemberById(id);
    if (!member || member.ownerUserId !== user.id) {
      throw new ApiError(403, "Bu profil sizga tegishli emas.");
    }
    return NextResponse.json({ attempts: getAttemptsForFamilyMember(id) });
  } catch (err) {
    return handleApiError(err);
  }
}
