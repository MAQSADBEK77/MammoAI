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

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <SessionProvider>
          <IllustrationsProvider>
            <DynamicPaperProvider>
              <DrawerProvider>
                <StatusBar style="dark" />
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
