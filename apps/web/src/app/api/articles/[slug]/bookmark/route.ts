import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { setArticleBookmark } from "@/server/repo";

/**
 * BOOKMARK-01: maqolani saqlash (PUT) va saqlanganlardan olib tashlash (DELETE).
 *
 * Ikkalasi ham IDEMPOTENT — ayol tugmani tez-tez bossa yoki tarmoq so'rovni
 * qayta yuborsa, natija bir xil bo'ladi va xato chiqmaydi.
 */
export async function PUT(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  return toggle(request, context, true);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  return toggle(request, context, false);
}

async function toggle(request: NextRequest, context: { params: Promise<{ slug: string }> }, on: boolean) {
  try {
    const user = await requireUser(request);
    const { slug } = await context.params;
    const ok = await setArticleBookmark(user.id, slug, on);
    if (!ok) return NextResponse.json({ error: "Maqola topilmadi" }, { status: 404 });
    return NextResponse.json({ isBookmarked: on });
  } catch (error) {
    return jsonError(error);
  }
}
