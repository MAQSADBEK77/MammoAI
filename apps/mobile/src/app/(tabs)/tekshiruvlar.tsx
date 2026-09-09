import { createElement, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";
import type { ChecklistResponse } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useThemeColors } from "@/lib/theme";
import { api } from "@/lib/api";
import { useDrawer } from "@/lib/drawer";
import { useIllustrations } from "@/lib/illustrations";
import { Badge, Button, Card, LoadingSpinner, ScreenHeader, StatTile } from "@/components/ui";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const STATUS_ICON: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = { pending: "clock-outline", done: "check-circle-outline", overdue: "alert-circle-outline" };

export default function ChecklistScreen() {
  const { dict } = useI18n();
  const themeColors = useThemeColors();
  // web: "pending" holati `text-text-muted` (CSS o'zgaruvchi) ishlatadi —
  // qorong'u rejimda o'zgaradi; bu yerda avval qattiq yozilgan yorug' rejim
  // kulrangi (#9CA3AF) doim bir xil qolardi.
  const STATUS_ICON_COLOR = { pending: themeColors.textMuted, done: "#57B894", overdue: "#E0506F" } as const;
  const { openDrawer } = useDrawer();
  const { resolve: resolveIllustration } = useIllustrations();
  const [data, setData] = useState<ChecklistResponse | null>(null);

  useEffect(() => {
    api.checklist.list().then(setData);
  }, []);

  if (!data) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <LoadingSpinner label={dict.common.loading} />
      </SafeAreaView>
    );
  }
  const { items, readOnly, emptyReason, partnerName } = data;

  async function complete(id: string) {
    setData(await api.checklist.complete(id));
  }

  const statusTone = { pending: "muted", done: "success", overdue: "danger" } as const;
  const statusLabel = {
    pending: dict.checklist.statusPending,
    done: dict.checklist.statusDone,
    overdue: dict.checklist.statusOverdue,
  } as const;

  const doneCount = items.filter((i) => i.status === "done").length;
  const pendingCount = items.filter((i) => i.status === "pending").length;
  const overdueCount = items.filter((i) => i.status === "overdue").length;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4 pt-4" contentContainerClassName="gap-4 pb-32">
        <Pressable onPress={openDrawer} className="h-9 w-9 items-center justify-center rounded-full bg-surface active:scale-95">
          <MaterialCommunityIcons name="menu" size={22} color={themeColors.textPrimary} />
        </Pressable>
        <ScreenHeader title={readOnly && partnerName ? dict.checklist.partnerTitle(partnerName) : dict.checklist.title} />

        <View className="items-center">{createElement(resolveIllustration("screen.tekshiruvlar"), { width: 170, height: 110 })}</View>

        {readOnly && emptyReason ? (
          <Card>
            <Text className="text-center text-sm text-text-secondary">
              {emptyReason === "not_linked" ? dict.checklist.partnerNotLinked : dict.checklist.partnerNotShared}
            </Text>
          </Card>
        ) : (
          <Animated.View entering={FadeInUp.duration(450)} className="flex-row gap-2.5">
            <StatTile
              icon={<MaterialCommunityIcons name="check-circle-outline" size={16} color="#FFFFFF" />}
              label={statusLabel.done}
              value={String(doneCount)}
              tone="accent"
              active
            />
            <StatTile
              icon={<MaterialCommunityIcons name="clock-outline" size={16} color="#FFFFFF" />}
              label={statusLabel.pending}
              value={String(pendingCount)}
              tone="secondary"
              active
            />
            <StatTile
              icon={<MaterialCommunityIcons name="alert-circle-outline" size={16} color="#FFFFFF" />}
              label={statusLabel.overdue}
              value={String(overdueCount)}
              tone="primary"
              active
            />
          </Animated.View>
        )}

        {/* O'z-o'zini tekshirish testi — faqat o'zining checklist'i uchun,
            hamkorining ro'yxatini ko'rayotganda ma'nosiz. */}
        {!readOnly && (
          <Pressable className="active:scale-[0.98]" onPress={() => router.push("/xavf-testi")}>
            <Card>
              <Text className="font-semibold text-text-primary">{dict.checklist.riskQuizCardTitle}</Text>
            </Card>
          </Pressable>
        )}

        {items.map((item) => {
          const info = dict.checklist.items[item.type];
          const StatusIcon = STATUS_ICON[item.status];
          return (
            <Card key={item.id} className="gap-2">
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1 flex-row items-start gap-2.5">
                  <View
                    className="h-8 w-8 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${STATUS_ICON_COLOR[item.status]}1A` }}
                  >
                    <MaterialCommunityIcons name={StatusIcon} size={16} color={STATUS_ICON_COLOR[item.status]} />
                  </View>
                  <Text className="flex-1 pt-1 font-semibold text-text-primary">{info.title}</Text>
                </View>
                <View className="items-end gap-2">
                  <Badge tone={statusTone[item.status]}>{statusLabel[item.status]}</Badge>
                  <Badge tone={item.isFree ? "success" : "warning"}>{item.isFree ? dict.common.free : dict.common.paid}</Badge>
                </View>
              </View>
              <Text className="text-sm text-text-secondary">{info.why}</Text>
              {!readOnly && item.status !== "done" && (
                <View className="flex-row gap-2 pt-1">
                  <Button variant="secondary" onPress={() => complete(item.id)}>
                    {dict.checklist.markDoneButton}
                  </Button>
                  <Button
                    variant="ghost"
                    onPress={() => router.push({ pathname: "/(tabs)/asosiy", params: { checklistItemId: item.id } })}
                  >
                    {dict.checklist.findClinicButton}
                  </Button>
                </View>
              )}
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
