import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { incrementKicks } from "@/server/repo";
import { buildPregnancyResponse } from "@/server/views";

/** Tepki hisoblagich — spec §3: "oddiy hisoblagich, uchinchi trimestr uchun". */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    await incrementKicks(user.id);
    return NextResponse.json(await buildPregnancyResponse(user.id));
  } catch (error) {
    return jsonError(error);
  }
}
