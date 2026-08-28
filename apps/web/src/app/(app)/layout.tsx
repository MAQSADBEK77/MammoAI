"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const { dict } = useI18n();
  const router = useRouter();

  useEffect(() => {
    if (status === "anonymous") router.replace("/onboarding");
  }, [status, router]);

  if (status !== "onboarded") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <p className="text-text-secondary">{dict.common.loading}</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background pb-24">
      <div className="mx-auto max-w-2xl px-4 pt-6">{children}</div>
      <BottomNav />
    </div>
  );
}
