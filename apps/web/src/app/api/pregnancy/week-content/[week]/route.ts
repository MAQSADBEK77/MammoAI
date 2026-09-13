import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { getPregnancyWeekContent } from "@/server/repo";

/** CONTENT-001: admin panel orqali tahrirlanadigan haftalik kontent
 * (chaqaloq rivojlanishi + onaning o'zgarishlari). `content: null` — hali
 * kiritilmagan, klient eski statik meva-qiyoslash tizimiga tushadi. */
export async function GET(request: NextRequest, context: { params: Promise<{ week: string }> }) {
  try {
    await requireUser(request);
    const { week } = await context.params;
    const weekNum = Number(week);
    // FIX-06: noto'g'ri qiymat (masalan "/week-content/abc") to'g'ridan-to'g'ri
    // getPregnancyWeekContent'ga uzatilsa, SQL `WHERE week = NaN` bilan
    // Postgres xatosi (500) qaytarardi — admin PATCH variantidagi bilan bir
    // xil validatsiya (1-42 oralig'i, butun son).
    if (!Number.isInteger(weekNum) || weekNum < 1 || weekNum > 42) {
      return NextResponse.json({ content: null });
    }
    const content = await getPregnancyWeekContent(weekNum);
    return NextResponse.json({ content });
  } catch (error) {
    return jsonError(error);
  }
}
