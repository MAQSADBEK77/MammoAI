import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import { createArticle, listArticles } from "@/server/repo";
import type { Article } from "@mammoai/shared";

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    return NextResponse.json(await listArticles());
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    const body = (await request.json()) as Omit<Article, "id" | "isSeedData">;
    if (!body.slug || !body.title || !body.body) {
      return NextResponse.json({ error: "Slug, sarlavha va matn kerak" }, { status: 400 });
    }
    return NextResponse.json(await createArticle(body));
  } catch (error) {
    return jsonError(error);
  }
}
