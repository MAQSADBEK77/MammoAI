import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { listChatMessages } from "@/server/repo";

/** AI Yordamchi suhbat tarixini yuklaydi. */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const messages = await listChatMessages(user.id);
    return NextResponse.json({ messages });
  } catch (error) {
    return jsonError(error);
  }
}
