"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SendRounded, ThumbUpAltOutlined, ThumbDownAltOutlined, WorkspacePremiumRounded } from "@mui/icons-material";
import type { ChatMessage, InsightsSummary, SymptomPattern } from "@mammoai/shared";
import clsx from "clsx";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { ScreenHeader, LoadingSpinner, Card, Button } from "@/components/ui";
import { InsightsPanel } from "@/components/screens/InsightsPanel";
import { Emoji } from "@/components/Emoji";

const FEEDBACK_PROMPT_AFTER_REPLIES = 5;

/**
 * AI Yordamchi — sikl/homiladorlik/simptom tarixini "eslab qoladigan" chat +
 * shu ma'lumotdan hisoblangan "Statistika" segmenti (bitta ekran ichida,
 * foydalanuvchi so'roviga ko'ra alohida tab/sahifa emas). Xotira alohida
 * saqlanmaydi: server har safar mavjud cycle_logs/onboarding ma'lumotidan
 * kontekst quradi (server/ai-chat.ts, server/insights.ts). Bo'sh chat
 * holatida API chaqirilmasdan static salomlashuv ko'rsatiladi.
 */
export function YordamchiScreen() {
  const { dict } = useI18n();
  const { hasPremium } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<"chat" | "stats">("chat");

  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patterns, setPatterns] = useState<SymptomPattern[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  const [insights, setInsights] = useState<{ summary: InsightsSummary; patterns: SymptomPattern[]; aiInsight: string | null } | null>(null);

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
    if (!hasPremium || tab !== "stats" || insights) return;
    api.insights.get().then(setInsights).catch(() => {});
  }, [hasPremium, tab, insights]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const assistantReplyCount = useMemo(() => (messages ?? []).filter((m) => m.role === "assistant").length, [messages]);
  const showFeedbackPrompt = tab === "chat" && !feedbackPromptDismissed && !feedbackAnswered && assistantReplyCount >= FEEDBACK_PROMPT_AFTER_REPLIES;

  async function send() {
    const content = draft.trim();
    if (!content || sending) return;
    setDraft("");
    setError(null);
    setMessages((prev) => [
      ...(prev ?? []),
      { id: `pending-${Date.now()}`, role: "user", content, createdAt: new Date().toISOString() },
    ]);
    setSending(true);
    try {
      const res = await api.chat.send(content);
      setMessages((prev) => [...(prev ?? []).filter((m) => !m.id.startsWith("pending-")), res.message]);
      setPatterns(res.patterns);
      // Aslida yuborilgan xabar ham serverda saqlangan — ro'yxatni serverdan qayta yuklab, "pending" o'rniga haqiqiy id qo'yamiz.
      api.chat.list().then((r) => setMessages(r.messages)).catch(() => {});
      setInsights(null); // yangi xabardan keyin statistika eskirgan bo'lishi mumkin — keyingi ochilishda qayta yuklanadi
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.chat.sendError);
      setMessages((prev) => (prev ?? []).filter((m) => !m.id.startsWith("pending-")));
    } finally {
      setSending(false);
    }
  }

  async function answerFeedbackPrompt(rating: number) {
    setFeedbackAnswered(true);
    try {
      await api.feedback.submit({ trigger: "chat_prompt", rating });
    } catch {
      // Fikr yuborishda xato bo'lsa ham suhbatga xalaqit bermaydi — jimgina o'tkazib yuboriladi.
    }
  }

  if (!hasPremium) {
    return (
      <div className="flex flex-col gap-4">
        <ScreenHeader title={dict.chat.title} subtitle={dict.chat.subtitle} />
        <Card className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="bg-aurora-cycle flex h-14 w-14 items-center justify-center rounded-full">
            <WorkspacePremiumRounded sx={{ fontSize: 26 }} className="text-white" />
          </div>
          <h2 className="text-lg font-bold text-text-primary">{dict.chat.premiumTitle}</h2>
          <p className="max-w-sm text-sm text-text-secondary">{dict.chat.premiumBody}</p>
          <ul className="flex flex-col gap-1.5 self-start text-sm text-text-secondary">
            {[dict.chat.premiumBenefit1, dict.chat.premiumBenefit2, dict.chat.premiumBenefit3].map((b) => (
              <li key={b} className="flex items-center gap-2">
                <Emoji e="✨" size={14} />
                {b}
              </li>
            ))}
          </ul>
          <Button className="mt-2" onClick={() => router.push("/fikr")}>
            {dict.chat.premiumCta}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    // Butun ekran o'lchami aniq belgilanadi (AppDrawer+padding yuqorida ~4.5rem,
    // BottomNav+safe-area pastda ~7.5rem) — shu orqali xabar ro'yxati `flex-1`
    // sifatida qolgan joyni oladi va input qatori HAR DOIM to'liq ko'rinadi,
    // banner/segment mavjudligidan qat'iy nazar (Playwright bilan tekshirilgan).
    <div className="flex flex-col gap-4" style={{ height: "calc(100dvh - 12rem - env(safe-area-inset-bottom, 0px))" }}>
      <div className="flex shrink-0 flex-col gap-4">
        <ScreenHeader title={dict.chat.title} subtitle={dict.chat.subtitle} />
        <p className="-mt-2 text-xs text-text-muted">{dict.chat.disclaimer}</p>

        <div className="flex gap-2">
          {(["chat", "stats"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={clsx(
                "tap-target flex-1 rounded-full px-4 py-2 text-sm font-semibold transition",
                tab === t ? "bg-primary text-white" : "bg-surface-muted text-text-secondary"
              )}
            >
              {t === "chat" ? dict.chat.chatTab : dict.chat.statisticsTab}
            </button>
          ))}
        </div>

        {tab === "chat" && patterns.length > 0 && (
          <div className="rounded-2xl border border-warning/20 bg-warning/5 p-4">
            <p className="text-sm font-bold text-warning">{dict.chat.patternBannerTitle}</p>
            <p className="mt-1 text-sm text-text-secondary">{dict.chat.patternBannerBody}</p>
          </div>
        )}
      </div>

      {tab === "stats" ? (
        insights ? (
          <InsightsPanel summary={insights.summary} patterns={insights.patterns} aiInsight={insights.aiInsight} />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <LoadingSpinner label={dict.common.loading} />
          </div>
        )
      ) : (
        <>
          <div ref={listRef} className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
            {messages === null ? (
              <LoadingSpinner label={dict.common.loading} />
            ) : messages.length === 0 ? (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-surface-muted px-4 py-2.5 text-sm leading-relaxed text-text-primary">
                  {dict.chat.emptyGreeting}
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={clsx("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={clsx(
                      "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words",
                      m.role === "user" ? "rounded-br-sm bg-primary text-white" : "rounded-bl-sm bg-surface-muted text-text-primary"
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))
            )}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-surface-muted px-4 py-2.5 text-sm text-text-muted">{dict.chat.thinking}</div>
              </div>
            )}
            {showFeedbackPrompt && (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-2.5">
                <p className="text-sm font-medium text-text-primary">{dict.feedback.chatPromptQuestion}</p>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => answerFeedbackPrompt(1)}
                    className="tap-target flex h-8 w-8 items-center justify-center rounded-full text-success hover:bg-success/10"
                  >
                    <ThumbUpAltOutlined sx={{ fontSize: 18 }} />
                  </button>
                  <button
                    type="button"
                    onClick={() => answerFeedbackPrompt(0)}
                    className="tap-target flex h-8 w-8 items-center justify-center rounded-full text-danger hover:bg-danger/10"
                  >
                    <ThumbDownAltOutlined sx={{ fontSize: 18 }} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackPromptDismissed(true)}
                    className="tap-target ml-1 text-xs font-medium text-text-muted hover:text-text-secondary"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && <p className="shrink-0 text-xs font-medium text-danger">{error}</p>}

          <div className="flex shrink-0 items-center gap-2 border-t border-border pt-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={dict.chat.placeholder}
              className="tap-target flex-1 rounded-full border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={send}
              disabled={!draft.trim() || sending}
              className="tap-target flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:opacity-50"
            >
              <SendRounded sx={{ fontSize: 18 }} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
