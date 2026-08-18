import { NextResponse } from "next/server";
import { createFamilyMember, getFamilyMembers } from "@/server/db";
import { requireUser } from "@/server/session";
import { ApiError, handleApiError } from "@/server/api-utils";

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({ members: getFamilyMembers(user.id) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { firstName, lastName, relation, birthDate } = (await request.json()) ?? {};
    if (!firstName?.trim()) {
      throw new ApiError(400, "Ismni kiriting.");
    }
    const member = createFamilyMember({
      ownerUserId: user.id,
      firstName: firstName.trim(),
      lastName: lastName?.trim() ?? "",
      relation: relation?.trim() ?? "",
      birthDate: birthDate || null,
    });
    return NextResponse.json({ member });
  } catch (err) {
    return handleApiError(err);
  }
}
