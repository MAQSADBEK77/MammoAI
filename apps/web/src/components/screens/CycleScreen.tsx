"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Avatar, Dialog, DialogTitle, DialogContent } from "@mui/material";
import {
  WaterDropOutlined,
  MedicalServicesOutlined,
  SentimentSatisfiedAltOutlined,
  CalendarMonthOutlined,
  GppMaybeOutlined,
  MenuBookOutlined,
  ChevronRight,
  EditOutlined,
  Close,
} from "@mui/icons-material";
import type { CycleResponse, CycleLog, Dictionary, FlowLevel, Mood, PredictionConfidence, PredictionExplanationReason, Symptom } from "@mammoai/shared";
import { formatDateDisplay, getCyclePhase, localDateStr, MOOD_EMOJI, MOOD_RESPONSE_EMOJI, FLOW_EMOJI, SYMPTOM_EMOJI } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { Button, Card, LoadingSpinner, ErrorState, EmptyState, IconChip, Badge, DateWheelPicker } from "@/components/ui";
import { MonthCalendar, type DayMarker } from "@/components/MonthCalendar";
import { useAppDrawer } from "@/components/AppDrawer";
import { PhaseCard } from "@/components/PhaseCard";
import { DailyInsightsCarousel } from "@/components/DailyInsightsCarousel";
import { WellnessCard } from "@/components/WellnessCard";
import { Emoji } from "@/components/Emoji";

// CYCLE-002: ishonch darajasi rangi — "past"/"o'rtacha" ikkalasi ham
// ogohlantiruvchi (warning) rang, chunki bu XATO holat emas, shunchaki
// hali tarix kam degani — qizil (danger) bezovtalanish uyg'otmasligi kerak.
const CONFIDENCE_TONE: Record<PredictionConfidence, "success" | "warning" | "muted"> = {
  high: "success",
  medium: "warning",
  low: "warning",
  insufficient: "muted",
};

/** CYCLE-ALGO-08: `explainPrediction()`ning til-agnostik sabab kodini
 * ekranga chiqariladigan matnga aylantiradi — predictionBasisHistory/
 * Estimate'ning o'rnini bosadi (endi 2 emas, 4 ta sabab bor). */
function explainPredictionText(reason: PredictionExplanationReason, dict: Dictionary): string {
  switch (reason.type) {
    case "no_data":
      return dict.cycle.predictionExplanation.noData;
    case "limited_data":
      return dict.cycle.predictionExplanation.limitedData(reason.cyclesAnalyzed);
    case "outliers_excluded":
      return dict.cycle.predictionExplanation.outliersExcluded(reason.cyclesAnalyzed, reason.outlierCount);
    case "standard":
      return dict.cycle.predictionExplanation.standard(reason.cyclesAnalyzed);
  }
}

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
  // CYCLE-ALGO-05: ikki-fazali lyuteal modelning ovulyatsiya SIGNALI —
  // foydalanuvchi shu simptomni qayd etsa, bashorat o'zining shaxsiy
  // lyuteal-faza uzunligini "o'rganadi" (cycle.ts#detectOvulationSignals).
  "ovulation_pain",
  // CYCLE-ALGO-12: xuddi shu maqsad — ancha keng tarqalgan/ishonchli
  // ikkinchi ovulyatsiya signali.
  "cervical_mucus_change",
];

/** "Asosiy" (/asosiy) sahifasining Hayz-rejim tarkibi — ilgari alohida /tsikl
 * sahifasi edi, endi rejimga qarab Asosiy ichida ko'rsatiladi. */
export function CycleScreen() {
  const { dict } = useI18n();
  const { onboardingProfile, user } = useSession();
  const { openDrawer } = useAppDrawer();
  const router = useRouter();
  const [data, setData] = useState<CycleResponse | null>(null);
  const [streakDays, setStreakDays] = useState<number | null>(null);
  const [logging, setLogging] = useState(false);
  const [logDate, setLogDate] = useState<string>(() => localDateStr());
  const [flow, setFlow] = useState<FlowLevel | null>(null);
  const [mood, setMood] = useState<Mood | null>(null);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [saving, setSaving] = useState(false);
  const [deletingLog, setDeletingLog] = useState(false);
  const [moodSaving, setMoodSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => localDateStr());
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());
  const [editingLastPeriod, setEditingLastPeriod] = useState(false);
  const [lastPeriodDraft, setLastPeriodDraft] = useState<string>(() => localDateStr());
  const [savingLastPeriod, setSavingLastPeriod] = useState(false);
  // 2026-09-18 UX qayta qurish: kayfiyat-tekshiruvi va to'liq oy-kalendari
  // endi bosh ekranda DOIM ko'rinib turmaydi — faqat tegishli tugma/ikonka
  // bosilganda ochiladi (ekranni yengillashtirish, foydalanuvchi so'rovi).
  const [showCheckin, setShowCheckin] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  // UX-01: ilgari api.cycle.get() muvaffaqiyatsiz bo'lsa `data` HECH QACHON
  // to'lmas edi — ekran CHEKSIZ "yuklanmoqda" holatida qolib ketardi (hech
  // qanday xato/qayta urinish imkoniyatisiz). Endi PregnancyScreen'dagi
  // bilan bir xil naqsh.
  const [loadError, setLoadError] = useState(false);

  const today = localDateStr();
  const isMinor = !!onboardingProfile && onboardingProfile.age < 18;
  // Perimenopauzada bashorat/kalendar-prognoz ko'rsatish ma'nosiz (tsikl
  // tabiiy ravishda tartibsizlashadi) — shu bo'limlar (halqa, "tartibsiz"
  // ogohlantirishi) yashiriladi, o'rniga simptom kuzatuviga urg'u beriladi.
  const isPerimenopause = onboardingProfile?.primaryGoal === "perimenopause";
  const isWellbeing = onboardingProfile?.primaryGoal === "wellbeing";

  const loadCycle = useCallback(() => {
    setLoadError(false);
    api.cycle.get().then(setData).catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(loadCycle, 0);
    // Gamifikatsiya (roadmap) — muvaffaqiyatsiz bo'lsa ham asosiy ekran ishlayveradi.
    api.gamification
      .get()
      .then((g) => setStreakDays(g.currentStreakDays))
      .catch(() => {});
    return () => clearTimeout(timeout);
  }, [loadCycle]);

  if (loadError) {
    return <ErrorState message={dict.common.errorGeneric} retry={{ label: dict.common.retryButton, onClick: loadCycle }} />;
  }

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
  // MUHIM: `isStale` bo'lsa (oxirgi hayz sanasi juda eskirgan — real qurilmada
  // ko'rilgan holat: "226 kun kechikmoqda") bu ikkalasi ATAYLAB hisoblanmaydi.
  // Sabab: modulo orqali "sikldagi N-kun" chiqarish stale ma'lumotda soxta
  // aniqlik beradi (masalan bir necha oy hech narsa qayd etilmagan bo'lsa ham
  // "3-kun" deb ko'rsatib yuboradi) — bu holatda haqiqiy javob "bilmaymiz,
  // ma'lumotni yangilang", raqam emas.
  let periodDay: number | null = null;
  let dayInCycle: number | null = null;
  if (data.settings.lastPeriodStart && !data.prediction?.isStale) {
    const diff = Math.round(
      (new Date(today).getTime() - new Date(data.settings.lastPeriodStart).getTime()) / 86400000
    );
    if (diff >= 0 && diff < data.settings.averagePeriodLength) periodDay = diff + 1;
    dayInCycle = (((diff % cycleLen) + cycleLen) % cycleLen) + 1;
  }

  const todayLog = data.logs.find((l) => l.date === today);
  const selectedPhase = phaseForDate(selectedDate);

  // 2026-09-18 UX qayta qurish — yangi yuqori qator: "26-avgust" formatidagi
  // oddiy sana (avvalgi greeting o'rniga — mumkin qadar kam matn, App qayta
  // qurish so'rovi: "bitta aniq raqam... ortiqcha tafsilotlar faqat so'ralganda").
  const todayDateObj = new Date(today + "T00:00:00");
  const todayLabel = `${todayDateObj.getDate()}-${dict.common.months[todayDateObj.getMonth()]}`;
  const initials = onboardingProfile?.name?.trim()?.[0]?.toUpperCase() ?? null;

  // 7 kunlik chiziq — doim BUGUNgi kunni ko'rsatib boshlanishi uchun kalendar
  // haftasiga bog'lanmaydi, aksincha bugunni markazga olgan aylanma oyna
  // (3 kun oldin...bugun...3 kun keyin), shu bilan skroll shart bo'lmaydi.
  const weekStrip = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today + "T00:00:00");
    d.setDate(d.getDate() + (i - 3));
    return { date: localDateStr(d), dateObj: d };
  });

  // 2026-09-18 FIX: "yetarli ma'lumot yo'q" holati ilgari BIR VAQTDA to'rt
  // xil shaklda aytilardi (headline + izoh + Badge + sana-diapazon) — endi
  // shu holat aniqlanib, pastda hammasi BITTA qatorga birlashtiriladi.
  // Confidence "insufficient" YOKI sabab turi hali chinakam sikl tarixi
  // yo'qligini bildirsa (no_data/limited_data) — ikkalasi ham "hali ishonchli
  // bashorat yo'q" degani, faqat turli darajada.
  const isLowInfoPrediction =
    !!data.prediction &&
    (data.prediction.confidence === "insufficient" ||
      data.prediction.explanationReason.type === "no_data" ||
      data.prediction.explanationReason.type === "limited_data");

  // Bosh ekrandagi "hero" matni — CycleRing'ning eski sublabel mantig'i bilan
  // asosan bir xil, lekin "kam ma'lumot" holatida endi PASSIV "ma'lumot yo'q"
  // o'rniga FAOL, harakatga undovchi jumla ko'rsatiladi (pastdagi tugma
  // allaqachon shu amalga — kunlik yozuv qo'shishga — olib boradi).
  const heroHeadline = data.prediction?.isStale
    ? dict.cycle.staleDataLabel
    : !data.prediction
      ? dict.cycle.ringEmptyLabel
      : isLowInfoPrediction
        ? dict.cycle.notEnoughDataHeroLabel
        : data.isIrregular
          ? dict.cycle.irregularRingLabel
          : dict.cycle.nextPeriodIn(data.prediction.daysUntilNextPeriod);

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

  function openEditLastPeriod() {
    setLastPeriodDraft(data!.settings.lastPeriodStart ?? today);
    setEditingLastPeriod(true);
  }

  async function saveLastPeriod() {
    setSavingLastPeriod(true);
    try {
      setData(await api.cycle.updateSettings({ lastPeriodStart: lastPeriodDraft }));
      setEditingLastPeriod(false);
    } finally {
      setSavingLastPeriod(false);
    }
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

  /** CYCLE-002: xato qayd etilgan kunni butunlay o'chirish (masalan bexosdan
   * bosilgan sana) — faqat mavjud yozuv tahrirlanayotganda ko'rsatiladigan
   * tugma orqali chaqiriladi. */
  /** FIX-08: boshqa barcha yo'q qiluvchi amallar (post/comment o'chirish,
   * muallifni bloklash — jamiyat/page.tsx) window.confirm bilan himoyalangan,
   * bu esa yo'q edi — tasodifiy bosish yozuvni qaytarib bo'lmas holda o'chirib
   * yuborardi. */
  async function removeLog() {
    if (!window.confirm(dict.cycle.deleteLogConfirm)) return;
    setDeletingLog(true);
    try {
      const res = await api.cycle.deleteLog(logDate);
      setData(res);
      setLogging(false);
      setFlow(null);
      setMood(null);
      setSymptoms([]);
    } finally {
      setDeletingLog(false);
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
      {/* 1. Yuqori qator — chapda profil-avatar (mavjud AppDrawer'ni ochadi,
          yangi navigatsiya emas), o'rtada bugungi sana, o'ngda faqat bosilganda
          to'liq oy-kalendarini ochadigan ikonka (foydalanuvchi so'rovi: bosh
          ekran yengil bo'lsin, to'liq kalendar doim ko'rinib turmasin). */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={openDrawer}
          aria-label={dict.common.openMenu}
          className="tap-target shrink-0 rounded-full active:scale-95"
        >
          <Avatar
            src={user?.avatarUrl ?? undefined}
            sx={{ width: 40, height: 40, bgcolor: "var(--color-primary-light)", color: "var(--color-primary-dark)", fontWeight: 700 }}
          >
            {!user?.avatarUrl && (initials ?? <Emoji e="👋" size={18} />)}
          </Avatar>
        </button>
        <p className="text-sm font-semibold text-text-secondary">{todayLabel}</p>
        <button
          type="button"
          onClick={() => setShowCalendarModal(true)}
          aria-label={dict.cycle.calendarTitle}
          className="tap-target flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-secondary active:scale-95"
        >
          <CalendarMonthOutlined sx={{ fontSize: 20 }} />
        </button>
      </div>

      {/* Gamifikatsiya — yuqori qatorga sig'maydi, shuning uchun shu ostida,
          faqat streak 1+ bo'lganda (yangi userga bo'sh "0 kun" ko'rsatib
          chalg'itmaslik uchun). */}
      {!!streakDays && (
        <div className="flex justify-end">
          <button
            onClick={() => router.push("/profil")}
            className="tap-target shrink-0 rounded-full bg-warning/15 px-3 py-1.5 text-xs font-bold text-warning"
          >
            {dict.gamification.cycleScreenStreakPill(streakDays)}
          </button>
        </div>
      )}

      {/* 2. 7 kunlik chiziq — doim bugunni ko'rsatib boshlanadi, o'tgan
          kunlardagi yozuvlar mavjud DayMarker mantig'idan (markers) nuqta
          bilan ko'rsatiladi. */}
      <div className="grid grid-cols-7 gap-1">
        {weekStrip.map(({ date, dateObj }) => {
          const marker = markers[date];
          const isToday = date === today;
          return (
            <button
              key={date}
              type="button"
              onClick={() => {
                setSelectedDate(date);
                setCalendarMonth(dateObj);
                setShowCalendarModal(true);
              }}
              className="tap-target flex flex-col items-center gap-1 rounded-2xl py-1.5"
            >
              <span className="text-[10px] font-semibold uppercase text-text-muted">{dict.common.weekdaysShort[dateObj.getDay()]}</span>
              <span
                className={clsx(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition",
                  isToday ? "bg-primary text-white" : "text-text-primary"
                )}
              >
                {dateObj.getDate()}
              </span>
              <span
                className={clsx(
                  "h-1.5 w-1.5 rounded-full",
                  marker && !isToday ? (marker === "period" ? "bg-primary" : "bg-primary-light") : "bg-transparent"
                )}
              />
            </button>
          );
        })}
      </div>

      {isPerimenopause ? (
        // Bashorat halqasi o'rniga — perimenopauzada "necha kun qoldi" degan
        // savolning o'zi ma'nosiz, shuning uchun ilovaning boshqa rejimlaridagi
        // "tartibsiz sikl" ogohlantirishi ham ko'rsatilmaydi (bu yerda
        // tartibsizlik KUTILGAN holat, xavotir belgisi emas).
        <Card className="animate-fade-in-up flex flex-col items-center gap-2 py-8 text-center">
          {/* OVERNIGHT-05: 🌇'ning mahalliy Twemoji SVG fayli yo'q edi. */}
          <Emoji e="🌸" size={36} />
          <p className="text-lg font-bold text-text-primary">{dict.cycle.perimenopauseCardTitle}</p>
          <p className="max-w-sm text-sm text-text-secondary">{dict.cycle.perimenopauseCardBody}</p>
        </Card>
      ) : (
        <>
          {data.isIrregular && (
            <Card className="bg-warning/10">
              <p className="font-semibold text-text-primary">{dict.cycle.irregularBannerTitle}</p>
              {/* CYCLE-ALGO-11: aniq-sana bashorati bu banner bilan ziddiyatli
                  signal bermasligi kerak — shuning uchun bu yerda "nega aniq
                  sana yo'q" tushuntirilib, ustuvorlik tekshiruvga siljitiladi. */}
              <p className="mt-1 text-sm text-text-secondary">{dict.cycle.irregularPredictionNote}</p>
              <button
                onClick={() => router.push("/tekshiruvlar")}
                className="tap-target mt-3 rounded-full bg-warning/20 px-4 py-2 text-xs font-semibold text-text-primary transition hover:bg-warning/30"
              >
                {dict.cycle.irregularCheckupLink}
              </button>
            </Card>
          )}

          {/* 3. Markaziy "hero" bloki — bitta katta matn ustunlik qiladi,
              CycleRing'ning to'liq halqa diagrammasi o'rniga yumshoq,
              sekin-asta "nafas oluvchi" blob-fon (LandingPage'dagi BlobArt
              texnikasi bilan bir xil — motion-breathe, faqat scale
              animatsiya qiladi, prefers-reduced-motion'da to'xtaydi lekin
              yo'qolmaydi). */}
          <button
            type="button"
            onClick={() => !dayInCycle && openLogging(today, todayLog)}
            disabled={!!dayInCycle}
            className="relative block w-full overflow-hidden rounded-[32px] py-10 text-center disabled:cursor-default"
          >
            {/* 2026-09-18 FIX: ilgari `-light` tokenlar (o'zi allaqachon
                juda oч rang) baland opacity bilan ham och fonda deyarli
                ko'rinmasdi. Endi TO'YINGAN asosiy ranglar (primary/accent)
                PAST opacity bilan — bu blob-fon texnikasining odatiy
                yechimi: rang o'zi to'yingan, shaffoflik uni yumshatadi. */}
            <HeroBlob className="left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 bg-primary/25" />
            <HeroBlob className="left-1/2 top-1/2 h-40 w-40 -translate-x-[70%] -translate-y-[30%] rotate-45 bg-accent/20" breatheDelay="-3.5s" />
            <div className="relative z-10 px-4">
              <p className="text-2xl leading-snug font-extrabold text-text-primary sm:text-3xl">{heroHeadline}</p>

              {periodDay && (
                <div className="mt-3 flex justify-center">
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

              {/* FIX: bu butun blok (izoh+Badge+sana-diapazon) faqat
                  HAQIQIY (kam bo'lsa ham) bashorat mavjud bo'lganda
                  ko'rsatiladi — "kam ma'lumot" holatida yuqoridagi
                  heroHeadline'ning o'zi (notEnoughDataHeroLabel) yetarli,
                  bularning barchasi bir xil fikrni takrorlardi. */}
              {data.prediction && !isLowInfoPrediction && (
                <div className="mt-3 flex flex-col items-center gap-1.5">
                  <p className="max-w-xs text-center text-xs text-text-muted">{explainPredictionText(data.prediction.explanationReason, dict)}</p>
                  {/* CYCLE-002: aniq sanani tibbiy haqiqat emas, turli aniqlikdagi
                      taxmin sifatida ko'rsatish — foydalanuvchi ishonch darajasini
                      ko'rib, mos ravishda kutishlarini moslashtira oladi. */}
                  <Badge tone={CONFIDENCE_TONE[data.prediction.confidence]}>
                    {dict.cycle.confidenceLabel[data.prediction.confidence]}
                  </Badge>
                  {/* CYCLE-ALGO-07: "yuqori" ishonchda aniq sana yetarli (diapazon
                      deyarli nuqtaga teng) — faqat past/o'rta ishonchda haqiqiy
                      diapazonni ko'rsatib, soxta aniqlik taassurotini oldini olamiz. */}
                  {data.prediction.confidence !== "high" && !data.prediction.isStale && data.prediction.daysUntilNextPeriod >= 0 && (
                    <p className="text-center text-xs text-text-muted">
                      {dict.cycle.nextPeriodRangeLabel(
                        formatDateDisplay(data.prediction.nextPeriodStartEarliest),
                        formatDateDisplay(data.prediction.nextPeriodStartLatest)
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>
          </button>

          {/* CYCLE-ALGO-12: bashorat qilingan unumdor oyna atrofida — foydalanuvchiga
              ovulyatsiya signalini qayd etishni taklif qiladi (mavjud "add log"
              oqimidan foydalanib, yangi UI qurmasdan). */}
          {data.prediction &&
            !data.prediction.isStale &&
            today >= data.prediction.fertileWindowStart &&
            today <= data.prediction.fertileWindowEnd && (
              <Card className="bg-primary-light/20">
                <p className="text-sm font-semibold text-text-primary">{dict.cycle.ovulationSignalPromptTitle}</p>
                <p className="mt-1 text-xs text-text-secondary">{dict.cycle.ovulationSignalPromptBody}</p>
                <button
                  onClick={() => openLogging(today, todayLog)}
                  className="tap-target mt-3 rounded-full bg-primary/15 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/25"
                >
                  {dict.cycle.ovulationSignalPromptButton}
                </button>
              </Card>
            )}
        </>
      )}

      {/* 4. Tezkor amallar — mavjud sikl/simptom/kayfiyat oqimlarining TASHQI
          ko'rinishi shu 3 tugmaga birlashtirildi (hech qanday yangi
          backend/holat mantig'i yozilmagan — ikkinchisi ham birinchisi ham
          allaqachon bir xil openLogging()ni chaqirar edi). */}
      <div className="grid grid-cols-3 gap-2.5">
        <QuickActionButton
          icon={<WaterDropOutlined sx={{ fontSize: 22 }} />}
          label={dict.cycle.logFlowButton}
          onClick={() => openLogging(today, todayLog)}
        />
        <QuickActionButton
          icon={<MedicalServicesOutlined sx={{ fontSize: 22 }} />}
          label={dict.cycle.symptomsCardLabel}
          onClick={() => openLogging(today, todayLog)}
        />
        <QuickActionButton
          icon={<SentimentSatisfiedAltOutlined sx={{ fontSize: 22 }} />}
          label={dict.cycle.checkinButton}
          active={showCheckin}
          onClick={() => setShowCheckin((v) => !v)}
        />
      </div>

      {/* Kunlik kayfiyat so'rovi — endi faqat "Check-in" tugmasi bosilganda
          ko'rinadi (mantiq o'zgarmagan: bosilgan zahoti saqlanadi va
          kontekstual javob ko'rsatiladi). */}
      {showCheckin && (
        <div className="animate-fade-in-up space-y-3">
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
      )}

      {isWellbeing && <WellnessCard />}

      {/* 5. Kunlik maslahat kartasi — iliq, "sizga atalgan" ohangdagi matn
          (dict.cycle.dailyInsights, mazmuni o'zgarmagan, faqat ohang). */}
      <DailyInsightsCarousel phase={!isPerimenopause && !data.prediction?.isStale ? phaseForDate(today) : null} />

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
            <Button variant="ghost" onClick={() => setLogging(false)} disabled={saving || deletingLog}>
              {dict.common.cancel}
            </Button>
            <Button className="flex-1" onClick={saveLog} disabled={saving || deletingLog}>
              {dict.common.save}
            </Button>
          </div>
          {/* CYCLE-002: faqat MAVJUD yozuvni tahrirlashda ko'rinadi — yangi
              (hali saqlanmagan) kun uchun o'chirish tugmasi ma'nosiz. */}
          {data.logs.some((l) => l.date === logDate) && (
            <Button variant="ghost" className="w-full text-danger!" onClick={removeLog} disabled={saving || deletingLog}>
              {dict.cycle.deleteLogButton}
            </Button>
          )}
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
          <EmptyState
            message={dict.cycle.noLogsYet}
            action={{ label: dict.cycle.addLogButton, onClick: () => openLogging(today, todayLog) }}
          />
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

        {/* Bo'sh holatda EmptyState O'ZI xuddi shu amalni allaqachon taklif
            qiladi — ikkinchi, ortiqcha "+ Yozuv qo'shish" tugmasini
            ko'rsatmaslik uchun faqat yozuvlar mavjud bo'lgandagina. */}
        {data.logs.length > 0 && (
          <Button className="w-full" onClick={() => openLogging(today, todayLog)}>
            {dict.cycle.addLogButton}
          </Button>
        )}
      </div>

      {/* Oxirgi hayz sanasini to'g'ridan-to'g'ri tuzatish — kalendar tepasidagi
          qalamcha tugmasi bilan ochiladi (foydalanuvchi so'rovi). Kam
          kuzatuv tarixi bo'lgan foydalanuvchilarda bu qiymat halqa/bashorat
          hisobiga to'g'ridan-to'g'ri ta'sir qiladi (server/views.ts —
          2+ sikl aniqlangan bo'lsa, moslashuvchan algoritm haqiqiy
          yozuvlar asosida ustunlik qiladi, bu holda sozlama shunchaki
          zaxira qiymat sifatida saqlanadi). */}
      <Dialog open={editingLastPeriod} onClose={() => setEditingLastPeriod(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>{dict.onboarding.lastPeriodQuestion}</DialogTitle>
        <DialogContent className="space-y-4 pb-2!">
          <DateWheelPicker
            value={lastPeriodDraft}
            onChange={setLastPeriodDraft}
            monthLabels={dict.common.months}
            minYear={new Date().getFullYear() - 1}
            maxYear={new Date().getFullYear()}
          />
          <div className="flex gap-2 pb-4">
            <Button variant="ghost" onClick={() => setEditingLastPeriod(false)} disabled={savingLastPeriod}>
              {dict.common.cancel}
            </Button>
            <Button className="flex-1" onClick={saveLastPeriod} disabled={savingLastPeriod}>
              {dict.common.save}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* To'liq oy-kalendari — endi doim ko'rinib turmaydi, faqat yuqori
          qatordagi kalendar-ikonkasi yoki 7 kunlik chiziqdagi biror kun
          bosilganda bottom-sheet sifatida ochiladi (foydalanuvchi so'rovi).
          MonthCalendar'ning o'zi o'zgartirilmagan. */}
      <Dialog
        open={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        fullWidth
        maxWidth="xs"
        slotProps={{ paper: { sx: { borderRadius: "28px" } } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 700 }}>
          {dict.cycle.calendarTitle}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={openEditLastPeriod}
              title={dict.cycle.editLastPeriodLabel}
              aria-label={dict.cycle.editLastPeriodLabel}
              className="tap-target flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-text-secondary active:scale-95"
            >
              <EditOutlined sx={{ fontSize: 16 }} />
            </button>
            <button
              type="button"
              onClick={() => setShowCalendarModal(false)}
              aria-label={dict.common.close}
              className="tap-target flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-text-secondary active:scale-95"
            >
              <Close sx={{ fontSize: 18 }} />
            </button>
          </div>
        </DialogTitle>
        <DialogContent className="space-y-4 pb-4!">
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
          {/* Tanlangan kun uchun faza/prognoz — App.pdf/Figma referens: "kalendar
              pastida ma'lumot bersin, tanlov qilishiga qarab". */}
          {selectedPhase && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-text-secondary">{formatDateLabel(selectedDate)}</p>
              <PhaseCard phase={selectedPhase} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Bosh ekrandagi "hero" raqami ortidagi yumshoq, sekin-asta "nafas oluvchi"
 * blob-fon — LandingPage'dagi BlobArt bilan AYNAN bir xil texnika (blur +
 * organik border-radius + `motion-breathe` klassi), faqat bu yerga moslab
 * qayta yozilgan (alohida umumiy komponent qilinmagan — ikkalasi bir-biridan
 * mustaqil, ekranga xos fon bezagi). */
function HeroBlob({ className, breatheDelay }: { className: string; breatheDelay?: string }) {
  return (
    <div
      aria-hidden
      className={clsx("motion-breathe pointer-events-none absolute z-0 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] blur-2xl", className)}
      style={breatheDelay ? { animationDelay: breatheDelay } : undefined}
    />
  );
}

/** Tezkor amal tugmasi — sikl/simptom/check-in oqimlarining bosh ekrandagi
 * yangi, birlashtirilgan tashqi ko'rinishi (foydalanuvchi so'rovi: "3-4 ta
 * teng o'lchamli tugma"). */
function QuickActionButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="text-left">
      <Card
        interactive
        className={clsx("flex h-full flex-col items-center justify-center gap-2 py-4 text-center", active && "bg-primary text-white")}
      >
        <span className={clsx("flex h-10 w-10 items-center justify-center rounded-2xl", active ? "bg-white/20" : "bg-surface-muted text-text-secondary")}>
          {icon}
        </span>
        <span className={clsx("text-xs font-semibold", active ? "text-white" : "text-text-secondary")}>{label}</span>
      </Card>
    </button>
  );
}
