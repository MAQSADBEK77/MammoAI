import { useEffect } from "react";
import { View, Text } from "react-native";
import { Tabs, router } from "expo-router";
import { Calendar, Baby, ListChecks, MapPin, User } from "lucide-react-native";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";

export default function TabsLayout() {
  const { status } = useSession();
  const { dict } = useI18n();

  useEffect(() => {
    if (status === "anonymous") router.replace("/onboarding");
  }, [status]);

  if (status !== "onboarded") {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-text-secondary">{dict.common.loading}</Text>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#F43F7F",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: { backgroundColor: "#FFFFFF", borderTopColor: "#E5E7EB" },
      }}
    >
      <Tabs.Screen
        name="tsikl"
        options={{ title: dict.nav.cycle, tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="homiladorlik"
        options={{ title: dict.nav.pregnancy, tabBarIcon: ({ color, size }) => <Baby color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="tekshiruvlar"
        options={{ title: dict.nav.checklist, tabBarIcon: ({ color, size }) => <ListChecks color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="klinikalar"
        options={{ title: dict.nav.clinics, tabBarIcon: ({ color, size }) => <MapPin color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="profil"
        options={{ title: dict.nav.profile, tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
    </Tabs>
  );
}
