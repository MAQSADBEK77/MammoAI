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
    const content = await getPregnancyWeekContent(Number(week));
    return NextResponse.json({ content });
  } catch (error) {
    return jsonError(error);
  }
}
