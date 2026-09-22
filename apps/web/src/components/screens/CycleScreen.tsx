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
  ArrowForwardOutlined,
  Add,
  LibraryAddCheckOutlined,
} from "@mui/icons-material";
import type { CycleResponse, CycleLog, FlowLevel, Mood, Symptom } from "@mammoai/shared";
import { formatDateDisplay, getCyclePhase, localDateStr, resolvePet, summarizeCycles, MOOD_EMOJI, MOOD_RESPONSE_EMOJI, FLOW_EMOJI, SYMPTOM_EMOJI } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { Button, Card, LoadingSpinner, ErrorState, EmptyState, IconChip, Badge, DateWheelPicker } from "@/components/ui";
import { MonthCalendar, type DayMarker } from "@/components/MonthCalendar";
import { useAppDrawer } from "@/components/AppDrawer";
import { PhaseCard } from "@/components/PhaseCard";
import { DailyInsightsCarousel } from "@/components/DailyInsightsCarousel";
import { MyCyclesCard } from "@/components/screens/MyCyclesCard";
import { WellnessCard } from "@/components/WellnessCard";
import { Emoji } from "@/components/Emoji";
import { TodayHeader, type TodayDay, type TodayDayMarker } from "@/components/screens/TodayHeader";
import { TodayAssistantCard } from "@/components/screens/TodayAssistantCard";
import { CheckinDeck } from "@/components/screens/checkin/CheckinDeck";
import { TodayBackdrop, TodayStatusCircle } from "@/components/screens/TodayBackdrop";
import { LogSheet } from "@/components/screens/LogSheet";
import { PeriodCalendar } from "@/components/screens/PeriodCalendar";
import { PetPicker } from "@/components/pets/PetPicker";

/** 0-BOSQICH: oxirgi QAYD ETILGAN hayzning birinchi kuni — ketma-ket "flow"
 * kunlari guruhining boshi. `null` — foydalanuvchi hech qachon hayz qayd
 * etmagan.
 *
 * Nega kerak: "Hayz: N-kun" — bu HOZIRGI holat haqidagi DA'VO. Ilgari u
 * `cycle_settings.last_period_start`dan, ya'ni onboarding'dagi bir martalik
 * "oxirgi marta qachon hayz ko'rgansiz?" javobidan hisoblanardi. O'sha qiymat
 * hayz belgilanganda ham, o'chirilganda ham HECH QACHON yangilanmaydi
 * (repo.ts: setPeriodRange/applyPeriodDiff/clearPeriodRange faqat `cycle_logs`
 * ga tegadi). Natijada hech narsa belgilamagan foydalanuvchiga ilova
 * "Hayz: 3-kun" deb aytardi — production'da 71 ta foydalanuvchiga tegishli.
 *
 * Ilova ayolning hozir hayz ko'rayotganini BILA OLMAYDI — buni faqat ayolning
 * o'zi aytadi. Shuning uchun endi da'vo faqat haqiqiy qaydga tayanadi. */
function lastLoggedPeriodStart(logs: CycleLog[]): string | null {
  const dates = logs
    .filter((l) => l.flow)
    .map((l) => l.date)
    .sort();
  if (dates.length === 0) return null;
  let start = dates[dates.length - 1];
  for (let i = dates.length - 2; i >= 0; i--) {
    const next = new Date(dates[i] + "T00:00:00");
    next.setDate(next.getDate() + 1);
    // Uzilish topildi — oldingi kunlar BOSHQA hayzga tegishli.
    if (localDateStr(next) !== start) break;
    start = dates[i];
  }
  return start;
}

/** TODAY-07: bosh ekrandagi kunlar karuseli qancha oraliqni qamraydi.
 * Bugundan oldin/keyin ~6 hafta — qayd qilish va yaqin bashoratlar uchun
 * yetarli, lekin chiziqni cheksiz uzaytirib yubormaydi (undan uzoqni ko'rish
 * uchun to'liq kalendar bor). */
const STRIP_DAYS_BACK = 45;
const STRIP_DAYS_FORWARD = 45;

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

/**
 * Ekranning tashqi ko'rinishi. Ma'lumot, hisob-kitob va barcha oqimlar
 * IKKALASIDA HAM bir xil — faqat yuqori blokning taqdimoti farq qiladi.
 * - "classic" — 2026-09-18 dagi ko'rinish (barcha eski rejimlar).
 * - "today"   — TODAY-01, foydalanuvchi bergan referens bo'yicha qayta
 *               bezalgan "Bugun" ekrani (`cycle` va `planning_pregnancy`).
 */
export type CycleScreenVariant = "classic" | "today";

/** "Asosiy" (/asosiy) sahifasining Hayz-rejim tarkibi — ilgari alohida /tsikl
 * sahifasi edi, endi rejimga qarab Asosiy ichida ko'rsatiladi. */
export function CycleScreen({ variant = "classic" }: { variant?: CycleScreenVariant } = {}) {
  const isTodayVariant = variant === "today";
  const { dict } = useI18n();
  const { onboardingProfile, user, applyMeResponse } = useSession();
  const { openDrawer } = useAppDrawer();
  const router = useRouter();
  const [data, setData] = useState<CycleResponse | null>(null);
  const [streakDays, setStreakDays] = useState<number | null>(null);
  const [logging, setLogging] = useState(false);
  const [logDate, setLogDate] = useState<string>(() => localDateStr());
  const [flow, setFlow] = useState<FlowLevel | null>(null);
  const [mood, setMood] = useState<Mood | null>(null);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  // CYCLE-ALGO-15: matn ko'rinishida saqlanadi (raqam emas) — foydalanuvchi
  // "36." kabi yarim kiritgan holatni ham to'g'ri ko'rsatish uchun; saqlashda
  // raqamga aylantiriladi (bo'sh bo'lsa `null`).
  const [basalBodyTempInput, setBasalBodyTempInput] = useState("");
  const [showAdvancedLog, setShowAdvancedLog] = useState(false);
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
  // TODAY-02: "today" ko'rinishida Check-in endi sahifa ichidagi kichik
  // kayfiyat qatori emas, to'liq ekranli karta to'plami (CheckinDeck).
  const [showCheckinDeck, setShowCheckinDeck] = useState(false);
  // TODAY-03: yozuv saqlangandan keyin bashorat qayta hisoblanadi — referens
  // dizaynda bu qisqa "yangilandi" tasdig'i bilan ko'rsatiladi (markaziy blok
  // o'rnida, bir necha soniya).
  const [predictionsUpdated, setPredictionsUpdated] = useState(false);
  // PET-01: uy hayvonini tanlash varag'i — faqat 18 yoshgacha.
  const [showPetPicker, setShowPetPicker] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  /** TODAY-09: homiladorlik ehtimoli qatoridagi ⓘ oynasi. */
  const [showChanceInfo, setShowChanceInfo] = useState(false);
  // TODAY-06: kalendar IKKI yo'l bilan ochiladi va ular boshqa-boshqa
  // maqsadga xizmat qiladi (foydalanuvchi so'rovi):
  //   • yuqoridagi kalendar ikonkasi → ko'rish (bashorat, fazalar, kun ma'lumoti);
  //   • "Hayz belgilash" tugmasi   → to'g'ridan-to'g'ri tahrirlash rejimi.
  const [calendarStartsEditing, setCalendarStartsEditing] = useState(false);
  // OVERNIGHT-17: 7 kunlik chiziqda bir kun bosilganda ilgari to'g'ridan-
  // to'g'ri kalendar-modal ochilardi (foydalanuvchi so'rovi: "kalendar
  // ochilmasdan to'g'ridan-to'g'ri o'tib ketsin"). Endi shu sana uchun
  // qisqa ma'lumot kartasi BOSH SAHIFANING O'ZIDA (modal'siz) ochiladi.
  const [viewedDayDetail, setViewedDayDetail] = useState<string | null>(null);
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

  useEffect(() => {
    if (!predictionsUpdated) return;
    const timeout = setTimeout(() => setPredictionsUpdated(false), 2500);
    return () => clearTimeout(timeout);
  }, [predictionsUpdated]);

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

  // OVERNIGHT-20: foydalanuvchi so'roviga ko'ra ("kirganda so'rasin srazu",
  // Flo'ning proaktiv kunlik so'rovnomasi kabi) — bugun uchun hali hech
  // narsa qayd etilmagan bo'lsa, ekran ochilishi bilan darhol (kutmasdan,
  // qidirmasdan) belgilash oynasi o'zi ochiladi. Bir kunda BIR MARTA
  // (sessionStorage) — sahifalar orasida bir necha marta o'tib-kelinganda
  // zerikarli bo'lib qolmasligi uchun; ma'lumot allaqachon bo'lsa umuman
  // ko'rsatilmaydi.
  useEffect(() => {
    if (!data) return;
    if (data.logs.some((l) => l.date === today)) return;
    try {
      const key = `mammoai_checkin_prompted_${today}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Xususiy rejim va h.k. — baribir bir marta ko'rsatamiz.
    }
    // setState effekt ICHIDA sinxron chaqirilmaydi (fayldagi boshqa
    // effektlar bilan bir xil naqsh — react-hooks/set-state-in-effect).
    const timeout = setTimeout(() => {
      setLogDate(today);
      setFlow(null);
      setMood(null);
      setSymptoms([]);
      setLogging(true);
    }, 0);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (loadError) {
    return <ErrorState message={dict.common.errorGeneric} retry={{ label: dict.common.retryButton, onClick: loadCycle }} />;
  }

  if (!data) {
    // TODAY-03: "today" ko'rinishida oddiy spinner o'rniga referensdagi katta
    // "tahlil qilinmoqda" doirasi — bu birinchi kirishdagi BIRINCHI taassurot,
    // shuning uchun bo'sh ekran emas, ilovaning o'z ohangidagi holat.
    if (isTodayVariant) {
      return (
        <>
          <TodayBackdrop />
          <div className="relative z-10 flex min-h-[70dvh] items-center justify-center">
            <TodayStatusCircle label={dict.cycle.analyzingLabel} />
          </div>
        </>
      );
    }
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

  // CYCLE-ALGO-23: faza va sikl kuni endi BASHORAT bilan bir xil qiymatlardan
  // hisoblanadi. Ilgari bu yerda xom `cycle_settings` (onboarding javobi)
  // ishlatilardi, kalendar belgilari esa `forecast`dan kelardi — natijada
  // bitta kun haqida ikki xil gap aytilardi.
  const cycleLen = data.prediction?.averageCycleLength || data.settings.averageCycleLength || 28;
  const periodLen = data.prediction?.averagePeriodLength || data.settings.averagePeriodLength || 5;
  /** Fazani hisoblash uchun LANGAR — bashorat ishlatadigani bilan bir xil. */
  const phaseAnchor = data.prediction?.lastPeriodStart ?? data.settings.lastPeriodStart;
  /** CYCLE-ALGO-24: ovulyatsiya o'rni ham bashorat bilan bir xil bo'lishi
   * uchun — shaxsiy lyuteal faza (o'rganilgan bo'lsa). */
  const lutealDays = data.prediction?.lutealPhaseDays;

  // Berilgan istalgan sana uchun tsikl fazasini hisoblaydi — kalendarda qaysi
  // kun bosilsa, o'sha kun uchun "prognoz" ko'rsatish uchun (App.pdf/Figma
  // referens: "kalendar pastida ma'lumot bersin, tanlov qilishiga qarab").
  function phaseForDate(dateStr: string) {
    if (!phaseAnchor) return null;
    const diff = Math.round((new Date(dateStr).getTime() - new Date(phaseAnchor).getTime()) / 86400000);
    const dayInCycle = (((diff % cycleLen) + cycleLen) % cycleLen) + 1;
    return getCyclePhase(dayInCycle, cycleLen, periodLen, lutealDays);
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
  if (phaseAnchor && !data.prediction?.isStale) {
    const diff = Math.round((new Date(today).getTime() - new Date(phaseAnchor).getTime()) / 86400000);
    // `dayInCycle` — "siklning N-kuni", ya'ni BASHORAT (faza taxmini), shuning
    // uchun u foydalanuvchi kiritgan sanaga tayanishi mumkin.
    dayInCycle = (((diff % cycleLen) + cycleLen) % cycleLen) + 1;
  }

  // `periodDay` esa bashorat EMAS, hozirgi holat haqidagi da'vo — u faqat
  // haqiqiy qayddan chiqadi (qarang: lastLoggedPeriodStart izohi).
  const loggedPeriodStart = !data.prediction?.isStale ? lastLoggedPeriodStart(data.logs) : null;
  if (loggedPeriodStart) {
    const diff = Math.round((new Date(today).getTime() - new Date(loggedPeriodStart).getTime()) / 86400000);
    // CYCLE-ALGO-19: O'RGANILGAN davomiylik (prediction), xom `cycle_settings`
    // emas — u onboarding'dan keyin hech qachon yangilanmaydi.
    const effectivePeriodLength = data.prediction?.averagePeriodLength || data.settings.averagePeriodLength;
    if (diff >= 0 && diff < effectivePeriodLength) periodDay = diff + 1;
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

  // TODAY-02: BUGUN chiziqning O'RTASIDA turadi (foydalanuvchi so'rovi).
  //
  // TODAY-07 (foydalanuvchi so'rovi 2026-09-22: "when it comes to the days
  // above seven days can you make that like carusel i can see other dates as
  // well by scrolling?"): chiziq endi 7 kun bilan CHEKLANMAGAN — u ikki oyga
  // yaqin oraliqni qamraydi va gorizontal suriladi (TodayHeader karusel qilib
  // chizadi, bugun esa markazga o'rnatiladi). Butun kalendarni bu yerda
  // ko'rsatish shart emas — chuqur ko'rish uchun PeriodCalendar bor.
  const dayStrip: TodayDay[] = (() => {
    // `markers` faqat qayd etilgan kunlar + KEYINGI bitta hayzni bilardi, ya'ni
    // karusel uzaytirilganda o'ngdagi kunlar bo'sh qolardi. Shuning uchun bu
    // yerda kalendar bilan BIR XIL manba — `data.forecast` (bir necha sikl
    // oldinga) ishlatiladi.
    const logByDate = new Map(data.logs.map((l) => [l.date, l]));
    const predicted = new Set<string>();
    const fertile = new Set<string>();
    const ovulation = new Set<string>();
    // Bashorat eskirgan bo'lsa (oxirgi hayz juda uzoq oldin qayd etilgan)
    // hech qanday bashorat belgisi qo'yilmaydi — aks holda chiziq allaqachon
    // o'tib ketgan "bashorat"larni ko'rsatib, xato ma'lumot berardi.
    const showFertile = data.prediction?.confidence !== "insufficient";
    // CYCLE-ALGO-18: hali birorta sikl aniqlanmagan bo'lsa ("insufficient" —
    // odatda faqat onboarding'da bitta sana kiritilgan) unumdor oyna
    // KO'RSATILMAYDI. Sabab: bunday holatda noaniqlik ~6 kun, ya'ni oyna
    // 19 kunga cho'ziladi — siklning uchdan ikki qismi. Bu ma'lumot bermaydi,
    // faqat kalendarni xira kulrang qilib to'ldiradi (foydalanuvchi: "why
    // some dates are dark and some are grey"), va homiladorlikka
    // tayyorlanayotgan yoki aksincha saqlanayotgan ayolni chalg'itadi.
    if (!data.prediction?.isStale) {
      for (const c of data.forecast) {
        for (const [from, to, target] of [
          [c.periodStart, c.periodEnd, predicted],
          ...(showFertile
            ? ([
                [c.fertileWindowStart, c.fertileWindowEnd, fertile],
                [c.ovulationDay, c.ovulationDay, ovulation],
              ] as const)
            : []),
        ] as const) {
          const cur = new Date(from + "T00:00:00");
          const end = new Date(to + "T00:00:00");
          while (cur <= end) {
            target.add(localDateStr(cur));
            cur.setDate(cur.getDate() + 1);
          }
        }
      }
    }

    const start = new Date(today + "T00:00:00");
    start.setDate(start.getDate() - STRIP_DAYS_BACK);
    return Array.from({ length: STRIP_DAYS_BACK + STRIP_DAYS_FORWARD + 1 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const date = localDateStr(d);
      const log = logByDate.get(date);
      // Kun ostidagi eng ko'pi bilan ikkita belgi — mavjud emoji xaritalaridan
      // (yangi ikonka to'plami kiritilmagan).
      const emojis: string[] = [];
      if (log?.flow) emojis.push(FLOW_EMOJI[log.flow]);
      if (log?.mood) emojis.push(MOOD_EMOJI[log.mood]);
      if (emojis.length < 2 && log?.symptoms.length) emojis.push(SYMPTOM_EMOJI[log.symptoms[0]]);

      // Haqiqiy qayd bashoratdan USTUN, bashorat esa unumdor oynadan.
      let marker: TodayDayMarker = log?.flow ? "period" : predicted.has(date) ? "predicted" : null;
      // Tartib kalendar bilan AYNAN bir xil: ovulyatsiya unumdor oynadan ustun.
      if (!marker && ovulation.has(date)) marker = "ovulation";
      if (!marker && fertile.has(date)) marker = "fertile";
      return { date, dateObj: d, marker, emojis };
    });
  })();

  // 2026-09-18 FIX: "yetarli ma'lumot yo'q" holati ilgari BIR VAQTDA to'rt
  // xil shaklda aytilardi (headline + izoh + Badge + sana-diapazon) — endi
  // shu holat aniqlanib, pastda hammasi BITTA qatorga birlashtiriladi.
  // Confidence "insufficient" YOKI sabab turi hali chinakam sikl tarixi
  // yo'qligini bildirsa (no_data/limited_data) — ikkalasi ham "hali ishonchli
  // bashorat yo'q" degani, faqat turli darajada.
  // CYCLE-ALGO-22: ilgari `limited_data` ham shu yerga kirardi, ya'ni IKKI ta
  // haqiqiy sikl qayd etgan ayolga ham hero toza son ("8 kun qoldi") o'rniga
  // uzun jumla — "11.09.2026–19.09.2026 oralig'ida kutilmoqda" — ko'rsatilardi
  // (foydalanuvchi: "yozuv ham uzun"). Bu ortiqcha ehtiyotkorlik edi: ikkita
  // haqiqiy sikl BOR ma'lumot, shunchaki kam. Endi uzun diapazon faqat
  // HECH QANDAY sikl ma'lumoti bo'lmaganda chiqadi; "kam ma'lumot" holati esa
  // pastdagi kichik izoh qatorida (showTrackingNote) aytiladi — bir fikr
  // ikkita joyda takrorlanmaydi.
  const hasNoCycleData =
    !!data.prediction &&
    (data.prediction.confidence === "insufficient" || data.prediction.explanationReason.type === "no_data");
  const hasLimitedCycleData = data.prediction?.explanationReason.type === "limited_data";
  const isLowInfoPrediction = hasNoCycleData;

  const hasTodayLog = !!todayLog;

  // OVERNIGHT-23: OVERNIGHT-22 YARIM yechim edi — raqamni ko'rsatishni
  // to'g'irladi, lekin uni BOSHQA 5 ta elementga (izoh + Badge + yana
  // bir izoh + yana bir Badge + diapazon) o'rab, bitta fikrni OLTI marta
  // takrorladi, ustiga "Hayzning N-kuni" bilan "keyingi hayz N kundan
  // keyin" bir-biriga zid ko'rinardi (foydalanuvchi hozir sikl ICHIDA
  // bo'lsa, "keyingi" haqida gapirish chalkash). Endi markaziy blokda
  // ENG KO'PI BILAN IKKITA matn qatori: (1) ASOSIY sarlavha — aniq holatga
  // qarab TO'RTTA turdan FAQAT BITTASI, (2) ixtiyoriy, IKKINCHI DARAJALI,
  // FAQAT ijobiy ohangdagi bitta qo'shimcha qator. Alohida "ishonch
  // darajasi" Badge'i va alohida "hayz kuni" Badge'i BUTUNLAY OLIB
  // TASHLANDI — ularning ma'nosi endi to'g'ridan-to'g'ri sarlavhaning
  // o'ziga singdirilgan.
  const isOnPeriod = periodDay !== null;

  // 0-BOSQICH: kutilgan sana KELGAN yoki O'TGAN, lekin hech narsa qayd
  // etilmagan. Ilgari bunday holatda hero "Kechikmoqda: 3 kun" deb yozardi —
  // bu DA'VO, va u xato bo'lishi mumkin: ilova faqat hech narsa
  // belgilanmaganini biladi, hayz boshlanganmi yoki yo'qmi — bilmaydi.
  // Ayolning o'zidan so'rash ham halolroq, ham eng qimmatli ma'lumot
  // yig'iladigan LAHZA (aynan shu kuni javob berish oson).
  const periodExpectedButUnlogged =
    !!data.prediction &&
    !data.prediction.isStale &&
    data.prediction.daysUntilNextPeriod <= 0 &&
    !isOnPeriod;

  const heroHeadline = periodExpectedButUnlogged
    ? dict.cycle.heroPeriodStartedQuestion
    : data.prediction?.isStale
    ? dict.cycle.staleDataLabel
    : !data.prediction
      ? dict.cycle.ringEmptyLabel
      : isOnPeriod
        ? // Hozir hayz ICHIDA bo'lsa, "keyingi hayz"dan gapirish shart emas
          // (chalkash) — buning o'rniga HOZIRGI holat aytiladi.
          dict.cycle.periodDayHeroLabel(periodDay!, data.settings.averagePeriodLength)
        : data.isIrregular
          ? dict.cycle.irregularRingLabel
          : isLowInfoPrediction
            ? // Past ishonchda ANIQ kun o'rniga DIAPAZON — "27 kundan keyin"
              // kabi soxta aniqlik va pastdagi diapazon-qatorining o'zi
              // ENDI IKKALASI BIRGA ko'rinmaydi, faqat BITTASI (diapazon).
              dict.cycle.nextPeriodRangeLabel(
                formatDateDisplay(data.prediction.nextPeriodStartEarliest),
                formatDateDisplay(data.prediction.nextPeriodStartLatest)
              )
            : dict.cycle.nextPeriodIn(data.prediction.daysUntilNextPeriod);

  // TODAY-01: referensdagi ikki qatorli markaziy blok ("Period:" / "Day 6").
  // Shartlar yuqoridagi `heroHeadline` bilan AYNAN bir xil tartibda — ikkala
  // ko'rinish hech qachon boshqa-boshqa holat ko'rsatmasligi uchun. Ikki
  // qatorga bo'linmaydigan holatlarda (eskirgan ma'lumot, bashorat yo'q,
  // tartibsiz sikl, past ishonch) `heroLabel` null bo'ladi va TodayHeader
  // o'sha bitta tushuntiruvchi qatorni kichikroq shriftda ko'rsatadi.
  let heroLabel: string | null = null;
  let heroValue = heroHeadline;
  if (data.prediction && !data.prediction.isStale && !periodExpectedButUnlogged) {
    if (isOnPeriod) {
      heroLabel = dict.cycle.heroPeriodLabel;
      heroValue = dict.cycle.heroPeriodDayValue(periodDay!);
    } else if (!data.isIrregular && !isLowInfoPrediction) {
      const days = data.prediction.daysUntilNextPeriod;
      heroLabel = days < 0 ? dict.cycle.heroDelayedLabel : dict.cycle.heroNextPeriodLabel;
      heroValue = days === 0 ? dict.cycle.heroTodayValue : dict.cycle.heroDaysValue(Math.abs(days));
    }
  }

  // OVERNIGHT-23: ikkinchi darajali, FAQAT ijobiy ohangdagi BITTA qator —
  // "ma'lumot yo'q"/"yetarli emas" kabi salbiy so'zlar ATAYLAB ishlatilmaydi.
  // Faqat past-ishonch holatida ko'rsatiladi (tartibsiz-sikl holati o'zining
  // ALOHIDA, hero'dan TASHQARIDAGI bannerida allaqachon tushuntiriladi —
  // shu yerda takrorlanmaydi).
  const showTrackingNote =
    !!data.prediction && !data.prediction.isStale && (isLowInfoPrediction || hasLimitedCycleData) && !data.isIrregular;

  // OVERNIGHT-15/21/23: hero bloki bosilganda ochiladigan oyna endi HOLATGA
  // qarab FARQLANADI — haqiqiy "hech narsa yo'q" holatida (`!data.prediction`)
  // kerakli amal oxirgi hayz SANASINI kiritish (`openEditLastPeriod`), aks
  // holda (ma'lumot bor, faqat kam) — kunlik yozuv qo'shish (`openLogging`,
  // o'zgarishsiz). Bugun uchun yozuv ALLAQACHON mavjud bo'lsa (`hasTodayLog`),
  // qayta bosish hech narsani o'zgartirmaydi — bosilmaydigan.
  const heroIsCallToAction =
    (!data.prediction || isLowInfoPrediction || !!data.prediction.isStale || periodExpectedButUnlogged) && !hasTodayLog;
  const heroAction = !data.prediction ? openEditLastPeriod : () => openLogging(today, todayLog);
  // Savol berilayotgan bo'lsa, chaqiruv ham ANIQ javob bo'lsin ("Ha, bugun
  // belgilash") — umumiy "Bosing va boshlang" bu yerda savolga javob bermaydi.
  /** SUMMARY-01: faqat QAYD ETILGAN narsani o'lchaydi — bashorat emas. */
  const cycleSummary = summarizeCycles(data.logs, today);

  const heroTapHintText = periodExpectedButUnlogged
    ? dict.cycle.heroPeriodStartedCta
    : dict.cycle.heroTapHint;

  // TODAY-09: hero ostidagi bir qatorli holat (referenslarning uchalasida ham
  // shu joyda bitta qator bor). Uch holat, tartibi muhim:
  //   1) hayz ketayotgan bo'lsa — eng foydali amal shu paytda sanalarni
  //      to'g'irlash (Flo ham aynan shuni qo'yadi);
  //   2) ishonchli bashorat bo'lsa — homiladorlik ehtimoli;
  //   3) ma'lumot yetarli bo'lmasa — DA'VO QILINMAYDI, nima qilish kerakligi
  //      aytiladi. Aks holda hech qachon hayz qayd etmagan ayolga "ehtimol
  //      past" deb ishontirgan bo'lardik — biz buni bilmaymiz.
  const heroChip: { label: string; onClick?: () => void; solid?: boolean } | null = (() => {
    if (isOnPeriod) {
      return {
        label: dict.cycle.calEditPeriod,
        solid: true,
        onClick: () => {
          setCalendarStartsEditing(true);
          setShowCalendarModal(true);
        },
      };
    }
    if (!data.prediction || data.prediction.isStale || hasNoCycleData) {
      return { label: dict.cycle.pregnancyChanceUnknown, onClick: () => openLogging(today, todayLog) };
    }
    const inFertileWindow =
      today >= data.prediction.fertileWindowStart && today <= data.prediction.fertileWindowEnd;
    return {
      label: inFertileWindow ? dict.cycle.pregnancyChanceHigh : dict.cycle.pregnancyChanceLow,
      // ⓘ — umumiy gap emas, AYNAN shu xulosa qanday chiqqani tushuntiriladi.
      onClick: () => setShowChanceInfo(true),
    };
  })();



  // Kalendarda ko'rsatilayotgan oyning har bir kuni uchun tsikl fazasi — shu
  // orqali oldingi/keyingi oylarga o'tilganda ham fon ranglari to'g'ri
  // hisoblanadi (foydalanuvchi so'rovi: fazalar ranglar bilan ajralib tursin).
  const phaseMarkers: Record<string, ReturnType<typeof getCyclePhase>> = {};
  if (phaseAnchor) {
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
    setBasalBodyTempInput(existing?.basalBodyTemp != null ? String(existing.basalBodyTemp) : "");
    setShowAdvancedLog(existing?.basalBodyTemp != null);
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

  /** CAL-04: kalendarning tahrirlash rejimida "Saqlash" — belgilangan va
   * bekor qilingan kunlar BITTA so'rovda qo'llanadi. */
  async function savePeriodDiff(added: string[], removed: string[]) {
    setData(await api.cycle.periodDiff({ added, removed }));
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
      setBasalBodyTempInput("");
    } finally {
      setDeletingLog(false);
    }
  }

  async function saveLog() {
    setSaving(true);
    try {
      // CYCLE-ALGO-15: bo'sh matn → `null` (BBT kiritilmagan), aks holda
      // vergul o'rniga nuqta ham qabul qilinadi (foydalanuvchi klaviaturasiga
      // qarab) — server tomonida yana bir bor 34-42°C oralig'i tekshiriladi.
      const trimmed = basalBodyTempInput.trim().replace(",", ".");
      const basalBodyTemp = trimmed ? Number(trimmed) : null;
      const res = await api.cycle.logDay({ date: logDate, flow, mood, symptoms, basalBodyTemp });
      setData(res);
      // TODAY-03: yangi yozuv bashoratni qayta hisoblatadi — foydalanuvchi
      // buni ko'rishi kerak, aks holda "saqladim, nima o'zgardi?" degan savol
      // qoladi. Tasdiq bir necha soniyadan keyin o'zi yo'qoladi (quyidagi
      // effekt), markaziy blok esa yangilangan qiymat bilan qaytadi.
      setPredictionsUpdated(true);
      setLogging(false);
      setFlow(null);
      setMood(null);
      setSymptoms([]);
      setBasalBodyTempInput("");
    } finally {
      setSaving(false);
    }
  }

  // TODAY-03: "Ilg'or" (BBT) bo'limi IKKALA ko'rinishda ham bir xil —
  // to'liq ekranli LogSheet ham, eski modal ham shu bitta JSX'ni
  // ishlatadi (nusxalanmasligi uchun o'zgaruvchiga chiqarildi).
  // CYCLE-ALGO-15: BBT — ko'pchilik foydalanuvchi kuzatmaydi, shuning uchun
  // MAJBURIY emas, "Ilg'or" nomi ostida yashirin/yig'ilgan holatda boshlanadi
  // (mavjud yozuvda qiymat bo'lsa, avtomatik ochiladi — `openLogging`ga
  // qarang). Kuzatuvchilar uchun esa (BBT ovulyatsiyani simptomdan ANIQROQ
  // aniqlaydi) aniqlikni sezilarli oshiradi.
  const advancedLogFields = (
    <div>
      <button
        type="button"
        onClick={() => setShowAdvancedLog((v) => !v)}
        className="flex w-full items-center justify-between text-sm font-semibold text-text-secondary"
      >
        {dict.cycle.advancedSectionLabel}
        <ChevronRight sx={{ fontSize: 18, transform: showAdvancedLog ? "rotate(90deg)" : undefined, transition: "transform 150ms" }} />
      </button>
      {showAdvancedLog && (
        <div className="animate-fade-in-up mt-2 space-y-1.5">
          <label htmlFor="bbt-input" className="text-xs text-text-muted">
            {dict.cycle.basalBodyTempLabel}
          </label>
          <input
            id="bbt-input"
            type="number"
            inputMode="decimal"
            step="0.01"
            min={34}
            max={42}
            value={basalBodyTempInput}
            onChange={(e) => setBasalBodyTempInput(e.target.value)}
            placeholder="36.50"
            className="tap-target w-full rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-primary"
          />
          <p className="text-xs text-text-muted">{dict.cycle.basalBodyTempHint}</p>
        </div>
      )}
    </div>
  );

  const screen = (
    <div className={clsx("space-y-5", isTodayVariant && "relative z-10")}>
      {isTodayVariant ? (
        <TodayHeader
          avatarUrl={user?.avatarUrl ?? null}
          initials={initials}
          // Bugun hali hech narsa qayd etilmagan bo'lsa — kichik nuqta
          // (referensdagi bildirishnoma nuqtasining ma'noli muqobili).
          showAvatarDot={!todayLog}
          onOpenDrawer={openDrawer}
          streakDays={streakDays}
          todayLabel={todayLabel}
          onOpenCalendar={() => {
            setCalendarStartsEditing(false);
            setShowCalendarModal(true);
          }}
          days={dayStrip}
          today={today}
          selectedDate={viewedDayDetail}
          onSelectDay={(d) => setViewedDayDetail((cur) => (cur === d ? null : d))}
          heroLabel={heroLabel}
          heroValue={heroValue}
          heroTapHint={heroIsCallToAction ? heroTapHintText : null}
          onHeroClick={heroIsCallToAction ? heroAction : null}
          heroStatus={predictionsUpdated ? { label: dict.cycle.predictionsUpdatedLabel, done: true } : null}
          heroChip={heroChip}
          pet={isMinor ? resolvePet(user?.pet) : null}
          onPetTap={() => setShowPetPicker(true)}
          actions={[
            {
              key: "flow",
              // TODAY-02 (foydalanuvchi so'rovi): "Hayz belgilash" endi
              // to'g'ridan-to'g'ri bugungi forma emas, avval KALENDAR ochadi —
              // hayz bir necha kun davom etgani uchun ko'pincha bugungi emas,
              // o'tgan kunlarni belgilash kerak bo'ladi.
              icon: <EditOutlined sx={{ fontSize: 26 }} />,
              label: dict.cycle.logFlowButton,
              onClick: () => {
                setSelectedDate(today);
                setCalendarStartsEditing(true);
                setShowCalendarModal(true);
              },
              primary: true,
            },
            {
              key: "symptoms",
              icon: <Add sx={{ fontSize: 28 }} />,
              label: dict.cycle.symptomsCardLabel,
              onClick: () => openLogging(today, todayLog),
            },
            {
              key: "checkin",
              icon: <LibraryAddCheckOutlined sx={{ fontSize: 26 }} />,
              label: dict.cycle.checkinButton,
              onClick: () => setShowCheckinDeck(true),
            },
          ]}
        />
      ) : (
        <>
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
          const isViewed = date === viewedDayDetail;
          return (
            <button
              key={date}
              type="button"
              onClick={() => setViewedDayDetail((d) => (d === date ? null : date))}
              className={clsx(
                "tap-target flex flex-col items-center gap-1 rounded-2xl py-1.5 transition",
                isViewed && !isToday && "bg-surface-muted"
              )}
            >
              <span className="text-[10px] font-semibold uppercase text-text-muted">{dict.common.weekdaysShort[dateObj.getDay()]}</span>
              <span
                className={clsx(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition",
                  isToday ? "bg-primary text-white" : isViewed ? "ring-2 ring-primary text-text-primary" : "text-text-primary"
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

        </>
      )}

      {/* OVERNIGHT-17: tanlangan kun uchun — faza + o'sha kunga qayd
          etilgan (yoki qayd etilmagan) ma'lumot, "bugungidek" bitta joyda. */}
      {viewedDayDetail &&
        (() => {
          const detailLog = data.logs.find((l) => l.date === viewedDayDetail) ?? null;
          const detailPhase = phaseForDate(viewedDayDetail);
          return (
            <Card className="animate-fade-in-up space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-text-primary">{formatDateLabel(viewedDayDetail)}</p>
                <button
                  type="button"
                  onClick={() => setViewedDayDetail(null)}
                  aria-label={dict.common.close}
                  className="tap-target flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-text-secondary active:scale-95"
                >
                  <Close sx={{ fontSize: 16 }} />
                </button>
              </div>
              {detailPhase && <PhaseCard phase={detailPhase} />}
              {detailLog ? (
                <div className="flex flex-wrap gap-2">
                  {detailLog.flow && <Badge tone="primary">{`${dict.cycle.flowCardLabel}: ${dict.cycle.flowLevels[detailLog.flow]}`}</Badge>}
                  {detailLog.mood && <Badge tone="primary">{`${dict.cycle.moodCardLabel}: ${dict.cycle.moods[detailLog.mood]}`}</Badge>}
                  {detailLog.symptoms.map((s) => (
                    <Badge key={s}>{dict.cycle.symptoms[s]}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-secondary">{dict.cycle.dayDetailEmptyLabel}</p>
              )}
              <Button onClick={() => openLogging(viewedDayDetail, detailLog ?? undefined)} className="w-full">
                {detailLog ? dict.cycle.detailedLogButton : dict.cycle.dayDetailLogButton}
              </Button>
            </Card>
          );
        })()}

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

          {/* TODAY-01: "today" ko'rinishida markaziy blokni TodayHeader chizadi. */}
          {!isTodayVariant && (
            <>
          {/* 3. Markaziy "hero" bloki — bitta katta matn ustunlik qiladi,
              CycleRing'ning to'liq halqa diagrammasi o'rniga yumshoq,
              sekin-asta "nafas oluvchi" blob-fon (LandingPage'dagi BlobArt
              texnikasi bilan bir xil — motion-breathe, faqat scale
              animatsiya qiladi, prefers-reduced-motion'da to'xtaydi lekin
              yo'qolmaydi). */}
          <button
            type="button"
            onClick={() => heroIsCallToAction && heroAction()}
            disabled={!heroIsCallToAction}
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
              {/* OVERNIGHT-23: markaziy blokda ENG KO'PI BILAN IKKITA matn
                  qatori qoladi — asosiy sarlavha (raqam/diapazon/hozirgi
                  hayz kuni, holatga qarab TO'RTTADAN FAQAT BITTASI) va
                  ixtiyoriy bitta ijobiy ohangdagi qo'shimcha qator. Alohida
                  "hayz kuni" va "ishonch darajasi" Badge'lari, va bir necha
                  marta takrorlangan "ma'lumot yo'q" izohlari BUTUNLAY OLIB
                  TASHLANDI. */}
              <p className="text-2xl leading-snug font-extrabold text-text-primary sm:text-3xl">
                {isOnPeriod && isMinor && <Emoji e="🐰" size={22} />} {heroHeadline}
              </p>

              {/* OVERNIGHT-15: matn "bosing" demasdan turib ham bosiladigan
                  bo'lgani uchun ko'p foydalanuvchi buni tushunmay, alohida
                  tugma qidirardi — endi aniq, ko'zga tashlanadigan chaqiruv
                  qo'shildi. */}
              {heroIsCallToAction && (
                <p className="mt-2 flex items-center justify-center gap-1 text-sm font-bold text-primary">
                  {heroTapHintText}
                  <ArrowForwardOutlined sx={{ fontSize: 16 }} />
                </p>
              )}

              {/* OVERNIGHT-23: yagona, IJOBIY ohangdagi ikkinchi darajali
                  qator — "ma'lumot yo'q"/"yetarli emas" kabi salbiy so'zlar
                  ATAYLAB ishlatilmaydi. Faqat past-ishonch holatida, va
                  yuqoridagi CTA-chaqiruv matni bilan BIR VAQTDA hech
                  qachon (ikkalasi ham "keyingi qadam" haqida bo'lib
                  qolmasligi uchun) ko'rsatiladi. */}
              {!heroIsCallToAction && showTrackingNote && (
                <p className="mt-2 text-sm font-semibold text-text-secondary">{dict.cycle.trackingImprovesLabel}</p>
              )}
            </div>
          </button>
            </>
          )}

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

      {!isTodayVariant && (
        <>
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
        </>
      )}

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

      {/* TODAY-01: referensdagi pastki karta — mavjud AI-yordamchi ekraniga
          (/yordamchi) olib boradi, yangi backend yozilmagan. */}
      {isTodayVariant && <TodayAssistantCard />}

      {isWellbeing && <WellnessCard />}

      {/* 5. Kunlik maslahat kartasi — iliq, "sizga atalgan" ohangdagi matn
          (dict.cycle.dailyInsights, mazmuni o'zgarmagan, faqat ohang). */}
      <DailyInsightsCarousel phase={!isPerimenopause && !data.prediction?.isStale ? phaseForDate(today) : null} />

      {/* SUMMARY-01 — "Mening sikllarim". Referensda (Flo) bosh ekranning
          pastki qismi "qayd qilsang — buni qaytarib beraman" tamoyiliga
          qurilgan; bizda esa qayd qilishdan nima foyda ko'rilishi hech
          qayerda ko'rsatilmasdi. Perimenopauzada ko'rsatilmaydi — u yerda
          "odatiy sikl uzunligi" tushunchasining o'zi boshqa. */}
      {!isPerimenopause && <MyCyclesCard summary={cycleSummary} onLogPeriod={() => openLogging(today, todayLog)} />}

      {/* OVERNIGHT-20: bu forma ILGARI oddiy inline <Card> edi — sahifada
          DailyInsightsCarousel'dan PASTDA render bo'lardi, ya'ni hero/tezkor
          amal tugmalaridan birortasi bosilganda forma HAQIQATAN ochilardi,
          lekin ekran pastida, hech qanday scroll/vizual signalsiz — real
          foydalanuvchi "bosyapman, hech narsa bo'lmayapti" deb xabar berdi.
          Endi haqiqiy Dialog (Flo'dagi kabi darhol paydo bo'ladigan modal) —
          qaysi tugmadan chaqirilishidan qat'iy nazar (hero, "Sikl
          belgilash"/"Simptomlar", kun-tafsilot kartasi, "+ Yozuv qo'shish")
          DOIM zudlik bilan ko'rinadi. */}
      {/* TODAY-03: "today" ko'rinishida yozuv formasi kichik modal emas,
          to'liq ekranli varaq (LogSheet) — referens dizayn. Mantiq bir xil:
          ikkalasi ham shu komponentdagi `flow/mood/symptoms` holatini
          o'zgartiradi va bir xil `saveLog`ni chaqiradi. */}
      {isTodayVariant && logging && (
        <LogSheet
          date={logDate}
          today={today}
          onChangeDate={(d) => openLogging(d, data.logs.find((l) => l.date === d))}
          flowLevels={FLOW_LEVELS}
          flow={flow}
          onToggleFlow={(f) => setFlow(flow === f ? null : f)}
          symptomList={SYMPTOMS}
          symptoms={symptoms}
          onToggleSymptom={(sym) =>
            setSymptoms((cur) => (cur.includes(sym) ? cur.filter((x) => x !== sym) : [...cur, sym]))
          }
          moods={MOODS}
          mood={mood}
          onToggleMood={(m) => setMood(mood === m ? null : m)}
          advanced={advancedLogFields}
          onClose={() => setLogging(false)}
          onSave={saveLog}
          onDelete={data.logs.some((l) => l.date === logDate) ? removeLog : null}
          saving={saving}
          deleting={deletingLog}
        />
      )}

      <Dialog open={logging && !isTodayVariant} onClose={() => setLogging(false)} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: "28px" } } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 700 }}>
          {dict.cycle.dailyCheckinTitle}
          <button
            type="button"
            onClick={() => setLogging(false)}
            aria-label={dict.common.close}
            className="tap-target flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-text-secondary active:scale-95"
          >
            <Close sx={{ fontSize: 18 }} />
          </button>
        </DialogTitle>
        <DialogContent className="space-y-4 pb-4!">
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

          {advancedLogFields}

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
        </DialogContent>
      </Dialog>

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

      {/* CAL-01: "today" ko'rinishida kalendar to'liq ekranli va TAHRIRLASH
          imkoniyatiga ega (referens dizayn). "classic" ko'rinish quyidagi eski
          modalni o'zgarishsiz ishlatishda davom etadi. */}
      {isTodayVariant && showCalendarModal && (
        <PeriodCalendar
          data={data}
          today={today}
          onSavePeriodDiff={savePeriodDiff}
          initialEditing={calendarStartsEditing}
          onOpenLog={(date) => {
            setShowCalendarModal(false);
            openLogging(date, data.logs.find((l) => l.date === date));
          }}
          onClose={() => setShowCalendarModal(false)}
        />
      )}

      {/* To'liq oy-kalendari — endi doim ko'rinib turmaydi, faqat yuqori
          qatordagi kalendar-ikonkasi yoki 7 kunlik chiziqdagi biror kun
          bosilganda bottom-sheet sifatida ochiladi (foydalanuvchi so'rovi).
          MonthCalendar'ning o'zi o'zgartirilmagan. */}
      <Dialog
        open={showCalendarModal && !isTodayVariant}
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
          {/* TODAY-02: kalendar endi faqat ko'rish uchun emas — tanlangan kunni
              shu yerdan belgilash mumkin (kalendar yopiladi va o'sha kun uchun
              mavjud yozuv formasi ochiladi). */}
          {(() => {
            const selectedLog = data.logs.find((l) => l.date === selectedDate);
            return (
              <Button
                onClick={() => {
                  setShowCalendarModal(false);
                  openLogging(selectedDate, selectedLog);
                }}
                className="w-full"
              >
                {selectedLog ? dict.cycle.detailedLogButton : dict.cycle.dayDetailLogButton}
              </Button>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );

  const petPicker = isTodayVariant && isMinor && showPetPicker && (
    <PetPicker
      current={user?.pet ?? null}
      onSelect={async (pet) => applyMeResponse(await api.me.update({ pet }))}
      onClose={() => setShowPetPicker(false)}
    />
  );

  const deck = isTodayVariant && showCheckinDeck && (
    <CheckinDeck
      onClose={() => setShowCheckinDeck(false)}
      todayMood={todayLog?.mood ?? null}
      onPickMood={pickMood}
    />
  );

  if (!isTodayVariant) return screen;

  // TODAY-01/03: butun ekranni qoplaydigan, sekin harakatlanuvchi fon.
  // `fixed` + aniq z-index — sahifa qatlamlari (PageTransition) stacking
  // context yaratishi mumkinligi uchun manfiy z-index'ga tayanmaymiz:
  // fon z-0, mazmun esa z-10 (yuqoridagi `relative z-10`).
  // TODAY-08: fon ayolning HOZIRGI fazasiga ergashadi. Shart
  // DailyInsightsCarousel bilan AYNAN bir xil — bir ekranda faza bo'yicha
  // ikki xil qaror qabul qilinmasligi kerak.
  const backdropPhase = !isPerimenopause && !data.prediction?.isStale ? phaseForDate(today) : null;

  // ⓘ oynasi: xulosa QANDAY chiqqani + ogohlantirish. Ogohlantirish shart —
  // "ehtimol past" ni saqlanish usuli deb tushunish real xavf.
  const chanceInfoDialog = (
    <Dialog
      open={showChanceInfo}
      onClose={() => setShowChanceInfo(false)}
      fullWidth
      maxWidth="xs"
      slotProps={{ paper: { sx: { borderRadius: "24px", margin: 2 } } }}
    >
      <DialogContent>
        {data.prediction && (
          <div className="space-y-3">
            <p className="text-base leading-relaxed text-text-primary">
              {today >= data.prediction.fertileWindowStart && today <= data.prediction.fertileWindowEnd
                ? dict.cycle.pregnancyChanceExplainHigh(
                    formatDateLabel(data.prediction.fertileWindowStart),
                    formatDateLabel(data.prediction.fertileWindowEnd)
                  )
                : dict.cycle.pregnancyChanceExplainLow(
                    formatDateLabel(data.prediction.fertileWindowStart),
                    formatDateLabel(data.prediction.fertileWindowEnd)
                  )}
            </p>
            <p className="rounded-2xl bg-surface-muted p-3 text-sm leading-relaxed text-text-secondary">
              {dict.cycle.pregnancyChanceExplainNote}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      <TodayBackdrop phase={backdropPhase} />
      {screen}
      {chanceInfoDialog}
      {deck}
      {petPicker}
    </>
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
