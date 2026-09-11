import { NextResponse, type NextRequest } from "next/server";
import { ApiError, jsonError, requireUser } from "@/server/api-utils";
import { setExpoPushToken } from "@/server/repo";

/** Mobil ilova (expo-notifications) OS push ruxsati berilgach chaqiradi. */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as { token?: string };
    if (!body.token) throw new ApiError(400, "Token kerak");
    await setExpoPushToken(user.id, body.token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
