import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import { deleteCommunityCommentAdmin } from "@/server/repo";

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string; commentId: string }> }) {
  try {
    requireAdmin(request);
    const { id, commentId } = await context.params;
    await deleteCommunityCommentAdmin(id, commentId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
