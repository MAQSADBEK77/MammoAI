import { NextResponse, type NextRequest } from "next/server";
import { ApiError, jsonError, requireUser } from "@/server/api-utils";
import { createArticleComment, deleteArticleComment, listArticleComments } from "@/server/repo";

const MAX_COMMENT_LENGTH = 1000;
const MIN_COMMENT_LENGTH = 2;

/** CONTENT-02: maqola ostidagi izohlar. Ro'yxat ham autentifikatsiya talab
 * qiladi — `isMine` bayrog'i uchun kim so'rayotganini bilish kerak. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    return NextResponse.json({ comments: await listArticleComments(id, user.id) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const body = (await request.json()) as { body?: string; isAnonymous?: boolean };
    const text = body.body?.trim() ?? "";

    if (text.length < MIN_COMMENT_LENGTH) throw new ApiError(400, "Izoh juda qisqa", "post_too_short");
    if (text.length > MAX_COMMENT_LENGTH) throw new ApiError(400, "Izoh juda uzun", "message_too_long");
    const comment = await createArticleComment(id, user.id, { body: text, isAnonymous: body.isAnonymous === true });
    return NextResponse.json({ comment });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const commentId = request.nextUrl.searchParams.get("commentId");
    if (!commentId) throw new ApiError(400, "Izoh identifikatori berilmagan");
    // Faqat o'z izohini — shart repo qatlamidagi SQL'da ham takrorlangan.
    await deleteArticleComment(commentId, user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
