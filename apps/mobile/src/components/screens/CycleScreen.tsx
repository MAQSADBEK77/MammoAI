import { useEffect, useState } from "react";
import { Pressable, View, Text } from "react-native";
import { router } from "expo-router";
import clsx from "clsx";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Droplet, Stethoscope, CalendarRange, ShieldAlert, BookOpenText, ChevronRight } from "lucide-react-native";
import type { CycleLog, CycleResponse, FlowLevel, Mood, Symptom } from "@mammoai/shared";
import { getCyclePhase, localDateStr, MOOD_EMOJI, FLOW_EMOJI, SYMPTOM_EMOJI } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { Badge, Button, Card, FloatingTag, IconChip, LoadingSpinner, ScreenHeader } from "@/components/ui";
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

/** "Asosiy" (asosiy.tsx) tabining Hayz-rejim tarkibi — ilgari alohida /tsikl
 * ekrani edi, endi rejimga qarab Asosiy ichida ko'rsatiladi. O'zining
 * SafeAreaView/ScrollView'i yo'q — Asosiy shellga joylashadi. */
export function CycleScreen() {
  const { dict } = useI18n();
  const { onboardingProfile } = useSession();
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
      markers[p.toISOString().slice(0, 10)] = "predicted";
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

  let periodDay: number | null = null;
  let dayInCycle: number | null = null;
  if (data.settings.lastPeriodStart) {
    const diff = Math.round((new Date(today).getTime() - new Date(data.settings.lastPeriodStart).getTime()) / 86400000);
    if (diff >= 0 && diff < data.settings.averagePeriodLength) periodDay = diff + 1;
    dayInCycle = (((diff % cycleLen) + cycleLen) % cycleLen) + 1;
  }

  const todayLog = data.logs.find((l) => l.date === today);
  const selectedPhase = phaseForDate(selectedDate);
  const greeting = `${dict.common.greeting(onboardingProfile?.name ?? null, new Date().getHours())} 👋`;

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
    <View className="gap-4">
      <ScreenHeader title={greeting} subtitle={dict.cycle.title} />

      {data.isIrregular && (
        <Card className="bg-warning/10">
          <Text className="font-semibold text-text-primary">{dict.cycle.irregularBannerTitle}</Text>
          <Text className="mt-1 text-sm text-text-secondary">{dict.cycle.irregularBannerAction}</Text>
        </Card>
      )}

      <Animated.View entering={FadeInUp.duration(450)}>
        <Card variant="glass" className="items-center">
          <Pressable onPress={() => !dayInCycle && openLogging(today, todayLog)}>
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

          <View className="mt-4 flex-row gap-3">
            <FloatingTag
              icon={<CalendarRange size={18} color="#F43F7F" />}
              value={dict.cycle.daysUnit(data.settings.averageCycleLength)}
              label={dict.cycle.cycleLengthLabel}
            />
            <FloatingTag
              icon={<Droplet size={18} color="#F43F7F" />}
              value={dict.cycle.daysUnit(data.settings.averagePeriodLength)}
              label={dict.cycle.periodLengthLabel}
            />
          </View>
        </Card>
      </Animated.View>

      {/* Kunlik kayfiyat so'rovi — Figma referens: kalendar tepasida, faqat
          "o'zini qanday his qilyapti" so'raladi, bosilgan zahoti saqlanadi va
          kontekstual javob ko'rsatiladi. */}
      <View className="gap-3">
        <Text className="text-base font-bold text-text-primary">{dict.cycle.moodCheckinTitle}</Text>
        <View className="flex-row justify-between">
          {MOODS.map((m) => (
            <Pressable
              key={m}
              onPress={() => pickMood(m)}
              disabled={moodSaving}
              className={clsx(
                "h-12 w-12 items-center justify-center rounded-2xl border-2 active:scale-95",
                todayLog?.mood === m ? "border-primary bg-primary-light/40" : "border-transparent bg-surface-muted"
              )}
            >
              <Text style={{ fontSize: 22 }}>{MOOD_EMOJI[m]}</Text>
            </Pressable>
          ))}
        </View>
        {todayLog?.mood && (
          <Text className="text-center text-sm font-semibold" style={{ color: "#D62A63" }}>
            {dict.cycle.moodResponses[todayLog.mood]}
          </Text>
        )}
      </View>

      <View>
        <Text className="mb-2 text-sm font-semibold text-text-secondary">{dict.cycle.detailedLogButton}</Text>
        <View className="flex-row gap-2.5">
          <QuickCard
            icon={<Droplet size={20} color={todayLog?.flow ? "#FFFFFF" : "#F43F7F"} />}
            tone="primary"
            label={dict.cycle.flowCardLabel}
            value={todayLog?.flow ? `${FLOW_EMOJI[todayLog.flow]} ${dict.cycle.flowLevels[todayLog.flow]}` : undefined}
            onPress={() => openLogging(today, todayLog)}
          />
          <QuickCard
            icon={<Stethoscope size={20} color={todayLog?.symptoms.length ? "#FFFFFF" : "#0D9488"} />}
            tone="accent"
            label={dict.cycle.symptomsCardLabel}
            value={todayLog?.symptoms.length ? String(todayLog.symptoms.length) : undefined}
            onPress={() => openLogging(today, todayLog)}
          />
        </View>
      </View>

      <Card style={{ borderRadius: 20 }}>
        <MonthCalendar
          monthDate={new Date()}
          markers={markers}
          ovulationDate={data.prediction?.ovulationDay ?? null}
          today={today}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </Card>

      {/* Tanlangan kun uchun faza/prognoz — App.pdf/Figma referens: "kalendar
          pastida ma'lumot bersin, tanlov qilishiga qarab". */}
      {selectedPhase && (
        <View className="gap-2">
          <Text className="text-sm font-semibold text-text-secondary">{formatDateLabel(selectedDate)}</Text>
          <PhaseCard phase={selectedPhase} />
        </View>
      )}

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
        <Pressable className="flex-1 active:scale-[0.98]" onPress={() => router.push("/xavf-testi")}>
          <Card className="gap-2.5">
            <View className="h-10 w-10 items-center justify-center rounded-2xl bg-warning/15">
              <ShieldAlert size={20} color="#E7A83F" />
            </View>
            <Text className="font-semibold text-text-primary">{dict.cycle.riskQuizCardTitle}</Text>
            <Text className="text-xs text-text-secondary">{dict.cycle.riskQuizCardSubtitle}</Text>
          </Card>
        </Pressable>
        <Pressable className="flex-1 active:scale-[0.98]" onPress={() => router.push("/maqolalar")}>
          <Card className="gap-2.5">
            <View className="h-10 w-10 items-center justify-center rounded-2xl bg-secondary/15">
              <BookOpenText size={20} color="#7C3AED" />
            </View>
            <Text className="font-semibold text-text-primary">{dict.cycle.articlesCardTitle}</Text>
          </Card>
        </Pressable>
      </View>

      {/* So'nggi yozuvlar — Figma referens: nisbiy sana + emoji + qisqa tavsif +
          o'q, har bir qator bosilsa o'sha kun tahrirlanadi. */}
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-bold text-text-primary">{dict.cycle.recentLogsTitle}</Text>
          {data.logs.length > 3 && (
            <Pressable onPress={() => setShowAllLogs((v) => !v)}>
              <Text className="text-sm font-semibold" style={{ color: "#D62A63" }}>
                {dict.cycle.viewAllLogsLabel}
              </Text>
            </Pressable>
          )}
        </View>

        {data.logs.length === 0 ? (
          <Text className="text-sm text-text-muted">{dict.cycle.noLogsYet}</Text>
        ) : (
          <View className="gap-2">
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
                <Pressable key={log.id} className="active:scale-[0.98]" onPress={() => openLogging(log.date, log)}>
                  <Card className="flex-row items-center gap-3 py-3">
                    <View className="h-11 w-11 items-center justify-center rounded-full bg-primary-light/50">
                      <Text style={{ fontSize: 18 }}>{emoji}</Text>
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text className="font-semibold text-text-primary">{dateLabel}</Text>
                      {subtitleParts.length > 0 && (
                        <Text className="text-xs text-text-secondary" numberOfLines={1}>
                          {subtitleParts.join(" · ")}
                        </Text>
                      )}
                    </View>
                    <ChevronRight size={18} color="#9CA3AF" />
                  </Card>
                </Pressable>
              );
            })}
          </View>
        )}

        <Button onPress={() => openLogging(today, todayLog)}>{dict.cycle.addLogButton}</Button>
      </View>
    </View>
  );
}

function QuickCard({
  icon,
  label,
  value,
  tone,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  tone: "primary" | "secondary" | "accent";
  onPress: () => void;
}) {
  const filled = !!value;
  const bgClass = !filled ? "bg-surface" : tone === "primary" ? "bg-primary" : tone === "secondary" ? "bg-secondary" : "bg-accent";
  return (
    <Pressable className="flex-1 active:scale-95" onPress={onPress}>
      <Card className={`items-center gap-2 py-4 ${bgClass}`}>
        <View className={`h-10 w-10 items-center justify-center rounded-2xl ${filled ? "bg-white/20" : "bg-surface-muted"}`}>{icon}</View>
        <Text className={`text-xs font-semibold ${filled ? "text-white" : "text-text-secondary"}`}>{label}</Text>
        <Text className={`text-xs ${filled ? "text-white/80" : "text-text-muted"}`} numberOfLines={1}>
          {value ?? "—"}
        </Text>
      </Card>
    </Pressable>
  );
}
