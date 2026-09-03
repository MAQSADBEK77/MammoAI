import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { deleteCommunityPost } from "@/server/repo";

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    await deleteCommunityPost(user.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
