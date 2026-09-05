"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { goalToLandingTab } from "@mammoai/shared";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { LoadingSpinner } from "@/components/ui";
import { LandingPage } from "@/components/LandingPage";

export default function RootPage() {
  const { status, onboardingProfile } = useSession();
  const { dict } = useI18n();
  const router = useRouter();

  // Sessiyasi bor (onboarding'ni tugatgan) foydalanuvchi mammo.uz'ga qayta
  // kirganda to'g'ridan-to'g'ri ilovaga tushadi — landing faqat ANONIM
  // (birinchi marta kirgan yoki hali ro'yxatdan o'tmagan) tashrifchilarga
  // ko'rsatiladi (foydalanuvchi so'rovi: "1-marta kirganda landing ochilishi
  // kerak, sinab ko'rish tugmasi bosilganda dasturga kirishi kerak").
  useEffect(() => {
    if (status !== "onboarded" || !onboardingProfile) return;
    const tab = goalToLandingTab(onboardingProfile.primaryGoal);
    router.replace(tab === "checkups" ? "/tekshiruvlar" : "/asosiy");
  }, [status, onboardingProfile, router]);

  if (status === "loading" || status === "onboarded") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <LoadingSpinner label={dict.common.loading} />
      </div>
    );
  }

  return <LandingPage onStart={() => router.push("/onboarding")} />;
}
