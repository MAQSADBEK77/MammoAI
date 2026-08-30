import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";
import type { ChecklistItem } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Badge, Button, Card, LoadingSpinner, ScreenHeader, StatTile } from "@/components/ui";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react-native";
import HealthyLifestyleIllustration from "../../../assets/illustrations/healthy-lifestyle.svg";

const STATUS_ICON = { pending: Clock, done: CheckCircle2, overdue: AlertCircle } as const;
const STATUS_ICON_COLOR = { pending: "#9CA3AF", done: "#57B894", overdue: "#E0506F" } as const;

export default function ChecklistScreen() {
  const { dict } = useI18n();
  const [items, setItems] = useState<ChecklistItem[] | null>(null);

  useEffect(() => {
    api.checklist.list().then(setItems);
  }, []);

  if (!items) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <LoadingSpinner label={dict.common.loading} />
      </SafeAreaView>
    );
  }

  async function complete(id: string) {
    setItems(await api.checklist.complete(id));
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
      <ScrollView className="flex-1 px-4 pt-4" contentContainerClassName="gap-3 pb-32">
        <ScreenHeader title={dict.checklist.title} />

        <View className="items-center">
          <HealthyLifestyleIllustration width={170} height={110} />
        </View>

        <Animated.View entering={FadeInUp.duration(450)} className="flex-row gap-2.5">
          <StatTile
            icon={<CheckCircle2 size={16} color="#FFFFFF" />}
            label={statusLabel.done}
            value={String(doneCount)}
            tone="accent"
            active
          />
          <StatTile
            icon={<Clock size={16} color="#FFFFFF" />}
            label={statusLabel.pending}
            value={String(pendingCount)}
            tone="secondary"
            active
          />
          <StatTile
            icon={<AlertCircle size={16} color="#FFFFFF" />}
            label={statusLabel.overdue}
            value={String(overdueCount)}
            tone="primary"
            active
          />
        </Animated.View>

        <Pressable className="active:scale-[0.98]" onPress={() => router.push("/xavf-testi")}>
          <Card>
            <Text className="font-semibold text-text-primary">{dict.checklist.riskQuizCardTitle}</Text>
          </Card>
        </Pressable>

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
                    <StatusIcon size={16} color={STATUS_ICON_COLOR[item.status]} />
                  </View>
                  <Text className="flex-1 pt-1 font-semibold text-text-primary">{info.title}</Text>
                </View>
                <View className="items-end gap-1">
                  <Badge tone={statusTone[item.status]}>{statusLabel[item.status]}</Badge>
                  <Badge tone={item.isFree ? "success" : "warning"}>{item.isFree ? dict.common.free : dict.common.paid}</Badge>
                </View>
              </View>
              <Text className="text-sm text-text-secondary">{info.why}</Text>
              {item.status !== "done" && (
                <View className="flex-row gap-2 pt-1">
                  <Button variant="secondary" onPress={() => complete(item.id)}>
                    {dict.checklist.markDoneButton}
                  </Button>
                  <Button
                    variant="ghost"
                    onPress={() => router.push({ pathname: "/(tabs)/klinikalar", params: { checklistItemId: item.id } })}
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
