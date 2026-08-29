import { useEffect, useState } from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronRight, CalendarClock, Hourglass, Stethoscope } from "lucide-react-native";
import type { PregnancyResponse } from "@mammoai/shared";
import { getMilestoneForWeek, gradients } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { Button, Card, FloatingTag, ScreenHeader, TextField } from "@/components/ui";
import { SizeIllustration } from "@/components/SizeIllustration";
import ExpectingIllustration from "../../../assets/illustrations/expecting.svg";

export default function PregnancyScreen() {
  const { dict } = useI18n();
  const { onboardingProfile } = useSession();
  const [data, setData] = useState<PregnancyResponse | null>(null);
  const [lmpInput, setLmpInput] = useState("");
  const [addingVisit, setAddingVisit] = useState(false);
  const [visitLabel, setVisitLabel] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [visitClinic, setVisitClinic] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.pregnancy.get().then(setData);
  }, []);

  if (!data) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Text className="text-text-secondary">{dict.common.loading}</Text>
      </SafeAreaView>
    );
  }

  if (!data.status) {
    return (
      <SafeAreaView className="flex-1 bg-background px-4">
        <ScreenHeader title={dict.pregnancy.title} />
        <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 32, paddingVertical: 24 }}>
          <View className="items-center py-2">
            <ExpectingIllustration width={200} height={160} />
          </View>
        </LinearGradient>
        <Card className="mt-4 gap-3">
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
      </SafeAreaView>
    );
  }

  const { status } = data;
  const milestone = getMilestoneForWeek(status.currentWeek);
  const sizeLabel = dict.pregnancy.sizes[milestone.sizeComparisonKey.replace("size.", "") as keyof typeof dict.pregnancy.sizes];
  const progressPct = (status.currentWeek / 40) * 100;
  const weeksRemaining = Math.max(0, 40 - status.currentWeek);
  const greeting = `${dict.common.greeting(onboardingProfile?.name ?? null, new Date().getHours())} 👋`;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4 pt-4" contentContainerClassName="gap-4 pb-32">
        <ScreenHeader title={greeting} subtitle={dict.pregnancy.trimester(status.trimester)} />

        {/* Homiladorlik "sayohati" kartasi — referens: binafsha gradient fon,
            markazda o'lcham-illyustratsiya, ustida suzuvchi statistik yorliqlar. */}
        <LinearGradient
          colors={gradients.pregnancy}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 32, padding: 22, gap: 18 }}
        >
          <View className="items-center gap-3">
            <View className="rounded-full bg-white/20 p-3">
              <SizeIllustration icon={milestone.icon} />
            </View>
            <Text className="text-2xl font-extrabold text-white">{dict.pregnancy.weekLabel(status.currentWeek)}</Text>
            <Text className="max-w-[240px] text-center text-white/85">{dict.pregnancy.sizeComparison(sizeLabel)}</Text>
          </View>

          <View className="flex-row justify-center gap-3">
            <FloatingTag icon={<CalendarClock size={18} color="#7C3AED" />} value={String(status.currentWeek)} label={dict.pregnancy.completedWeekLabel} />
            <FloatingTag icon={<Hourglass size={18} color="#7C3AED" />} value={String(weeksRemaining)} label={dict.pregnancy.remainingWeekLabel} />
          </View>

          <View className="gap-2">
            <View className="h-3 w-full overflow-hidden rounded-full bg-white/25">
              <View className="h-full rounded-full bg-white" style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }} />
            </View>
            <Text className="text-center text-sm font-semibold text-white">{dict.pregnancy.daysRemaining(status.daysRemaining)}</Text>
          </View>
        </LinearGradient>

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
                <Stethoscope size={20} color="#FFFFFF" />
              </LinearGradient>
              <View className="flex-1">
                <Text className="font-semibold text-text-primary">{v.label}</Text>
                <Text className="text-sm text-text-secondary">
                  {v.date}
                  {v.clinicName ? ` · ${v.clinicName}` : ""}
                </Text>
              </View>
              <ChevronRight size={18} color="#9CA3AF" />
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
