import { NextResponse, type NextRequest } from "next/server";
import { computeRiskScore, riskLevelFromScore } from "@mammoai/shared";
import type { RiskQuizAnswers } from "@mammoai/shared";
import { jsonError, requireUser } from "@/server/api-utils";
import { getRiskQuizResult, saveRiskQuizResult } from "@/server/repo";

/** App.pdf §19 — o'z-o'zini tekshirish testi. Tibbiy tashxis emas, yo'naltiruvchi natija. */
export async function GET(request: NextRequest) {
  try {
    const user = requireUser(request);
    return NextResponse.json(getRiskQuizResult(user.id));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireUser(request);
    const body = (await request.json()) as { answers: RiskQuizAnswers };
    const score = computeRiskScore(body.answers);
    const level = riskLevelFromScore(score);
    return NextResponse.json(saveRiskQuizResult(user.id, body.answers, score, level));
  } catch (error) {
    return jsonError(error);
  }
}
