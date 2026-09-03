import { useEffect } from "react";
import { View, Text } from "react-native";
import { Tabs, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Calendar, Baby, ListChecks, Users, MapPin, User } from "lucide-react-native";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { TabBarBackground, TabIcon } from "@/components/TabBar";
import { LoadingSpinner } from "@/components/ui";

export default function TabsLayout() {
  const { status } = useSession();
  const { dict } = useI18n();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (status === "anonymous") router.replace("/onboarding");
  }, [status]);

  if (status !== "onboarded") {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <LoadingSpinner label={dict.common.loading} />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "rgba(255,255,255,0.5)",
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700", marginTop: -2 },
        tabBarItemStyle: { paddingTop: 6 },
        // Suzuvchi, tungi-siyoh pilla panel — referens UI-kitlardagi uslub.
        tabBarStyle: {
          position: "absolute",
          left: 16,
          right: 16,
          bottom: insets.bottom + 10,
          height: 66,
          borderRadius: 32,
          borderTopWidth: 0,
          backgroundColor: "transparent",
          paddingHorizontal: 6,
          elevation: 10,
          shadowColor: "#000",
          shadowOpacity: 0.28,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 10 },
        },
        tabBarBackground: () => <TabBarBackground />,
      }}
    >
      <Tabs.Screen
        name="tsikl"
        options={{
          title: dict.nav.cycle,
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon focused={focused}>
              <Calendar color={color} size={size} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="jamiyat"
        options={{
          title: dict.nav.community,
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon focused={focused}>
              <Users color={color} size={size} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="homiladorlik"
        options={{
          title: dict.nav.pregnancy,
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon focused={focused}>
              <Baby color={color} size={size} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="tekshiruvlar"
        options={{
          title: dict.nav.checklist,
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon focused={focused}>
              <ListChecks color={color} size={size} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="klinikalar"
        options={{
          title: dict.nav.clinics,
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon focused={focused}>
              <MapPin color={color} size={size} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: dict.nav.profile,
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon focused={focused}>
              <User color={color} size={size} />
            </TabIcon>
          ),
        }}
      />
    </Tabs>
  );
}
