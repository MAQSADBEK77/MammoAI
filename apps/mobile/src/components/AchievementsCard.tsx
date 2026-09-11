// Web'dagi AchievementsCard.tsx bilan bir xil naqsh — izoh o'sha yerda.
import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import type { BadgeId } from "@mammoai/shared";
import { BADGE_DEFINITIONS } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Card } from "@/components/ui";
import { Emoji } from "@/components/Emoji";

export function AchievementsCard() {
  const { dict } = useI18n();
  const [stats, setStats] = useState<{ currentStreakDays: number; longestStreakDays: number; totalLogsCount: number; badges: BadgeId[] } | null>(
    null
  );

  useEffect(() => {
    api.gamification.get().then(setStats).catch(() => {});
  }, []);

  if (!stats) return null;

  return (
    <Card className="gap-4">
      <Text className="text-sm font-bold text-text-primary">{dict.gamification.achievementsTitle}</Text>

      <View className="flex-row justify-between">
        <View className="flex-1 items-center">
          <Text className="text-xl font-extrabold text-text-primary">{stats.currentStreakDays}</Text>
          <Text className="text-center text-[11px] text-text-muted">{dict.gamification.currentStreakLabel}</Text>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-xl font-extrabold text-text-primary">{stats.longestStreakDays}</Text>
          <Text className="text-center text-[11px] text-text-muted">{dict.gamification.longestStreakLabel}</Text>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-xl font-extrabold text-text-primary">{stats.totalLogsCount}</Text>
          <Text className="text-center text-[11px] text-text-muted">{dict.gamification.totalLogsLabel}</Text>
        </View>
      </View>

      <View className="flex-row flex-wrap justify-between gap-y-2">
        {BADGE_DEFINITIONS.map((def) => {
          const earned = stats.badges.includes(def.id);
          const label = dict.gamification.badges[def.id];
          return (
            <View key={def.id} style={{ width: "18%" }} className="items-center gap-1">
              <View className={`h-12 w-12 items-center justify-center rounded-full ${earned ? "bg-primary" : "bg-surface-muted opacity-40"}`}>
                <Emoji e={def.icon} size={20} />
              </View>
              <Text className="text-center text-[8px] font-semibold leading-tight text-text-secondary" numberOfLines={2}>
                {label.name}
              </Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}
