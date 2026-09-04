import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import { listCommunityCommentsAdmin } from "@/server/repo";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(request);
    const { id } = await context.params;
    return NextResponse.json(await listCommunityCommentsAdmin(id));
  } catch (error) {
    return jsonError(error);
  }
}
