import { NextResponse } from "next/server";
import { getAttemptsForUser, getFamilyMembers, getSelfExamMonths, toPublicUser } from "@/server/db";
import { requireUser } from "@/server/session";
import { handleApiError } from "@/server/api-utils";

// "Download my data" — everything this account owns, as one JSON file.
// No admin involvement; a user can only ever export their own data.
export async function GET() {
  try {
    const user = await requireUser();
    const payload = {
      exportedAt: new Date().toISOString(),
      profile: toPublicUser(user),
      attempts: getAttemptsForUser(user.id),
      familyMembers: getFamilyMembers(user.id),
      selfExamMonths: getSelfExamMonths(user.id),
    };
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="mammoai-malumotlarim.json"`,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
