import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { listChecklistItems } from "@/server/repo";
import { syncChecklistForUser } from "@/server/checklist-sync";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    await syncChecklistForUser(user.id);
    return NextResponse.json(await listChecklistItems(user.id));
  } catch (error) {
    return jsonError(error);
  }
}
