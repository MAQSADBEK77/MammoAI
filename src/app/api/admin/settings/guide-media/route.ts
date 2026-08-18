import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/server/db";
import { requireAdmin, requireAdminOrModerator } from "@/server/session";
import { handleApiError } from "@/server/api-utils";

export async function GET() {
  try {
    await requireAdminOrModerator();
    return NextResponse.json({
      imageUrls: getSetting("guide_image_urls") ?? "",
      videoUrl: getSetting("guide_video_url") ?? "",
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { imageUrls, videoUrl } = (await request.json()) ?? {};
    setSetting("guide_image_urls", typeof imageUrls === "string" ? imageUrls.trim() : "");
    setSetting("guide_video_url", typeof videoUrl === "string" ? videoUrl.trim() : "");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
