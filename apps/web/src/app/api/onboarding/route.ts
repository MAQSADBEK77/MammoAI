import { NextResponse, type NextRequest } from "next/server";
import type { OnboardingProfile } from "@mammoai/shared";
import { jsonError, requireUser } from "@/server/api-utils";
import { saveOnboardingProfile, updateOnboardingProfile, updateUser } from "@/server/repo";
import { syncChecklistForUser } from "@/server/checklist-sync";

type OnboardingBody = Omit<OnboardingProfile, "userId"> & { notificationsEnabled: boolean };

/**
 * Onboarding so'rovnomasini yakunlaydi — App.pdf §2 bo'yicha akkaunt allaqachon
 * `/api/auth/start`da yaratilgan/topilgan, bu route faqat profilni to'ldiradi.
 *
 * MUHIM (tezlik): bu yerda ilgari 4 ta yozuv/o'qish ketma-ket bajarilar edi
 * (saqlash → foydalanuvchi yangilash → checklist → profilni QAYTA o'qish) —
 * oxirgisi butunlay ortiqcha edi (`profile` obyekti allaqachon qo'lda bor,
 * saqlash uni o'zgartirmaydi). Mustaqil ikkitasi (foydalanuvchi yangilash,
 * checklist) endi parallel — "tahlil qilinmoqda" ekranida sezilarli osilib
 * qolishning asosiy sababi shu ketma-ketlik edi.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as OnboardingBody;
    if (!body.age || body.age < 13 || body.age > 100) {
      return NextResponse.json({ error: "Yosh noto'g'ri kiritildi (kamida 13 bo'lishi kerak)" }, { status: 400 });
    }

    const profile: OnboardingProfile = { userId: user.id, ...body };
    await saveOnboardingProfile(profile);
    const [updatedUser] = await Promise.all([
      updateUser(user.id, { name: body.name, notificationsEnabled: body.notificationsEnabled }),
      syncChecklistForUser(user.id, profile),
    ]);

    return NextResponse.json({ user: updatedUser, onboardingProfile: profile });
  } catch (error) {
    return jsonError(error);
  }
}

/** Profil — "REJIMNI TANLANG" va shaxsiy ma'lumotlarni qisman yangilash. */
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const patch = (await request.json()) as Partial<
      Pick<OnboardingProfile, "primaryGoal" | "isPregnant" | "age" | "heightCm" | "weightKg" | "bloodType">
    >;
    const onboardingProfile = await updateOnboardingProfile(user.id, patch);
    return NextResponse.json({ onboardingProfile });
  } catch (error) {
    return jsonError(error);
  }
}
