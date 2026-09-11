import { NextResponse, type NextRequest } from "next/server";
import { ApiError, jsonError, requireUser } from "@/server/api-utils";
import { getInsightsSummary } from "@/server/insights";
import { detectSymptomPatterns } from "@/server/ai-chat";
import { getOrGenerateActiveInsight } from "@/server/active-insights";
import { hasPremiumAccess } from "@/server/repo";

/** AI Yordamchi ekranining "Statistika" segmenti — sikl uzunligi tarixi,
 * simptom chastotasi, kayfiyat taqsimoti, og'riqli kunlar/sikl + takrorlanuvchi
 * pattern (chat bilan bir xil detectSymptomPatterns, dublikat mantiq yo'q) +
 * AI'ning PROAKTIV tahlili (`aiInsight` — server/active-insights.ts, keshlangan,
 * har chaqiruvda qayta generatsiya qilinmaydi). Premium (foydalanuvchi
 * so'roviga ko'ra, AI Yordamchi bilan bir xil). */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!(await hasPremiumAccess(user.id))) {
      throw new ApiError(402, "Statistika Premium funksiya");
    }
    const [summary, patterns] = await Promise.all([getInsightsSummary(user.id), detectSymptomPatterns(user.id)]);
    const aiInsight = await getOrGenerateActiveInsight(user.id, user.language, summary, patterns);
    return NextResponse.json({ summary, patterns, aiInsight });
  } catch (error) {
    return jsonError(error);
  }
}
