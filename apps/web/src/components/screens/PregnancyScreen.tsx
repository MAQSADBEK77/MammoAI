"use client";

import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@mui/material";
import { AccessTimeOutlined as CalendarClock, CalendarMonthOutlined as CalendarDays, ChevronRight, HourglassEmptyOutlined as Hourglass, MedicalServicesOutlined as Stethoscope, FavoriteBorderOutlined as Heart, MonitorHeartOutlined as Activity, MonitorWeightOutlined as Scale, DeviceThermostatOutlined as Thermometer } from "@mui/icons-material";
import type { PregnancyResponse, PregnancyWeekContent, VitalType } from "@mammoai/shared";
import { getMilestoneForWeek, getVitalTone, localDateStr, formatDateDisplay } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useIllustrations } from "@/lib/illustrations";
import { Emoji } from "@/components/Emoji";
import { api } from "@/lib/api";
import { Badge, Button, Card, DateWheelPicker, FloatingTag, LoadingSpinner, ScreenHeader } from "@/components/ui";
import { PregnancyHero } from "@/components/screens/PregnancyHero";
import { PregnancyAlbum } from "@/components/PregnancyAlbum";

const VITAL_TYPES: VitalType[] = ["heart_rate", "blood_pressure", "weight", "temperature"];
const VITAL_ICON: Record<VitalType, typeof Heart> = { heart_rate: Heart, blood_pressure: Activity, weight: Scale, temperature: Thermometer };
const VITAL_TINT: Record<VitalType, string> = {
  heart_rate: "bg-primary/10 text-primary",
  blood_pressure: "bg-secondary/10 text-secondary",
  weight: "bg-accent/10 text-accent",
  temperature: "bg-warning/10 text-warning",
};

/** "Asosiy" (/asosiy) sahifasining Homiladorlik-rejim tarkibi — ilgari alohida
 * /homiladorlik sahifasi edi, endi rejimga qarab Asosiy ichida ko'rsatiladi. */
export function PregnancyScreen() {
  const { dict } = useI18n();
  const { resolve } = useIllustrations();
  const { onboardingProfile } = useSession();
  const [data, setData] = useState<PregnancyResponse | null>(null);
  // CONTENT-001: admin panel orqali tahrirlanadigan haftalik kontent —
  // topilmasa (hali kiritilmagan hafta) eski statik meva-qiyoslash tizimiga
  // (getMilestoneForWeek) tushiladi.
  const [weekContent, setWeekContent] = useState<PregnancyWeekContent | null>(null);
  const [lmpInput, setLmpInput] = useState("");
  const [addingVisit, setAddingVisit] = useState(false);
  const [visitLabel, setVisitLabel] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [visitClinic, setVisitClinic] = useState("");
  const [saving, setSaving] = useState(false);
  const [loggingVital, setLoggingVital] = useState<VitalType | null>(null);
  const [vitalInput, setVitalInput] = useState("");
  const [savingVital, setSavingVital] = useState(false);
  /** PREG-UI-01: ko'rsatkichlar bloki — standart holatda YOPIQ (0 ta ayol ishlatgan). */
  const router = useRouter();
  const [showVitals, setShowVitals] = useState(false);
  /** PREG-END-01: "homiladorlik tugadi" oynasi. */
  const [endingOpen, setEndingOpen] = useState(false);
  const [endingSaving, setEndingSaving] = useState(false);
  const [showWeekDetails, setShowWeekDetails] = useState(false);

  /**
   * PREG-END-01: natijani saqlaydi va rejimni almashtiradi.
   *
   * `isPregnant: false` ham yuboriladi — aks holda ayol rejimida
   * "homiladorlik" bo'lib qolardi va ekran o'zgarmasdi. Sikl rejimiga
   * o'tkazamiz, chunki ikkala holatda ham keyingi kuzatiladigan narsa
   * hayz siklining qaytishi.
   */
  async function endPregnancy(outcome: "birth" | "loss") {
    setEndingSaving(true);
    try {
      await api.pregnancy.updateProfile({ outcome, endedOn: todayStr });
      await api.onboarding.update({ primaryGoal: "cycle", isPregnant: false });
      window.location.assign("/asosiy");
    } catch {
      setEndingSaving(false);
      setEndingOpen(false);
    }
  }
  const [vitalError, setVitalError] = useState<string | null>(null);
  // WEB3-12: ClinicsScreen'dagi FIX-UX-08 bilan bir xil naqsh — .catch()
  // yo'q edi, so'rov muvaffaqiyatsiz bo'lsa ekran ABADIY yuklanish
  // holatida qolib ketardi.
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(() => {
    setLoadError(false);
    api.pregnancy.get().then(setData).catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    // setTimeout(0): `load()` sinxron `setState` chaqiradi (loadError reset)
    // — effekt ichida to'g'ridan-to'g'ri chaqirilsa ESLint qoidasi ("Calling
    // setState synchronously within an effect") xato beradi (ClinicsScreen'da
    // ham bir xil naqsh).
    const timeout = setTimeout(load, 0);
    return () => clearTimeout(timeout);
  }, [load]);

  const currentWeek = data?.status?.currentWeek;
  useEffect(() => {
    if (!currentWeek) return;
    api.pregnancy
      .weekContent(currentWeek)
      .then((res) => setWeekContent(res.content))
      .catch(() => setWeekContent(null));
  }, [currentWeek]);

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

  if (loadError) {
    return (
      <Card className="flex flex-col items-center gap-3 py-8 text-center text-sm text-text-secondary">
        <p>{dict.common.errorGeneric}</p>
        <Button onClick={load}>{dict.common.retryButton}</Button>
      </Card>
    );
  }
  if (!data) return <LoadingSpinner label={dict.common.loading} />;

  if (!data.status) {
    return (
      <div className="space-y-4">
        <ScreenHeader title={dict.pregnancy.title} />
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG, next/image optimizatsiyasi kerak emas */}
          <img src={resolve("screen.pregnancy")} alt="" className="h-40 w-auto" />
        </div>
        <Card className="space-y-3">
          <p className="text-sm text-text-secondary">{dict.onboarding.lastCheckupQuestion}</p>
          <DateWheelPicker
            value={lmpInput}
            onChange={setLmpInput}
            monthLabels={dict.common.months}
            minYear={new Date().getFullYear() - 1}
            maxYear={new Date().getFullYear()}
          />
          <Button
            className="w-full"
            disabled={!lmpInput || saving}
            onClick={async () => {
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
      </div>
    );
  }

  const { status } = data;
  const milestone = getMilestoneForWeek(status.currentWeek);
  // CONTENT-001: admin-tahrirlangan qiymat ustunlik qiladi, topilmasa eski
  // statik i18n ro'yxatiga tushiladi (izoh — weekContent state e'lonida).
  const sizeLabel = weekContent?.sizeLabel ?? dict.pregnancy.sizes[milestone.sizeComparisonKey.replace("size.", "") as keyof typeof dict.pregnancy.sizes];
  // PREG-WEEK-01: 1-2 haftada HOMILA HALI YO'Q — tibbiy hisob oxirgi hayzning
  // birinchi kunidan boshlanadi, urug'lanish esa taxminan 3-haftada sodir
  // bo'ladi (bazadagi shu haftalarning matni ham aynan shuni yozadi).
  //
  // Shuning uchun "Bolangiz hozir ... kattaligida" jumlasi bu haftalarda
  // ma'nosiz. Bazadagi 1-hafta yorlig'i "hali otalanmagan" bo'lgani uchun
  // ekranda "Bolangiz hozir HALI OTALANMAGAN kattaligida" degan buzuq jumla
  // chiqardi — foydalanuvchi buni ushladi.
  //
  // Bundan tashqari bu shunchaki grammatika emas: hali mavjud bo'lmagan
  // homila haqida "bolangiz" deb yozish noto'g'ri va homiladorlikni
  // kutayotgan ayol uchun og'riqli bo'lishi mumkin.
  const SIZE_COMPARISON_FROM_WEEK = 3;
  const showSizeComparison = status.currentWeek >= SIZE_COMPARISON_FROM_WEEK;
  const progressPct = (status.currentWeek / 40) * 100;
  const weeksRemaining = Math.max(0, 40 - status.currentWeek);
  const greeting = (
    <>
      {dict.common.greeting(onboardingProfile?.name ?? null, new Date().getHours())} <Emoji e="👋" size={20} />
    </>
  );

  const todayStr = localDateStr();
  /** PREG-SCHED-01: milliy jadval bo'yicha navbatdagi majburiy tekshiruv. */
  const scheduled = (() => {
    const n = data.nextScheduledCheckup;
    if (!n) return null;
    const daysLeft = n.dueDate
      ? Math.round((Date.parse(`${n.dueDate}T00:00:00Z`) - Date.parse(`${todayStr}T00:00:00Z`)) / 86_400_000)
      : 0;
    return { type: n.type, daysLeft: Math.max(0, daysLeft), overdue: n.status === "overdue" || daysLeft < 0 };
  })();

  const nextVisit = data.visits.find((v) => v.date >= todayStr) ?? null;
  const nextVisitDaysLeft = nextVisit
    ? Math.max(0, Math.round((new Date(nextVisit.date + "T00:00:00Z").getTime() - new Date(todayStr + "T00:00:00Z").getTime()) / 86400000))
    : null;

  /** PREG-HERO-01: hafta chizig'i uchun yetti kun — bugundan uch kun oldin
   * boshlanadi, ya'ni bugun o'rtada turadi (Flo referensidagi kabi). */
  const heroDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(`${todayStr}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + i - 3);
    const date = d.toISOString().slice(0, 10);
    return { date, weekdayLabel: dict.common.weekdaysShort[d.getUTCDay()], dayNumber: d.getUTCDate() };
  });

  return (
    <div className="space-y-5 pb-6">
      <PregnancyHero
        dateLabel={formatDateDisplay(todayStr)}
        onOpenCalendar={() => router.push("/tekshiruvlar")}
        days={heroDays}
        today={todayStr}
        selectedDate={todayStr}
        onSelectDay={() => {}}
        todayLabel={dict.cycle.todayLabel}
        week={status.currentWeek}
        sizeIcon={milestone.icon}
        weekDayLabel={dict.pregnancy.weekDayLabel(status.currentWeek, status.currentDay)}
        detailsLabel={dict.pregnancy.detailsButton}
        onOpenDetails={() => setShowWeekDetails(true)}
        menuLabel={dict.common.openMenu}
      />

      {/* Hafta tafsiloti — gradientdan KEYIN, oq fonda. Ilgari bularning
          hammasi gradient kartaning ICHIDA edi va o'qish qiyin edi. */}
      <div className="space-y-5">
        <div className="text-center">
          <p className="text-sm font-semibold text-text-secondary">{dict.pregnancy.trimester(status.trimester)}</p>
          <p className="mt-1 text-base font-bold text-text-primary">
            {showSizeComparison ? dict.pregnancy.sizeComparison(sizeLabel) : dict.pregnancy.earlyWeekNote}
          </p>
        </div>

        <div className="flex justify-center gap-3">
          <FloatingTag icon={<CalendarClock sx={{ fontSize: 18 }} className="text-pregnancy-accent" />} value={String(status.currentWeek)} label={dict.pregnancy.completedWeekLabel} />
          <FloatingTag icon={<Hourglass sx={{ fontSize: 18 }} className="text-pregnancy-accent" />} value={String(weeksRemaining)} label={dict.pregnancy.remainingWeekLabel} />
        </div>

        {/* PREG-HERO-01: chiziq endi OQ fonda — oq matn ko'rinmasdi.
            Lalu referensidagi kabi trimestr yorliqlari ham qo'shildi:
            ayol o'zini butun yo'lning qayerida turganini ko'rishi kerak,
            faqat foizni emas. */}
        <div className="space-y-1.5">
          <div className="h-3 w-full overflow-hidden rounded-full bg-surface-muted">
            <div
              className="bg-pregnancy-accent h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-semibold">
            {([1, 2, 3] as const).map((t) => (
              <span key={t} className={t === status.trimester ? "text-text-primary" : "text-text-muted"}>
                {dict.pregnancy.trimester(t)}
              </span>
            ))}
          </div>
          <p className="pt-1 text-center text-sm font-semibold text-text-secondary">
            {dict.pregnancy.daysRemaining(status.daysRemaining)}
          </p>
        </div>
      </div>

      {/* CONTENT-001: admin panel orqali tahrirlanadigan haftalik matn —
          tashxis emas, faqat umumiy ma'lumot (izoh — vitalsDisclaimer
          bilan bir xil ehtiyotkorlik). Kiritilmagan hafta uchun ko'rsatilmaydi. */}
      {weekContent && (
        <div className="space-y-3">
          <Card className="space-y-1.5">
            <p className="text-sm font-bold text-text-primary">{dict.pregnancy.babyDevelopmentTitle}</p>
            <p className="text-sm text-text-secondary">{weekContent.babyDevelopment}</p>
          </Card>
          <Card className="space-y-1.5">
            <p className="text-sm font-bold text-text-primary">{dict.pregnancy.motherChangesTitle}</p>
            <p className="text-sm text-text-secondary">{weekContent.motherChanges}</p>
          </Card>
        </div>
      )}

      {/* Sog'liq ko'rsatkichlari — foydalanuvchi o'zi qayd etadigan tezkor-jurnal.
          PREG-UI-01: endi YIG'ILGAN holda ochiladi. O'lchandi (production,
          2026-09-27): bu to'rtta kartani bironta ham ayol ishlatmagan —
          `pregnancy_vitals` jadvalida NOLTA yozuv bor. Shunga qaramay ular
          ekranning butun bir sahifasini "Kiritilmagan" deb egallab turardi
          va ostidagi narsalarni pastga surib yuborardi.
          Funksiya olib tashlanmadi (kimdir boshlashi mumkin) — faqat
          standart holatda yopiq. Qiymat kiritilgan bo'lsa o'zi ochiladi. */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setShowVitals((v) => !v)}
          className="flex w-full items-center justify-between text-base font-bold text-text-primary"
        >
          {dict.pregnancy.vitalsTitle}
          <ChevronRight sx={{ fontSize: 18, transform: showVitals ? "rotate(90deg)" : undefined, transition: "transform 150ms" }} />
        </button>
        {showVitals && (
        <>
        <p className="-mt-1 text-xs text-text-muted">{dict.pregnancy.vitalsDisclaimer}</p>

        <div className="grid grid-cols-2 gap-3">
          {VITAL_TYPES.map((type) => {
            const Icon = VITAL_ICON[type];
            const latest = data.latestVitals[type];
            const tone = latest ? getVitalTone(type, latest.value) : null;
            return (
              <button
                key={type}
                type="button"
                className="text-left"
                onClick={() => {
                  setLoggingVital(type);
                  setVitalInput("");
                  setVitalError(null);
                }}
              >
                <Card interactive className="h-full space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full ${VITAL_TINT[type]}`}>
                      <Icon sx={{ fontSize: 18 }} />
                    </span>
                    {type === "weight" && data.weightDeltaKg !== null ? (
                      <Badge tone="primary">{dict.pregnancy.vitalsWeightChange(data.weightDeltaKg)}</Badge>
                    ) : (
                      tone && <Badge tone={tone === "normal" ? "success" : "warning"}>{tone === "normal" ? dict.pregnancy.vitalsNormal : dict.pregnancy.vitalsAttention}</Badge>
                    )}
                  </div>
                  {latest ? (
                    <p className="text-xl font-extrabold text-text-primary">
                      {latest.value} <span className="text-xs font-semibold text-text-secondary">{dict.pregnancy.vitalsUnits[type]}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-text-muted">{dict.pregnancy.vitalsEmpty}</p>
                  )}
                  <p className="text-xs font-medium text-text-secondary">{dict.pregnancy.vitalsLabels[type]}</p>
                </Card>
              </button>
            );
          })}
        </div>

        {loggingVital && (
          <Card className="space-y-3">
            <p className="font-semibold text-text-primary">
              {dict.pregnancy.vitalsAddTitle} — {dict.pregnancy.vitalsLabels[loggingVital]}
            </p>
            <input
              value={vitalInput}
              onChange={(e) => setVitalInput(e.target.value)}
              placeholder={dict.pregnancy.vitalsPlaceholders[loggingVital]}
              className="tap-target w-full rounded-2xl border border-border bg-surface px-4 text-text-primary outline-none focus:border-primary"
            />
            {vitalError && <p className="text-sm text-danger">{vitalError}</p>}
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setLoggingVital(null)} disabled={savingVital}>
                {dict.common.cancel}
              </Button>
              <Button className="flex-1" onClick={saveVital} disabled={savingVital || !vitalInput.trim()}>
                {dict.common.save}
              </Button>
            </div>
          </Card>
        )}
        </>
        )}
      </div>

      {/* PREG-SCHED-01 — navbatdagi MAJBURIY tekshiruv (SSV jadvali).
          Ilgari bu karta faqat ayol O'ZI kiritgan tashriflardan o'qirdi va
          production'da doim bo'sh turardi: `pregnancy_visits` jadvalida
          NOLTA yozuv bor. Shu bilan birga milliy jadval (10-14, 16-20,
          24-28, 28-32, 35-37 hafta) checklist'da ALLAQACHON hisoblangan —
          u shunchaki bu ekranda ko'rsatilmasdi.

          Aynan shu bizning Lalu va Flo'da yo'q ustunligimiz: kontent emas,
          MAJBURIY JADVAL. Shuning uchun u endi birinchi navbatda o'sha
          jadvaldan o'qiydi, ayolning shaxsiy tashrifi esa ikkinchi. */}
      {scheduled ? (
        <button type="button" className="w-full text-left" onClick={() => router.push("/tekshiruvlar")}>
          <Card interactive className="flex items-center gap-3">
            <span
              className={clsx(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                scheduled.overdue ? "bg-danger/10" : "bg-secondary/10"
              )}
            >
              <CalendarDays sx={{ fontSize: 20 }} className={scheduled.overdue ? "text-danger" : "text-secondary"} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-text-secondary">{dict.pregnancy.scheduledCheckupTitle}</p>
              <p className="font-bold text-text-primary">{dict.checklist.items[scheduled.type].title}</p>
              <p className={clsx("text-sm", scheduled.overdue ? "font-semibold text-danger" : "text-text-secondary")}>
                {scheduled.overdue
                  ? dict.pregnancy.scheduledCheckupOverdue
                  : scheduled.daysLeft === 0
                    ? dict.pregnancy.scheduledCheckupNow
                    : dict.pregnancy.nextCheckupDaysLeft(scheduled.daysLeft)}
              </p>
            </div>
            <ChevronRight sx={{ fontSize: 18 }} className="shrink-0 text-text-muted" />
          </Card>
        </button>
      ) : (
        <button type="button" className="w-full text-left" onClick={() => setAddingVisit(true)}>
          <Card interactive className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/10">
              <CalendarDays sx={{ fontSize: 20 }} className="text-secondary" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-text-secondary">{dict.pregnancy.nextCheckupTitle}</p>
              {nextVisit ? (
                <>
                  <p className="font-bold text-text-primary">{nextVisit.date}</p>
                  <p className="text-sm text-text-secondary">
                    {nextVisit.label} · {dict.pregnancy.nextCheckupDaysLeft(nextVisitDaysLeft ?? 0)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-text-muted">{dict.pregnancy.nextCheckupNone}</p>
              )}
            </div>
            <ChevronRight sx={{ fontSize: 18 }} className="shrink-0 text-text-muted" />
          </Card>
        </button>
      )}

      {status.trimester === 3 && (
        <Card className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-text-primary">{dict.pregnancy.kickCounterTitle}</p>
            <p className="text-sm text-text-secondary">{dict.pregnancy.kickCounterCount(data.kicksToday)}</p>
          </div>
          <Button
            onClick={async () => setData(await api.pregnancy.logKick())}
          >
            {dict.pregnancy.kickCounterButton}
          </Button>
        </Card>
      )}

      {/* PREG-SCHED-02 — MILLIY JADVALNING TO'LIQ RO'YXATI.
          Ayol butun yo'lni oldindan ko'rishi kerak, faqat keyingi qadamni
          emas: homiladorlikda "yana nima kutmoqda" degan savol doimiy va
          hozircha unga javob beradigan joy yo'q edi.

          Bu Lalu va Flo'da UMUMAN yo'q: ularda haftalik kontent bor, lekin
          O'ZBEKISTON protokoli bo'yicha majburiy jadval yo'q. */}
      {data.scheduledCheckups.length > 0 && (
        <div>
          <p className="mb-2 font-semibold text-text-primary">{dict.pregnancy.scheduleTitle}</p>
          <div className="space-y-2">
            {data.scheduledCheckups.map((item) => {
              const done = item.status === "done";
              const overdue = item.status === "overdue";
              return (
                <Card key={item.type} className="flex items-center gap-3 py-3">
                  <span
                    className={clsx(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      done ? "bg-success/15 text-success" : overdue ? "bg-danger/15 text-danger" : "bg-surface-muted text-text-muted"
                    )}
                    aria-hidden
                  >
                    {done ? "\u2713" : overdue ? "!" : "\u00b7"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={clsx("truncate text-sm font-semibold", done ? "text-text-muted line-through" : "text-text-primary")}>
                      {dict.checklist.items[item.type].title}
                    </p>
                    {item.dueDate && !done && (
                      <p className={clsx("text-xs", overdue ? "font-semibold text-danger" : "text-text-muted")}>
                        {formatDateDisplay(item.dueDate)}
                      </p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-text-muted">{dict.pregnancy.scheduleNote}</p>
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="font-semibold text-text-primary">{dict.pregnancy.visitsTitle}</p>
          {!addingVisit && (
            <Button variant="ghost" onClick={() => setAddingVisit(true)}>
              {dict.pregnancy.addVisitButton}
            </Button>
          )}
        </div>

        {addingVisit && (
          <Card className="mb-3 space-y-2">
            <input
              value={visitLabel}
              onChange={(e) => setVisitLabel(e.target.value)}
              placeholder={dict.pregnancy.addVisitButton}
              className="tap-target w-full rounded-2xl border border-border bg-surface px-4 text-text-primary outline-none focus:border-primary"
            />
            <DateWheelPicker
              value={visitDate}
              onChange={setVisitDate}
              monthLabels={dict.common.months}
              minYear={new Date().getFullYear() - 1}
              maxYear={new Date().getFullYear() + 1}
            />
            <input
              value={visitClinic}
              onChange={(e) => setVisitClinic(e.target.value)}
              placeholder={dict.clinics.title}
              className="tap-target w-full rounded-2xl border border-border bg-surface px-4 text-text-primary outline-none focus:border-primary"
            />
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setAddingVisit(false)}>
                {dict.common.cancel}
              </Button>
              <Button
                className="flex-1"
                disabled={!visitLabel || !visitDate || saving}
                onClick={async () => {
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
            </div>
          </Card>
        )}

        <div className="space-y-2">
          {data.visits.map((v) => (
            <Card key={v.id} className="flex items-center gap-3 py-3">
              <span className="bg-aurora-pregnancy flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
                <Stethoscope sx={{ fontSize: 20 }} className="text-white" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-text-primary">{v.label}</p>
                <p className="text-sm text-text-secondary">
                  {formatDateDisplay(v.date)}
                  {v.clinicName ? ` · ${v.clinicName}` : ""}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <PregnancyAlbum currentWeek={status.currentWeek} />

      {/* PREG-END-01 — homiladorlik tugaganini aytish yo'li.
          Ilgari bu yo'l UMUMAN yo'q edi: ilova faqat TAXMINIY sanaga
          tayanardi. Muddatidan oldin tug'gan ayol haftalab noto'g'ri hafta
          ko'rardi; homiladorlikni yo'qotgan ayolga esa "bolangiz endi
          bodring kattaligida" deb yozishda davom etardi — taxminiy
          sanadan 14 kun o'tgunga qadar, ya'ni oylab.

          Bir ayol buni bizga FIKR QUTISIGA yozgan ("Homilador edim
          tugdim") — chunki boshqa joy yo'q edi.

          Tugma ATAYLAB kichkina va ekranning eng pastida: u kundalik
          harakat emas, lekin kerak bo'lganda topilishi shart. */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={() => setEndingOpen(true)}
          className="tap-target px-4 text-sm font-semibold text-text-muted underline decoration-text-muted/30 underline-offset-4"
        >
          {dict.pregnancy.endedLink}
        </button>
      </div>

      {/* PREG-HERO-01 — "Batafsil" oynasi. Flo referensida bu pastdan
          chiqadigan varaq: katta rasm, hafta, va shu hafta haqidagi matn.
          Bizda rasm allaqachon hero'da, shuning uchun bu yerda faqat
          mazmun — takrorlash ortiqcha bo'lardi. */}
      <Dialog
        open={showWeekDetails}
        onClose={() => setShowWeekDetails(false)}
        fullWidth
        maxWidth="xs"
        slotProps={{ paper: { sx: { borderRadius: "24px", margin: 2 } } }}
      >
        <DialogContent>
          <p className="text-lg font-bold text-text-primary">
            {dict.pregnancy.weekDayLabel(status.currentWeek, status.currentDay)}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {showSizeComparison ? dict.pregnancy.sizeComparison(sizeLabel) : dict.pregnancy.earlyWeekNote}
          </p>
          {weekContent ? (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm font-bold text-text-primary">{dict.pregnancy.babyDevelopmentTitle}</p>
                <p className="mt-1 text-sm leading-relaxed text-text-secondary">{weekContent.babyDevelopment}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">{dict.pregnancy.motherChangesTitle}</p>
                <p className="mt-1 text-sm leading-relaxed text-text-secondary">{weekContent.motherChanges}</p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-text-muted">{dict.pregnancy.weekContentMissing}</p>
          )}
          <button
            type="button"
            onClick={() => setShowWeekDetails(false)}
            className="tap-target mt-5 w-full rounded-2xl bg-surface-muted text-sm font-semibold text-text-secondary"
          >
            {dict.common.close}
          </button>
        </DialogContent>
      </Dialog>

      <Dialog
        open={endingOpen}
        onClose={() => setEndingOpen(false)}
        fullWidth
        maxWidth="xs"
        slotProps={{ paper: { sx: { borderRadius: "24px", margin: 2 } } }}
      >
        <DialogContent>
          <p className="text-lg font-bold leading-snug text-text-primary">{dict.pregnancy.endedTitle}</p>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">{dict.pregnancy.endedHint}</p>
          <div className="mt-5 space-y-2">
            {(["birth", "loss"] as const).map((outcome) => (
              <button
                key={outcome}
                type="button"
                disabled={endingSaving}
                onClick={() => void endPregnancy(outcome)}
                className="tap-target w-full rounded-2xl border border-border bg-surface px-4 py-3 text-left text-base font-semibold text-text-primary active:scale-[0.99] disabled:opacity-50"
              >
                {outcome === "birth" ? dict.pregnancy.endedBirth : dict.pregnancy.endedLoss}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setEndingOpen(false)}
            disabled={endingSaving}
            className="tap-target mt-4 w-full text-sm font-semibold text-text-muted"
          >
            {dict.common.cancel}
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
