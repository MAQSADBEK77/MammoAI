import { NextResponse } from "next/server";
import { deletePushSubscription } from "@/server/db";
import { requireUser } from "@/server/session";
import { ApiError, handleApiError } from "@/server/api-utils";

export async function POST(request: Request) {
  try {
    await requireUser();
    const { endpoint } = (await request.json()) ?? {};
    if (!endpoint) throw new ApiError(400, "endpoint kerak.");
    deletePushSubscription(endpoint);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
