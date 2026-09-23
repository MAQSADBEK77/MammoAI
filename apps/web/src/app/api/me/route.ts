import { NextResponse, type NextRequest } from "next/server";
import { countOverdueChecklistItems, deleteUser, getOnboardingProfile, hasPremiumAccess, updateUser } from "@/server/repo";
import { ApiError, jsonError, requireUser } from "@/server/api-utils";
import { SESSION_COOKIE } from "@/server/session";
import { PET_IDS, type User } from "@mammoai/shared";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const [onboardingProfile, hasPremium, overdueCheckups] = await Promise.all([
      getOnboardingProfile(user.id),
      hasPremiumAccess(user.id),
      countOverdueChecklistItems(user.id),
    ]);
    return NextResponse.json({ user, onboardingProfile, hasPremium, overdueCheckups });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as Partial<
      Pick<
        User,
        | "name"
        | "phone"
        | "language"
        | "fontScale"
        | "theme"
        | "notificationsEnabled"
        | "avatarUrl"
        | "lastLocationLat"
        | "lastLocationLng"
        | "pet"
      >
    >;
    // FIX-02: `phone` bu yerda ATAYLAB tashlab yuboriladi (destructuring orqali —
    // shunchaki TS tipidan olib tashlash yetarli emas, chunki updateUser xom
    // obyektni ${merged.phone} bilan to'g'ridan-to'g'ri SQL'ga yozadi). Login
    // paytida `findUserByIdentifier` telefon raqamini YAGONA identifikator
    // sifatida ishlatadi — foydalanuvchi o'zini o'zi qayta tasdiqlashsiz
    // istalgan raqamga o'zgartira olsa, keyin o'sha raqamning HAQIQIY egasi
    // OTP orqali tasdiqlaganda hujumchining oldindan yaratilgan akkauntiga
    // kiritib yuboriladi. Telefonni o'zgartirish faqat OTP-tasdiqlash oqimi
    // (ro'yxatdan o'tishdagi kabi) orqali bo'lishi kerak, shu yerda emas.
    const { phone: _ignoredPhone, ...patch } = body;
    // PET-01/02: `pet` mijozdan keladi — faqat tanilgan hayvon, "none"
    // (ataylab hayvonsiz) yoki `null` qabul qilinadi; ixtiyoriy matn ustunga
    // tushib qolmasligi kerak.
    if ("pet" in patch && patch.pet !== null && patch.pet !== "none" && !PET_IDS.includes(patch.pet as never)) {
      return NextResponse.json({ error: "Noma'lum tanlov" }, { status: 400 });
    }
    // OVERNIGHT-18: `lastLocationAt` mijozdan ISHONCH bilan qabul qilinmaydi
    // (soxta sana yuborishning oldini olish uchun) — koordinata kelgan
    // zahoti server vaqti ishlatiladi. Asosiy sonli qiymatlar ham
    // tekshiriladi — buzuq/xato koordinata bazaga tushib qolmasin.
    let locationPatch: Pick<User, "lastLocationLat" | "lastLocationLng" | "lastLocationAt"> | Record<string, never> = {};
    if (patch.lastLocationLat != null || patch.lastLocationLng != null) {
      const { lastLocationLat: lat, lastLocationLng: lng } = patch;
      if (typeof lat !== "number" || typeof lng !== "number" || Number.isNaN(lat) || Number.isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        throw new ApiError(400, "Noto'g'ri koordinata");
      }
      locationPatch = { lastLocationLat: lat, lastLocationLng: lng, lastLocationAt: new Date().toISOString() };
    }
    const updated = await updateUser(user.id, { ...patch, ...locationPatch });
    const [onboardingProfile, hasPremium] = await Promise.all([getOnboardingProfile(user.id), hasPremiumAccess(user.id)]);
    return NextResponse.json({ user: updated, onboardingProfile, hasPremium });
  } catch (error) {
    return jsonError(error);
  }
}

/** Play Store "akkauntni o'chirish" talabi — foydalanuvchi o'zi va barcha
 * ma'lumotlarini (tsikl, homiladorlik, jamiyat postlari, hamkorlik...) bir
 * bosishda butunlay o'chira oladi (repo.ts:deleteUser — CASCADE orqali). */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser(request);
    await deleteUser(user.id);
    const res = NextResponse.json({ ok: true });
    res.cookies.delete(SESSION_COOKIE);
    return res;
  } catch (error) {
    return jsonError(error);
  }
}
