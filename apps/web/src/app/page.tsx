"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { goalToLandingTab } from "@mammoai/shared";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { LoadingSpinner } from "@/components/ui";
import { LandingPage } from "@/components/LandingPage";
import { isMedianApp } from "@/lib/median";
import { useTelegramStartLink } from "@/lib/telegram-link";

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

  // Foydalanuvchi so'rovi (2026-09-16, 2026-09-17'da qattiqlashtirildi):
  // "sinab ko'rmoqchi bo'lsa telegramdagi landing pagega yo'naltirsin
  // saytdagi dasturga emas ... umuman webdan ishlatolmasin, faqat telegram
  // bot ichidagi mini appdan foydalana olsin". "Boshlash"/"Bepul sinab
  // ko'rish" tugmalari VEB onboarding'ga ("/onboarding") ENDI HECH QACHON
  // qaytmaydi — bu yerda ilgari bo'lgan "agar bot havolasi tayyor bo'lmasa,
  // veb onboarding'ga zaxira sifatida qayt" mantig'i OLIB TASHLANDI: aynan
  // shu zaxira "ba'zida botga yo'naltirmayapti" muammosiga sabab bo'lgan
  // edi (tarmoq so'rovi WEB3-03'ning 4s taймаутidan sekinroq bo'lsa, tugma
  // veb onboarding'ga tushib qolardi). `useTelegramStartLink()` endi hech
  // qachon bo'sh qaytmaydi — hozir ma'lum bo'lgan bot username'i qattiq
  // yozilgan oxirgi chora sifatida darhol ishlatiladi, dinamik so'rov esa
  // fonda (agar boshqacha bo'lsa) yangilaydi.
  const telegramLink = useTelegramStartLink();

  function handleStart() {
    window.location.href = telegramLink;
  }

  // Foydalanuvchi so'rovi (2026-09-16, LANDING-01/WEB2-05/WEB3-03) — Median.co
  // butun saytni o'zgarishsiz WebView'da ochadi, shuning uchun marketing
  // LandingPage native ilova ichida ham chiqib qolardi. ANONIM (hali
  // onboarding'dan o'tmagan) Median-ilova foydalanuvchisi uchun landing
  // butunlay o'tkazib yuboriladi va to'g'ridan-to'g'ri Telegram botga
  // yo'naltiriladi — endi `telegramLink` hech qachon bo'sh bo'lmagani
  // uchun hech qanday "fetch tugashini kutish" yoki "veb onboarding'ga
  // zaxira" shart emas, effekt darhol ishga tushadi.
  const isMedian = isMedianApp();
  useEffect(() => {
    if (!isMedian || status !== "anonymous") return;
    window.location.href = telegramLink;
  }, [isMedian, status, telegramLink]);

  if (status === "loading" || status === "onboarded" || (isMedian && status === "anonymous")) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <LoadingSpinner label={dict.common.loading} />
      </div>
    );
  }

  return <LandingPage onStart={handleStart} />;
}
