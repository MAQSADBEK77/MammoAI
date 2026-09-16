"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { goalToLandingTab } from "@mammoai/shared";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { LoadingSpinner } from "@/components/ui";
import { LandingPage } from "@/components/LandingPage";
import { api } from "@/lib/api";
import { isMedianApp } from "@/lib/median";

export default function RootPage() {
  const { status, onboardingProfile } = useSession();
  const { dict } = useI18n();
  const router = useRouter();

  // Sessiyasi bor (onboarding'ni tugatgan) foydalanuvchi mammo.uz'ga qayta
  // kirganda to'g'ridan-to'g'ri ilovaga tushadi — landing faqat ANONIM
  // (birinchi marta kirgan yoki hali ro'yxatdan o'tmagan) tashrifchilarga
  // ko'rsatiladi.
  useEffect(() => {
    if (status !== "onboarded" || !onboardingProfile) return;
    const tab = goalToLandingTab(onboardingProfile.primaryGoal);
    router.replace(tab === "checkups" ? "/tekshiruvlar" : tab === "partner" ? "/hamkor" : "/asosiy");
  }, [status, onboardingProfile, router]);

  // Foydalanuvchi so'rovi (2026-09-16): "median orqali qilsam landing page
  // ham qo'shilib appga qo'shilib ketyapti" — Median.co butun saytni
  // o'zgarishsiz WebView'da ochadi, shuning uchun marketing LandingPage
  // native ilova ichida ham chiqib qolardi. ANONIM (hali onboarding'dan
  // o'tmagan) Median-ilova foydalanuvchisi uchun landing butunlay
  // o'tkazib yuboriladi — to'g'ridan-to'g'ri onboarding'ga (lib/median.ts).
  // Sessiyasi bor foydalanuvchi uchun hech narsa o'zgarmaydi — yuqoridagi
  // effekt allaqachon uni asosiy ekranga olib chiqadi.
  const isMedian = isMedianApp();
  useEffect(() => {
    if (isMedian && status === "anonymous") router.replace("/onboarding");
  }, [isMedian, status, router]);

  // Foydalanuvchi so'rovi (2026-09-16): "sinab ko'rmoqchi bo'lsa telegramdagi
  // landing pagega yo'naltirsin saytdagi dasturga emas" — "Boshlash"/"Bepul
  // sinab ko'rish" tugmalari endi VEB onboarding ("/onboarding") o'rniga
  // to'g'ridan-to'g'ri Telegram botga (u yerdagi Mini App "landing"
  // tajribasiga — apps/web/src/app/tg/page.tsx, Telegram identifikatsiyasi
  // orqali avtomatik autentifikatsiya, telefon+SMS qadamlarsiz) yo'naltiradi.
  // Bot hali admin panelda sozlanmagan (yoki so'rov muvaffaqiyatsiz) bo'lsa —
  // eski xatti-harakat (veb onboarding) ZAXIRA (fallback) sifatida saqlanadi,
  // tugma hech qachon "o'lik" bo'lib qolmasligi uchun.
  const [telegramLink, setTelegramLink] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    api.telegram
      .getStartLink()
      .then((res) => {
        if (!cancelled) setTelegramLink(res.url);
      })
      .catch(() => {
        // jim yutiladi — pastdagi handleStart veb onboarding'ga qaytadi
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleStart() {
    if (telegramLink) {
      window.location.href = telegramLink;
    } else {
      router.push("/onboarding");
    }
  }

  if (status === "loading" || status === "onboarded" || (isMedian && status === "anonymous")) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <LoadingSpinner label={dict.common.loading} />
      </div>
    );
  }

  return <LandingPage onStart={handleStart} />;
}
