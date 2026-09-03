import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { I18nProvider } from "@/lib/i18n";
import { SessionProvider } from "@/lib/session";
import { DynamicPaperProvider } from "@/lib/paper-theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <SessionProvider>
          <DynamicPaperProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </DynamicPaperProvider>
        </SessionProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
