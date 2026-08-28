import { useEffect } from "react";
import { View, Text } from "react-native";
import { router } from "expo-router";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";

export default function IndexScreen() {
  const { status, onboardingProfile } = useSession();
  const { dict } = useI18n();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "anonymous") {
      router.replace("/onboarding");
      return;
    }
    router.replace(onboardingProfile?.isPregnant ? "/(tabs)/homiladorlik" : "/(tabs)/tsikl");
  }, [status, onboardingProfile]);

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-text-secondary">{dict.common.loading}</Text>
    </View>
  );
}
