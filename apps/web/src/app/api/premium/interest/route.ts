import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { checkFeedbackRateLimit, getLatestPremiumInterest, recordPremiumInterest } from "@/server/repo";
import {
  PREMIUM_MONTHLY_UZS,
  PREMIUM_YEARLY_UZS,
  isPremiumInterestChoice,
  isPremiumInterestSource,
} from "@mammoai/shared";

interface InterestBody {
  choice?: unknown;
  source?: unknown;
  note?: unknown;
}

/** Ayol allaqachon javob berganmi — paywall takroran so'ramasligi uchun. */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    return NextResponse.json({ choice: await getLatestPremiumInterest(user.id) });
  } catch (error) {
    return jsonError(error);
  }
}

/**
 * PRICE-SIGNAL-01 — paywallda narxni ko'rgan ayolning javobi.
 *
 * Narx mijozdan OLINMAYDI, serverda belgilanadi: aks holda javobni yuboruvchi
 * istalgan raqamni yozib, o'lchovni buzishi mumkin edi.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    // Xuddi fikr-mulohaza kabi — bir ayol tugmani ming marta bosib, o'lchovni
    // egib yubormasligi uchun bir xil chegara ishlatiladi.
    await checkFeedbackRateLimit(user.id);
    const body = (await request.json()) as InterestBody;

    if (!isPremiumInterestChoice(body.choice)) {
      return NextResponse.json({ error: "Noto'g'ri tanlov" }, { status: 400 });
    }
    if (!isPremiumInterestSource(body.source)) {
      return NextResponse.json({ error: "Noto'g'ri manba" }, { status: 400 });
    }

    const priceUzs = body.choice === "yearly" ? PREMIUM_YEARLY_UZS : PREMIUM_MONTHLY_UZS;
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) || null : null;

    await recordPremiumInterest({ userId: user.id, choice: body.choice, source: body.source, priceUzs, note });
    return NextResponse.json({ ok: true, choice: body.choice });
  } catch (error) {
    return jsonError(error);
  }
}
