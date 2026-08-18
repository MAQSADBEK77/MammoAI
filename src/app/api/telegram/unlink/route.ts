import { NextResponse } from "next/server";
import { setTelegramChatId } from "@/server/db";
import { requireUser } from "@/server/session";
import { handleApiError } from "@/server/api-utils";

export async function POST() {
  try {
    const user = await requireUser();
    setTelegramChatId(user.id, null);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
