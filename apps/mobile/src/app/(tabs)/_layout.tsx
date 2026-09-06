import { useEffect } from "react";
import { View } from "react-native";
import { Tabs, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { TabBarBackground, TabIcon } from "@/components/TabBar";
import { LoadingSpinner } from "@/components/ui";
import { trackClick } from "@/lib/analytics";

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
      {/* "Asosiy" — Tsikl/Homiladorlik (rejimga qarab) + Klinikalar birlashtirilgan
          yagona bosh tab (foydalanuvchi so'roviga ko'ra 4 ta bo'limga siqildi). */}
      <Tabs.Screen
        name="asosiy"
        options={{
          title: dict.nav.home,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <MaterialCommunityIcons name={focused ? "home" : "home-outline"} color={color} size={26} />
            </TabIcon>
          ),
        }}
        listeners={{ tabPress: () => trackClick("/asosiy", dict.nav.home) }}
      />
      <Tabs.Screen
        name="jamiyat"
        options={{
          title: dict.nav.community,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <MaterialCommunityIcons name={focused ? "account-group" : "account-group-outline"} color={color} size={26} />
            </TabIcon>
          ),
        }}
        listeners={{ tabPress: () => trackClick("/jamiyat", dict.nav.community) }}
      />
      <Tabs.Screen
        name="tekshiruvlar"
        options={{
          title: dict.nav.checklist,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <MaterialCommunityIcons name={focused ? "clipboard-check" : "clipboard-check-outline"} color={color} size={26} />
            </TabIcon>
          ),
        }}
        listeners={{ tabPress: () => trackClick("/tekshiruvlar", dict.nav.checklist) }}
      />
      {/* Hamkor — foydalanuvchi so'roviga ko'ra pastki menyuga qo'shildi. */}
      <Tabs.Screen
        name="hamkor"
        options={{
          title: dict.partner.title,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <MaterialCommunityIcons name={focused ? "heart" : "heart-outline"} color={color} size={26} />
            </TabIcon>
          ),
        }}
        listeners={{ tabPress: () => trackClick("/hamkor", dict.partner.title) }}
      />
      {/* AI Yordamchi — sikl/homiladorlik tarixidan kontekst olib suhbatlashadigan,
          takrorlanuvchi simptomlarni signal qiladigan yordamchi. */}
      <Tabs.Screen
        name="yordamchi"
        options={{
          title: dict.nav.assistant,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <MaterialCommunityIcons name={focused ? "robot" : "robot-outline"} color={color} size={26} />
            </TabIcon>
          ),
        }}
        listeners={{ tabPress: () => trackClick("/yordamchi", dict.nav.assistant) }}
      />
      {/* Profil endi pastki menyuda emas — faqat chap burger menyusi orqali
          ochiladi (foydalanuvchi so'rovi). `href: null` marshrutni ishlaydigan
          holda qoldiradi, lekin tab panelidan yashiradi. */}
      <Tabs.Screen name="profil" options={{ href: null }} />
    </Tabs>
  );
}
