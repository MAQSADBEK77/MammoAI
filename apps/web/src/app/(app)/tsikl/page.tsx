"use client";

import { useEffect, useState } from "react";
import type { CycleResponse, FlowLevel, Mood, Symptom } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Button, Card, ScreenHeader, IconChip, Badge } from "@/components/ui";
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

export default function CyclePage() {
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
    return <p className="text-text-secondary">{dict.common.loading}</p>;
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
      const key = p.toISOString().slice(0, 10);
      markers[key] = "predicted";
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
    <div className="space-y-5 pb-6">
      <ScreenHeader title={dict.cycle.title} />

      {data.isIrregular && (
        <Card className="border-warning/40 bg-warning/10">
          <p className="font-semibold text-text-primary">{dict.cycle.irregularBannerTitle}</p>
          <p className="mt-1 text-sm text-text-secondary">{dict.cycle.irregularBannerAction}</p>
        </Card>
      )}

      {data.prediction && (
        <Card>
          <p className="text-lg font-bold text-text-primary">
            {dict.cycle.nextPeriodIn(data.prediction.daysUntilNextPeriod)}
          </p>
          <p className="mt-1 text-sm text-text-secondary">{dict.cycle.fertileWindowLabel}</p>
        </Card>
      )}

      <Card>
        <MonthCalendar monthDate={new Date()} markers={markers} today={today} />
      </Card>

      {!logging ? (
        <Button className="w-full" onClick={() => setLogging(true)}>
          {dict.cycle.logDayButton}
        </Button>
      ) : (
        <Card className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-text-secondary">{dict.cycle.flowLabel}</p>
            <div className="grid grid-cols-4 gap-2">
              {FLOW_LEVELS.map((f) => (
                <IconChip
                  key={f}
                  label={dict.cycle.flowLevels[f]}
                  active={flow === f}
                  onClick={() => setFlow(flow === f ? null : f)}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-text-secondary">{dict.cycle.moodLabel}</p>
            <div className="grid grid-cols-3 gap-2">
              {MOODS.map((m) => (
                <IconChip
                  key={m}
                  label={dict.cycle.moods[m]}
                  active={mood === m}
                  onClick={() => setMood(mood === m ? null : m)}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-text-secondary">{dict.cycle.symptomsLabel}</p>
            <div className="grid grid-cols-4 gap-2">
              {SYMPTOMS.map((s) => (
                <IconChip
                  key={s}
                  label={dict.cycle.symptoms[s]}
                  active={symptoms.includes(s)}
                  onClick={() =>
                    setSymptoms((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]))
                  }
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setLogging(false)} disabled={saving}>
              {dict.common.cancel}
            </Button>
            <Button className="flex-1" onClick={saveLog} disabled={saving}>
              {dict.common.save}
            </Button>
          </div>
        </Card>
      )}

      {data.logs.length > 0 && (
        <div className="space-y-2">
          {data.logs.slice(0, 5).map((log) => (
            <Card key={log.id} className="flex items-center justify-between py-3">
              <span className="text-sm text-text-secondary">{log.date}</span>
              <div className="flex gap-1">
                {log.flow && <Badge tone="primary">{dict.cycle.flowLevels[log.flow]}</Badge>}
                {log.mood && <Badge>{dict.cycle.moods[log.mood]}</Badge>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
