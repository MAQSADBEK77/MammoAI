import { NextResponse } from "next/server";
import { getReferralCount } from "@/server/db";
import { requireUser } from "@/server/session";
import { handleApiError } from "@/server/api-utils";

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({ code: user.referralCode, count: getReferralCount(user.id) });
  } catch (err) {
    return handleApiError(err);
  }
}
