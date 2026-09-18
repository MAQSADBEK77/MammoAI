import { NextResponse, type NextRequest } from "next/server";
import { computeRiskScore, riskLevelFromScore, RISK_QUIZ_QUESTIONS } from "@mammoai/shared";
import type { RiskQuizAnswers } from "@mammoai/shared";
import { ApiError, jsonError, requireUser } from "@/server/api-utils";
import { getRiskQuizResult, saveRiskQuizResult } from "@/server/repo";

// DATA-ACCURACY-07: ikkala mavjud klient (`/baholash`, `xavf-testi/page.tsx`)
// bosqichma-bosqich UI orqali barcha 7 savolga javob berilishini KAFOLATLAYDI
// — lekin bu SERVER TOMONDA hech qanday tekshiruvsiz edi. `computeRiskScore`
// yo'q kalitni jimgina "yo'q" (xavf omili yo'q) deb hisoblaydi
// (`answers[q.id] ? weight : 0`), shuning uchun to'g'ridan-to'g'ri API'ga
// (klientni chetlab) YUBORILGAN to'liqsiz javoblar HAQIQIY xavfni jimgina
// KAMROQ ko'rsatib, foydalanuvchining o'z hisobiga saqlanib qolardi — bu
// sog'liqqa oid xavf-bahosi uchun ayniqsa jiddiy. Endi barcha 7 ta savolga
// aniq boolean javob berilganligi serverda ham tekshiriladi.
function isCompleteRiskQuizAnswers(value: unknown): value is RiskQuizAnswers {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return RISK_QUIZ_QUESTIONS.every((q) => typeof obj[q.id] === "boolean");
}

/** App.pdf §19 — o'z-o'zini tekshirish testi. Tibbiy tashxis emas, yo'naltiruvchi natija. */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    return NextResponse.json(await getRiskQuizResult(user.id));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as { answers?: unknown };
    if (!isCompleteRiskQuizAnswers(body.answers)) {
      throw new ApiError(400, "Barcha savollarga javob berilishi shart", "incomplete_answers");
    }
    const score = computeRiskScore(body.answers);
    const level = riskLevelFromScore(score);
    return NextResponse.json(await saveRiskQuizResult(user.id, body.answers, score, level));
  } catch (error) {
    return jsonError(error);
  }
}
