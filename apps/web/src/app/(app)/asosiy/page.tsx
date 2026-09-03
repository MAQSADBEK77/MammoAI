"use client";

import { goalToLandingTab } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { LoadingSpinner } from "@/components/ui";
import { CycleScreen } from "@/components/screens/CycleScreen";
import { PregnancyScreen } from "@/components/screens/PregnancyScreen";
import { ClinicsScreen } from "@/components/screens/ClinicsScreen";

/**
 * "Asosiy" — yagona bosh sahifa: rejimga qarab Tsikl yoki Homiladorlik
 * tarkibini, undan keyin esa Klinikalar bo'limini ko'rsatadi (foydalanuvchi
 * so'roviga ko'ra 4 ta bo'limli navigatsiyaga siqish uchun birlashtirildi).
 */
export default function AsosiyPage() {
  const { dict } = useI18n();
  const { onboardingProfile } = useSession();

  if (!onboardingProfile) {
    return <LoadingSpinner label={dict.common.loading} />;
  }

  const isPregnancyMode = goalToLandingTab(onboardingProfile.primaryGoal) === "pregnancy";

  return (
    <div className="space-y-8 pb-6">
      {isPregnancyMode ? <PregnancyScreen /> : <CycleScreen />}
      <div className="border-t border-border pt-6">
        <ClinicsScreen />
      </div>
    </div>
  );
}
