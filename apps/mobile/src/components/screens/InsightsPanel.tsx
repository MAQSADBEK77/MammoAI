import { ScrollView, View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { InsightsSummary, SymptomPattern } from "@mammoai/shared";
import { gradients } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui";
import { Emoji } from "@/components/Emoji";

function formatShortDate(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  return `${day}.${month}`;
}

/** Bitta seriyali (magnitude) vertikal ustunlar — web'dagi InsightsPanel bilan
 * bir xil dataviz-uslubi (yagona brend rangi, legend shart emas), RN
 * primitivlarida. Hover tooltip yo'q (RN'da hover kontsepsiyasi yo'q) —
 * o'rniga har bir ustun tagida qiymat doim ko'rinadi. */
function BarTrendChart({ points, valueSuffix }: { points: { label: string; value: number }[]; valueSuffix: string }) {
  const max = Math.max(1, ...points.map((p) => p.value));
  return (
    <View>
      <View className="flex-row items-end gap-1.5" style={{ height: 96 }}>
        {points.map((p, i) => {
          const heightPct = (p.value / max) * 100;
          return (
            <View key={`${p.label}-${i}`} className="flex-1 items-center justify-end" style={{ height: "100%" }}>
              <Text className="mb-1 text-[10px] font-semibold text-text-secondary">{p.value}</Text>
              <View className="w-full max-w-[18px] rounded-t-[4px] bg-primary/60" style={{ height: `${Math.max(heightPct, 4)}%` }} />
            </View>
          );
        })}
      </View>
      <View className="mt-2 flex-row justify-between">
        <Text className="text-[11px] font-medium text-text-muted">{points[0]?.label}</Text>
        <Text className="text-[11px] font-medium text-text-muted">
          {points[points.length - 1]?.label} {valueSuffix}
        </Text>
      </View>
    </View>
  );
}

function RankedRow({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <View>
      <View className="mb-1 flex-row items-center justify-between gap-3">
        <Text className="flex-1 text-xs font-semibold text-text-secondary" numberOfLines={1}>
          {label}
        </Text>
        <Text className="text-xs text-text-muted">{count}</Text>
      </View>
      <View className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
        <View className="h-full rounded-full bg-primary/70" style={{ width: `${Math.max(pct, 3)}%` }} />
      </View>
    </View>
  );
}

/** Ikki seriyali (hayz kunlari / boshqa kunlar) taqqoslash — web bilan bir xil. */
function PhaseBreakdownRow({ label, periodDays, otherDays }: { label: string; periodDays: number; otherDays: number }) {
  const total = periodDays + otherDays || 1;
  return (
    <View>
      <View className="mb-1 flex-row items-center justify-between gap-3">
        <Text className="flex-1 text-xs font-semibold text-text-secondary" numberOfLines={1}>
          {label}
        </Text>
        <Text className="text-xs text-text-muted">
          {periodDays}/{otherDays}
        </Text>
      </View>
      <View className="h-2 w-full flex-row overflow-hidden rounded-full bg-surface-muted">
        <View className="h-full bg-primary" style={{ width: `${(periodDays / total) * 100}%` }} />
        <View className="h-full bg-secondary/50" style={{ width: `${(otherDays / total) * 100}%` }} />
      </View>
    </View>
  );
}

export function InsightsPanel({
  summary,
  patterns,
  aiInsight,
}: {
  summary: InsightsSummary;
  patterns: SymptomPattern[];
  /** AI'ning proaktiv tahlili (server/active-insights.ts) — `null` bo'lsa
   * shunchaki ko'rsatilmaydi, qolgan Statistika baribir to'liq ishlaydi. */
  aiInsight?: string | null;
}) {
  const { dict } = useI18n();

  if (!summary.hasEnoughData) {
    return <Text className="py-10 text-center text-sm text-text-muted">{dict.chat.insightsEmpty}</Text>;
  }

  const symptomMax = Math.max(1, ...summary.symptomFrequency.map((p) => p.count));
  const moodMax = Math.max(1, ...summary.moodDistribution.map((p) => p.count));

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-4 px-4 pb-4">
      {aiInsight && (
        <LinearGradient colors={gradients.cycle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 28, padding: 20, gap: 6 }}>
          <View className="flex-row items-center gap-1.5">
            <Emoji e="✨" size={14} />
            <Text className="text-sm font-bold text-white">{dict.chat.aiInsightTitle}</Text>
          </View>
          <Text className="text-sm leading-relaxed text-white/90">{aiInsight}</Text>
        </LinearGradient>
      )}

      {patterns.length > 0 && (
        <View className="rounded-2xl border border-warning/20 bg-warning/5 p-4">
          <Text className="text-sm font-bold text-warning">{dict.chat.patternBannerTitle}</Text>
          {patterns.map((p) => (
            <Text key={p.symptom} className="mt-1.5 text-sm text-text-secondary">
              {dict.cycle.symptoms[p.symptom]} — {p.occurrences}x
            </Text>
          ))}
          <Text className="mt-1.5 text-sm text-text-secondary">{dict.chat.patternBannerBody}</Text>
        </View>
      )}

      {summary.regularity && (
        <Card className="gap-1.5">
          <Text className="text-sm font-bold text-text-primary">{dict.chat.regularityTitle}</Text>
          <Text className="text-2xl font-extrabold text-text-primary">
            {dict.chat.regularitySummary(summary.regularity.averageCycleLength, summary.regularity.variabilityDays)}
          </Text>
          <Text className="text-xs text-text-muted">
            {summary.regularity.trend === "lengthening"
              ? dict.chat.regularityTrendLengthening
              : summary.regularity.trend === "shortening"
                ? dict.chat.regularityTrendShortening
                : dict.chat.regularityTrendStable}
          </Text>
        </Card>
      )}

      {summary.predictionAccuracy && (
        <Card className="gap-1.5">
          <Text className="text-sm font-bold text-text-primary">{dict.chat.predictionAccuracyTitle}</Text>
          <Text className="text-2xl font-extrabold text-text-primary">
            {dict.chat.predictionAccuracySummary(summary.predictionAccuracy.avgErrorDays, summary.predictionAccuracy.within2DaysPct)}
          </Text>
          <Text className="text-xs text-text-muted">{dict.chat.predictionAccuracyHint}</Text>
        </Card>
      )}

      {summary.cycleLengths.length > 0 && (
        <Card className="gap-3">
          <Text className="text-sm font-bold text-text-primary">{dict.chat.cycleLengthChartTitle}</Text>
          <BarTrendChart
            points={summary.cycleLengths.map((p) => ({ label: formatShortDate(p.startDate), value: p.lengthDays }))}
            valueSuffix={dict.chat.daysUnit}
          />
        </Card>
      )}

      {summary.periodLengths.length > 0 && (
        <Card className="gap-3">
          <Text className="text-sm font-bold text-text-primary">{dict.chat.periodLengthChartTitle}</Text>
          <BarTrendChart
            points={summary.periodLengths.map((p) => ({ label: formatShortDate(p.startDate), value: p.lengthDays }))}
            valueSuffix={dict.chat.daysUnit}
          />
        </Card>
      )}

      {summary.symptomPhaseBreakdown.length > 0 && (
        <Card className="gap-3">
          <Text className="text-sm font-bold text-text-primary">{dict.chat.symptomPhaseChartTitle}</Text>
          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center gap-1.5">
              <View className="h-2 w-2 rounded-full bg-primary" />
              <Text className="text-[11px] font-semibold text-text-secondary">{dict.chat.symptomPhasePeriodLabel}</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <View className="h-2 w-2 rounded-full bg-secondary/50" />
              <Text className="text-[11px] font-semibold text-text-secondary">{dict.chat.symptomPhaseOtherLabel}</Text>
            </View>
          </View>
          <View className="gap-2.5">
            {summary.symptomPhaseBreakdown.map((p) => (
              <PhaseBreakdownRow
                key={p.symptom}
                label={dict.cycle.symptoms[p.symptom]}
                periodDays={p.periodDaysCount}
                otherDays={p.otherDaysCount}
              />
            ))}
          </View>
        </Card>
      )}

      {summary.moodPhaseBreakdown.length > 0 && (
        <Card className="gap-3">
          <Text className="text-sm font-bold text-text-primary">{dict.chat.moodPhaseChartTitle}</Text>
          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center gap-1.5">
              <View className="h-2 w-2 rounded-full bg-primary" />
              <Text className="text-[11px] font-semibold text-text-secondary">{dict.chat.symptomPhasePeriodLabel}</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <View className="h-2 w-2 rounded-full bg-secondary/50" />
              <Text className="text-[11px] font-semibold text-text-secondary">{dict.chat.symptomPhaseOtherLabel}</Text>
            </View>
          </View>
          <View className="gap-2.5">
            {summary.moodPhaseBreakdown.map((p) => (
              <PhaseBreakdownRow key={p.mood} label={dict.cycle.moods[p.mood]} periodDays={p.periodDaysCount} otherDays={p.otherDaysCount} />
            ))}
          </View>
        </Card>
      )}

      {summary.painDaysPerCycle.length > 0 && (
        <Card className="gap-3">
          <Text className="text-sm font-bold text-text-primary">{dict.chat.painDaysChartTitle}</Text>
          <BarTrendChart
            points={summary.painDaysPerCycle.map((p) => ({ label: formatShortDate(p.startDate), value: p.painDays }))}
            valueSuffix={dict.chat.daysUnit}
          />
          <Text className="text-xs text-text-muted">{dict.chat.painDaysChartHint}</Text>
        </Card>
      )}

      {summary.symptomFrequency.length > 0 && (
        <Card className="gap-3">
          <Text className="text-sm font-bold text-text-primary">{dict.chat.symptomFrequencyChartTitle}</Text>
          <View className="gap-2.5">
            {summary.symptomFrequency.map((p) => (
              <RankedRow key={p.symptom} label={dict.cycle.symptoms[p.symptom]} count={p.count} max={symptomMax} />
            ))}
          </View>
        </Card>
      )}

      {summary.moodDistribution.length > 0 && (
        <Card className="gap-3">
          <Text className="text-sm font-bold text-text-primary">{dict.chat.moodDistributionChartTitle}</Text>
          <View className="gap-2.5">
            {summary.moodDistribution.map((p) => (
              <RankedRow key={p.mood} label={dict.cycle.moods[p.mood]} count={p.count} max={moodMax} />
            ))}
          </View>
        </Card>
      )}
    </ScrollView>
  );
}
