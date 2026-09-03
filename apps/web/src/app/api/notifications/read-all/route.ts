import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { markAllNotificationsRead } from "@/server/repo";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    await markAllNotificationsRead(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
