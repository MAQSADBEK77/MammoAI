import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import { getAnthropicApiKey, setAnthropicApiKey } from "@/server/ai-chat";

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    const key = await getAnthropicApiKey();
    return NextResponse.json({
      hasKey: !!key,
      maskedKey: key ? `•••• ${key.slice(-6)}` : null,
    });
  } catch (error) {
    return jsonError(error);
  }
}

interface PatchBody {
  apiKey?: string;
}

export async function PATCH(request: NextRequest) {
  try {
    requireAdmin(request);
    const body = (await request.json()) as PatchBody;
    if (body.apiKey) await setAnthropicApiKey(body.apiKey.trim());
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
