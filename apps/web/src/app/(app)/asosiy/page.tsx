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
import { ClinicsScreen } from "@/components/screens/ClinicsScreen";

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
  const [clinicsOpen, setClinicsOpen] = useState(() => Boolean(searchParams.get("checklistItemId")));

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

  const isPregnancyMode = goalToLandingTab(onboardingProfile.primaryGoal) === "pregnancy";

  return (
    <div className="space-y-8 pb-6">
      {isPregnancyMode ? <PregnancyScreen /> : <CycleScreen />}
      <div className="border-t border-border pt-6">
        {clinicsOpen ? (
          <ClinicsScreen />
        ) : (
          <button type="button" className="w-full text-left" onClick={() => setClinicsOpen(true)}>
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
        )}
      </div>
    </div>
  );
}
