import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/server/db";
import { requireAdmin } from "@/server/session";
import { handleApiError } from "@/server/api-utils";

const KEY = "high_risk_info_text";

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ text: getSetting(KEY) ?? "" });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { text } = (await request.json()) ?? {};
    setSetting(KEY, typeof text === "string" ? text.trim() : "");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
