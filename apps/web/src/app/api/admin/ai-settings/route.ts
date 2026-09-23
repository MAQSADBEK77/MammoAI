import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import {
  getAiProvider,
  getAnthropicApiKey,
  getAnthropicModel,
  getGeminiApiKey,
  getHuaweiMaasApiKey,
  getHuaweiMaasModel,
  isAiProvider,
  setAiProvider,
  setAnthropicApiKey,
  setAnthropicModel,
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
    const [provider, geminiKey, huaweiKey, huaweiModel, anthropicKey, anthropicModel] = await Promise.all([
      getAiProvider(),
      getGeminiApiKey(),
      getHuaweiMaasApiKey(),
      getHuaweiMaasModel(),
      getAnthropicApiKey(),
      getAnthropicModel(),
    ]);
    const activeKey = provider === "huawei_maas" ? huaweiKey : provider === "anthropic" ? anthropicKey : geminiKey;
    // AI-PROVIDER-02: joriy provayderning oxirgi N kunlik token sarfi —
    // bizning o'z hisobimiz (provayderning haqiqiy jonli kvotasi emas).
    const usageHistory = await getAiUsageRecent(provider, USAGE_HISTORY_DAYS);
    return NextResponse.json({
      provider,
      usageHistory,
      usageToday: usageHistory[usageHistory.length - 1]?.totalTokens ?? 0,
      // ORQAGA MOSLIK: eski admin UI hali ham `hasKey`/`maskedKey`ni o'qiydi —
      // bular joriy TANLANGAN provayderning kalitini ko'rsatadi.
      hasKey: !!activeKey,
      maskedKey: activeKey ? `•••• ${activeKey.slice(-6)}` : null,
      hasGeminiKey: !!geminiKey,
      maskedGeminiKey: geminiKey ? `•••• ${geminiKey.slice(-6)}` : null,
      hasHuaweiKey: !!huaweiKey,
      maskedHuaweiKey: huaweiKey ? `•••• ${huaweiKey.slice(-6)}` : null,
      huaweiModel,
      hasAnthropicKey: !!anthropicKey,
      maskedAnthropicKey: anthropicKey ? `•••• ${anthropicKey.slice(-6)}` : null,
      anthropicModel,
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
  anthropicApiKey?: string;
  anthropicModel?: string;
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = (await request.json()) as PatchBody;

    if (isAiProvider(body.provider)) await setAiProvider(body.provider);
    if (body.geminiApiKey) await setGeminiApiKey(body.geminiApiKey.trim());
    if (body.huaweiApiKey) await setHuaweiMaasApiKey(body.huaweiApiKey.trim());
    if (body.huaweiModel) await setHuaweiMaasModel(body.huaweiModel.trim());
    if (body.anthropicApiKey) await setAnthropicApiKey(body.anthropicApiKey.trim());
    if (body.anthropicModel) await setAnthropicModel(body.anthropicModel.trim());

    if (body.apiKey) {
      const provider = body.provider ?? (await getAiProvider());
      if (provider === "huawei_maas") await setHuaweiMaasApiKey(body.apiKey.trim());
      else if (provider === "anthropic") await setAnthropicApiKey(body.apiKey.trim());
      else await setGeminiApiKey(body.apiKey.trim());
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
