import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { RISK_QUIZ_QUESTIONS } from "@mammoai/shared";
import type { RiskQuizAnswers, RiskQuizResult } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Badge, Button, Card, LoadingSpinner, ProgressBar, ScreenHeader } from "@/components/ui";

export default function RiskQuizScreen() {
  const { dict } = useI18n();

  const [existingResult, setExistingResult] = useState<RiskQuizResult | null | undefined>(undefined);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Partial<RiskQuizAnswers>>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<RiskQuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.riskQuiz.get().then(setExistingResult);
  }, []);

  const question = RISK_QUIZ_QUESTIONS[stepIndex];
  const isLast = stepIndex === RISK_QUIZ_QUESTIONS.length - 1;

  async function answer(value: boolean) {
    const next = { ...answers, [question.id]: value };
    setAnswers(next);
    if (!isLast) {
      setStepIndex((i) => i + 1);
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.riskQuiz.submit(next as RiskQuizAnswers);
      setResult(res);
    } finally {
      setSubmitting(false);
    }
  }

  const shown = result ?? (existingResult && !started ? existingResult : null);

  if (existingResult === undefined) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <LoadingSpinner label={dict.common.loading} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4 pt-4" contentContainerClassName="gap-5 pb-8">
        <ScreenHeader title={dict.riskQuiz.title} />
        <Text className="-mt-3 text-xs text-text-muted">{dict.riskQuiz.disclaimer}</Text>

        {shown ? (
          <Card className="gap-3">
            <Badge tone={shown.level === "high" ? "danger" : shown.level === "medium" ? "warning" : "success"}>
              {dict.riskQuiz.levels[shown.level].label}
            </Badge>
            <Text className="text-xl font-bold text-text-primary">{dict.riskQuiz.resultTitle}</Text>
            <Text className="text-text-secondary">{dict.riskQuiz.levels[shown.level].description}</Text>
            {shown.level !== "low" && (
              <Button onPress={() => router.push("/(tabs)/asosiy")}>{dict.riskQuiz.findClinicButton}</Button>
            )}
            <Button
              variant="ghost"
              onPress={() => {
                setStarted(true);
                setResult(null);
                setAnswers({});
                setStepIndex(0);
              }}
            >
              {dict.riskQuiz.startButton}
            </Button>
          </Card>
        ) : (
          <Card className="gap-4">
            <View className="gap-2">
              <ProgressBar value={((stepIndex + 1) / RISK_QUIZ_QUESTIONS.length) * 100} />
              <Text className="text-sm text-text-muted">
                {stepIndex + 1} / {RISK_QUIZ_QUESTIONS.length}
              </Text>
            </View>
            <Text className="text-lg font-semibold text-text-primary">{dict.riskQuiz.questions[question.id]}</Text>
            <View className="flex-row gap-2">
              <Button variant="secondary" className="flex-1" onPress={() => answer(true)} disabled={submitting}>
                {dict.common.yes}
              </Button>
              <Button variant="secondary" className="flex-1" onPress={() => answer(false)} disabled={submitting}>
                {dict.common.no}
              </Button>
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
