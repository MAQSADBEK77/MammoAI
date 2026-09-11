import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, TextInput, FlatList, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import clsx from "clsx";
import type { ChatMessage, InsightsSummary, SymptomPattern } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useThemeColors } from "@/lib/theme";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { useDrawer } from "@/lib/drawer";
import { Button, Card, LoadingSpinner, ScreenHeader } from "@/components/ui";
import { InsightsPanel } from "@/components/screens/InsightsPanel";
import { Emoji } from "@/components/Emoji";

const FEEDBACK_PROMPT_AFTER_REPLIES = 5;

/**
 * AI Yordamchi — sikl/homiladorlik/simptom tarixini "eslab qoladigan" chat +
 * shu ma'lumotdan hisoblangan "Statistika" segmenti (bitta ekran ichida).
 * Xotira alohida saqlanmaydi: server har safar mavjud cycle_logs/onboarding
 * ma'lumotidan kontekst quradi (server/ai-chat.ts, server/insights.ts).
 * Web'dagi components/screens/YordamchiScreen.tsx bilan bir xil backend'dan foydalanadi.
 */
export default function YordamchiScreen() {
  const { dict } = useI18n();
  const themeColors = useThemeColors();
  const { openDrawer } = useDrawer();
  const { hasPremium } = useSession();
  const [tab, setTab] = useState<"chat" | "stats">("chat");

  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patterns, setPatterns] = useState<SymptomPattern[]>([]);

  const [insights, setInsights] = useState<{ summary: InsightsSummary; patterns: SymptomPattern[] } | null>(null);

  const [feedbackPromptDismissed, setFeedbackPromptDismissed] = useState(false);
  const [feedbackAnswered, setFeedbackAnswered] = useState(false);

  useEffect(() => {
    if (!hasPremium) return;
    api.chat
      .list()
      .then((res) => setMessages(res.messages))
      .catch(() => setMessages([]));
  }, [hasPremium]);

  useEffect(() => {
    if (hasPremium && tab === "stats" && !insights) {
      api.insights.get().then(setInsights).catch(() => {});
    }
  }, [hasPremium, tab, insights]);

  const assistantReplyCount = useMemo(() => (messages ?? []).filter((m) => m.role === "assistant").length, [messages]);
  const showFeedbackPrompt = tab === "chat" && !feedbackPromptDismissed && !feedbackAnswered && assistantReplyCount >= FEEDBACK_PROMPT_AFTER_REPLIES;

  async function send() {
    const content = draft.trim();
    if (!content || sending) return;
    setDraft("");
    setError(null);
    setSending(true);
    try {
      const res = await api.chat.send(content);
      setPatterns(res.patterns);
      const fresh = await api.chat.list();
      setMessages(fresh.messages);
      setInsights(null); // yangi xabardan keyin statistika eskirgan bo'lishi mumkin
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.chat.sendError);
    } finally {
      setSending(false);
    }
  }

  async function answerFeedbackPrompt(rating: number) {
    setFeedbackAnswered(true);
    try {
      await api.feedback.submit({ trigger: "chat_prompt", rating });
    } catch {
      // Fikr yuborishda xato bo'lsa ham suhbatga xalaqit bermaydi.
    }
  }

  if (!hasPremium) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="gap-4 px-4 pt-2">
          <Pressable onPress={openDrawer} className="h-9 w-9 items-center justify-center rounded-full bg-surface active:scale-95">
            <MaterialCommunityIcons name="menu" size={22} color={themeColors.textPrimary} />
          </Pressable>
          <ScreenHeader title={dict.chat.title} subtitle={dict.chat.subtitle} />
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Card className="w-full items-center gap-3 py-8">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-primary">
              <MaterialCommunityIcons name="crown-outline" size={26} color="#FFFFFF" />
            </View>
            <Text className="text-lg font-bold text-text-primary">{dict.chat.premiumTitle}</Text>
            <Text className="text-center text-sm text-text-secondary">{dict.chat.premiumBody}</Text>
            <View className="w-full gap-1.5">
              {[dict.chat.premiumBenefit1, dict.chat.premiumBenefit2, dict.chat.premiumBenefit3].map((b) => (
                <View key={b} className="flex-row items-center gap-2">
                  <Emoji e="✨" size={14} />
                  <Text className="text-sm text-text-secondary">{b}</Text>
                </View>
              ))}
            </View>
            <View className="mt-2 w-full">
              <Button onPress={() => router.push("/fikr")}>{dict.chat.premiumCta}</Button>
            </View>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  if (!messages) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <LoadingSpinner label={dict.common.loading} />
      </SafeAreaView>
    );
  }

  // FlatList `inverted` — eng yangi xabar pastda (Telegram uslubi); shuning
  // uchun massiv teskarisiga beriladi (PartnerChatModal'dagi bilan bir xil naqsh).
  const reversedMessages = [...messages].reverse();

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* pb-24 — pastki tab paneli `position: absolute` (suzuvchi pilla, _layout.tsx),
          ekran balandligini kamaytirmaydi, shuning uchun input qatori panel ostida
          qolib ketmasligi uchun qo'lda joy ajratiladi (web'dagi xuddi shu muammoning
          tuzatilishi bilan bir xil sabab). */}
      <KeyboardAvoidingView className="flex-1 pb-24" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View className="gap-4 px-4 pt-2">
          <Pressable onPress={openDrawer} className="h-9 w-9 items-center justify-center rounded-full bg-surface active:scale-95">
            <MaterialCommunityIcons name="menu" size={22} color={themeColors.textPrimary} />
          </Pressable>
          <View className="gap-4">
            <ScreenHeader title={dict.chat.title} subtitle={dict.chat.subtitle} />
            <Text className="-mt-2 text-xs text-text-muted">{dict.chat.disclaimer}</Text>

            {/* web: bu yerda umumiy SegmentedControl emas, ikkita mustaqil
                to'liq-enli pilla tugma (gap-2) ishlatiladi — Klinikalar
                ekranidagi guruhlangan segmentdan uslubiy jihatdan ataylab
                farq qiladi, shuning uchun bu yerda ham xuddi shunday. */}
            <View className="flex-row gap-2">
              {(["chat", "stats"] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setTab(t)}
                  className={clsx(
                    "tap-target flex-1 items-center justify-center rounded-full px-4 py-2",
                    tab === t ? "bg-primary" : "bg-surface-muted"
                  )}
                >
                  <Text className={clsx("text-sm font-semibold", tab === t ? "text-white" : "text-text-secondary")}>
                    {t === "chat" ? dict.chat.chatTab : dict.chat.statisticsTab}
                  </Text>
                </Pressable>
              ))}
            </View>

            {tab === "chat" && patterns.length > 0 && (
              <View className="rounded-2xl border border-warning/20 bg-warning/5 p-4">
                <Text className="text-sm font-bold text-warning">{dict.chat.patternBannerTitle}</Text>
                <Text className="mt-1 text-sm text-text-secondary">{dict.chat.patternBannerBody}</Text>
              </View>
            )}
          </View>
        </View>

        {tab === "stats" ? (
          insights ? (
            <InsightsPanel summary={insights.summary} patterns={insights.patterns} />
          ) : (
            <View className="flex-1 items-center justify-center">
              <LoadingSpinner label={dict.common.loading} />
            </View>
          )
        ) : (
          <>
            <FlatList
              data={reversedMessages}
              inverted
              keyExtractor={(m) => m.id}
              contentContainerClassName="gap-2 px-4 py-4"
              ListEmptyComponent={
                <View className="flex-row justify-start">
                  <View className="max-w-[85%] rounded-2xl rounded-bl-md bg-surface-muted px-4 py-2.5">
                    <Text className="text-sm leading-relaxed text-text-primary">{dict.chat.emptyGreeting}</Text>
                  </View>
                </View>
              }
              renderItem={({ item }) => (
                <View className={clsx("flex-row", item.role === "user" ? "justify-end" : "justify-start")}>
                  <View
                    className={clsx(
                      "max-w-[85%] rounded-2xl px-4 py-2.5",
                      item.role === "user" ? "rounded-br-md bg-primary" : "rounded-bl-md bg-surface-muted"
                    )}
                  >
                    <Text className={clsx("text-sm leading-relaxed", item.role === "user" ? "text-white" : "text-text-primary")}>
                      {item.content}
                    </Text>
                  </View>
                </View>
              )}
              ListHeaderComponent={
                <View className="gap-2">
                  {sending && (
                    <View className="flex-row justify-start">
                      <View className="rounded-2xl rounded-bl-md bg-surface-muted px-4 py-2.5">
                        <Text className="text-sm text-text-muted">{dict.chat.thinking}</Text>
                      </View>
                    </View>
                  )}
                  {showFeedbackPrompt && (
                    <View className="flex-row items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-2.5">
                      <Text className="flex-1 text-sm font-medium text-text-primary">{dict.feedback.chatPromptQuestion}</Text>
                      <View className="flex-row items-center gap-1">
                        <Pressable onPress={() => answerFeedbackPrompt(1)} className="h-8 w-8 items-center justify-center rounded-full active:bg-success/10">
                          {/* web: `text-success` (#57B894) — Tailwind'ning umumiy
                              yashil rangi (#16A34A) emas, ilovaning o'z tokeni. */}
                          <MaterialCommunityIcons name="thumb-up-outline" size={18} color="#57B894" />
                        </Pressable>
                        <Pressable onPress={() => answerFeedbackPrompt(0)} className="h-8 w-8 items-center justify-center rounded-full active:bg-danger/10">
                          <MaterialCommunityIcons name="thumb-down-outline" size={18} color="#E0506F" />
                        </Pressable>
                        <Pressable onPress={() => setFeedbackPromptDismissed(true)} className="ml-1 h-8 w-8 items-center justify-center">
                          <MaterialCommunityIcons name="close" size={16} color={themeColors.textMuted} />
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              }
            />

            {error && <Text className="px-4 pb-1 text-xs font-medium text-danger">{error}</Text>}

            <View className="flex-row items-center gap-2 border-t border-border bg-surface px-3 py-3">
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={dict.chat.placeholder}
                placeholderTextColor="#9CA3AF"
                className="min-h-[44px] flex-1 rounded-full border border-border bg-background px-4 text-base text-text-primary"
              />
              <Pressable
                onPress={send}
                disabled={!draft.trim() || sending}
                className={clsx("h-11 w-11 items-center justify-center rounded-full bg-primary", (!draft.trim() || sending) && "opacity-50")}
              >
                <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
