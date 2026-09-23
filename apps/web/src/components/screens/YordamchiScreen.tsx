"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { SendRounded, ThumbUpAltOutlined, ThumbDownAltOutlined, WorkspacePremiumRounded } from "@mui/icons-material";
import type { ChatMessage, InsightsSummary, SymptomPattern } from "@mammoai/shared";
import { ApiError, detectsMedicalConcern, translateApiError } from "@mammoai/shared";
import clsx from "clsx";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { ScreenHeader, LoadingSpinner, ErrorState, Card, Button } from "@/components/ui";
import { InsightsPanel } from "@/components/screens/InsightsPanel";
import { Emoji } from "@/components/Emoji";
import { DURATION, EASE_BRAND } from "@/lib/motion";

const FEEDBACK_PROMPT_AFTER_REPLIES = 5;

/** MOTION-APP-04: har bir yangi xabar/pufakcha ekranga kirganda yengil
 * fade+ko'tarilish — `Reveal`dan farqli (scroll-ichida-ko'rinish emas,
 * chunki chat pastga qarab avtomatik skroll qiladi), shunchaki HAR SAFAR
 * yangi elementning o'zi mount bo'lganda ishga tushadi. Eski, allaqachon
 * ko'rsatilgan xabarlar qayta animatsiya qilinmaydi (remount bo'lmagani
 * uchun). */
function ChatBubbleEnter({ className, children }: { className?: string; children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.micro, ease: EASE_BRAND }}
    >
      {children}
    </motion.div>
  );
}

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
  const router = useRouter();
  const [tab, setTab] = useState<"chat" | "stats">("chat");

  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [draft, setDraft] = useState("");
  // TODAY-05: bosh ekrandagi yordamchi kartasidan tayyor savol bilan kelish
  // mumkin (`/yordamchi?q=...`) — foydalanuvchi savolni qayta yozib
  // o'tirmasin. Matn maydonga QO'YILADI, lekin avtomatik YUBORILMAYDI:
  // yuborishdan oldin uni tahrirlash imkoni qolishi kerak.
  const searchParams = useSearchParams();
  const prefill = searchParams.get("q");
  useEffect(() => {
    if (!prefill) return;
    const timeout = setTimeout(() => setDraft(prefill), 0);
    return () => clearTimeout(timeout);
  }, [prefill]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patterns, setPatterns] = useState<SymptomPattern[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  // Bu ekran ustidan (AppDrawer va uning bo'sh joylari) va ostidan
  // (BottomNav) qancha joy egallanganini ILGARI qo'lda taxmin qilingan
  // "rem" son bilan hisoblardi — taxmin xato bo'lsa (qurilma/brauzer/
  // WebView'da haqiqiy balandlik farq qilganda) chat kirish maydoni
  // pastki menyu ORQASIGA yashiringan holda ko'rinardi. Endi buning
  // o'rniga: (a) bu componentning O'ZI ekranda QAYERDAN boshlanishini
  // (`getBoundingClientRect().top`) to'g'ridan-to'g'ri o'lchaymiz — bu
  // ustidagi HAR QANDAY elementning (AppDrawer, banner va h.k.)
  // balandligini bilish shart qilmaydi; (b) pastdan BottomNav.tsx yozib
  // qo'ygan HAQIQIY `--bottom-nav-height`dan foydalanamiz. Ikkalasi ham
  // taxmin emas, o'lchov.
  const rootRef = useRef<HTMLDivElement>(null);
  const [rootTop, setRootTop] = useState(0);
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const update = () => setRootTop(el.getBoundingClientRect().top);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(document.body);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);
  // "Takrorlanuvchi pattern" banneri paydo bo'lganda/yo'qolganda ham
  // (bu ustidagi elementlarning balandligini o'zgartiradi) darhol qayta
  // o'lchaymiz — ResizeObserver body darajasida bu holatni har doim ham
  // ushlab qolavermasligi mumkin (masalan boshqa joyda muvozanatlovchi
  // o'zgarish bo'lsa).
  useLayoutEffect(() => {
    if (rootRef.current) setRootTop(rootRef.current.getBoundingClientRect().top);
  }, [tab, patterns.length]);

  const [insights, setInsights] = useState<{ summary: InsightsSummary; patterns: SymptomPattern[]; aiInsight: string | null } | null>(null);

  const [feedbackPromptDismissed, setFeedbackPromptDismissed] = useState(false);
  const [feedbackAnswered, setFeedbackAnswered] = useState(false);
  // UX-02: ilgari xato ("chat tarixini yuklab bo'lmadi") va HAQIQIY bo'sh
  // suhbat ("hali hech qanday xabar yo'q") FARQLANMASDI — ikkalasi ham
  // xuddi shu "bo'sh chat" holatiga tenglashtirilardi. Bu qaytib kelgan,
  // haqiqiy tarixi bor foydalanuvchiga "suhbatingiz o'chib ketdi" degan
  // noto'g'ri taassurot berishi mumkin edi. Endi alohida.
  const [chatLoadError, setChatLoadError] = useState(false);

  // MONETIZE-01: kirish huquqi endi SERVERDAN keladi (sessiyadagi
  // `hasPremium` faqat obuna holatini biladi, bepul xabarlar qoldig'ini
  // emas). Yuklangunicha `null` — shu paytda paywall ham, chat ham
  // ko'rsatilmaydi, faqat yuklanish holati.
  const [access, setAccess] = useState<{ hasPremium: boolean; freeMessagesLeft: number; freeAllowance: number } | null>(null);

  const loadMessages = useCallback(() => {
    setChatLoadError(false);
    api.chat
      .list()
      .then((res) => {
        setMessages(res.messages);
        setAccess({ hasPremium: res.hasPremium, freeMessagesLeft: res.freeMessagesLeft, freeAllowance: res.freeAllowance });
      })
      .catch(() => setChatLoadError(true));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(loadMessages, 0);
    return () => clearTimeout(timeout);
  }, [loadMessages]);

  useEffect(() => {
    if (!access?.hasPremium || tab !== "stats" || insights) return;
    api.insights.get().then(setInsights).catch(() => {});
  }, [access?.hasPremium, tab, insights]);

  // Chatdan foydalana oladimi: Premium YOKI bepul xabari qolgan.
  const canUseChat = access === null ? true : access.hasPremium || access.freeMessagesLeft > 0;
  const freeLeft = access && !access.hasPremium ? access.freeMessagesLeft : null;

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
      setAccess((prev) => (prev ? { ...prev, hasPremium: res.hasPremium, freeMessagesLeft: res.freeMessagesLeft } : prev));
      // Aslida yuborilgan xabar ham serverda saqlangan — ro'yxatni serverdan qayta yuklab, "pending" o'rniga haqiqiy id qo'yamiz.
      // FIX2-30: ilgari to'g'ridan-to'g'ri `setMessages(r.messages)` bilan
      // BUTUN ro'yxat almashtirilardi — agar foydalanuvchi shu orada
      // (bu so'rov hali javob bermasdan) yana bir xabar yozgan bo'lsa,
      // uning "pending-" pufakchasi hali serverga yetib bormagan (demak
      // `r.messages`da yo'q) holda butunlay ekrandan yo'qolib qolardi.
      // Endi joriy holatda hali qolgan (boshqa, keyingi so'rovga tegishli)
      // pending xabarlar aniqlanib, natija oxiriga qo'shib qo'yiladi.
      api.chat.list().then((r) => {
        setMessages((prev) => {
          const stillPending = (prev ?? []).filter((m) => m.id.startsWith("pending-"));
          return [...r.messages, ...stillPending];
        });
      }).catch(() => {});
      setInsights(null); // yangi xabardan keyin statistika eskirgan bo'lishi mumkin — keyingi ochilishda qayta yuklanadi
    } catch (err) {
      // FIX2-20: server xato KALITI qaytarsa (masalan "daily_chat_limit_reached")
      // shuni tarjima qilib ko'rsatamiz; boshqa (tarmoq) xatolarda ilgaridagi
      // umumiy dict.chat.sendError xabari saqlanadi.
      setError(err instanceof ApiError ? translateApiError(err, dict) : dict.chat.sendError);
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

  // MONETIZE-01: paywall endi FAQAT bepul xabarlar tugagach chiqadi —
  // ilgari u birinchi xabardanoq chiqib, ayolga yordamchi qanday
  // ishlashini ko'rsatmasdan pul so'rardi.
  if (!canUseChat) {
    return (
      <div className="flex flex-col gap-4">
        <ScreenHeader title={dict.chat.title} subtitle={dict.chat.subtitle} />
        <Card className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="bg-aurora-cycle flex h-14 w-14 items-center justify-center rounded-full">
            <WorkspacePremiumRounded sx={{ fontSize: 26 }} className="text-white" />
          </div>
          <h2 className="text-lg font-bold text-text-primary">{dict.chat.premiumExhaustedTitle}</h2>
          <p className="max-w-sm text-sm text-text-secondary">{dict.chat.premiumExhaustedBody}</p>
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

  // "Suhbat"/"Statistika" bo'limlariga ham, sarlavha ostidagi
  // yopishtirilgan (sticky) hududga ham bir xil kerak — ikki marta
  // yozmaslik uchun bitta joyda tuziladi.
  const headerBlock = (
    <>
      <ScreenHeader title={dict.chat.title} subtitle={dict.chat.subtitle} />
      <p className="-mt-2 text-xs text-text-muted">{dict.chat.disclaimer}</p>

      {/* MONETIZE-01: bepul xabarlar qoldig'i — ayol paywallga to'satdan
          urilmasligi uchun oldindan ko'rinib turadi. */}
      {freeLeft !== null && (
        <div className="rounded-2xl border border-border bg-surface-muted px-4 py-3">
          <p className="text-sm font-bold text-text-primary">
            {freeLeft === 1 ? dict.chat.freeLastOne : dict.chat.freeLeft.replace("{n}", String(freeLeft))}
          </p>
          <p className="mt-0.5 text-xs text-text-secondary">{dict.chat.freeBannerBody}</p>
        </div>
      )}

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
    </>
  );

  return (
    // Butun ekran balandligi endi HAQIQIY o'lchangan qiymatlardan hisoblanadi
    // (rootTop — shu componentning ekrandagi boshlanish nuqtasi,
    // --bottom-nav-height — BottomNav.tsx) — taxminiy "rem" son emas.
    // `rootTop` hali o'lchanmagan (0) bo'lsa ham layout buzilmaydi —
    // birinchi render'da bir zumga to'liqroq ko'rinib, o'lchov kelgach
    // to'g'ri balandlikka tushadi.
    <div ref={rootRef} className="flex flex-col gap-4" style={{ height: `calc(100dvh - ${rootTop}px - var(--bottom-nav-height))` }}>
      {tab === "stats" ? (
        <>
          <div className="flex shrink-0 flex-col gap-4">
            {headerBlock}
          </div>
          {access && !access.hasPremium ? (
            // MONETIZE-01: bepul foydalanuvchi endi suhbatdan o'tib shu
            // yergacha keladi (ilgari paywall uni ekranga umuman
            // kiritmasdi). Statistika Premium bo'lib qoladi — lekin jim
            // xato o'rniga NIMA olishini ko'rsatamiz. Bu ayol yordamchini
            // allaqachon sinab ko'rgandan KEYINGI taklif, ya'ni eng
            // ishonarli payt.
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
          ) : insights ? (
            <InsightsPanel summary={insights.summary} patterns={insights.patterns} aiInsight={insights.aiInsight} />
          ) : (
            // UX-00: ilgari bu <div> markazlashtirishga urinardi, lekin
            // LoadingSpinner o'zi `position: fixed` Backdrop bo'lgani uchun
            // hech qanday amaliy farq qilmasdi — endi haqiqiy `inline` variant.
            <LoadingSpinner label={dict.common.loading} inline />
          )}
        </>
      ) : (
        <>
          {/* OVERNIGHT-04: sarlavha+yorliq+banner endi xabarlar bilan BIR
              XIL aylantiriladigan hudud ichida (`sticky` bilan tepada
              yopishtirilgan) — ilgari alohida `shrink-0` bo'lgani uchun,
              juda past balandlikda (masalan klaviatura ochiq kichik
              qurilmada, 390x400px'da tasdiqlandi) sarlavha+banner+kirish
              qatorining yig'indisi ajratilgan balandlikdan oshib, kirish
              maydonini pastki navigatsiya orqasiga surib yuborardi. Endi
              qancha kontent bo'lishidan qat'iy nazar, kirish qatori HAR
              DOIM shu konteynerning pastki chetida qoladi — ortiqcha
              kontent esa (odatiy holatda deyarli hech qachon) shu ichki
              hudud o'zi aylanadi, kirish maydonini bosib chiqarmaydi.*/}
          <div ref={listRef} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
            <div className="sticky top-0 z-10 flex flex-col gap-4 bg-background pb-2">{headerBlock}</div>
            <div className="flex flex-col gap-2">
            {chatLoadError ? (
              <ErrorState message={dict.common.errorGeneric} retry={{ label: dict.common.retryButton, onClick: loadMessages }} />
            ) : messages === null ? (
              <LoadingSpinner label={dict.common.loading} inline />
            ) : messages.length === 0 ? (
              <ChatBubbleEnter className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-surface-muted px-4 py-2.5 text-sm leading-relaxed text-text-primary">
                  {dict.chat.emptyGreeting}
                </div>
              </ChatBubbleEnter>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="flex flex-col gap-1.5">
                  <ChatBubbleEnter className={clsx("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                    <div
                      className={clsx(
                        "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words",
                        m.role === "user" ? "rounded-br-sm bg-primary text-white" : "rounded-bl-sm bg-surface-muted text-text-primary"
                      )}
                    >
                      {m.content}
                    </div>
                  </ChatBubbleEnter>
                  {/* OVERNIGHT-06: jamiyat postlarida allaqachon ishlatilayotgan
                      bir xil, ATAYLAB kengroq (soxta-musbat xavfsiz) kalit-so'z
                      aniqlagichi — bu yerda AI'ning o'zi HECH NARSA "hal
                      qilmaydi" (LLM'ga ishonib qolmaslik uchun ATAYLAB
                      deterministik/mijoz-tomon) — foydalanuvchi shoshilinch
                      ko'rinishdagi narsa yozganda, klinikalarga taklif
                      ko'rsatiladi. Tashxis emas, faqat yumshoq signal. */}
                  {m.role === "user" && detectsMedicalConcern(m.content) && (
                    <ChatBubbleEnter className="flex justify-end">
                      <div className="flex max-w-[85%] flex-col gap-2 rounded-2xl rounded-br-sm bg-warning/10 px-4 py-2.5">
                        <p className="text-xs font-medium text-warning">{dict.chat.medicalConcernBanner}</p>
                        {/* OVERNIGHT-06 tuzatish: "/klinikalar" — RedirectToAsosiy
                            orqali "/asosiy"ga qaytaradigan ESKI/bekor qilingan
                            yo'l ekan (tirik tekshirishda topildi) — Klinikalar
                            bo'limi HAQIQATDA "/asosiy" ichidagi yopiladigan-
                            ochiladigan segment. `checklistItemId` esa faqat
                            referral-kuzatuv uchun (haqiqiy tekshiruv bandi
                            ID'siga bog'liq) — bu yerda mos kelmaydi, shuning
                            uchun soxta ID o'ylab topmasdan shunchaki "/asosiy"ga
                            yo'naltiramiz (foydalanuvchi Klinikalar segmentini
                            o'zi ochadi). */}
                        <Button className="self-start px-4! py-1.5! text-xs!" onClick={() => router.push("/asosiy")}>
                          {dict.chat.medicalConcernCta}
                        </Button>
                      </div>
                    </ChatBubbleEnter>
                  )}
                </div>
              ))
            )}
            {sending && (
              <ChatBubbleEnter className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-surface-muted px-4 py-2.5 text-sm text-text-muted">{dict.chat.thinking}</div>
              </ChatBubbleEnter>
            )}
            {showFeedbackPrompt && (
              <ChatBubbleEnter className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-2.5">
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
              </ChatBubbleEnter>
            )}
            </div>
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
