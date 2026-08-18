import { NextResponse } from "next/server";
import { savePushSubscription } from "@/server/db";
import { requireUser } from "@/server/session";
import { ApiError, handleApiError } from "@/server/api-utils";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { endpoint, keys } = (await request.json()) ?? {};
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      throw new ApiError(400, "Noto'g'ri obuna ma'lumotlari.");
    }
    savePushSubscription(user.id, endpoint, keys.p256dh, keys.auth);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
