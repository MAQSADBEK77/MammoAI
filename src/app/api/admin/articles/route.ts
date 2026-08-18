import { NextResponse } from "next/server";
import { createArticle, getAllArticles, logAdminAction } from "@/server/db";
import { requireAdmin, requireAdminOrModerator } from "@/server/session";
import { ApiError, handleApiError } from "@/server/api-utils";

export async function GET() {
  try {
    await requireAdminOrModerator();
    return NextResponse.json({ articles: getAllArticles() });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = (await request.json()) ?? {};
    if (!body.title?.trim() || !body.content?.trim()) {
      throw new ApiError(400, "Sarlavha va matnni kiriting.");
    }
    const article = createArticle({
      title: body.title.trim(),
      excerpt: body.excerpt?.trim() ?? "",
      content: body.content.trim(),
      published: body.published !== false,
      videoUrl: body.videoUrl?.trim() ?? "",
    });
    logAdminAction(admin.id, `${admin.firstName} ${admin.lastName}`, "article.create", article.title);
    return NextResponse.json({ article });
  } catch (err) {
    return handleApiError(err);
  }
}
