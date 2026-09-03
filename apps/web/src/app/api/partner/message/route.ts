import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { sendPartnerMessage } from "@/server/repo";

/** Hamkorga tezkor xabar (eslatma) yuboradi — uning bildirishnomalar
 * ro'yxatida ko'rinadi. */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as { text?: string };
    const text = body.text?.trim();
    if (!text) return NextResponse.json({ error: "Xabar matni bo'sh" }, { status: 400 });
    await sendPartnerMessage(user.id, text);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
