import "../global.css";
import { vars } from "nativewind";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { resolveThemeColors } from "@mammoai/shared";
import { I18nProvider } from "@/lib/i18n";
import { SessionProvider } from "@/lib/session";
import { useResolvedTheme } from "@/lib/theme";
import { IllustrationsProvider } from "@/lib/illustrations";
import { DynamicPaperProvider } from "@/lib/paper-theme";
import { DrawerProvider } from "@/lib/drawer";
import { AppDrawer } from "@/components/AppDrawer";
import { useAnalytics } from "@/lib/analytics";

/** `useAnalytics` expo-router'ning global yo'l kontekstiga muhtoj — shuning
 * uchun `<Stack>` bilan bir qatorda, alohida (ko'rinmas) komponentda chaqiriladi. */
function AnalyticsMount() {
  useAnalytics();
  return null;
}

/** Butun ilova daraxtini NativeWind `vars()` bilan o'raydi — shu orqali
 * tailwind.config.js'dagi `var(--color-background)` va h.k. CSS
 * o'zgaruvchilari joriy hal qilingan mavzuga (yorug'/qorong'u) mos qiymatga
 * ega bo'ladi (web'dagi globals.css'ning `[data-theme="dark"]` bloki bilan
 * bir xil g'oya). `useResolvedTheme` sessiyaga muhtoj bo'lgani uchun bu
 * komponent SessionProvider ICHIDA bo'lishi shart.
 */
function ThemedApp() {
  const resolvedTheme = useResolvedTheme();
  const colors = resolveThemeColors(resolvedTheme);
  const themeVars = vars({
    "--color-background": colors.background,
    "--color-surface": colors.surface,
    "--color-surface-muted": colors.surfaceMuted,
    "--color-text-primary": colors.textPrimary,
    "--color-text-secondary": colors.textSecondary,
    "--color-text-muted": colors.textMuted,
    "--color-border": colors.border,
  });

  return (
    <View style={[{ flex: 1 }, themeVars]}>
      <IllustrationsProvider>
        <DynamicPaperProvider>
          <DrawerProvider>
            <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
            <AnalyticsMount />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="(tabs)" />
            </Stack>
            <AppDrawer />
          </DrawerProvider>
        </DynamicPaperProvider>
      </IllustrationsProvider>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <SessionProvider>
          <ThemedApp />
        </SessionProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
