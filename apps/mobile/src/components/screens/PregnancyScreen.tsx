import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInUp } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { PregnancyResponse, VitalType } from "@mammoai/shared";
import { getMilestoneForWeek, getVitalTone, gradients, localDateStr, formatDateDisplay } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { Badge, Button, Card, FloatingTag, LoadingSpinner, ScreenHeader, TextField } from "@/components/ui";
import { SizeIllustration } from "@/components/SizeIllustration";
import ExpectingIllustration from "../../../assets/illustrations/expecting.svg";

const VITAL_TYPES: VitalType[] = ["heart_rate", "blood_pressure", "weight", "temperature"];
const VITAL_ICON: Record<VitalType, keyof typeof MaterialCommunityIcons.glyphMap> = { heart_rate: "heart-outline", blood_pressure: "chart-line", weight: "scale-bathroom", temperature: "thermometer" };
const VITAL_ICON_COLOR: Record<VitalType, string> = {
  heart_rate: "#F43F7F",
  blood_pressure: "#7C3AED",
  weight: "#0D9488",
  temperature: "#E7A83F",
};

/** "Asosiy" (asosiy.tsx) tabining Homiladorlik-rejim tarkibi — ilgari alohida
 * /homiladorlik ekrani edi. O'zining SafeAreaView/ScrollView'i yo'q. */
export function PregnancyScreen() {
  const { dict } = useI18n();
  const { onboardingProfile } = useSession();
  const [data, setData] = useState<PregnancyResponse | null>(null);
  const [lmpInput, setLmpInput] = useState("");
  const [addingVisit, setAddingVisit] = useState(false);
  const [visitLabel, setVisitLabel] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [visitClinic, setVisitClinic] = useState("");
  const [saving, setSaving] = useState(false);
  const [loggingVital, setLoggingVital] = useState<VitalType | null>(null);
  const [vitalInput, setVitalInput] = useState("");
  const [savingVital, setSavingVital] = useState(false);
  const [vitalError, setVitalError] = useState<string | null>(null);

  async function saveVital() {
    if (!loggingVital || !vitalInput.trim()) return;
    setSavingVital(true);
    setVitalError(null);
    try {
      setData(await api.pregnancy.logVital({ type: loggingVital, value: vitalInput.trim() }));
      setLoggingVital(null);
      setVitalInput("");
    } catch {
      setVitalError(dict.pregnancy.vitalsInvalidFormat);
    } finally {
      setSavingVital(false);
    }
  }

  useEffect(() => {
    api.pregnancy.get().then(setData);
  }, []);

  if (!data) {
    return <LoadingSpinner label={dict.common.loading} />;
  }

  if (!data.status) {
    return (
      <View className="gap-4">
        <ScreenHeader title={dict.pregnancy.title} />
        <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 32, paddingVertical: 24 }}>
          <View className="items-center py-2">
            <ExpectingIllustration width={200} height={160} />
          </View>
        </LinearGradient>
        <Card className="gap-3">
          <Text className="text-sm text-text-secondary">{dict.onboarding.lastCheckupQuestion}</Text>
          <TextField value={lmpInput} onChangeText={setLmpInput} placeholder="YYYY-MM-DD" />
          <Button
            disabled={!lmpInput || saving}
            onPress={async () => {
              setSaving(true);
              try {
                setData(await api.pregnancy.updateProfile({ lastMenstrualPeriod: lmpInput }));
              } finally {
                setSaving(false);
              }
            }}
          >
            {dict.common.save}
          </Button>
        </Card>
      </View>
    );
  }

  const { status } = data;
  const milestone = getMilestoneForWeek(status.currentWeek);
  const sizeLabel = dict.pregnancy.sizes[milestone.sizeComparisonKey.replace("size.", "") as keyof typeof dict.pregnancy.sizes];
  const progressPct = (status.currentWeek / 40) * 100;
  const weeksRemaining = Math.max(0, 40 - status.currentWeek);
  const greeting = `${dict.common.greeting(onboardingProfile?.name ?? null, new Date().getHours())} 👋`;

  const todayStr = localDateStr();
  const nextVisit = data.visits.find((v) => v.date >= todayStr) ?? null;
  const nextVisitDaysLeft = nextVisit
    ? Math.max(0, Math.round((new Date(nextVisit.date + "T00:00:00Z").getTime() - new Date(todayStr + "T00:00:00Z").getTime()) / 86400000))
    : null;

  return (
    <View className="gap-4">
      <ScreenHeader title={greeting} subtitle={dict.pregnancy.trimester(status.trimester)} />

      <Animated.View entering={FadeInUp.duration(450)}>
        <LinearGradient colors={gradients.pregnancy} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 32, padding: 22, gap: 18 }}>
          <View className="items-center gap-3">
            <View className="rounded-full bg-white/20 p-3">
              <SizeIllustration icon={milestone.icon} />
            </View>
            <Text className="text-2xl font-extrabold text-white">{dict.pregnancy.weekLabel(status.currentWeek)}</Text>
            <Text className="max-w-[240px] text-center text-white/85">{dict.pregnancy.sizeComparison(sizeLabel)}</Text>
          </View>

          <View className="flex-row justify-center gap-3">
            <FloatingTag icon={<MaterialCommunityIcons name="clock-time-eight-outline" size={18} color="#7C3AED" />} value={String(status.currentWeek)} label={dict.pregnancy.completedWeekLabel} />
            <FloatingTag icon={<MaterialCommunityIcons name="timer-sand" size={18} color="#7C3AED" />} value={String(weeksRemaining)} label={dict.pregnancy.remainingWeekLabel} />
          </View>

          <View className="gap-2">
            <View className="h-3 w-full overflow-hidden rounded-full bg-white/25">
              <View className="h-full rounded-full bg-white" style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }} />
            </View>
            <Text className="text-center text-sm font-semibold text-white">{dict.pregnancy.daysRemaining(status.daysRemaining)}</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(450).delay(80)} className="gap-2">
        <Text className="text-base font-bold text-text-primary">{dict.pregnancy.vitalsTitle}</Text>
        <Text className="-mt-1 text-xs text-text-muted">{dict.pregnancy.vitalsDisclaimer}</Text>

        <View className="flex-row flex-wrap gap-3">
          {VITAL_TYPES.map((type) => {
            const Icon = VITAL_ICON[type];
            const latest = data.latestVitals[type];
            const tone = latest ? getVitalTone(type, latest.value) : null;
            return (
              <Pressable key={type} className="w-[47%] flex-1" onPress={() => { setLoggingVital(type); setVitalInput(""); setVitalError(null); }}>
                <Card className="gap-3">
                  <View className="flex-row items-center justify-between">
                    <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: `${VITAL_ICON_COLOR[type]}1A` }}>
                      <MaterialCommunityIcons name={Icon} size={18} color={VITAL_ICON_COLOR[type]} />
                    </View>
                    {type === "weight" && data.weightDeltaKg !== null ? (
                      <Badge tone="primary">{dict.pregnancy.vitalsWeightChange(data.weightDeltaKg)}</Badge>
                    ) : (
                      tone && <Badge tone={tone === "normal" ? "success" : "warning"}>{tone === "normal" ? dict.pregnancy.vitalsNormal : dict.pregnancy.vitalsAttention}</Badge>
                    )}
                  </View>
                  {latest ? (
                    <Text className="text-xl font-extrabold text-text-primary">
                      {latest.value} <Text className="text-xs font-semibold text-text-secondary">{dict.pregnancy.vitalsUnits[type]}</Text>
                    </Text>
                  ) : (
                    <Text className="text-sm text-text-muted">{dict.pregnancy.vitalsEmpty}</Text>
                  )}
                  <Text className="text-xs font-medium text-text-secondary">{dict.pregnancy.vitalsLabels[type]}</Text>
                </Card>
              </Pressable>
            );
          })}
        </View>

        {loggingVital && (
          <Card className="gap-3">
            <Text className="font-semibold text-text-primary">
              {dict.pregnancy.vitalsAddTitle} — {dict.pregnancy.vitalsLabels[loggingVital]}
            </Text>
            <TextField
              value={vitalInput}
              onChangeText={setVitalInput}
              placeholder={dict.pregnancy.vitalsPlaceholders[loggingVital]}
              keyboardType={loggingVital === "blood_pressure" ? "default" : "numeric"}
            />
            {vitalError && <Text className="text-sm text-danger">{vitalError}</Text>}
            <View className="flex-row gap-2">
              <Button variant="ghost" onPress={() => setLoggingVital(null)} disabled={savingVital}>
                {dict.common.cancel}
              </Button>
              <View className="flex-1">
                <Button onPress={saveVital} disabled={savingVital || !vitalInput.trim()}>
                  {dict.common.save}
                </Button>
              </View>
            </View>
          </Card>
        )}
      </Animated.View>

      <Pressable className="active:scale-[0.98]" onPress={() => setAddingVisit(true)}>
        <Card className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-secondary/15">
            <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#7C3AED" />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-semibold text-text-secondary">{dict.pregnancy.nextCheckupTitle}</Text>
            {nextVisit ? (
              <>
                <Text className="font-bold text-text-primary">{nextVisit.date}</Text>
                <Text className="text-sm text-text-secondary">
                  {nextVisit.label} · {dict.pregnancy.nextCheckupDaysLeft(nextVisitDaysLeft ?? 0)}
                </Text>
              </>
            ) : (
              <Text className="text-sm text-text-muted">{dict.pregnancy.nextCheckupNone}</Text>
            )}
          </View>
          <MaterialCommunityIcons name="chevron-right" size={18} color="#9CA3AF" />
        </Card>
      </Pressable>

      {status.trimester === 3 && (
        <Card className="flex-row items-center justify-between">
          <View>
            <Text className="font-semibold text-text-primary">{dict.pregnancy.kickCounterTitle}</Text>
            <Text className="text-sm text-text-secondary">{dict.pregnancy.kickCounterCount(data.kicksToday)}</Text>
          </View>
          <Button onPress={async () => setData(await api.pregnancy.logKick())}>{dict.pregnancy.kickCounterButton}</Button>
        </Card>
      )}

      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-bold text-text-primary">{dict.pregnancy.visitsTitle}</Text>
          {!addingVisit && (
            <Button variant="ghost" onPress={() => setAddingVisit(true)}>
              {dict.pregnancy.addVisitButton}
            </Button>
          )}
        </View>

        {addingVisit && (
          <Card className="gap-2">
            <TextField value={visitLabel} onChangeText={setVisitLabel} placeholder={dict.pregnancy.addVisitButton} />
            <TextField value={visitDate} onChangeText={setVisitDate} placeholder="YYYY-MM-DD" />
            <TextField value={visitClinic} onChangeText={setVisitClinic} placeholder={dict.clinics.title} />
            <View className="flex-row gap-2">
              <Button variant="ghost" onPress={() => setAddingVisit(false)}>
                {dict.common.cancel}
              </Button>
              <View className="flex-1">
                <Button
                  disabled={!visitLabel || !visitDate || saving}
                  onPress={async () => {
                    setSaving(true);
                    try {
                      setData(
                        await api.pregnancy.addVisit({
                          label: visitLabel,
                          date: visitDate,
                          clinicName: visitClinic || null,
                          note: null,
                        })
                      );
                      setVisitLabel("");
                      setVisitDate("");
                      setVisitClinic("");
                      setAddingVisit(false);
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  {dict.common.add}
                </Button>
              </View>
            </View>
          </Card>
        )}

        {data.visits.map((v) => (
          <Card key={v.id} className="flex-row items-center gap-3 py-3">
            <LinearGradient
              colors={gradients.pregnancy}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: 44, height: 44, borderRadius: 16, alignItems: "center", justifyContent: "center" }}
            >
              <MaterialCommunityIcons name="stethoscope" size={20} color="#FFFFFF" />
            </LinearGradient>
            <View className="flex-1">
              <Text className="font-semibold text-text-primary">{v.label}</Text>
              <Text className="text-sm text-text-secondary">
                {formatDateDisplay(v.date)}
                {v.clinicName ? ` · ${v.clinicName}` : ""}
              </Text>
            </View>
          </Card>
        ))}
      </View>
    </View>
  );
}
