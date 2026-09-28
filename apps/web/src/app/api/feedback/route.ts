import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { checkFeedbackRateLimit, submitFeedback } from "@/server/repo";
import type { FeedbackTrigger } from "@mammoai/shared";

interface FeedbackBody {
  trigger?: FeedbackTrigger;
  rating?: number;
  message?: string;
}

/** "Fikr bildirish" menyusi (trigger='manual'), AI Yordamchi ichidagi
 * yumshoq 👍/👎 so'rov (trigger='chat_prompt') va Premium so'rovi
 * (trigger='premium_request') shu bitta endpoint orqali. */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    // FIX3-17: rate-limit yo'q edi — spam fikr-mulohaza jadvalini to'ldirishi mumkin edi.
    await checkFeedbackRateLimit(user.id);
    const body = (await request.json()) as FeedbackBody;
    if (body.trigger !== "manual" && body.trigger !== "chat_prompt" && body.trigger !== "premium_request") {
      return NextResponse.json({ error: "Noto'g'ri trigger" }, { status: 400 });
    }
    // PREMIUM-01: Premium so'rovida baho ham, matn ham MAJBURIY EMAS —
    // tugmani bosishning o'zi "menga kerak" degani. Qolgan turlarda
    // bo'sh yozuvning ma'nosi yo'q.
    if (body.trigger !== "premium_request" && body.rating === undefined && !body.message?.trim()) {
      return NextResponse.json({ error: "Baho yoki izoh kiritish shart" }, { status: 400 });
    }
    const response = await submitFeedback(user.id, {
      trigger: body.trigger,
      rating: body.rating ?? null,
      message: body.message?.trim() || null,
    });
    return NextResponse.json({ response });
  } catch (error) {
    return jsonError(error);
  }
}
