import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { I18nProvider } from "@/lib/i18n";
import { SessionProvider } from "@/lib/session";
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

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <SessionProvider>
          <IllustrationsProvider>
            <DynamicPaperProvider>
              <DrawerProvider>
                <StatusBar style="dark" />
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
        </SessionProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
