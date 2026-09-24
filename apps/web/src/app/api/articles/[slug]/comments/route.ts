import { NextResponse, type NextRequest } from "next/server";
import { ApiError, jsonError, requireUser } from "@/server/api-utils";
import { createArticleComment, deleteArticleComment, getArticleBySlug, listArticleComments } from "@/server/repo";

const MAX_COMMENT_LENGTH = 1000;
const MIN_COMMENT_LENGTH = 2;

/** CONTENT-02: maqola ostidagi izohlar. Ro'yxat ham autentifikatsiya talab
 * qiladi — `isMine` bayrog'i uchun kim so'rayotganini bilish kerak. */
/** CONTENT-02 (tuzatildi): yo'l `[slug]` segmentidan foydalanadi.
 * Ilgari bu marshrut `[id]` deb yaratilgan edi — Next.js bitta yo'lda
 * ikki xil dinamik segment nomiga ruxsat bermaydi va bu BUTUN ilovani
 * 500 xatosiga olib kelgan edi (`/api/articles/[slug]` allaqachon bor). */
async function resolveArticleId(slug: string): Promise<string> {
  const article = await getArticleBySlug(slug);
  if (!article) throw new ApiError(404, "Maqola topilmadi");
  return article.id;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const user = await requireUser(request);
    const { slug } = await params;
    const id = await resolveArticleId(slug);
    return NextResponse.json({ comments: await listArticleComments(id, user.id) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const user = await requireUser(request);
    const { slug } = await params;
    const id = await resolveArticleId(slug);
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
