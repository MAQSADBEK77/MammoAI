import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { getInsightsSummary } from "@/server/insights";
import { detectSymptomPatterns } from "@/server/ai-chat";

/** AI Yordamchi ekranining "Statistika" segmenti — sikl uzunligi tarixi,
 * simptom chastotasi, kayfiyat taqsimoti, og'riqli kunlar/sikl + takrorlanuvchi
 * pattern (chat bilan bir xil detectSymptomPatterns, dublikat mantiq yo'q). */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const [summary, patterns] = await Promise.all([getInsightsSummary(user.id), detectSymptomPatterns(user.id)]);
    return NextResponse.json({ summary, patterns });
  } catch (error) {
    return jsonError(error);
  }
}
