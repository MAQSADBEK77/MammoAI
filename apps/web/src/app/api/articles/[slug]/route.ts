import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { getArticleBySlug } from "@/server/repo";

export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    await requireUser(request);
    const { slug } = await context.params;
    const article = await getArticleBySlug(slug);
    if (!article) return NextResponse.json({ error: "Maqola topilmadi" }, { status: 404 });
    return NextResponse.json(article);
  } catch (error) {
    return jsonError(error);
  }
}
