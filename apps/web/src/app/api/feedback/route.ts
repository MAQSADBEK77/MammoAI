import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { submitFeedback } from "@/server/repo";
import type { FeedbackTrigger } from "@mammoai/shared";

interface FeedbackBody {
  trigger?: FeedbackTrigger;
  rating?: number;
  message?: string;
}

/** "Fikr bildirish" menyusi (trigger='manual') va AI Yordamchi ichidagi
 * yumshoq 👍/👎 so'rov (trigger='chat_prompt') shu bitta endpoint orqali. */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as FeedbackBody;
    if (body.trigger !== "manual" && body.trigger !== "chat_prompt") {
      return NextResponse.json({ error: "Noto'g'ri trigger" }, { status: 400 });
    }
    if (body.rating === undefined && !body.message?.trim()) {
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
