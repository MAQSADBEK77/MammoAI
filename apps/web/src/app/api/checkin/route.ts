import { NextResponse, type NextRequest } from "next/server";
import { isKnownCheckinQuestion } from "@mammoai/shared";
import { jsonError, requireUser } from "@/server/api-utils";
import { getCheckinAnswers, saveCheckinAnswer } from "@/server/repo";

/** TODAY-02 — bugungi Check-in kartalariga berilgan javoblar. */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    return NextResponse.json(await getCheckinAnswers(user.id));
  } catch (error) {
    return jsonError(error);
  }
}

interface AnswerBody {
  questionKey: string;
  answer: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as AnswerBody;
    // Kalit ro'yxatdan bo'lishi SHART — aks holda bazaga istalgan matnni
    // yozib yuborish mumkin bo'lardi (savollar mahsulot mazmuni, foydalanuvchi
    // kiritadigan ma'lumot emas).
    if (typeof body.questionKey !== "string" || !isKnownCheckinQuestion(body.questionKey)) {
      return NextResponse.json({ error: "Noma'lum savol" }, { status: 400 });
    }
    if (typeof body.answer !== "boolean") {
      return NextResponse.json({ error: "Javob noto'g'ri" }, { status: 400 });
    }
    return NextResponse.json(await saveCheckinAnswer(user.id, body.questionKey, body.answer));
  } catch (error) {
    return jsonError(error);
  }
}
