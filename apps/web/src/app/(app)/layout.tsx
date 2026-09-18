"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { BottomNav } from "@/components/BottomNav";
import { AppDrawer, AppDrawerProvider } from "@/components/AppDrawer";
import { LoadingSpinner } from "@/components/ui";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const { dict } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  // 2026-09-18 UX qayta qurish: /asosiy (CycleScreen) endi burger-menyuni
  // O'ZINING yuqori qatorida (profil-avatar) ochadi — global panel bu yerda
  // ikki marta ko'rsatilmasligi uchun shu bitta sahifada yashiriladi
  // (boshqa hamma ekranda o'zgarishsiz qoladi).
  const showGlobalDrawerBar = pathname !== "/asosiy";

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
    <AppDrawerProvider>
      <div
        className="min-h-dvh bg-background"
        // Pastdagi suzuvchi menyu (BottomNav) endi Telegram Mini App'da
        // odatdagidan balandroq bo'lishi mumkin (--tg-safe-area-bottom) —
        // sahifa mazmuni shu balandlikdan pastda qolib, menyu ostida
        // "siqilib" ko'rinmasligi uchun scroll maydoni ham shunga mos kengaytiriladi.
        style={{ paddingBottom: "calc(6rem + var(--tg-safe-area-bottom))" }}
      >
        {/* Telegram Mini App'da fullscreen sarlavha paneli shaffof holda shu
            yerning ustida qoladi (lib/telegram.ts) — `--tg-safe-area-top`
            oddiy brauzerda 0px, Mini App'da esa panel balandligiga teng
            bo'lib, burger-menyu tugmasi tugmalar ostida qolib ketmaydi. */}
        {showGlobalDrawerBar && (
          <div className="mx-auto max-w-2xl px-4 pt-4" style={{ paddingTop: "calc(var(--tg-safe-area-top) + 1rem)" }}>
            <AppDrawer />
          </div>
        )}
        <div
          className="mx-auto max-w-2xl px-4 pt-2"
          style={!showGlobalDrawerBar ? { paddingTop: "calc(var(--tg-safe-area-top) + 1rem)" } : undefined}
        >
          {children}
        </div>
        <BottomNav />
      </div>
    </AppDrawerProvider>
  );
}
