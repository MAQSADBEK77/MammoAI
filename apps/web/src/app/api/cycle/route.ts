import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { buildCycleResponse } from "@/server/views";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    return NextResponse.json(await buildCycleResponse(user.id));
  } catch (error) {
    return jsonError(error);
  }
}
