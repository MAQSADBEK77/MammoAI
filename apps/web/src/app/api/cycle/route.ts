import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { buildCycleResponse } from "@/server/views";

export async function GET(request: NextRequest) {
  try {
    const user = requireUser(request);
    return NextResponse.json(buildCycleResponse(user.id));
  } catch (error) {
    return jsonError(error);
  }
}
