import { NextResponse, type NextRequest } from "next/server";
import type { AnalyticsEventInput } from "@mammoai/shared";
import { jsonError, getAuthenticatedUser } from "@/server/api-utils";
import { recordAnalyticsEvents } from "@/server/repo";

const MAX_EVENTS_PER_BATCH = 100;

/**
 * Foydalanish hodisalari (sahifa ko'rish/tugma bosish) — mijoz to'plab, davriy
 * yuboradi. Sessiya bo'lmasa ham (masalan onboarding tugamasdan oldingi
 * hodisalar) qabul qilinadi — `requireUser` emas, `getAuthenticatedUser`
 * ishlatiladi, chunki analitika ilova ishlashini bloklamasligi kerak.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = (await request.json().catch(() => null)) as { events?: AnalyticsEventInput[] } | null;
    const events = Array.isArray(body?.events) ? body.events.slice(0, MAX_EVENTS_PER_BATCH) : [];
    await recordAnalyticsEvents(user?.id ?? null, events);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
