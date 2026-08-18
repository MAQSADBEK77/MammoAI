import { NextResponse } from "next/server";
import { deleteArticle, logAdminAction, updateArticle } from "@/server/db";
import { requireAdmin } from "@/server/session";
import { ApiError, handleApiError } from "@/server/api-utils";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = (await request.json()) ?? {};
    if (!body.title?.trim() || !body.content?.trim()) {
      throw new ApiError(400, "Sarlavha va matnni kiriting.");
    }
    const article = updateArticle(id, {
      title: body.title.trim(),
      excerpt: body.excerpt?.trim() ?? "",
      content: body.content.trim(),
      published: body.published !== false,
    });
    logAdminAction(admin.id, `${admin.firstName} ${admin.lastName}`, "article.update", article.title);
    return NextResponse.json({ article });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    deleteArticle(id);
    logAdminAction(admin.id, `${admin.firstName} ${admin.lastName}`, "article.delete", id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
