import { useEffect, useState } from "react";
import { Pressable, ScrollView, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import type { CycleResponse, FlowLevel, Mood, Symptom } from "@mammoai/shared";
import { getCyclePhase, MOOD_EMOJI, FLOW_EMOJI, SYMPTOM_EMOJI } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { Badge, Button, Card, IconChip, ScreenHeader } from "@/components/ui";
import { MonthCalendar, type DayMarker } from "@/components/MonthCalendar";
import { CycleRing } from "@/components/CycleRing";
import { PhaseCard } from "@/components/PhaseCard";

const FLOW_LEVELS: FlowLevel[] = ["spotting", "light", "medium", "heavy"];
const MOODS: Mood[] = ["happy", "calm", "tired", "sad", "irritable", "anxious"];
const SYMPTOMS: Symptom[] = [
  "cramps",
  "headache",
  "bloating",
  "acne",
  "back_pain",
  "nausea",
  "breast_tenderness",
  "insomnia",
  "fatigue",
  "irritability",
  "difficulty_concentrating",
];

export default function CycleScreen() {
  const { dict } = useI18n();
  const { onboardingProfile } = useSession();
  const [data, setData] = useState<CycleResponse | null>(null);
  const [logging, setLogging] = useState(false);
  const [flow, setFlow] = useState<FlowLevel | null>(null);
  const [mood, setMood] = useState<Mood | null>(null);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const isMinor = !!onboardingProfile && onboardingProfile.age < 18;

  useEffect(() => {
    api.cycle.get().then(setData);
  }, []);

  if (!data) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Text className="text-text-secondary">{dict.common.loading}</Text>
      </SafeAreaView>
    );
  }

  const markers: Record<string, DayMarker> = {};
  for (const log of data.logs) if (log.flow) markers[log.date] = "period";
  if (data.prediction) {
    let d = new Date(data.prediction.fertileWindowStart + "T00:00:00Z");
    const end = new Date(data.prediction.fertileWindowEnd + "T00:00:00Z");
    while (d <= end) {
      const key = d.toISOString().slice(0, 10);
      if (!markers[key]) markers[key] = "fertile";
      d.setUTCDate(d.getUTCDate() + 1);
    }
    let p = new Date(data.prediction.nextPeriodStart + "T00:00:00Z");
    const pEnd = new Date(data.prediction.nextPeriodEnd + "T00:00:00Z");
    while (p <= pEnd) {
      markers[p.toISOString().slice(0, 10)] = "predicted";
      p.setUTCDate(p.getUTCDate() + 1);
    }
  }

  let periodDay: number | null = null;
  let dayInCycle: number | null = null;
  if (data.settings.lastPeriodStart) {
    const diff = Math.round((new Date(today).getTime() - new Date(data.settings.lastPeriodStart).getTime()) / 86400000);
    if (diff >= 0 && diff < data.settings.averagePeriodLength) periodDay = diff + 1;
    const cycleLen = data.settings.averageCycleLength || 28;
    dayInCycle = (((diff % cycleLen) + cycleLen) % cycleLen) + 1;
  }

  const todayLog = data.logs.find((l) => l.date === today);
  const cycleLen = data.settings.averageCycleLength || 28;
  const periodLen = data.settings.averagePeriodLength || 5;
  const phase = dayInCycle ? getCyclePhase(dayInCycle, cycleLen, periodLen) : null;
  const greeting = `👋 ${dict.common.greeting(onboardingProfile?.name ?? null, new Date().getHours())}`;

  async function saveLog() {
    setSaving(true);
    try {
      const res = await api.cycle.logDay({ date: today, flow, mood, symptoms });
      setData(res);
      setLogging(false);
      setFlow(null);
      setMood(null);
      setSymptoms([]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4 pt-4" contentContainerClassName="gap-4 pb-8">
        <ScreenHeader title={greeting} subtitle={dict.cycle.title} />

        {data.isIrregular && (
          <Card className="bg-warning/10">
            <Text className="font-semibold text-text-primary">{dict.cycle.irregularBannerTitle}</Text>
            <Text className="mt-1 text-sm text-text-secondary">{dict.cycle.irregularBannerAction}</Text>
          </Card>
        )}

        <Card>
          <Pressable onPress={() => !dayInCycle && setLogging(true)}>
            <CycleRing
              dayInCycle={dayInCycle ?? 1}
              cycleLength={data.settings.averageCycleLength}
              label={dict.cycle.title}
              sublabel={data.prediction ? dict.cycle.nextPeriodIn(data.prediction.daysUntilNextPeriod) : dict.cycle.ringEmptyLabel}
            />
          </Pressable>
          {periodDay && (
            <View className="mt-4 items-center">
              <Badge tone="primary">{`${isMinor ? "🐰 " : ""}${dict.cycle.periodDayBadge(periodDay)}`}</Badge>
            </View>
          )}
        </Card>

        {phase && <PhaseCard phase={phase} />}

        <Card>
          <MonthCalendar monthDate={new Date()} markers={markers} today={today} />
        </Card>

        <View>
          <Text className="mb-2 text-sm font-semibold text-text-secondary">{dict.cycle.dailyCheckinTitle}</Text>
          <View className="flex-row gap-2">
            <QuickCard
              label={dict.cycle.moodCardLabel}
              value={todayLog?.mood ? `${MOOD_EMOJI[todayLog.mood]} ${dict.cycle.moods[todayLog.mood]}` : undefined}
              onPress={() => setLogging(true)}
            />
            <QuickCard
              label={dict.cycle.flowCardLabel}
              value={todayLog?.flow ? `${FLOW_EMOJI[todayLog.flow]} ${dict.cycle.flowLevels[todayLog.flow]}` : undefined}
              onPress={() => setLogging(true)}
            />
            <QuickCard
              label={dict.cycle.symptomsCardLabel}
              value={todayLog?.symptoms.length ? String(todayLog.symptoms.length) : undefined}
              onPress={() => setLogging(true)}
            />
          </View>
        </View>

        {logging && (
          <Card className="gap-4">
            <View>
              <Text className="mb-2 text-sm font-semibold text-text-secondary">{dict.cycle.flowLabel}</Text>
              <View className="flex-row gap-2">
                {FLOW_LEVELS.map((f) => (
                  <IconChip
                    key={f}
                    icon={FLOW_EMOJI[f]}
                    label={dict.cycle.flowLevels[f]}
                    active={flow === f}
                    onPress={() => setFlow(flow === f ? null : f)}
                  />
                ))}
              </View>
            </View>

            <View>
              <Text className="mb-2 text-sm font-semibold text-text-secondary">{dict.cycle.moodLabel}</Text>
              <View className="flex-row flex-wrap gap-2">
                {MOODS.map((m) => (
                  <IconChip
                    key={m}
                    icon={MOOD_EMOJI[m]}
                    label={dict.cycle.moods[m]}
                    active={mood === m}
                    onPress={() => setMood(mood === m ? null : m)}
                  />
                ))}
              </View>
            </View>

            <View>
              <Text className="mb-2 text-sm font-semibold text-text-secondary">{dict.cycle.symptomsLabel}</Text>
              <View className="flex-row flex-wrap gap-2">
                {SYMPTOMS.map((s) => (
                  <IconChip
                    key={s}
                    icon={SYMPTOM_EMOJI[s]}
                    label={dict.cycle.symptoms[s]}
                    active={symptoms.includes(s)}
                    onPress={() => setSymptoms((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]))}
                  />
                ))}
              </View>
            </View>

            <View className="flex-row gap-2">
              <Button variant="ghost" onPress={() => setLogging(false)} disabled={saving}>
                {dict.common.cancel}
              </Button>
              <View className="flex-1">
                <Button onPress={saveLog} disabled={saving}>
                  {dict.common.save}
                </Button>
              </View>
            </View>
          </Card>
        )}

        <View className="flex-row gap-3">
          <Pressable className="flex-1" onPress={() => router.push("/xavf-testi")}>
            <Card>
              <Text className="font-semibold text-text-primary">{dict.cycle.riskQuizCardTitle}</Text>
              <Text className="mt-1 text-xs text-text-secondary">{dict.cycle.riskQuizCardSubtitle}</Text>
            </Card>
          </Pressable>
          <Pressable className="flex-1" onPress={() => router.push("/maqolalar")}>
            <Card>
              <Text className="font-semibold text-text-primary">{dict.cycle.articlesCardTitle}</Text>
            </Card>
          </Pressable>
        </View>

        {data.logs.slice(0, 5).map((log) => (
          <Card key={log.id} className="flex-row items-center justify-between py-3">
            <Text className="text-sm text-text-secondary">{log.date}</Text>
            <View className="flex-row gap-1">
              {log.flow && <Badge tone="primary">{`${FLOW_EMOJI[log.flow]} ${dict.cycle.flowLevels[log.flow]}`}</Badge>}
              {log.mood && <Badge>{`${MOOD_EMOJI[log.mood]} ${dict.cycle.moods[log.mood]}`}</Badge>}
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickCard({ label, value, onPress }: { label: string; value?: string; onPress: () => void }) {
  return (
    <Pressable className="flex-1" onPress={onPress}>
      <Card className="items-center gap-1 py-4">
        <Text className="text-xs font-semibold text-text-secondary">{label}</Text>
        <Text className="text-sm text-text-muted">{value ?? "—"}</Text>
      </Card>
    </Pressable>
  );
}
