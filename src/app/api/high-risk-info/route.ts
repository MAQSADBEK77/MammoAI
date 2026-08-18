import { NextResponse } from "next/server";
import { getSetting } from "@/server/db";

// Public, read-only: shown on the test result page when the risk level is
// "yuqori" (high). No auth needed — it's the same admin-authored safety
// text the Telegram bot also reads directly from the settings table.
export async function GET() {
  return NextResponse.json({ text: getSetting("high_risk_info_text") ?? "" });
}
