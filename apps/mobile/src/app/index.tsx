import { useEffect } from "react";
import { View, Text } from "react-native";
import { router } from "expo-router";
import { goalToLandingTab } from "@mammoai/shared";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { LoadingSpinner } from "@/components/ui";

export default function IndexScreen() {
  const { status, onboardingProfile } = useSession();
  const { dict } = useI18n();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "anonymous" || !onboardingProfile) {
      router.replace("/onboarding");
      return;
    }
    const tab = goalToLandingTab(onboardingProfile.primaryGoal);
    router.replace(tab === "cycle" ? "/(tabs)/tsikl" : tab === "pregnancy" ? "/(tabs)/homiladorlik" : "/(tabs)/tekshiruvlar");
  }, [status, onboardingProfile]);

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <LoadingSpinner label={dict.common.loading} />
    </View>
  );
}
