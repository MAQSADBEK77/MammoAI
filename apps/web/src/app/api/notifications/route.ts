import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { listNotifications } from "@/server/repo";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    return NextResponse.json(await listNotifications(user.id));
  } catch (error) {
    return jsonError(error);
  }
}
