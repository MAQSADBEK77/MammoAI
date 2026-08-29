import { useEffect, useState } from "react";
import { ScrollView, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import type { PregnancyResponse } from "@mammoai/shared";
import { getMilestoneForWeek } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { Button, Card, ProgressBar, ScreenHeader, TextField } from "@/components/ui";
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
        <View className="items-center py-2">
          <ExpectingIllustration width={200} height={160} />
        </View>
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
      </SafeAreaView>
    );
  }

  const { status } = data;
  const milestone = getMilestoneForWeek(status.currentWeek);
  const sizeLabel = dict.pregnancy.sizes[milestone.sizeComparisonKey.replace("size.", "") as keyof typeof dict.pregnancy.sizes];
  const progressPct = (status.currentWeek / 40) * 100;
  const greeting = `${dict.common.greeting(onboardingProfile?.name ?? null, new Date().getHours())} 👋`;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4 pt-4" contentContainerClassName="gap-4 pb-8">
        <ScreenHeader title={greeting} subtitle={dict.pregnancy.trimester(status.trimester)} />

        <LinearGradient
          colors={["#e8f5e9", "#e3f2fd"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 24, padding: 20, alignItems: "center", gap: 16 }}
        >
          <SizeIllustration icon={milestone.icon} />
          <Text className="text-2xl font-extrabold text-text-primary">{dict.pregnancy.weekLabel(status.currentWeek)}</Text>
          <Text className="text-center text-text-secondary">{dict.pregnancy.sizeComparison(sizeLabel)}</Text>
          <ProgressBar value={progressPct} />
          <Text className="text-sm font-semibold text-primary-dark">{dict.pregnancy.daysRemaining(status.daysRemaining)}</Text>
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
            <Text className="font-semibold text-text-primary">{dict.pregnancy.visitsTitle}</Text>
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
            <Card key={v.id} className="py-3">
              <Text className="font-medium text-text-primary">{v.label}</Text>
              <Text className="text-sm text-text-secondary">
                {v.date}
                {v.clinicName ? ` · ${v.clinicName}` : ""}
              </Text>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
