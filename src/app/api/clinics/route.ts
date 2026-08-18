import { NextResponse } from "next/server";
import { getClinics } from "@/server/db";

// Public — the "yuqori xavf" (high risk) result links here.
export async function GET() {
  return NextResponse.json({ clinics: getClinics() });
}
