import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { completeChecklistItem, listChecklistItems } from "@/server/repo";

/** "Bajardim" tugmasi — spec §4: bajarilganlik belgisi natija (outcome) ma'lumoti. */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = requireUser(request);
    const { id } = await context.params;
    completeChecklistItem(user.id, id);
    return NextResponse.json(listChecklistItems(user.id));
  } catch (error) {
    return jsonError(error);
  }
}
