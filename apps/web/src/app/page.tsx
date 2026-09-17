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
  // WEB2-05: pastdagi Median-effekti telegramLink hali "yo'q" (fetch
  // tugamagan) bilan "chindan sozlanmagan" (fetch tugadi, url yo'q)ni
  // farqlashi kerak — shuning uchun alohida "tugadimi" bayrog'i.
  const [telegramLinkChecked, setTelegramLinkChecked] = useState(false);
  useEffect(() => {
    let cancelled = false;
    // WEB3-03: bu so'rov osilib qolgan taqdirda ham (loyihada avval bir necha
    // marta yuz bergan DB-ulanish osilib qolish holati bilan bir xil turdagi
    // muammo — postgres-pool-hang-bug xotirasiga qarang) Median foydalanuvchisi
    // ABADIY yuklanish holatida qolib ketmasin — 4 soniyadan keyin so'rovning
    // o'zi bekor qilinadi, quyidagi .catch/.finally baribir ishga tushib
    // fallback (veb onboarding) yo'liga o'tkazadi.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    api.telegram
      .getStartLink({ signal: controller.signal })
      .then((res) => {
        if (!cancelled) setTelegramLink(res.url);
      })
      .catch(() => {
        // jim yutiladi (taймаут ham shu yerga tushadi) — pastdagi
        // handleStart/Median-effekti veb onboarding'ga qaytadi
      })
      .finally(() => {
        clearTimeout(timeout);
        if (!cancelled) setTelegramLinkChecked(true);
      });
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  function handleStart() {
    if (telegramLink) {
      window.location.href = telegramLink;
    } else {
      router.push("/onboarding");
    }
  }

  // Foydalanuvchi so'rovi (2026-09-16, keyinroq LANDING-01/WEB2-05 sifatida
  // qayd etilgan): "median orqali qilsam landing page ham qo'shilib appga
  // qo'shilib ketyapti" — Median.co butun saytni o'zgarishsiz WebView'da
  // ochadi, shuning uchun marketing LandingPage native ilova ichida ham
  // chiqib qolardi. ANONIM (hali onboarding'dan o'tmagan) Median-ilova
  // foydalanuvchisi uchun landing butunlay o'tkazib yuboriladi — LEKIN
  // qayerga yo'naltirish yuqoridagi `handleStart` bilan BIR XIL qoidaga
  // bo'ysunadi: avval Telegram bot (agar sozlangan bo'lsa), aks holda veb
  // onboarding. Shuning uchun bu effekt `telegramLinkChecked` tugashini
  // kutadi — aks holda fetch hali tugamagan paytda doim onboarding'ga
  // shoshilib, botni hech qachon sinab ko'rmasdi. Sessiyasi bor
  // foydalanuvchi uchun hech narsa o'zgarmaydi — yuqoridagi birinchi
  // effekt allaqachon uni asosiy ekranga olib chiqadi.
  const isMedian = isMedianApp();
  useEffect(() => {
    if (!isMedian || status !== "anonymous" || !telegramLinkChecked) return;
    if (telegramLink) {
      window.location.href = telegramLink;
    } else {
      router.replace("/onboarding");
    }
  }, [isMedian, status, telegramLinkChecked, telegramLink, router]);

  if (status === "loading" || status === "onboarded" || (isMedian && status === "anonymous")) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <LoadingSpinner label={dict.common.loading} />
      </div>
    );
  }

  return <LandingPage onStart={handleStart} />;
}
