import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser, ApiError } from "@/server/api-utils";
import { createCommunityPost, listCommunityPosts } from "@/server/repo";
import type { CommunityTag } from "@mammoai/shared";

const VALID_TAGS: CommunityTag[] = ["cycle", "pregnancy", "checkups", "general"];

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const { searchParams } = new URL(request.url);
    const tagParam = searchParams.get("tag");
    const tag = tagParam && (VALID_TAGS as string[]).includes(tagParam) ? (tagParam as CommunityTag) : undefined;
    const limit = Number(searchParams.get("limit") ?? 20);
    const offset = Number(searchParams.get("offset") ?? 0);
    return NextResponse.json(await listCommunityPosts(user.id, { tag, limit, offset }));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as { tag?: CommunityTag; body?: string; isAnonymous?: boolean };
    if (!body.tag || !(VALID_TAGS as string[]).includes(body.tag)) {
      throw new ApiError(400, "Mavzu (tag) noto'g'ri");
    }
    const text = body.body?.trim() ?? "";
    if (text.length < 2) {
      throw new ApiError(400, "Post matni juda qisqa");
    }
    const post = await createCommunityPost(user.id, { tag: body.tag, body: text, isAnonymous: Boolean(body.isAnonymous) });
    return NextResponse.json(post);
  } catch (error) {
    return jsonError(error);
  }
}
