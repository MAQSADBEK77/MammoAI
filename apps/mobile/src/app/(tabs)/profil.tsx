import { useEffect, useState } from "react";
import { ScrollView, View, Text, Pressable, Share, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import clsx from "clsx";
import { LinearGradient } from "expo-linear-gradient";
import type { Language } from "@mammoai/shared";
import { goalToLandingTab, gradientStops, colors, gradients } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { Badge, Button, Card, ScreenHeader, TextField } from "@/components/ui";
import { Type, Eye, type LucideIcon } from "lucide-react-native";

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
      <ScrollView className="flex-1 px-4 pt-4" contentContainerClassName="gap-4 pb-32">
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

        <Card className="gap-1">
          <Text className="mb-1 text-sm font-semibold text-text-secondary">{dict.profile.accessibilityTitle}</Text>

          <SettingsRow icon={Type} label={dict.profile.fontSizeLabel}>
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
          </SettingsRow>

          <SettingsRow icon={Eye} label={dict.profile.highContrastLabel}>
            <Toggle checked={user.highContrast} onPress={() => save({ highContrast: !user.highContrast })} />
          </SettingsRow>

          <SettingsRow icon="🔔" label={dict.profile.notificationsLabel} last>
            <Toggle checked={user.notificationsEnabled} onPress={() => save({ notificationsEnabled: !user.notificationsEnabled })} />
          </SettingsRow>
        </Card>

        <Card className="gap-1">
          <SettingsRow icon="📊" label={dict.profile.statsTitle} last>
            <Text className="text-sm text-text-secondary">{dict.profile.statsLogsCount(logsCount ?? 0)}</Text>
          </SettingsRow>
        </Card>

        <Pressable onPress={() => router.push("/maxfiylik")}>
          <Card className="gap-1">
            <SettingsRow icon="🔒" label={dict.profile.securityTitle} last>
              <Text className="text-sm text-primary-dark">{dict.profile.privacyPolicyLink}</Text>
            </SettingsRow>
          </Card>
        </Pressable>

        <Card className="gap-1">
          <SettingsRow icon="❓" label={dict.profile.helpTitle} last>
            <Text className="text-right text-sm text-text-secondary">{dict.profile.helpPhoneValue}</Text>
          </SettingsRow>
        </Card>

        <LinearGradient
          colors={gradients.pregnancy}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 28, padding: 20 }}
        >
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-white/20">
              <Text style={{ fontSize: 22 }}>✨</Text>
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-white">{dict.profile.premiumTitle}</Text>
              <Text className="mt-1 text-sm text-white/80">{dict.profile.premiumSubtitle}</Text>
            </View>
          </View>
        </LinearGradient>

        <Card className="gap-1">
          <Pressable onPress={() => Alert.alert(dict.profile.rateAppButton, dict.profile.rateAppComingSoon)}>
            <SettingsRow icon="⭐" label={dict.profile.rateAppButton} />
          </Pressable>
          <Pressable onPress={() => Share.share({ message: dict.profile.shareAppMessage })}>
            <SettingsRow icon="📱" label={dict.profile.shareAppButton} last />
          </Pressable>
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

function SettingsRow({
  icon,
  label,
  children,
  last,
}: {
  /** Lucide komponenti (aniq mos emoji topilmagan holatlar uchun) yoki manba
   * ilovadagi ("Uzbek Women's Health Tracker" — src/App.tsx) aynan emoji. */
  icon: LucideIcon | string;
  label: string;
  children?: React.ReactNode;
  last?: boolean;
}) {
  const Icon = typeof icon === "string" ? null : icon;
  return (
    <View className={clsx("flex-row items-center justify-between gap-3 py-2.5", !last && "border-b border-border")}>
      <View className="flex-row items-center gap-3">
        <LinearGradient
          colors={gradientStops(colors.primary)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" }}
        >
          {Icon ? <Icon size={18} color="#FFFFFF" /> : <Text style={{ fontSize: 16 }}>{icon as string}</Text>}
        </LinearGradient>
        <Text className="font-medium text-text-primary">{label}</Text>
      </View>
      {children}
    </View>
  );
}

function Toggle({ checked, onPress }: { checked: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={clsx("h-8 w-14 rounded-full p-1", checked ? "bg-primary" : "bg-surface-muted")}>
      <View className={clsx("h-6 w-6 rounded-full bg-white", checked && "ml-6")} />
    </Pressable>
  );
}
