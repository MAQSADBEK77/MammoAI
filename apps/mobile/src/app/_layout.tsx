import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { I18nProvider } from "@/lib/i18n";
import { SessionProvider } from "@/lib/session";

export default function RootLayout() {
  return (
    <I18nProvider>
      <SessionProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </SessionProvider>
    </I18nProvider>
  );
}
