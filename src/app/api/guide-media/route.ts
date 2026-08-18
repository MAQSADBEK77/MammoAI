import { NextResponse } from "next/server";
import { getSetting } from "@/server/db";

// Public — read by the /qollanma (guide) page.
export async function GET() {
  const imageUrls = (getSetting("guide_image_urls") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  return NextResponse.json({ imageUrls, videoUrl: getSetting("guide_video_url") ?? "" });
}
