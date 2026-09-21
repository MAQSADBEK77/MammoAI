"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { BottomNav } from "@/components/BottomNav";
import { AppDrawer, AppDrawerProvider } from "@/components/AppDrawer";
import { LoadingSpinner } from "@/components/ui";
import { PageTransition } from "@/components/PageTransition";

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
    if (status !== "anonymous") return;

    // DEV-MODE-01: brauzerda `localStorage.mode = "test"` bo'lsa, sessiyasiz
    // kelgan so'rov onboarding'ga EMAS, test hisobiga avtomatik kiritiladi.
    //
    // Nega shunchaki "yo'naltirmaslik" YETARLI EMAS: onboarding'ga o'tmasak
    // ham, sessiya bo'lmagani uchun `onboardingProfile` bo'sh qoladi va
    // ekranlar cheksiz "yuklanmoqda" holatida qotib qolardi. Shuning uchun
    // bayroq ko'rilganda `/api/dev-login` chaqiriladi — u cookie'ni server
    // tomonida qo'yadi va shu yerga qaytaradi.
    //
    // XAVFSIZLIK: uch qatlamli himoya —
    //   1) bu shart faqat `NODE_ENV === "development"`da bajariladi
    //      (Vercel build har doim "production", ya'ni kod umuman ishlamaydi);
    //   2) `/api/dev-login` ham production'da 404 qaytaradi;
    //   3) u faqat `is_test_account = TRUE` hisobiga kiradi — haqiqiy
    //      foydalanuvchi hisobiga hech qachon.
    if (process.env.NODE_ENV === "development") {
      try {
        if (window.localStorage.getItem("mode") === "test") {
          // `router.push()` EMAS, ataylab to'liq navigatsiya: `/api/dev-login`
          // sahifa emas, route handler — u `Set-Cookie` yuboradi va qayta
          // yo'naltiradi. Next'ning mijoz-router'i route handler'ga o'ta
          // olmaydi va cookie'ni qabul qilmaydi, shuning uchun bu yerda
          // brauzerning o'z navigatsiyasi SHART.
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- route handler, sahifa emas (yuqoridagi izoh)
          window.location.href = `/api/dev-login?next=${encodeURIComponent(pathname ?? "/asosiy")}`;
          return;
        }
      } catch {
        // localStorage bloklangan — oddiy yo'l bilan davom etamiz.
      }
    }

    router.replace("/onboarding");
  }, [status, router, pathname]);

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
          <PageTransition>{children}</PageTransition>
        </div>
        <BottomNav />
      </div>
    </AppDrawerProvider>
  );
}
