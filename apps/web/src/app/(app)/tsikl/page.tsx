"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Smile, Droplet, Stethoscope, CalendarRange, ShieldAlert, BookOpenText } from "lucide-react";
import type { CycleResponse, FlowLevel, Mood, Symptom } from "@mammoai/shared";
import { getCyclePhase, MOOD_EMOJI, FLOW_EMOJI, SYMPTOM_EMOJI } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { Button, Card, FloatingTag, LoadingSpinner, ScreenHeader, IconChip, Badge } from "@/components/ui";
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
    return <LoadingSpinner label={dict.common.loading} />;
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

  // Hayzning nechinchi kuni (bleeding) va sikldagi umumiy o'rni (halqa uchun) — App.pdf §12.
  let periodDay: number | null = null;
  let dayInCycle: number | null = null;
  if (data.settings.lastPeriodStart) {
    const diff = Math.round(
      (new Date(today).getTime() - new Date(data.settings.lastPeriodStart).getTime()) / 86400000
    );
    if (diff >= 0 && diff < data.settings.averagePeriodLength) periodDay = diff + 1;
    const cycleLen = data.settings.averageCycleLength || 28;
    dayInCycle = (((diff % cycleLen) + cycleLen) % cycleLen) + 1;
  }

  const todayLog = data.logs.find((l) => l.date === today);
  const cycleLen = data.settings.averageCycleLength || 28;
  const periodLen = data.settings.averagePeriodLength || 5;
  const phase = dayInCycle ? getCyclePhase(dayInCycle, cycleLen, periodLen) : null;
  const greeting = `${dict.common.greeting(onboardingProfile?.name ?? null, new Date().getHours())} 👋`;

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
      <ScreenHeader title={greeting} subtitle={dict.cycle.title} />

      {data.isIrregular && (
        <Card className="bg-warning/10">
          <p className="font-semibold text-text-primary">{dict.cycle.irregularBannerTitle}</p>
          <p className="mt-1 text-sm text-text-secondary">{dict.cycle.irregularBannerAction}</p>
        </Card>
      )}

      <Card variant="glass" className="animate-fade-in-up flex flex-col items-center">
        <button onClick={() => !dayInCycle && setLogging(true)} className="w-full">
          <CycleRing
            dayInCycle={dayInCycle ?? 1}
            cycleLength={data.settings.averageCycleLength}
            label={dict.cycle.title}
            sublabel={data.prediction ? dict.cycle.nextPeriodIn(data.prediction.daysUntilNextPeriod) : dict.cycle.ringEmptyLabel}
          />
        </button>
        {periodDay && (
          <div className="mt-4 flex justify-center">
            <Badge tone="primary">
              {isMinor ? "🐰 " : ""}
              {dict.cycle.periodDayBadge(periodDay)}
            </Badge>
          </div>
        )}

        <div className="mt-4 flex justify-center gap-3">
          <FloatingTag
            icon={<CalendarRange size={18} className="text-primary" />}
            value={dict.cycle.daysUnit(data.settings.averageCycleLength)}
            label={dict.cycle.cycleLengthLabel}
          />
          <FloatingTag
            icon={<Droplet size={18} className="text-primary" />}
            value={dict.cycle.daysUnit(data.settings.averagePeriodLength)}
            label={dict.cycle.periodLengthLabel}
          />
        </div>
      </Card>

      {phase && <PhaseCard phase={phase} />}

      <Card>
        <MonthCalendar monthDate={new Date()} markers={markers} today={today} />
      </Card>

      {/* Kunlik nazorat — App.pdf §20: 3 ta tezkor karta */}
      <div>
        <p className="mb-2 text-base font-bold text-text-primary">{dict.cycle.dailyCheckinTitle}</p>
        <div className="grid grid-cols-3 gap-2.5">
          <QuickCard
            icon={<Smile size={20} />}
            tone="secondary"
            label={dict.cycle.moodCardLabel}
            value={todayLog?.mood ? `${MOOD_EMOJI[todayLog.mood]} ${dict.cycle.moods[todayLog.mood]}` : undefined}
            onClick={() => setLogging(true)}
          />
          <QuickCard
            icon={<Droplet size={20} />}
            tone="primary"
            label={dict.cycle.flowCardLabel}
            value={todayLog?.flow ? `${FLOW_EMOJI[todayLog.flow]} ${dict.cycle.flowLevels[todayLog.flow]}` : undefined}
            onClick={() => setLogging(true)}
          />
          <QuickCard
            icon={<Stethoscope size={20} />}
            tone="accent"
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
                  icon={FLOW_EMOJI[f]}
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
                  icon={MOOD_EMOJI[m]}
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
                  icon={SYMPTOM_EMOJI[s]}
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
          <Card interactive className="h-full space-y-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-warning/15">
              <ShieldAlert size={20} className="text-warning" />
            </span>
            <p className="font-semibold text-text-primary">{dict.cycle.riskQuizCardTitle}</p>
            <p className="text-xs text-text-secondary">{dict.cycle.riskQuizCardSubtitle}</p>
          </Card>
        </button>
        <button onClick={() => router.push("/maqolalar")} className="text-left">
          <Card interactive className="h-full space-y-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/15">
              <BookOpenText size={20} className="text-secondary" />
            </span>
            <p className="font-semibold text-text-primary">{dict.cycle.articlesCardTitle}</p>
          </Card>
        </button>
      </div>

      {data.logs.length > 0 && (
        <div className="space-y-2">
          <p className="text-base font-bold text-text-primary">{dict.cycle.recentLogsTitle}</p>
          {data.logs.slice(0, 5).map((log) => (
            <Card key={log.id} className="flex items-center gap-3 py-3">
              <span className="bg-aurora-cycle flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl">
                <Droplet size={18} className="text-white" />
              </span>
              <span className="flex-1 text-sm font-medium text-text-primary">{log.date}</span>
              <div className="flex gap-1">
                {log.flow && <Badge tone="primary">{FLOW_EMOJI[log.flow]} {dict.cycle.flowLevels[log.flow]}</Badge>}
                {log.mood && <Badge>{MOOD_EMOJI[log.mood]} {dict.cycle.moods[log.mood]}</Badge>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function QuickCard({
  icon,
  label,
  value,
  tone,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  tone: "primary" | "secondary" | "accent";
  onClick: () => void;
}) {
  const filled = !!value;
  const toneBg = tone === "primary" ? "bg-primary" : tone === "secondary" ? "bg-secondary" : "bg-accent";
  return (
    <button onClick={onClick} className="text-left">
      <Card interactive className={clsx("flex h-full flex-col items-center justify-center gap-2 py-4 text-center", filled && `${toneBg} text-white`)}>
        <span className={clsx("flex h-10 w-10 items-center justify-center rounded-2xl", filled ? "bg-white/20" : "bg-surface-muted text-text-secondary")}>
          {icon}
        </span>
        <span className={clsx("text-xs font-semibold", filled ? "text-white" : "text-text-secondary")}>{label}</span>
        <span className={clsx("truncate text-xs", filled ? "text-white/80" : "text-text-muted")}>{value ?? "—"}</span>
      </Card>
    </button>
  );
}
