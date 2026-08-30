import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import { deleteArticle, updateArticle } from "@/server/repo";
import type { Article } from "@mammoai/shared";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(request);
    const { id } = await context.params;
    const patch = (await request.json()) as Partial<Omit<Article, "id" | "isSeedData">>;
    await updateArticle(id, patch);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(request);
    const { id } = await context.params;
    await deleteArticle(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
