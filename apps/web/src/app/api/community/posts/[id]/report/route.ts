import { NextResponse, type NextRequest } from "next/server";
import type { CommunityReportReason } from "@mammoai/shared";
import { jsonError, requireUser, ApiError } from "@/server/api-utils";
import { createCommunityReport } from "@/server/repo";

const VALID_REASONS: CommunityReportReason[] = ["spam", "harassment", "misinformation", "medical_emergency", "other"];

/** COMM-001: postni shikoyat qilish — postning o'zi o'chirilmaydi, faqat
 * admin moderatsiya navbatiga tushadi. */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    const body = (await request.json()) as { reason?: CommunityReportReason; note?: string };
    if (!body.reason || !VALID_REASONS.includes(body.reason)) {
      throw new ApiError(400, "Shikoyat sababi noto'g'ri");
    }
    await createCommunityReport(user.id, { targetType: "post", postId: id, reason: body.reason, note: body.note?.trim() || null });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
