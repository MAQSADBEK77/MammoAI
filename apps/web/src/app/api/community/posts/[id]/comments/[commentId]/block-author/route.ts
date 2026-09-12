import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { blockCommunityCommentAuthor } from "@/server/repo";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string; commentId: string }> }) {
  try {
    const user = await requireUser(request);
    const { commentId } = await context.params;
    await blockCommunityCommentAuthor(user.id, commentId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
