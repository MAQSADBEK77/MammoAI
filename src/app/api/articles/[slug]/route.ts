import { NextResponse } from "next/server";
import { getArticleBySlug } from "@/server/db";
import { ApiError, handleApiError } from "@/server/api-utils";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const article = getArticleBySlug(slug);
    if (!article || !article.published) throw new ApiError(404, "Maqola topilmadi.");
    return NextResponse.json({ article });
  } catch (err) {
    return handleApiError(err);
  }
}
