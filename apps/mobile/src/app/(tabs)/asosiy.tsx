import { useState } from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { goalToLandingTab } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useDrawer } from "@/lib/drawer";
import { Card, LoadingSpinner } from "@/components/ui";
import { CycleScreen } from "@/components/screens/CycleScreen";
import { PregnancyScreen } from "@/components/screens/PregnancyScreen";
import { ClinicsScreen } from "@/components/screens/ClinicsScreen";

/**
 * "Asosiy" — yagona bosh tab: rejimga qarab Tsikl yoki Homiladorlik
 * tarkibini, undan keyin esa Klinikalar bo'limini ko'rsatadi (foydalanuvchi
 * so'roviga ko'ra 4 ta bo'limli navigatsiyaga siqish uchun birlashtirildi).
 * Klinikalar bo'limi yopiq holatda boshlanadi — ustiga bosilganda ochiladi
 * (agar checklistItemId bilan kirilgan bo'lsa, avtomatik ochiq keladi).
 */
export default function AsosiyScreen() {
  const { dict } = useI18n();
  const { onboardingProfile } = useSession();
  const { checklistItemId } = useLocalSearchParams<{ checklistItemId?: string }>();
  const [clinicsOpen, setClinicsOpen] = useState(() => Boolean(checklistItemId));
  const { openDrawer } = useDrawer();

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
      <ScrollView className="flex-1 px-4 pt-4" contentContainerClassName="gap-8 pb-32">
        <Pressable onPress={openDrawer} className="h-9 w-9 items-center justify-center rounded-full bg-surface active:scale-95">
          <MaterialCommunityIcons name="menu" size={22} color="#1F2937" />
        </Pressable>
        {isPregnancyMode ? <PregnancyScreen /> : <CycleScreen />}
        <View className="border-t border-border pt-6">
          {clinicsOpen ? (
            <ClinicsScreen />
          ) : (
            <Pressable className="active:scale-[0.98]" onPress={() => setClinicsOpen(true)}>
              <Card className="flex-row items-center gap-3">
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-accent/10">
                  <MaterialCommunityIcons name="map-marker-outline" size={20} color="#0D9488" />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="font-bold text-text-primary">{dict.clinics.title}</Text>
                  <Text className="text-sm text-text-secondary">{dict.clinics.seedDataNotice}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18} color="#9CA3AF" />
              </Card>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
