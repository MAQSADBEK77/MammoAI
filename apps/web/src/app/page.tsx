"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";

export default function RootPage() {
  const { status, onboardingProfile } = useSession();
  const { dict } = useI18n();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "anonymous") {
      router.replace("/onboarding");
      return;
    }
    router.replace(onboardingProfile?.isPregnant ? "/homiladorlik" : "/tsikl");
  }, [status, onboardingProfile, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <p className="text-text-secondary">{dict.common.loading}</p>
    </div>
  );
}
