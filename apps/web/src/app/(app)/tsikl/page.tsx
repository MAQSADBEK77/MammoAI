"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CycleResponse, FlowLevel, Mood, Symptom } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
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
  "fatigue",
  "irritability",
  "difficulty_concentrating",
];

export default function CyclePage() {
  const { dict } = useI18n();
  const { onboardingProfile } = useSession();
  const router = useRouter();
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

  // Hayzning nechinchi kuni ekanini hisoblaymiz (App.pdf §12 — kunlik hisoblagich).
  let periodDay: number | null = null;
  if (data.settings.lastPeriodStart) {
    const diff = Math.round(
      (new Date(today).getTime() - new Date(data.settings.lastPeriodStart).getTime()) / 86400000
    );
    if (diff >= 0 && diff < data.settings.averagePeriodLength) periodDay = diff + 1;
  }

  const todayLog = data.logs.find((l) => l.date === today);

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

      {periodDay && (
        <Badge tone="primary">
          {isMinor ? "🐰 " : ""}
          {dict.cycle.periodDayBadge(periodDay)}
        </Badge>
      )}

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

      {/* Kunlik nazorat — App.pdf §20: 3 ta tezkor karta */}
      <div>
        <p className="mb-2 text-sm font-semibold text-text-secondary">{dict.cycle.dailyCheckinTitle}</p>
        <div className="grid grid-cols-3 gap-2">
          <QuickCard label={dict.cycle.moodCardLabel} value={todayLog?.mood ? dict.cycle.moods[todayLog.mood] : undefined} onClick={() => setLogging(true)} />
          <QuickCard label={dict.cycle.flowCardLabel} value={todayLog?.flow ? dict.cycle.flowLevels[todayLog.flow] : undefined} onClick={() => setLogging(true)} />
          <QuickCard
            label={dict.cycle.symptomsCardLabel}
            value={todayLog?.symptoms.length ? String(todayLog.symptoms.length) : undefined}
            onClick={() => setLogging(true)}
          />
        </div>
      </div>

      {logging && (
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

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => router.push("/xavf-testi")} className="text-left">
          <Card className="h-full">
            <p className="font-semibold text-text-primary">{dict.cycle.riskQuizCardTitle}</p>
            <p className="mt-1 text-xs text-text-secondary">{dict.cycle.riskQuizCardSubtitle}</p>
          </Card>
        </button>
        <button onClick={() => router.push("/maqolalar")} className="text-left">
          <Card className="h-full">
            <p className="font-semibold text-text-primary">{dict.cycle.articlesCardTitle}</p>
          </Card>
        </button>
      </div>

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

function QuickCard({ label, value, onClick }: { label: string; value?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-left">
      <Card className="flex h-full flex-col items-center justify-center gap-1 py-4 text-center">
        <span className="text-xs font-semibold text-text-secondary">{label}</span>
        <span className="text-sm text-text-muted">{value ?? "—"}</span>
      </Card>
    </button>
  );
}
