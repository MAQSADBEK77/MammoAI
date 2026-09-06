import { useState } from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import clsx from "clsx";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Button, Card, ScreenHeader } from "@/components/ui";

const RATINGS = [1, 2, 3, 4, 5];

export default function FikrScreen() {
  const { dict } = useI18n();
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (rating === null && !message.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.feedback.submit({ trigger: "manual", rating, message: message.trim() || null });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.chat.sendError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 gap-5 px-4 pt-2">
        <ScreenHeader title={dict.feedback.title} subtitle={dict.feedback.subtitle} />

        {submitted ? (
          <Card className="items-center py-8">
            <Text className="text-sm font-semibold text-success">{dict.feedback.thankYou}</Text>
          </Card>
        ) : (
          <Card className="gap-4">
            <View className="gap-2">
              <Text className="text-sm font-semibold text-text-secondary">{dict.feedback.ratingLabel}</Text>
              <View className="flex-row gap-2">
                {RATINGS.map((n) => (
                  <Pressable
                    key={n}
                    onPress={() => setRating(n)}
                    className={clsx(
                      "aspect-square flex-1 items-center justify-center rounded-2xl",
                      rating === n ? "bg-primary" : "bg-surface-muted"
                    )}
                  >
                    <Text className={clsx("text-base font-bold", rating === n ? "text-white" : "text-text-secondary")}>{n}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder={dict.feedback.messagePlaceholder}
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              maxLength={2000}
              className="min-h-[120px] rounded-2xl border border-border bg-surface px-4 py-3 text-base text-text-primary"
            />

            {error && <Text className="text-xs font-medium text-danger">{error}</Text>}

            <Button onPress={submit} disabled={submitting || (rating === null && !message.trim())}>
              {submitting ? "…" : dict.feedback.submitButton}
            </Button>
          </Card>
        )}
      </View>
    </SafeAreaView>
  );
}
