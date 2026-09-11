import { NextResponse, type NextRequest } from "next/server";
import { ApiError, jsonError, requireUser } from "@/server/api-utils";
import { getInsightsSummary } from "@/server/insights";
import { detectSymptomPatterns } from "@/server/ai-chat";
import { hasPremiumAccess } from "@/server/repo";

/** AI Yordamchi ekranining "Statistika" segmenti — sikl uzunligi tarixi,
 * simptom chastotasi, kayfiyat taqsimoti, og'riqli kunlar/sikl + takrorlanuvchi
 * pattern (chat bilan bir xil detectSymptomPatterns, dublikat mantiq yo'q).
 * Premium (foydalanuvchi so'roviga ko'ra, AI Yordamchi bilan bir xil). */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!(await hasPremiumAccess(user.id))) {
      throw new ApiError(402, "Statistika Premium funksiya");
    }
    const [summary, patterns] = await Promise.all([getInsightsSummary(user.id), detectSymptomPatterns(user.id)]);
    return NextResponse.json({ summary, patterns });
  } catch (error) {
    return jsonError(error);
  }
}
