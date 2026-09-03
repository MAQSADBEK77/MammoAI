// Pastki navigatsiya paneli uchun yordamchi — ikkala referens UI-kit'da ham
// uchraydigan uslub (qorong'i suzuvchi pilla panel, faol element gradient
// doira ichida). expo-router'ning `Tabs` komponenti ustidan `@react-navigation/
// bottom-tabs` paketi alohida o'rnatilmagan (expo-router uni ichida jamlagan),
// shuning uchun butun tabBar'ni almashtirish o'rniga hujjatlashtirilgan
// `tabBarBackground` + har bir ekran uchun `tabBarIcon` orqali ishlaymiz —
// bu ancha barqaror va versiyaga bog'liq bo'lmagan yo'l.
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { gradients } from "@mammoai/shared";
import { useModeAccent } from "@/lib/theme";
import type { ReactNode } from "react";

/** Pastki panel foni — tungi-siyoh diagonal gradient (screenOptions.tabBarBackground). */
export function TabBarBackground() {
  return (
    <LinearGradient
      colors={gradients.navBar}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1, borderRadius: 32 }}
    />
  );
}

/** Faol tab ikonasi uchun gradient doira o'rash (screenOptions ichida emas,
 * har bir Tabs.Screen'ning `tabBarIcon`'ida ishlatiladi). Rang joriy rejimga
 * (Hayz/Homiladorlik/Tayyorgarlik) qarab butunlay o'zgaradi. */
export function TabIcon({ focused, children }: { focused: boolean; children: ReactNode }) {
  const accent = useModeAccent();
  if (!focused) {
    return <View style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>{children}</View>;
  }
  return (
    <LinearGradient
      colors={[accent.primary, accent.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" }}
    >
      {children}
    </LinearGradient>
  );
}
