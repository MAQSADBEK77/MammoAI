import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser, ApiError } from "@/server/api-utils";
import { addCommunityComment, listCommunityComments } from "@/server/repo";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    return NextResponse.json(await listCommunityComments(id, user.id));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    const body = (await request.json()) as { body?: string; isAnonymous?: boolean };
    const text = body.body?.trim() ?? "";
    if (text.length < 1) throw new ApiError(400, "Izoh matni bo'sh bo'lishi mumkin emas");
    const comment = await addCommunityComment(user.id, id, { body: text, isAnonymous: Boolean(body.isAnonymous) });
    return NextResponse.json(comment);
  } catch (error) {
    return jsonError(error);
  }
}
