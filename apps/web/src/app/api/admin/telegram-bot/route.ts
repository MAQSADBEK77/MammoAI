import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import {
  callTelegramApi,
  getTelegramBotDescription,
  getTelegramBotShortDescription,
  getTelegramBotToken,
  getTelegramBotUsername,
  setTelegramBotDescription,
  setTelegramBotName,
  setTelegramBotShortDescription,
  setTelegramBotToken,
} from "@/server/telegram-bot";

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    const token = await getTelegramBotToken();
    const username = await getTelegramBotUsername();
    let name: string | null = null;
    let description: string | null = null;
    let shortDescription: string | null = null;
    let tokenValid = false;

    if (token) {
      try {
        const info = await callTelegramApi<{ first_name: string }>("getMe");
        name = info.first_name;
        description = await getTelegramBotDescription();
        shortDescription = await getTelegramBotShortDescription();
        tokenValid = true;
      } catch {
        // Token saqlangan, lekin Telegram uni rad etdi (masalan bekor qilingan) — jim qolamiz.
      }
    }

    return NextResponse.json({
      hasToken: !!token,
      tokenValid,
      maskedToken: token ? `•••• ${token.slice(-6)}` : null,
      username,
      name,
      description,
      shortDescription,
    });
  } catch (error) {
    return jsonError(error);
  }
}

interface PatchBody {
  token?: string;
  name?: string;
  description?: string;
  shortDescription?: string;
}

export async function PATCH(request: NextRequest) {
  try {
    requireAdmin(request);
    const body = (await request.json()) as PatchBody;
    const origin = new URL(request.url).origin;

    if (body.token) {
      await setTelegramBotToken(body.token.trim(), origin);
    }
    if (body.name !== undefined) await setTelegramBotName(body.name);
    if (body.description !== undefined) await setTelegramBotDescription(body.description);
    if (body.shortDescription !== undefined) await setTelegramBotShortDescription(body.shortDescription);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
