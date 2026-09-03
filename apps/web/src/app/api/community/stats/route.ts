import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { getCommunityStats } from "@/server/repo";

export async function GET(request: NextRequest) {
  try {
    await requireUser(request);
    return NextResponse.json(await getCommunityStats());
  } catch (error) {
    return jsonError(error);
  }
}
