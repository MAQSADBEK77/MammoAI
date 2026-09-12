// Web'dagi DailyInsightsCarousel.tsx bilan bir xil naqsh — izoh o'sha yerda.
import { View, Text, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import clsx from "clsx";
import { getDailyInsightIds, DAILY_INSIGHT_EMOJI, DAILY_INSIGHT_LINK, localDateStr } from "@mammoai/shared";
import type { CyclePhase } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { Emoji } from "@/components/Emoji";

const TINTS = ["bg-primary/10", "bg-secondary/10", "bg-accent/10", "bg-warning/10"];

export function DailyInsightsCarousel({ phase }: { phase: CyclePhase | null }) {
  const { dict } = useI18n();
  const ids = getDailyInsightIds(phase, localDateStr());

  return (
    <View className="gap-2.5">
      <Text className="text-base font-bold text-text-primary">{dict.cycle.dailyInsightsTitle}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 px-0.5">
        {ids.map((id, i) => {
          const content = dict.cycle.dailyInsights[id];
          const clickable = DAILY_INSIGHT_LINK[id] === "assistant";
          return (
            <Pressable
              key={id}
              onPress={clickable ? () => router.push("/(tabs)/yordamchi") : undefined}
              className={clsx("w-40 rounded-2xl p-4", TINTS[i % TINTS.length], clickable && "active:scale-[0.98]")}
            >
              <Emoji e={DAILY_INSIGHT_EMOJI[id]} size={22} />
              <Text className="mt-2 text-sm font-bold text-text-primary">{content.title}</Text>
              <Text className="mt-1 text-xs leading-snug text-text-secondary">{content.body}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
