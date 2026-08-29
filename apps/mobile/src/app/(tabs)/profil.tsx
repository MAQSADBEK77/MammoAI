import { useEffect, useState } from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import clsx from "clsx";
import type { Language } from "@mammoai/shared";
import { goalToLandingTab } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { Badge, Button, Card, ScreenHeader, TextField } from "@/components/ui";

export default function ProfileScreen() {
  const { dict, language, setLanguage } = useI18n();
  const { user, onboardingProfile, refresh } = useSession();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [logsCount, setLogsCount] = useState<number | null>(null);

  useEffect(() => {
    api.cycle.get().then((res) => setLogsCount(res.logs.length));
  }, []);

  if (!user) return null;

  async function save(patch: Parameters<typeof api.me.update>[0]) {
    setSaving(true);
    try {
      await api.me.update(patch);
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  const modeIcon = onboardingProfile
    ? goalToLandingTab(onboardingProfile.primaryGoal) === "pregnancy"
      ? "🤰"
      : goalToLandingTab(onboardingProfile.primaryGoal) === "checkups"
        ? "🩺"
        : "🩸"
    : null;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4 pt-4" contentContainerClassName="gap-4 pb-8">
        <View className="flex-row items-center justify-between">
          <ScreenHeader title={dict.profile.title} />
          {modeIcon && onboardingProfile && (
            <Badge tone="primary">{`${modeIcon} ${dict.onboarding.goals[onboardingProfile.primaryGoal]}`}</Badge>
          )}
        </View>

        <Card className="gap-3">
          <Text className="text-sm font-semibold text-text-secondary">{dict.profile.languageLabel}</Text>
          <View className="flex-row gap-2">
            {(["uz", "ru"] as Language[]).map((lang) => (
              <Pressable
                key={lang}
                onPress={() => {
                  setLanguage(lang);
                  save({ language: lang });
                }}
                className={clsx(
                  "min-h-[48px] flex-1 items-center justify-center rounded-2xl border-2",
                  language === lang ? "border-primary bg-primary-light" : "border-border bg-surface"
                )}
              >
                <Text className={clsx("font-semibold", language === lang ? "text-primary-dark" : "text-text-primary")}>
                  {lang === "uz" ? "O'zbekcha" : "Русский"}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card className="gap-3">
          <Text className="text-sm font-semibold text-text-secondary">{dict.profile.nameLabel}</Text>
          <TextField value={name} onChangeText={setName} />
          <Text className="text-sm font-semibold text-text-secondary">{dict.profile.phoneLabel}</Text>
          <TextField value={phone} onChangeText={setPhone} placeholder={dict.profile.phonePlaceholder} keyboardType="phone-pad" />
          <Button disabled={saving} onPress={() => save({ name: name || null, phone: phone || null })}>
            {dict.common.save}
          </Button>
        </Card>

        <Card className="gap-3">
          <Text className="text-sm font-semibold text-text-secondary">{dict.profile.accessibilityTitle}</Text>

          <View className="flex-row items-center justify-between">
            <Text className="text-text-primary">{dict.profile.fontSizeLabel}</Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => save({ fontScale: "normal" })}
                className={clsx("min-h-[40px] rounded-full px-4 justify-center", user.fontScale === "normal" ? "bg-primary" : "bg-surface-muted")}
              >
                <Text className={clsx("text-sm font-semibold", user.fontScale === "normal" ? "text-white" : "text-text-secondary")}>
                  {dict.profile.fontSizeNormal}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => save({ fontScale: "large" })}
                className={clsx("min-h-[40px] rounded-full px-4 justify-center", user.fontScale === "large" ? "bg-primary" : "bg-surface-muted")}
              >
                <Text className={clsx("text-sm font-semibold", user.fontScale === "large" ? "text-white" : "text-text-secondary")}>
                  {dict.profile.fontSizeLarge}
                </Text>
              </Pressable>
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-text-primary">{dict.profile.highContrastLabel}</Text>
            <Toggle checked={user.highContrast} onPress={() => save({ highContrast: !user.highContrast })} />
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-text-primary">{dict.profile.notificationsLabel}</Text>
            <Toggle checked={user.notificationsEnabled} onPress={() => save({ notificationsEnabled: !user.notificationsEnabled })} />
          </View>
        </Card>

        <Card className="gap-1">
          <Text className="text-sm font-semibold text-text-secondary">{dict.profile.statsTitle}</Text>
          <Text className="text-text-primary">{dict.profile.statsLogsCount(logsCount ?? 0)}</Text>
        </Card>

        <Pressable onPress={() => router.push("/maxfiylik")}>
          <Card className="gap-1">
            <Text className="text-sm font-semibold text-text-secondary">{dict.profile.securityTitle}</Text>
            <Text className="text-primary-dark underline">{dict.profile.privacyPolicyLink}</Text>
          </Card>
        </Pressable>

        <Card className="gap-1">
          <Text className="text-sm font-semibold text-text-secondary">{dict.profile.helpTitle}</Text>
          <Text className="text-text-primary">{dict.profile.helpPhoneLabel}</Text>
          <Text className="text-text-secondary">{dict.profile.helpPhoneValue}</Text>
        </Card>

        <Card className="border border-secondary/40 bg-secondary-light/30">
          <Text className="font-semibold text-text-primary">{dict.profile.premiumTitle}</Text>
          <Text className="mt-1 text-sm text-text-secondary">{dict.profile.premiumSubtitle}</Text>
        </Card>

        <Button
          variant="secondary"
          onPress={async () => {
            const data = await api.me.exportData();
            const fileUri = `${FileSystem.cacheDirectory}mammoai-malumotlar.json`;
            await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(data, null, 2));
            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(fileUri, { mimeType: "application/json" });
            }
          }}
        >
          {dict.profile.exportButton}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

function Toggle({ checked, onPress }: { checked: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={clsx("h-8 w-14 rounded-full p-1", checked ? "bg-primary" : "bg-surface-muted")}>
      <View className={clsx("h-6 w-6 rounded-full bg-white", checked && "ml-6")} />
    </Pressable>
  );
}
