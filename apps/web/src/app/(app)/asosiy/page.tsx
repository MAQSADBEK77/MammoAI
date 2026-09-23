"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PlaceOutlined, ChevronRight } from "@mui/icons-material";
import { goalToLandingTab } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { Card, LoadingSpinner } from "@/components/ui";
import { CycleScreen } from "@/components/screens/CycleScreen";
import { PregnancyScreen } from "@/components/screens/PregnancyScreen";
import { NotificationsOptInCard } from "@/components/screens/NotificationsOptInCard";

/**
 * "Asosiy" — yagona bosh sahifa: rejimga qarab Tsikl yoki Homiladorlik
 * tarkibini, undan keyin esa Klinikalar bo'limini ko'rsatadi (foydalanuvchi
 * so'roviga ko'ra 4 ta bo'limli navigatsiyaga siqish uchun birlashtirildi).
 * Klinikalar bo'limi yopiq holatda boshlanadi — ustiga bosilganda ochiladi
 * (agar checklistItemId bilan kirilgan bo'lsa, avtomatik ochiq keladi).
 */
export default function AsosiyPage() {
  const { dict } = useI18n();
  const { onboardingProfile } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  // "Hamkorimni kuzataman" maqsadi tanlangan foydalanuvchida shaxsiy sikl/
  // homiladorlik ma'lumoti umuman yo'q — bosh sahifasi to'g'ridan-to'g'ri
  // Hamkor bo'limi (pastki menyudan "Asosiy"ga bosilsa ham shu yerga qaytadi).
  useEffect(() => {
    if (onboardingProfile && goalToLandingTab(onboardingProfile.primaryGoal) === "partner") {
      router.replace("/hamkor");
    }
  }, [onboardingProfile, router]);

  if (!onboardingProfile || goalToLandingTab(onboardingProfile.primaryGoal) === "partner") {
    return <LoadingSpinner label={dict.common.loading} />;
  }

  // TODAY-01: ilgari bu shart `goalToLandingTab(...) === "pregnancy"` edi, ya'ni
  // "homiladorlikni REJALASHTIRAMAN" degan (hali homilador BO'LMAGAN)
  // foydalanuvchi ham PregnancyScreen'ga — homiladorlik haftalari, tepishlar
  // sanog'iga — tushib qolardi. Endi PregnancyScreen faqat haqiqiy
  // homiladorlik rejimida; rejalashtiruvchilar sikl ekraniga o'tadi (onboarding
  // ularda sikl ma'lumotini ALLAQACHON so'raydi — goal.ts#needsCycleInfo).
  const isPregnancyMode = onboardingProfile.primaryGoal === "pregnancy";

  // Referens bo'yicha qayta bezalgan "Bugun" ekrani — foydalanuvchi so'roviga
  // ko'ra faqat shu ikki maqsad uchun. Qolgan sikl-asosidagi maqsadlar
  // (wellbeing, understand_body, skin, perimenopause) hozircha o'zgarishsiz
  // "classic" ko'rinishda qoladi.
  // MODE-HONESTY-01: ilgari faqat "cycle" va "planning_pregnancy" yangi
  // ekranni olardi. Qolgan sikl-asosidagi rejimlar (wellbeing, skin,
  // understand_body, perimenopause, checkups) ESKI ko'rinishda qolardi —
  // ya'ni "Umumiy salomatlik" ni tanlagan 33 ayol, bilmagan holda,
  // kamroq sayqallangan ekranni olgan edi. Bu rejimlarning hech biri
  // eski ekranga MUHTOJ emas — farq shunchaki e'tibordan chetda qolgan.
  // Endi barcha sikl-asosidagi rejimlar bir xil, yangi ekranni oladi.
  //
  // `perimenopause` ATAYLAB chetda: u bashorat halqasi o'rniga o'z
  // kartasini ko'rsatadigan qilib maxsus qurilgan ("necha kun qoldi"
  // savolining o'zi u yerda ma'nosiz) va uni yangi ekranga ko'chirish
  // alohida, ehtiyotkor ish — bu tuzatishning maqsadi emas.
  const useTodayVariant =
    goalToLandingTab(onboardingProfile.primaryGoal) === "cycle" && onboardingProfile.primaryGoal !== "perimenopause";

  return (
    <div className="space-y-8 pb-6">
      {/* NOTIF-02: eslatmalarni yoqish taklifi — NOTIF-01 xatosi tufayli
          jimgina o'chirilib qolgan ayollarga tanlovni qaytaradi. Faqat
          bildirishnomasi o'chiq bo'lganlarga va bir marta ko'rinadi. */}
      <NotificationsOptInCard />

      {isPregnancyMode ? <PregnancyScreen /> : <CycleScreen variant={useTodayVariant ? "today" : "classic"} />}
      <div className="border-t border-border pt-6">
        {/* BRIDGE-01: karta endi bo'limni SHU YERDA ochmaydi, balki
            `/klinikalar` sahifasiga olib boradi.
            Ilgari ro'yxat shu yerda, bosh sahifaning eng pastida ochilardi —
            va o'lchov bo'yicha unga deyarli hech kim yetib bormasdi
            (30 kunda 1 foydalanuvchi). Bugun bosh sahifa yana beshta blokka
            uzaydi, ya'ni holat yomonlashardi. */}
        <button type="button" className="w-full text-left" onClick={() => router.push("/klinikalar")}>
          <Card interactive className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
              <PlaceOutlined sx={{ fontSize: 20 }} className="text-accent" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-text-primary">{dict.clinics.title}</p>
              <p className="text-sm text-text-secondary">{dict.clinics.seedDataNotice}</p>
            </div>
            <ChevronRight sx={{ fontSize: 18 }} className="shrink-0 text-text-muted" />
          </Card>
        </button>
      </div>
    </div>
  );
}
