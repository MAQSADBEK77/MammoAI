import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import {
  getAiProvider,
  getGeminiApiKey,
  getHuaweiMaasApiKey,
  getHuaweiMaasModel,
  setAiProvider,
  setGeminiApiKey,
  setHuaweiMaasApiKey,
  setHuaweiMaasModel,
  type AiProvider,
} from "@/server/ai-chat";
import { getAiUsageRecent } from "@/server/repo";

const USAGE_HISTORY_DAYS = 7;

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const [provider, geminiKey, huaweiKey, huaweiModel] = await Promise.all([
      getAiProvider(),
      getGeminiApiKey(),
      getHuaweiMaasApiKey(),
      getHuaweiMaasModel(),
    ]);
    // AI-PROVIDER-02: joriy provayderning oxirgi N kunlik token sarfi —
    // bizning o'z hisobimiz (provayderning haqiqiy jonli kvotasi emas).
    const usageHistory = await getAiUsageRecent(provider, USAGE_HISTORY_DAYS);
    return NextResponse.json({
      provider,
      usageHistory,
      usageToday: usageHistory[usageHistory.length - 1]?.totalTokens ?? 0,
      // ORQAGA MOSLIK: eski admin UI hali ham `hasKey`/`maskedKey`ni o'qiydi —
      // bular joriy TANLANGAN provayderning kalitini ko'rsatadi.
      hasKey: provider === "huawei_maas" ? !!huaweiKey : !!geminiKey,
      maskedKey: provider === "huawei_maas" ? (huaweiKey ? `•••• ${huaweiKey.slice(-6)}` : null) : geminiKey ? `•••• ${geminiKey.slice(-6)}` : null,
      hasGeminiKey: !!geminiKey,
      maskedGeminiKey: geminiKey ? `•••• ${geminiKey.slice(-6)}` : null,
      hasHuaweiKey: !!huaweiKey,
      maskedHuaweiKey: huaweiKey ? `•••• ${huaweiKey.slice(-6)}` : null,
      huaweiModel,
    });
  } catch (error) {
    return jsonError(error);
  }
}

interface PatchBody {
  apiKey?: string; // ORQAGA MOSLIK — eski UI shakli, joriy provayderga yoziladi
  provider?: AiProvider;
  geminiApiKey?: string;
  huaweiApiKey?: string;
  huaweiModel?: string;
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = (await request.json()) as PatchBody;

    if (body.provider === "gemini" || body.provider === "huawei_maas") await setAiProvider(body.provider);
    if (body.geminiApiKey) await setGeminiApiKey(body.geminiApiKey.trim());
    if (body.huaweiApiKey) await setHuaweiMaasApiKey(body.huaweiApiKey.trim());
    if (body.huaweiModel) await setHuaweiMaasModel(body.huaweiModel.trim());

    if (body.apiKey) {
      const provider = body.provider ?? (await getAiProvider());
      if (provider === "huawei_maas") await setHuaweiMaasApiKey(body.apiKey.trim());
      else await setGeminiApiKey(body.apiKey.trim());
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
