"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { BottomNav } from "@/components/BottomNav";
import { AppDrawer } from "@/components/AppDrawer";
import { LoadingSpinner } from "@/components/ui";

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
        <LoadingSpinner label={dict.common.loading} />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background pb-24">
      {/* Telegram Mini App'da fullscreen sarlavha paneli shaffof holda shu
          yerning ustida qoladi (lib/telegram.ts) — `--tg-safe-area-top`
          oddiy brauzerda 0px, Mini App'da esa panel balandligiga teng
          bo'lib, burger-menyu tugmasi tugmalar ostida qolib ketmaydi. */}
      <div className="mx-auto max-w-2xl px-4 pt-4" style={{ paddingTop: "calc(var(--tg-safe-area-top) + 1rem)" }}>
        <AppDrawer />
      </div>
      <div className="mx-auto max-w-2xl px-4 pt-2">{children}</div>
      <BottomNav />
    </div>
  );
}
