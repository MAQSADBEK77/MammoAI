"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { WaterDropOutlined, MedicalServicesOutlined, DateRangeOutlined, GppMaybeOutlined, MenuBookOutlined, ChevronRight } from "@mui/icons-material";
import type { CycleResponse, CycleLog, FlowLevel, Mood, Symptom } from "@mammoai/shared";
import { getCyclePhase, localDateStr, MOOD_EMOJI, MOOD_RESPONSE_EMOJI, FLOW_EMOJI, SYMPTOM_EMOJI } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { Button, Card, FloatingTag, LoadingSpinner, ScreenHeader, IconChip, Badge } from "@/components/ui";
import { MonthCalendar, type DayMarker } from "@/components/MonthCalendar";
import { CycleRing } from "@/components/CycleRing";
import { PhaseCard } from "@/components/PhaseCard";
import { Emoji } from "@/components/Emoji";

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

/** "Asosiy" (/asosiy) sahifasining Hayz-rejim tarkibi — ilgari alohida /tsikl
 * sahifasi edi, endi rejimga qarab Asosiy ichida ko'rsatiladi. */
export function CycleScreen() {
  const { dict } = useI18n();
  const { onboardingProfile } = useSession();
  const router = useRouter();
  const [data, setData] = useState<CycleResponse | null>(null);
  const [logging, setLogging] = useState(false);
  const [logDate, setLogDate] = useState<string>(() => localDateStr());
  const [flow, setFlow] = useState<FlowLevel | null>(null);
  const [mood, setMood] = useState<Mood | null>(null);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [saving, setSaving] = useState(false);
  const [moodSaving, setMoodSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => localDateStr());
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());

  const today = localDateStr();
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
    let p = new Date(data.prediction.nextPeriodStart + "T00:00:00Z");
    const pEnd = new Date(data.prediction.nextPeriodEnd + "T00:00:00Z");
    while (p <= pEnd) {
      const key = p.toISOString().slice(0, 10);
      markers[key] = "predicted";
      p.setUTCDate(p.getUTCDate() + 1);
    }
  }

  const cycleLen = data.settings.averageCycleLength || 28;
  const periodLen = data.settings.averagePeriodLength || 5;

  // Berilgan istalgan sana uchun tsikl fazasini hisoblaydi — kalendarda qaysi
  // kun bosilsa, o'sha kun uchun "prognoz" ko'rsatish uchun (App.pdf/Figma
  // referens: "kalendar pastida ma'lumot bersin, tanlov qilishiga qarab").
  function phaseForDate(dateStr: string) {
    if (!data!.settings.lastPeriodStart) return null;
    const diff = Math.round((new Date(dateStr).getTime() - new Date(data!.settings.lastPeriodStart).getTime()) / 86400000);
    const dayInCycle = (((diff % cycleLen) + cycleLen) % cycleLen) + 1;
    return getCyclePhase(dayInCycle, cycleLen, periodLen);
  }

  function formatDateLabel(dateStr: string) {
    if (dateStr === today) return dict.cycle.todayLabel;
    const d = new Date(dateStr + "T00:00:00");
    return `${d.getDate()}-${dict.common.months[d.getMonth()]}`;
  }

  // Hayzning nechinchi kuni (bleeding) va sikldagi umumiy o'rni (halqa uchun) — App.pdf §12.
  let periodDay: number | null = null;
  let dayInCycle: number | null = null;
  if (data.settings.lastPeriodStart) {
    const diff = Math.round(
      (new Date(today).getTime() - new Date(data.settings.lastPeriodStart).getTime()) / 86400000
    );
    if (diff >= 0 && diff < data.settings.averagePeriodLength) periodDay = diff + 1;
    dayInCycle = (((diff % cycleLen) + cycleLen) % cycleLen) + 1;
  }

  const todayLog = data.logs.find((l) => l.date === today);
  const selectedPhase = phaseForDate(selectedDate);
  const greeting = (
    <>
      {dict.common.greeting(onboardingProfile?.name ?? null, new Date().getHours())} <Emoji e="👋" size={20} />
    </>
  );

  // Kalendarda ko'rsatilayotgan oyning har bir kuni uchun tsikl fazasi — shu
  // orqali oldingi/keyingi oylarga o'tilganda ham fon ranglari to'g'ri
  // hisoblanadi (foydalanuvchi so'rovi: fazalar ranglar bilan ajralib tursin).
  const phaseMarkers: Record<string, ReturnType<typeof getCyclePhase>> = {};
  if (data.settings.lastPeriodStart) {
    const y = calendarMonth.getFullYear();
    const m = calendarMonth.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = localDateStr(new Date(y, m, d));
      const phase = phaseForDate(dateStr);
      if (phase) phaseMarkers[dateStr] = phase;
    }
  }

  function openLogging(date: string, existing?: CycleLog) {
    setLogDate(date);
    setFlow(existing?.flow ?? null);
    setMood(existing?.mood ?? null);
    setSymptoms(existing?.symptoms ?? []);
    setLogging(true);
  }

  async function pickMood(m: Mood) {
    setMoodSaving(true);
    try {
      const res = await api.cycle.logDay({ date: today, flow: todayLog?.flow ?? null, mood: m, symptoms: todayLog?.symptoms ?? [] });
      setData(res);
    } finally {
      setMoodSaving(false);
    }
  }

  async function saveLog() {
    setSaving(true);
    try {
      const res = await api.cycle.logDay({ date: logDate, flow, mood, symptoms });
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
    <div className="space-y-5">
      <ScreenHeader title={greeting} subtitle={dict.cycle.title} />

      {data.isIrregular && (
        <Card className="bg-warning/10">
          <p className="font-semibold text-text-primary">{dict.cycle.irregularBannerTitle}</p>
          <p className="mt-1 text-sm text-text-secondary">{dict.cycle.irregularBannerAction}</p>
        </Card>
      )}

      <Card variant="glass" className="animate-fade-in-up flex flex-col items-center">
        <button onClick={() => !dayInCycle && openLogging(today, todayLog)} className="w-full">
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
              {isMinor && (
                <>
                  <Emoji e="🐰" size={14} />{" "}
                </>
              )}
              {dict.cycle.periodDayBadge(periodDay)}
            </Badge>
          </div>
        )}

        <div className="mt-4 flex justify-center gap-3">
          <FloatingTag
            icon={<DateRangeOutlined sx={{ fontSize: 18 }} className="text-primary" />}
            value={dict.cycle.daysUnit(data.settings.averageCycleLength)}
            label={dict.cycle.cycleLengthLabel}
          />
          <FloatingTag
            icon={<WaterDropOutlined sx={{ fontSize: 18 }} className="text-primary" />}
            value={dict.cycle.daysUnit(data.settings.averagePeriodLength)}
            label={dict.cycle.periodLengthLabel}
          />
        </div>
      </Card>

      {/* Kunlik kayfiyat so'rovi — Figma referens: kalendar tepasida, faqat
          "o'zini qanday his qilyapti" so'raladi, bosilgan zahoti saqlanadi va
          kontekstual javob ko'rsatiladi. */}
      <div className="space-y-3">
        <p className="text-base font-bold text-text-primary">{dict.cycle.moodCheckinTitle}</p>
        <div className="grid grid-cols-6 gap-2">
          {MOODS.map((m) => (
            <button
              key={m}
              onClick={() => pickMood(m)}
              disabled={moodSaving}
              className={clsx(
                "tap-target flex aspect-square flex-col items-center justify-center rounded-2xl border-2 text-2xl transition active:scale-95 disabled:opacity-60",
                todayLog?.mood === m ? "border-primary bg-primary-light/40" : "border-transparent bg-surface-muted hover:border-border"
              )}
            >
              <Emoji e={MOOD_EMOJI[m]} size={26} />
            </button>
          ))}
        </div>
        {todayLog?.mood && (
          <p className="flex items-center justify-center gap-1 text-center text-sm font-semibold text-primary-dark">
            {dict.cycle.moodResponses[todayLog.mood]} <Emoji e={MOOD_RESPONSE_EMOJI[todayLog.mood]} size={16} />
          </p>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-text-secondary">{dict.cycle.detailedLogButton}</p>
        <div className="grid grid-cols-2 gap-2.5">
          <QuickCard
            icon={<WaterDropOutlined sx={{ fontSize: 20 }} />}
            tone="primary"
            label={dict.cycle.flowCardLabel}
            value={
              todayLog?.flow ? (
                <>
                  <Emoji e={FLOW_EMOJI[todayLog.flow]} size={14} /> {dict.cycle.flowLevels[todayLog.flow]}
                </>
              ) : undefined
            }
            onClick={() => openLogging(today, todayLog)}
          />
          <QuickCard
            icon={<MedicalServicesOutlined sx={{ fontSize: 20 }} />}
            tone="accent"
            label={dict.cycle.symptomsCardLabel}
            value={todayLog?.symptoms.length ? String(todayLog.symptoms.length) : undefined}
            onClick={() => openLogging(today, todayLog)}
          />
        </div>
      </div>

      <Card className="rounded-[20px]!">
        <MonthCalendar
          monthDate={calendarMonth}
          markers={markers}
          phaseMarkers={phaseMarkers}
          ovulationDate={data.prediction?.ovulationDay ?? null}
          today={today}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onPrevMonth={() => setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          onNextMonth={() => setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
        />
      </Card>

      {/* Tanlangan kun uchun faza/prognoz — App.pdf/Figma referens: "kalendar
          pastida ma'lumot bersin, tanlov qilishiga qarab". */}
      {selectedPhase && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-text-secondary">{formatDateLabel(selectedDate)}</p>
          <PhaseCard phase={selectedPhase} />
        </div>
      )}

      {logging && (
        <Card className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-text-secondary">{dict.cycle.flowLabel}</p>
            <div className="grid grid-cols-4 gap-2">
              {FLOW_LEVELS.map((f) => (
                <IconChip
                  key={f}
                  icon={<Emoji e={FLOW_EMOJI[f]} />}
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
                  icon={<Emoji e={MOOD_EMOJI[m]} />}
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
                  icon={<Emoji e={SYMPTOM_EMOJI[s]} />}
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
              <GppMaybeOutlined sx={{ fontSize: 20 }} className="text-warning" />
            </span>
            <p className="font-semibold text-text-primary">{dict.cycle.riskQuizCardTitle}</p>
            <p className="text-xs text-text-secondary">{dict.cycle.riskQuizCardSubtitle}</p>
          </Card>
        </button>
        <button onClick={() => router.push("/maqolalar")} className="text-left">
          <Card interactive className="h-full space-y-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/15">
              <MenuBookOutlined sx={{ fontSize: 20 }} className="text-secondary" />
            </span>
            <p className="font-semibold text-text-primary">{dict.cycle.articlesCardTitle}</p>
          </Card>
        </button>
      </div>

      {/* So'nggi yozuvlar — Figma referens: nisbiy sana + emoji + qisqa tavsif +
          o'q, har bir qator bosilsa o'sha kun tahrirlanadi. */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-base font-bold text-text-primary">{dict.cycle.recentLogsTitle}</p>
          {data.logs.length > 3 && (
            <button type="button" onClick={() => setShowAllLogs((v) => !v)} className="text-sm font-semibold text-primary-dark">
              {dict.cycle.viewAllLogsLabel}
            </button>
          )}
        </div>

        {data.logs.length === 0 ? (
          <p className="text-sm text-text-muted">{dict.cycle.noLogsYet}</p>
        ) : (
          <div className="space-y-2">
            {(showAllLogs ? data.logs : data.logs.slice(0, 3)).map((log) => {
              const diff = Math.round((new Date(today).getTime() - new Date(log.date).getTime()) / 86400000);
              const dateLabel = diff === 0 ? dict.cycle.todayLabel : diff === 1 ? dict.cycle.yesterdayLabel : dict.cycle.daysAgoLabel(diff);
              const subtitleParts: string[] = [];
              if (log.symptoms.length) {
                subtitleParts.push(
                  dict.cycle.symptoms[log.symptoms[0]] + (log.symptoms.length > 1 ? ` +${log.symptoms.length - 1}` : "")
                );
              }
              if (log.flow) subtitleParts.push(dict.cycle.flowLevels[log.flow]);
              if (!subtitleParts.length && log.mood) subtitleParts.push(dict.cycle.moods[log.mood]);
              const emoji = log.mood ? MOOD_EMOJI[log.mood] : log.flow ? FLOW_EMOJI[log.flow] : "📝";
              return (
                <button key={log.id} type="button" onClick={() => openLogging(log.date, log)} className="w-full text-left">
                  <Card interactive className="flex items-center gap-3 py-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-light/50">
                      <Emoji e={emoji} size={22} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-text-primary">{dateLabel}</p>
                      {subtitleParts.length > 0 && <p className="truncate text-xs text-text-secondary">{subtitleParts.join(" · ")}</p>}
                    </div>
                    <ChevronRight sx={{ fontSize: 18 }} className="shrink-0 text-text-muted" />
                  </Card>
                </button>
              );
            })}
          </div>
        )}

        <Button className="w-full" onClick={() => openLogging(today, todayLog)}>
          {dict.cycle.addLogButton}
        </Button>
      </div>
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
  value?: React.ReactNode;
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
