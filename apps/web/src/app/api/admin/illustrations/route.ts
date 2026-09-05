import { NextResponse, type NextRequest } from "next/server";
import { ILLUSTRATION_LIBRARY, SLOT_KEYS, type IllustrationSlotKey } from "@mammoai/shared";
import { jsonError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import { getIllustrationSlots, setIllustrationSlot } from "@/server/repo";

const VALID_SLUGS = new Set(ILLUSTRATION_LIBRARY.map((i) => i.slug));
const VALID_SLOTS = new Set<string>(SLOT_KEYS);

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    return NextResponse.json({ slots: await getIllustrationSlots(), library: ILLUSTRATION_LIBRARY });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    requireAdmin(request);
    const body = (await request.json()) as { slotKey?: string; slug?: string };
    if (!body.slotKey || !VALID_SLOTS.has(body.slotKey)) {
      return NextResponse.json({ error: "Noto'g'ri slot" }, { status: 400 });
    }
    if (!body.slug || !VALID_SLUGS.has(body.slug)) {
      return NextResponse.json({ error: "Noto'g'ri illyustratsiya" }, { status: 400 });
    }
    await setIllustrationSlot(body.slotKey as IllustrationSlotKey, body.slug);
    return NextResponse.json({ slots: await getIllustrationSlots() });
  } catch (error) {
    return jsonError(error);
  }
}
