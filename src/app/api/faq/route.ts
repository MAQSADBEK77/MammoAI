import { NextResponse } from "next/server";
import { getFaqItems } from "@/server/db";

// Public — shown on the /faq page, no login needed.
export async function GET() {
  return NextResponse.json({ items: getFaqItems() });
}
