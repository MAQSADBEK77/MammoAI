import { NextResponse, type NextRequest } from "next/server";
import { jsonError, ApiError } from "@/server/api-utils";
import { hashAdminPassword, requireAdmin } from "@/server/admin-auth";
import { createAdminUser, listAdminUsers, logAdminAction } from "@/server/repo";

/** ADMIN-001: admin hisoblarini boshqarish — faqat allaqachon kirgan admin
 * (root yoki boshqa nomdagi) yangi hisob qo'sha oladi. */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    return NextResponse.json({ admins: await listAdminUsers() });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const identity = await requireAdmin(request);
    const body = (await request.json()) as { email?: string; password?: string; name?: string };
    const email = body.email?.trim().toLowerCase();
    const name = body.name?.trim();
    if (!email || !email.includes("@")) throw new ApiError(400, "To'g'ri email kiriting");
    if (!name) throw new ApiError(400, "Ism kerak");
    if (!body.password || body.password.length < 8) throw new ApiError(400, "Parol kamida 8 belgidan iborat bo'lishi kerak");

    const admin = await createAdminUser(email, hashAdminPassword(body.password), name);
    logAdminAction(identity.adminLabel, "admin_created", `${name} (${email})`).catch(() => {});
    return NextResponse.json({ admin });
  } catch (error) {
    return jsonError(error);
  }
}
