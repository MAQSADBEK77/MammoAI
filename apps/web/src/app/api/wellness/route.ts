import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { buildWellnessResponse } from "@/server/views";

/** "Sog'liqni nazorat qilish" (wellbeing) rejimi — bugungi suv/kaloriya jurnali. */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    return NextResponse.json(await buildWellnessResponse(user.id));
  } catch (error) {
    return jsonError(error);
  }
}
