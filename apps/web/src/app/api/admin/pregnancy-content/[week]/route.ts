import { NextResponse, type NextRequest } from "next/server";
import { jsonError, ApiError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import { upsertPregnancyWeekContent, logAdminAction } from "@/server/repo";

export async function PATCH(request: NextRequest, context: { params: Promise<{ week: string }> }) {
  try {
    const identity = requireAdmin(request);
    const { week } = await context.params;
    const weekNum = Number(week);
    if (!Number.isInteger(weekNum) || weekNum < 1 || weekNum > 42) throw new ApiError(400, "Hafta 1-42 oralig'ida bo'lishi kerak");

    const body = (await request.json()) as { sizeLabel?: string; babyDevelopment?: string; motherChanges?: string };
    const sizeLabel = body.sizeLabel?.trim();
    const babyDevelopment = body.babyDevelopment?.trim();
    const motherChanges = body.motherChanges?.trim();
    if (!sizeLabel || !babyDevelopment || !motherChanges) throw new ApiError(400, "Barcha maydonlar to'ldirilishi kerak");

    const content = await upsertPregnancyWeekContent(weekNum, { sizeLabel, babyDevelopment, motherChanges });
    await logAdminAction(identity.adminLabel, "pregnancy_content_updated", `hafta=${weekNum}`);
    return NextResponse.json({ content });
  } catch (error) {
    return jsonError(error);
  }
}
