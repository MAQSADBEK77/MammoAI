import { NextResponse } from "next/server";
import { getPublishedArticles } from "@/server/db";

// Public — published articles only.
export async function GET() {
  return NextResponse.json({ articles: getPublishedArticles() });
}
