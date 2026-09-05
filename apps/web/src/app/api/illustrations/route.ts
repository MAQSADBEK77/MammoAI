import { NextResponse } from "next/server";
import { jsonError } from "@/server/api-utils";
import { getIllustrationSlots } from "@/server/repo";

/**
 * Ochiq (autentifikatsiyasiz) — admin panelda tanlangan illyustratsiyalar
 * xaritasini qaytaradi. Ilova (web + mobil) shu bilan qaysi rasm qaysi
 * "joy"da (masalan "onboarding.welcome") ko'rsatilishini aniqlaydi.
 */
export async function GET() {
  try {
    const slots = await getIllustrationSlots();
    return NextResponse.json({ slots });
  } catch (error) {
    return jsonError(error);
  }
}
