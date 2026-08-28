import { useEffect, useState } from "react";
import { ScrollView, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { CycleResponse, FlowLevel, Mood, Symptom } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Badge, Button, Card, IconChip, ScreenHeader } from "@/components/ui";
import { MonthCalendar, type DayMarker } from "@/components/MonthCalendar";

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
];

export default function CycleScreen() {
  const { dict } = useI18n();
  const [data, setData] = useState<CycleResponse | null>(null);
  const [logging, setLogging] = useState(false);
  const [flow, setFlow] = useState<FlowLevel | null>(null);
  const [mood, setMood] = useState<Mood | null>(null);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

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
        <ScreenHeader title={dict.cycle.title} />

        {data.isIrregular && (
          <Card className="border border-warning/40 bg-warning/10">
            <Text className="font-semibold text-text-primary">{dict.cycle.irregularBannerTitle}</Text>
            <Text className="mt-1 text-sm text-text-secondary">{dict.cycle.irregularBannerAction}</Text>
          </Card>
        )}

        {data.prediction && (
          <Card>
            <Text className="text-lg font-bold text-text-primary">
              {dict.cycle.nextPeriodIn(data.prediction.daysUntilNextPeriod)}
            </Text>
            <Text className="mt-1 text-sm text-text-secondary">{dict.cycle.fertileWindowLabel}</Text>
          </Card>
        )}

        <Card>
          <MonthCalendar monthDate={new Date()} markers={markers} today={today} />
        </Card>

        {!logging ? (
          <Button onPress={() => setLogging(true)}>{dict.cycle.logDayButton}</Button>
        ) : (
          <Card className="gap-4">
            <View>
              <Text className="mb-2 text-sm font-semibold text-text-secondary">{dict.cycle.flowLabel}</Text>
              <View className="flex-row gap-2">
                {FLOW_LEVELS.map((f) => (
                  <IconChip key={f} label={dict.cycle.flowLevels[f]} active={flow === f} onPress={() => setFlow(flow === f ? null : f)} />
                ))}
              </View>
            </View>

            <View>
              <Text className="mb-2 text-sm font-semibold text-text-secondary">{dict.cycle.moodLabel}</Text>
              <View className="flex-row flex-wrap gap-2">
                {MOODS.map((m) => (
                  <IconChip key={m} label={dict.cycle.moods[m]} active={mood === m} onPress={() => setMood(mood === m ? null : m)} />
                ))}
              </View>
            </View>

            <View>
              <Text className="mb-2 text-sm font-semibold text-text-secondary">{dict.cycle.symptomsLabel}</Text>
              <View className="flex-row flex-wrap gap-2">
                {SYMPTOMS.map((s) => (
                  <IconChip
                    key={s}
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

        {data.logs.slice(0, 5).map((log) => (
          <Card key={log.id} className="flex-row items-center justify-between py-3">
            <Text className="text-sm text-text-secondary">{log.date}</Text>
            <View className="flex-row gap-1">
              {log.flow && <Badge tone="primary">{dict.cycle.flowLevels[log.flow]}</Badge>}
              {log.mood && <Badge>{dict.cycle.moods[log.mood]}</Badge>}
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
