import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { deleteCommunityComment } from "@/server/repo";

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string; commentId: string }> }) {
  try {
    const user = await requireUser(request);
    const { id, commentId } = await context.params;
    await deleteCommunityComment(user.id, id, commentId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
