import { NextResponse, type NextRequest } from "next/server";
import { jsonError, ApiError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import { resolveCommunityReport, listOpenCommunityReports, logAdminAction } from "@/server/repo";

/** COMM-001: shikoyatni "ko'rib chiqildi" ('resolved') yoki "bekor qilindi"
 * ('dismissed') deb belgilash — mazmunning o'zini o'chirish ALOHIDA, mavjud
 * `/api/admin/community/posts/[id]` (DELETE) orqali amalga oshiriladi. */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const identity = await requireAdmin(request);
    const { id } = await context.params;
    const body = (await request.json()) as { status?: "resolved" | "dismissed" };
    if (body.status !== "resolved" && body.status !== "dismissed") {
      throw new ApiError(400, "Status noto'g'ri");
    }
    await resolveCommunityReport(id, body.status);
    await logAdminAction(identity.adminLabel, "report_" + body.status, id);
    return NextResponse.json({ reports: await listOpenCommunityReports() });
  } catch (error) {
    return jsonError(error);
  }
}
