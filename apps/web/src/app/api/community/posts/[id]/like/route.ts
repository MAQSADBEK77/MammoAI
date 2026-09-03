import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { toggleCommunityLike } from "@/server/repo";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    return NextResponse.json(await toggleCommunityLike(user.id, id));
  } catch (error) {
    return jsonError(error);
  }
}
