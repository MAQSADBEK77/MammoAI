import { useEffect, useState } from "react";
import { ScrollView, View, Text, Pressable, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Portal, Dialog, Switch, Avatar } from "react-native-paper";
import type { PartnerShareSettings, PartnerStatusResponse } from "@mammoai/shared";
import { MOOD_EMOJI, formatDateDisplay } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { useDrawer } from "@/lib/drawer";
import { Button, Card, LoadingSpinner, ScreenHeader, Badge } from "@/components/ui";
import { PartnerChatModal } from "@/components/screens/PartnerChatModal";

/**
 * "Hamkor" ekrani — Figma referens (https://www.figma.com/make/M7nwCcQDmwjZsaadesxS88)
 * "Partner Tab": kod orqali ulanish, ulashish sozlamalari, hamkor ma'lumotlari.
 * Web'dagi components/screens/HamkorScreen.tsx bilan bir xil backend'dan foydalanadi.
 */
export default function HamkorScreen() {
  const { dict } = useI18n();
  const { openDrawer } = useDrawer();
  const [status, setStatus] = useState<PartnerStatusResponse | null>(null);
  const [connectOpen, setConnectOpen] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.partner.status().then(setStatus);
  }, []);

  if (!status) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <LoadingSpinner label={dict.common.loading} />
      </SafeAreaView>
    );
  }

  async function openConnectModal() {
    setConnectError(null);
    setConnectOpen(true);
    if (!status!.myInviteCode) {
      setStatus(await api.partner.generateCode());
    }
  }

  async function submitCode() {
    setConnecting(true);
    setConnectError(null);
    try {
      const res = await api.partner.connect(codeInput);
      setStatus(res);
      setConnectOpen(false);
      setCodeInput("");
    } catch {
      setConnectError(dict.partner.invalidCode);
    } finally {
      setConnecting(false);
    }
  }

  async function toggleShare(key: keyof PartnerShareSettings) {
    if (!status!.mySharing || saving) return;
    setSaving(true);
    try {
      const next = { ...status!.mySharing, [key]: !status!.mySharing[key] };
      setStatus(await api.partner.updateSettings(next));
    } finally {
      setSaving(false);
    }
  }

  function disconnect() {
    Alert.alert(dict.partner.disconnectButton, dict.partner.disconnectConfirm, [
      { text: dict.common.cancel, style: "cancel" },
      { text: dict.partner.disconnectButton, style: "destructive", onPress: async () => setStatus(await api.partner.disconnect()) },
    ]);
  }

  async function copyCode() {
    if (!status!.myInviteCode) return;
    await Clipboard.setStringAsync(status!.myInviteCode);
    Alert.alert(dict.partner.codeCopied);
  }

  const daysAgo = status.linkedSince ? Math.floor((new Date().getTime() - new Date(status.linkedSince).getTime()) / 86400000) : 0;
  const initials = (status.partner?.name?.trim()?.[0] ?? "🙂").toUpperCase();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4 pt-4" contentContainerClassName="gap-4 pb-32">
        <Pressable onPress={openDrawer} className="h-9 w-9 items-center justify-center rounded-full bg-surface active:scale-95">
          <MaterialCommunityIcons name="menu" size={22} color="#1F2937" />
        </Pressable>
        <ScreenHeader title={dict.partner.title} subtitle={dict.partner.subtitle} />

        {!status.linked ? (
          <>
            <View className="gap-2 rounded-[28px] bg-primary-light/30 p-6">
              <Text className="text-center text-4xl">🐰❤️🐰</Text>
              <Text className="text-center text-lg font-bold text-text-primary">{dict.partner.heroTitle}</Text>
              <Text className="text-center text-sm text-text-secondary">{dict.partner.heroDescription}</Text>
            </View>

            <Card className="flex-row items-start gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                <MaterialCommunityIcons name="chart-bar" size={20} color="#F43F7F" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-text-primary">{dict.partner.featureSharingTitle}</Text>
                <Text className="text-sm text-text-secondary">{dict.partner.featureSharingDescription}</Text>
              </View>
            </Card>
            <Card className="flex-row items-start gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-warning/10">
                <MaterialCommunityIcons name="bell-ring-outline" size={20} color="#E7A83F" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-text-primary">{dict.partner.featureRemindersTitle}</Text>
                <Text className="text-sm text-text-secondary">{dict.partner.featureRemindersDescription}</Text>
              </View>
            </Card>
            <Card className="flex-row items-start gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-secondary/10">
                <MaterialCommunityIcons name="chat-outline" size={20} color="#7C3AED" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-text-primary">{dict.partner.featureMessagesTitle}</Text>
                <Text className="text-sm text-text-secondary">{dict.partner.featureMessagesDescription}</Text>
              </View>
            </Card>

            <Button onPress={openConnectModal}>{dict.partner.connectButton}</Button>
            <Button variant="ghost" onPress={openConnectModal}>
              {dict.partner.enterCodeButton}
            </Button>
          </>
        ) : (
          <>
            <Card className="gap-3">
              <View className="flex-row items-center gap-3">
                <Avatar.Text size={48} label={initials} style={{ backgroundColor: "#FFB3CB" }} />
                <View className="min-w-0 flex-1">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="flex-shrink font-bold text-text-primary" numberOfLines={1}>
                      {status.partner?.name || dict.profile.noNameFallback}
                    </Text>
                    <MaterialCommunityIcons name="circle" size={8} color="#57B894" />
                  </View>
                  <Text className="text-xs text-text-secondary">{dict.partner.roleLabel}</Text>
                </View>
              </View>
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Button variant="secondary" onPress={() => setChatOpen(true)}>
                    <MaterialCommunityIcons name="chat-outline" size={16} color="#1F2937" />
                    <Text className="text-sm font-semibold text-text-primary"> {dict.partner.messageButton}</Text>
                  </Button>
                </View>
                <View className="flex-1">
                  <Button onPress={() => setStatsOpen(true)}>
                    <MaterialCommunityIcons name="chart-bar" size={16} color="#FFFFFF" />
                    <Text className="text-sm font-semibold text-white"> {dict.partner.statsButton}</Text>
                  </Button>
                </View>
              </View>
            </Card>

            <View className="gap-2">
              <Text className="text-sm font-bold text-text-primary">{dict.partner.canSeeTitle}</Text>
              <Card className="gap-1">
                <SharingRow
                  icon="🤰"
                  label={dict.partner.shareTogglePregnancy}
                  checked={!!status.mySharing?.pregnancy}
                  onChange={() => toggleShare("pregnancy")}
                />
                <SharingRow
                  icon="🗓️"
                  label={dict.partner.shareToggleCheckups}
                  checked={!!status.mySharing?.checkups}
                  onChange={() => toggleShare("checkups")}
                />
                <SharingRow
                  icon="😊"
                  label={dict.partner.shareToggleMood}
                  checked={!!status.mySharing?.mood}
                  onChange={() => toggleShare("mood")}
                />
                <SharingRow
                  icon="🩸"
                  label={dict.partner.shareTogglePeriod}
                  checked={!!status.mySharing?.period}
                  onChange={() => toggleShare("period")}
                  last
                />
              </Card>
            </View>

            {status.linkedSince && (
              <Card className="bg-primary-light/30">
                <Text className="text-sm font-semibold" style={{ color: "#D62A63" }}>
                  {daysAgo <= 0 ? dict.partner.connectedToday : dict.partner.connectedDaysAgo(daysAgo)}
                </Text>
              </Card>
            )}

            <Pressable onPress={disconnect}>
              <Text className="text-center text-sm font-semibold text-danger">{dict.partner.disconnectButton}</Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={connectOpen} onDismiss={() => setConnectOpen(false)} style={{ borderRadius: 24 }}>
          <Dialog.Title>{dict.partner.modalTitle}</Dialog.Title>
          <Dialog.Content className="gap-4">
            <View className="items-center gap-1 rounded-2xl bg-surface-muted p-4">
              <Text className="text-xs text-text-muted">{dict.partner.yourCodeLabel}</Text>
              <Pressable onPress={copyCode} className="flex-row items-center gap-1.5">
                <Text className="text-xl font-extrabold text-primary">{status.myInviteCode ?? "…"}</Text>
                <MaterialCommunityIcons name="content-copy" size={16} color="#F43F7F" />
              </Pressable>
              <Text className="text-xs text-text-muted">{dict.partner.sendCodeHint}</Text>
            </View>
            <Text className="text-center text-xs font-semibold text-text-muted">{dict.partner.orDivider}</Text>
            <TextInput
              value={codeInput}
              onChangeText={setCodeInput}
              placeholder={dict.partner.codeInputPlaceholder}
              autoCapitalize="characters"
              className="min-h-[48px] rounded-2xl border border-border bg-surface px-4 text-base text-text-primary"
              placeholderTextColor="#9CA3AF"
            />
            {connectError && <Text className="text-sm text-danger">{connectError}</Text>}
            <Button onPress={submitCode} disabled={!codeInput.trim() || connecting}>
              {connecting ? dict.partner.connecting : dict.partner.connectSubmitButton}
            </Button>
          </Dialog.Content>
        </Dialog>

        <Dialog visible={statsOpen} onDismiss={() => setStatsOpen(false)} style={{ borderRadius: 24 }}>
          <Dialog.Title>{dict.partner.statsModalTitle}</Dialog.Title>
          <Dialog.Content className="gap-2">
            {!status.partnerData ||
            (status.partnerData.pregnancyWeek === null &&
              !status.partnerData.nextCheckup &&
              !status.partnerData.todayMood &&
              status.partnerData.cycleDay === null) ? (
              <Text className="text-sm text-text-muted">{dict.partner.noDataShared}</Text>
            ) : (
              <>
                {status.partnerData.pregnancyWeek !== null && (
                  <Badge tone="primary">{dict.partner.statPregnancyWeek(status.partnerData.pregnancyWeek)}</Badge>
                )}
                {status.partnerData.nextCheckup && (
                  <Text className="text-sm text-text-primary">
                    <Text className="font-semibold">{dict.partner.statNextCheckupLabel}: </Text>
                    {dict.checklist.items[status.partnerData.nextCheckup.type].title} —{" "}
                    {formatDateDisplay(status.partnerData.nextCheckup.date)}
                  </Text>
                )}
                {status.partnerData.todayMood && (
                  <Text className="text-sm text-text-primary">
                    <Text className="font-semibold">{dict.partner.statMoodLabel}: </Text>
                    {MOOD_EMOJI[status.partnerData.todayMood]} {dict.cycle.moods[status.partnerData.todayMood]}
                  </Text>
                )}
                {status.partnerData.cycleDay !== null && (
                  <Text className="text-sm text-text-primary">{dict.partner.statCycleDay(status.partnerData.cycleDay)}</Text>
                )}
              </>
            )}
          </Dialog.Content>
        </Dialog>
      </Portal>

      {/* Hamkor bilan to'liq suhbat — Telegram uslubidagi chat. */}
      <PartnerChatModal
        visible={chatOpen}
        onClose={() => setChatOpen(false)}
        partnerName={status.partner?.name || dict.profile.noNameFallback}
        partnerAvatarUrl={status.partner?.avatarUrl ?? null}
      />
    </SafeAreaView>
  );
}

function SharingRow({
  icon,
  label,
  checked,
  onChange,
  last,
}: {
  icon: string;
  label: string;
  checked: boolean;
  onChange: () => void;
  last?: boolean;
}) {
  return (
    <View className={`flex-row items-center justify-between gap-3 py-2 ${last ? "" : "border-b border-border"}`}>
      <View className="flex-row items-center gap-2.5">
        <Text className="text-lg">{icon}</Text>
        <Text className="text-sm font-medium text-text-primary">{label}</Text>
      </View>
      <Switch value={checked} onValueChange={onChange} color="#F43F7F" />
    </View>
  );
}
