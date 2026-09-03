import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { goalToLandingTab } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { LoadingSpinner } from "@/components/ui";
import { CycleScreen } from "@/components/screens/CycleScreen";
import { PregnancyScreen } from "@/components/screens/PregnancyScreen";
import { ClinicsScreen } from "@/components/screens/ClinicsScreen";

/**
 * "Asosiy" — yagona bosh tab: rejimga qarab Tsikl yoki Homiladorlik
 * tarkibini, undan keyin esa Klinikalar bo'limini ko'rsatadi (foydalanuvchi
 * so'roviga ko'ra 4 ta bo'limli navigatsiyaga siqish uchun birlashtirildi).
 */
export default function AsosiyScreen() {
  const { dict } = useI18n();
  const { onboardingProfile } = useSession();

  if (!onboardingProfile) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <LoadingSpinner label={dict.common.loading} />
      </SafeAreaView>
    );
  }

  const isPregnancyMode = goalToLandingTab(onboardingProfile.primaryGoal) === "pregnancy";

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4 pt-4" contentContainerClassName="gap-4 pb-32">
        {isPregnancyMode ? <PregnancyScreen /> : <CycleScreen />}
        <View className="border-t border-border pt-6">
          <ClinicsScreen />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
