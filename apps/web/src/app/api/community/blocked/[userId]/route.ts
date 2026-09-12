import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { unblockUser, listBlockedUsers } from "@/server/repo";

export async function DELETE(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  try {
    const user = await requireUser(request);
    const { userId } = await context.params;
    await unblockUser(user.id, userId);
    return NextResponse.json({ blocked: await listBlockedUsers(user.id) });
  } catch (error) {
    return jsonError(error);
  }
}
