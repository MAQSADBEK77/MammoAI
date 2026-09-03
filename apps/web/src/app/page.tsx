"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { goalToLandingTab } from "@mammoai/shared";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { LoadingSpinner } from "@/components/ui";

export default function RootPage() {
  const { status, onboardingProfile } = useSession();
  const { dict } = useI18n();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "anonymous" || !onboardingProfile) {
      router.replace("/onboarding");
      return;
    }
    const tab = goalToLandingTab(onboardingProfile.primaryGoal);
    router.replace(tab === "checkups" ? "/tekshiruvlar" : "/asosiy");
  }, [status, onboardingProfile, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <LoadingSpinner label={dict.common.loading} />
    </div>
  );
}
