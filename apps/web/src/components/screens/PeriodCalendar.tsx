"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Close, ArrowUpward, ChevronLeft, ChevronRight, Add, CheckOutlined } from "@mui/icons-material";
import type { CycleLog, CycleResponse } from "@mammoai/shared";
import { DEFAULT_PERIOD_LENGTH, FLOW_EMOJI, MOOD_EMOJI, SYMPTOM_EMOJI, getCyclePhase, localDateStr } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { Portal } from "@/components/Portal";
import { Emoji } from "@/components/Emoji";
import { PhaseCard } from "@/components/PhaseCard";

/**
 * CAL-05 — to'liq ekranli kalendar. Ikki rejim, foydalanuvchi so'rovi bo'yicha
 * (2026-09-21, oldingi versiyani real qurilmada sinab ko'rgach):
 *
 *  • ODDIY rejim — kun bosilsa FAQAT ma'lumot ko'rsatiladi (sana, sikl kuni,
 *    o'sha kunga qayd etilganlar). Hech narsa yozilmaydi.
 *
 *  • TAHRIRLASH rejimi ("Hayz sanalarini tahrirlash" tugmasi) — har bir kunga
 *    bosish FAQAT O'SHA kunni belgilaydi/bekor qiladi. Oldin bitta bosish
 *    butun 5 kunlik davrni belgilab yoki o'chirib yuborardi — foydalanuvchi
 *    buni "bir danigi" (bir zumda hammasi) deb to'g'ri tanqid qildi.
 *    O'zgarishlar "Saqlash" bosilgunicha FAQAT xotirada turadi; "Bekor
 *    qilish" ularni butunlay tashlab yuboradi.
 *
 * Bashorat (nuqtali kunlar) endi bir necha oy oldinga chiziladi —
 * `data.forecast` (CYCLE-ALGO-16); ilgari faqat keyingi bitta sikl bor edi va
 * kalendar bir oydan nariga hech narsa ko'rsatmasdi.
 */

const MONTHS_BACK = 12;
const MONTHS_FORWARD = 12;

// CAL-03: "ovulation" qo'shildi. `forecast[].ovulationDay` allaqachon
// hisoblanardi, lekin hech qayerda CHIZILMASDI — foydalanuvchi buni sezdi
// ("why ovulation days arent added to the calendar"). U unumdor oynaning eng
// muhim kuni, shuning uchun oynadan ajralib turishi kerak.
type DayState = "period" | "predicted" | "ovulation" | "fertile" | null;

/** Noaniqlik shu chegaradan oshsa, bashorat kalendarda XIRAROQ chiziladi —
 * foydalanuvchi uzoq oydagi sanaga yaqin oydagidek ishonmasligi uchun. */
const FAINT_UNCERTAINTY_DAYS = 3;

interface PeriodCalendarProps {
  data: CycleResponse;
  today: string;
  /** Tahrirlash rejimida "Saqlash" — belgilangan/bekor qilingan kunlar. */
  onSavePeriodDiff: (added: string[], removed: string[]) => Promise<void>;
  /** Kun ma'lumoti varag'idagi "+" — to'liq yozuv formasini ochadi. */
  onOpenLog: (date: string) => void;
  /** TODAY-06: bosh ekrandagi "Hayz belgilash" tugmasi kalendarni TO'G'RIDAN-
   * TO'G'RI tahrirlash rejimida ochadi (foydalanuvchi so'rovi) — kalendar
   * ikonkasi esa oddiy ko'rish rejimida. */
  initialEditing?: boolean;
  onClose: () => void;
}

export function PeriodCalendar({
  data,
  today,
  onSavePeriodDiff,
  onOpenLog,
  initialEditing = false,
  onClose,
}: PeriodCalendarProps) {
  const { dict } = useI18n();
  const todayDate = useMemo(() => new Date(today + "T00:00:00"), [today]);
  /** Ayolning O'Z hayz davomiyligi — avtomatik to'ldirish shunga qarab
   * bo'ladi. Manbalar tartibi MUHIM: avval `prediction` (u `cycle_logs`dan
   * O'RGANILGAN qiymat), keyin onboarding javobi, oxirida standart 5.
   * `cycle_settings` onboarding'dan keyin hech qachon yangilanmaydi — unga
   * tayanilsa, hayzi doim 6 kun davom etadigan ayolda ham abadiy 5 qolardi. */
  const periodLength =
    data.prediction?.averagePeriodLength || data.settings.averagePeriodLength || DEFAULT_PERIOD_LENGTH;
  const [view, setView] = useState<"month" | "year">("month");
  const [year, setYear] = useState(todayDate.getFullYear());
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState(initialEditing);
  const [draft, setDraft] = useState<Set<string>>(
    // Tahrirlash rejimida ochilsa, boshlang'ich holat darhol kerak.
    () => (initialEditing ? new Set(data.logs.filter((l) => l.flow).map((l) => l.date)) : new Set())
  );
  const [saving, setSaving] = useState(false);
  /** CAL-01: oxirgi avtomatik to'ldirishda qo'shilgan kunlar — TARTIBI bilan.
   * Faqat animatsiya uchun: har bir kun o'z navbatida "chiqadi" (globals.css
   * `.day-fill`), shuning uchun kechikish shu ro'yxatdagi o'rniga bog'liq. */
  const [fillOrder, setFillOrder] = useState<string[]>([]);
  const [showBackToToday, setShowBackToToday] = useState(false);
  const todayMonthRef = useRef<HTMLDivElement | null>(null);
  const monthRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const pendingScrollMonth = useRef<number | null>(null);
  const didInitialScroll = useRef(false);

  /** Haqiqatan qayd etilgan hayz kunlari — tahrirlashning boshlang'ich holati. */
  const loggedPeriodDates = useMemo(
    () => new Set(data.logs.filter((l) => l.flow).map((l) => l.date)),
    [data.logs]
  );

  /** Bashorat qilingan kunlar — BIR NECHA sikl oldinga (CYCLE-ALGO-16).
   * Set sifatida oldindan yig'iladi: kalendarda ~750 ta katak bor, har biri
   * uchun butun ro'yxatni aylanib chiqish sezilarli sekinlashuv berardi. */
  const { predictedDates, fertileDates, ovulationDates, faintDates } = useMemo(() => {
    const predicted = new Set<string>();
    const fertile = new Set<string>();
    const ovulation = new Set<string>();
    const faint = new Set<string>();
    const push = (target: Set<string>, from: string, to: string, alsoFaint: boolean) => {
      for (let d = from; d <= to; d = addDays(d, 1)) {
        target.add(d);
        if (alsoFaint) faint.add(d);
      }
    };
    // CYCLE-ALGO-18: hali birorta sikl aniqlanmagan bo'lsa ("insufficient" —
    // odatda faqat onboarding'da bitta sana kiritilgan) unumdor oyna
    // KO'RSATILMAYDI. Sabab: bunday holatda noaniqlik ~6 kun, ya'ni oyna
    // 19 kunga cho'ziladi — siklning uchdan ikki qismi. Bu ma'lumot bermaydi,
    // faqat kalendarni xira kulrang qilib to'ldiradi (foydalanuvchi: "why
    // some dates are dark and some are grey"), va homiladorlikka
    // tayyorlanayotgan yoki aksincha saqlanayotgan ayolni chalg'itadi.
    const showFertile = data.prediction?.confidence !== "insufficient";
    for (const c of data.forecast) {
      const uncertain = c.uncertaintyDays > FAINT_UNCERTAINTY_DAYS;
      push(predicted, c.periodStart, c.periodEnd, uncertain);
      if (showFertile) {
        push(fertile, c.fertileWindowStart, c.fertileWindowEnd, uncertain);
        // Ovulyatsiya unumdor oyna ICHIDA — u bilan bir xil shart ostida
        // ko'rsatiladi (ishonch yetarli bo'lmaganda ikkalasi ham chiqmaydi).
        ovulation.add(c.ovulationDay);
        if (uncertain) faint.add(c.ovulationDay);
      }
    }
    return { predictedDates: predicted, fertileDates: fertile, ovulationDates: ovulation, faintDates: faint };
  }, [data.forecast, data.prediction?.confidence]);

  const months = useMemo(
    () =>
      Array.from(
        { length: MONTHS_BACK + MONTHS_FORWARD + 1 },
        (_, i) => new Date(todayDate.getFullYear(), todayDate.getMonth() - MONTHS_BACK + i, 1)
      ),
    [todayDate]
  );

  function attachTodayMonth(el: HTMLDivElement | null) {
    todayMonthRef.current = el;
    if (!el || didInitialScroll.current) return;
    didInitialScroll.current = true;
    // rAF — element biriktirildi, lekin joylashuv hali yakunlanmagan bo'lishi
    // mumkin. (Effekt ishlatib bo'lmaydi: Portal mazmunni bir takt keyin
    // chiqaradi, ya'ni effekt paytida element hali DOM'da yo'q edi — kalendar
    // shu sababli bir yil oldingi oydan ochilib qolgandi.)
    requestAnimationFrame(() => el.scrollIntoView({ block: "start" }));
  }

  useEffect(() => {
    if (view !== "month" || pendingScrollMonth.current === null) return;
    const key = `${year}-${pendingScrollMonth.current}`;
    pendingScrollMonth.current = null;
    monthRefs.current[key]?.scrollIntoView({ block: "start" });
  }, [view, year]);

  function dayState(date: string): DayState {
    // Tahrirlashda faqat IKKI holat ko'rinadi — belgilangan yoki yo'q;
    // unumdor oyna kabi qo'shimcha ranglar tanlovni chalkashtirardi.
    if (editing) return draft.has(date) ? "period" : predictedDates.has(date) ? "predicted" : null;
    if (loggedPeriodDates.has(date)) return "period";
    if (predictedDates.has(date)) return "predicted";
    // Ovulyatsiya unumdor oynadan USTUN — aks holda u oyna ichida yo'qolib
    // ketardi (u ham "fertile", lekin oynaning eng muhim kuni).
    if (ovulationDates.has(date)) return "ovulation";
    if (fertileDates.has(date)) return "fertile";
    return null;
  }

  /** CAL-01 (foydalanuvchi so'rovi): hayz boshlangan kunga bosilganda qolgan
   * kunlarni ham QO'LDA belgilash shart emas — ayolning o'z hayz davomiyligi
   * bo'yicha avtomatik to'ldiriladi.
   *
   * MUHIM cheklov — bugundan nariga O'TMAYDI. `cycle_logs`ga yozilgan "flow"
   * qayd "shu kuni hayz bo'lgan" degani; kelasi kunlar uchun buni yozish
   * ilova bilmagan narsasini da'vo qilishi bo'lardi (aynan shu muammoni
   * 0-bosqichda bosh sahifadan olib tashladik). Kelajakdagi kunlar allaqachon
   * BASHORAT sifatida (punktir gardish) ko'rinadi.
   *
   * Belgilangan kunga bosish — faqat O'SHA kunni olib tashlaydi (butun
   * guruhni emas): ayol davomiylikni bir kunga qisqartira olishi kerak. */
  function handleDayTap(date: string) {
    if (!editing) {
      setSelected(date);
      return;
    }
    if (draft.has(date)) {
      setFillOrder([]);
      setDraft((cur) => {
        const next = new Set(cur);
        next.delete(date);
        return next;
      });
      return;
    }

    // CAL-02: avtomatik to'ldirish faqat YANGI hayz boshlanganda ishlaydi.
    // Agar bosilgan kun allaqachon belgilangan kunga TUTASH bo'lsa, ayol
    // mavjud hayzni uzaytiryapti (masalan odatda 5 kun, bu safar 6 kun
    // ketdi) — bunday holatda faqat o'sha bitta kun qo'shiladi. Aks holda
    // 6-kunni qo'shmoqchi bo'lgan ayolga ilova yana 5 kun belgilab berardi.
    const extendsExistingPeriod = draft.has(addDays(date, -1)) || draft.has(addDays(date, 1));

    const added: string[] = [];
    if (extendsExistingPeriod) {
      added.push(date);
    } else {
      for (let i = 0; i < periodLength; i++) {
        const d = addDays(date, i);
        if (d > today) break;
        if (!draft.has(d)) added.push(d);
      }
      // Hamma kun allaqachon belgilangan bo'lsa ham boshlanish kuni qo'shilsin.
      if (added.length === 0) added.push(date);
    }
    setFillOrder(added);
    setDraft((cur) => {
      const next = new Set(cur);
      for (const d of added) next.add(d);
      return next;
    });
  }

  /** Animatsiya kechikishi — kun avtomatik to'ldirishda nechanchi bo'lsa. */
  function fillDelayMs(date: string): number | null {
    const i = fillOrder.indexOf(date);
    return i === -1 ? null : i * 90;
  }

  function startEditing() {
    setSelected(null);
    setFillOrder([]);
    setDraft(new Set(loggedPeriodDates));
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    try {
      const added = [...draft].filter((d) => !loggedPeriodDates.has(d));
      const removed = [...loggedPeriodDates].filter((d) => !draft.has(d));
      if (added.length || removed.length) await onSavePeriodDiff(added, removed);
      if (initialEditing) onClose();
      else setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  const selectedLog = selected ? (data.logs.find((l) => l.date === selected) ?? null) : null;
  const showMonthList = view === "month" || editing;

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <div className="shrink-0 border-b border-border bg-surface" style={{ paddingTop: "var(--tg-safe-area-top)" }}>
          <div className="mx-auto flex w-full max-w-md items-center gap-2 px-3 py-3">
            <button
              type="button"
              onClick={editing && !initialEditing ? () => setEditing(false) : onClose}
              aria-label={dict.common.close}
              className="tap-target flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-primary active:scale-95"
            >
              <Close sx={{ fontSize: 26 }} />
            </button>

            {editing ? (
              <p className="mx-auto text-base font-bold text-text-primary">{dict.cycle.calEditPeriod}</p>
            ) : (
              <div className="mx-auto flex rounded-full bg-surface-muted p-1">
                {(["month", "year"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setView(v)}
                    aria-pressed={view === v}
                    className={clsx(
                      "tap-target rounded-full px-5 py-1.5 text-sm font-bold transition",
                      view === v ? "bg-surface text-text-primary shadow" : "text-text-secondary"
                    )}
                  >
                    {v === "month" ? dict.cycle.calMonthTab : dict.cycle.calYearTab}
                  </button>
                ))}
              </div>
            )}

            <span className="h-10 w-10 shrink-0" />
          </div>

          {editing && (
            <p className="mx-auto max-w-md px-4 pb-2 text-center text-xs text-text-secondary">
              {dict.cycle.calEditHint(periodLength)}
            </p>
          )}

          {showMonthList ? (
            <div className="mx-auto grid w-full max-w-md grid-cols-7 px-3 pb-2">
              {dict.common.weekdaysShort.map((w, i) => (
                <span key={i} className="text-center text-xs font-semibold text-text-muted">
                  {w}
                </span>
              ))}
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-md items-center justify-center gap-6 px-4 pb-3">
              <button
                type="button"
                onClick={() => setYear((y) => y - 1)}
                aria-label={String(year - 1)}
                className="tap-target flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-text-primary active:scale-95"
              >
                <ChevronLeft sx={{ fontSize: 20 }} />
              </button>
              <span className="min-w-[4ch] text-center text-lg font-extrabold text-text-primary">{year}</span>
              <button
                type="button"
                onClick={() => setYear((y) => y + 1)}
                aria-label={String(year + 1)}
                className="tap-target flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-text-primary active:scale-95"
              >
                <ChevronRight sx={{ fontSize: 20 }} />
              </button>
            </div>
          )}
        </div>

        {/* YAGONA skroll maydoni — ichida boshqa `overflow` yo'q, `body` esa
            Portal tomonidan qotirilgan. Ilgari ikkalasi bir vaqtda skroll
            bo'lib, foydalanuvchi "ikkita skroll" deb xabar bergan edi. */}
        <div onScroll={() => setShowBackToToday(true)} className="relative flex-1 overflow-y-auto overscroll-contain">
          {showMonthList ? (
            <div className="mx-auto w-full max-w-md px-3 pb-10 pt-2">
              {months.map((m) => {
                const key = `${m.getFullYear()}-${m.getMonth()}`;
                const isTodayMonth =
                  m.getMonth() === todayDate.getMonth() && m.getFullYear() === todayDate.getFullYear();
                return (
                  <div
                    key={key}
                    ref={(el) => {
                      monthRefs.current[key] = el;
                      if (isTodayMonth) attachTodayMonth(el);
                    }}
                    className="scroll-mt-2 pb-6"
                  >
                    <p className="py-3 text-center text-lg font-bold text-text-primary">
                      {dict.common.months[m.getMonth()]}
                      {m.getFullYear() !== todayDate.getFullYear() ? ` ${m.getFullYear()}` : ""}
                    </p>
                    <MonthGrid
                      monthDate={m}
                      today={today}
                      todayLabel={dict.cycle.heroTodayLabel}
                      selected={selected}
                      editing={editing}
                      dayState={dayState}
                      isFaint={(d) => faintDates.has(d)}
                      onDayTap={handleDayTap}
                      fillDelayMs={fillDelayMs}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mx-auto grid w-full max-w-md grid-cols-3 gap-3 px-3 pb-10 pt-3">
              {Array.from({ length: 12 }, (_, i) => new Date(year, i, 1)).map((m) => (
                <button
                  key={m.getMonth()}
                  type="button"
                  onClick={() => {
                    pendingScrollMonth.current = m.getMonth();
                    setView("month");
                  }}
                  className="tap-target rounded-2xl bg-surface p-2 shadow-sm ring-1 ring-border/60 transition active:scale-95"
                >
                  <p
                    className={clsx(
                      "pb-1.5 text-center text-xs font-bold",
                      m.getMonth() === todayDate.getMonth() && year === todayDate.getFullYear()
                        ? "text-primary"
                        : "text-text-primary"
                    )}
                  >
                    {dict.common.months[m.getMonth()]}
                  </p>
                  <MiniMonth monthDate={m} today={today} dayState={dayState} />
                </button>
              ))}
            </div>
          )}

          {showBackToToday && showMonthList && (
            <div className="pointer-events-none sticky bottom-4 flex justify-center">
              <button
                type="button"
                onClick={() => todayMonthRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="tap-target pointer-events-auto flex items-center gap-1.5 rounded-full bg-surface px-5 py-2.5 text-sm font-bold text-text-primary shadow-lg ring-1 ring-border/60"
              >
                <ArrowUpward sx={{ fontSize: 18 }} />
                {dict.cycle.calBackToToday}
              </button>
            </div>
          )}
        </div>

        {/* Pastdagi doimiy panel: tahrirlashda — Bekor/Saqlash, aks holda
            tahrirlashga kirish tugmasi. */}
        <div
          className="shrink-0 border-t border-border bg-surface px-4 pt-3"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + var(--tg-safe-area-bottom) + 12px)" }}
        >
          {editing ? (
            <div className="mx-auto flex w-full max-w-md items-center gap-3">
              <button
                type="button"
                onClick={initialEditing ? onClose : () => setEditing(false)}
                disabled={saving}
                className="tap-target flex-1 rounded-full py-3.5 text-base font-bold text-text-secondary disabled:opacity-60"
              >
                {dict.common.cancel}
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="tap-target flex-1 rounded-full bg-primary py-3.5 text-base font-bold text-white active:scale-[0.99] disabled:opacity-60"
              >
                {dict.common.save}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={startEditing}
              className="tap-target mx-auto flex w-full max-w-md items-center justify-center rounded-full bg-primary py-4 text-base font-bold text-white transition active:scale-[0.99]"
            >
              {dict.cycle.calEditPeriod}
            </button>
          )}
        </div>

        {/* Kun ma'lumoti — faqat ODDIY rejimda, hech narsa yozmaydi. */}
        {selected && !editing && (
          <DayDetailSheet
            date={selected}
            log={selectedLog}
            cycleDay={cycleDayFor(selected, data)}
            phase={phaseFor(selected, data)}
            onAdd={() => onOpenLog(selected)}
            onClose={() => setSelected(null)}
          />
        )}
      </div>
    </Portal>
  );
}

function DayDetailSheet({
  date,
  log,
  cycleDay,
  phase,
  onAdd,
  onClose,
}: {
  date: string;
  log: CycleLog | null;
  cycleDay: number | null;
  /** TODAY-06: foydalanuvchi so'rovi — kun bosilganda u QAYSI FAZAda ekani
   * ham ko'rinsin, faqat simptom qatori emas. */
  phase: ReturnType<typeof getCyclePhase> | null;
  onAdd: () => void;
  onClose: () => void;
}) {
  const { dict } = useI18n();
  const d = new Date(date + "T00:00:00");
  const hasAnything = !!log && (!!log.flow || !!log.mood || log.symptoms.length > 0);

  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-end bg-black/30" onClick={onClose}>
      <div
        className="animate-fade-in-up rounded-t-[28px] bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + var(--tg-safe-area-bottom) + 20px)" }}
      >
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-start justify-between gap-3">
            <p className="text-2xl font-extrabold text-text-primary">
              {`${d.getDate()}-${dict.common.months[d.getMonth()]}`}
              {cycleDay !== null && <span className="text-text-secondary"> · {dict.cycle.calCycleDay(cycleDay)}</span>}
            </p>
            <button
              type="button"
              onClick={onClose}
              aria-label={dict.common.close}
              className="tap-target flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-secondary active:scale-95"
            >
              <Close sx={{ fontSize: 16 }} />
            </button>
          </div>

          {phase && (
            <div className="mt-4">
              <PhaseCard phase={phase} />
            </div>
          )}

          <p className="mt-4 text-lg font-bold text-text-primary">{dict.cycle.calSymptomsTitle}</p>
          <div className="mt-2 flex items-center gap-3 rounded-2xl bg-surface-muted p-3">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              {hasAnything && log ? (
                <>
                  {log.flow && <Emoji e={FLOW_EMOJI[log.flow]} size={26} />}
                  {log.mood && <Emoji e={MOOD_EMOJI[log.mood]} size={26} />}
                  {log.symptoms.slice(0, 5).map((s) => (
                    <Emoji key={s} e={SYMPTOM_EMOJI[s]} size={26} />
                  ))}
                </>
              ) : (
                <p className="text-sm text-text-secondary">{dict.cycle.calNothingLogged}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onAdd}
              aria-label={dict.cycle.calAddLog}
              className="tap-target flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-white active:scale-95"
            >
              <Add sx={{ fontSize: 26 }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MonthGrid({
  monthDate,
  today,
  todayLabel,
  selected,
  editing,
  dayState,
  isFaint,
  onDayTap,
  fillDelayMs,
}: {
  monthDate: Date;
  today: string;
  todayLabel: string;
  selected: string | null;
  editing: boolean;
  dayState: (date: string) => DayState;
  /** Uzoq (noaniqroq) bashorat — xiraroq chiziladi. */
  isFaint: (date: string) => boolean;
  onDayTap: (date: string) => void;
  /** CAL-01: avtomatik to'ldirilgan kun uchun animatsiya kechikishi (ms),
   * yoki `null` — bu kun avtomatik to'ldirilmagan. */
  fillDelayMs: (date: string) => number | null;
}) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return (
    <div className="grid grid-cols-7 gap-y-1">
      {Array.from({ length: firstWeekday }, (_, i) => (
        <span key={`pad-${i}`} />
      ))}
      {Array.from({ length: daysInMonth }, (_, i) => {
        const date = localDateStr(new Date(year, month, i + 1));
        const state = dayState(date);
        const isToday = date === today;
        const delay = fillDelayMs(date);
        return (
          <button
            key={date}
            type="button"
            onClick={() => onDayTap(date)}
            className="tap-target flex flex-col items-center rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {/* Yorliq maydoni balandligi DOIM band — aks holda "BUGUN"
                yorlig'i bor qator qolganlardan balandroq bo'lib qolardi. */}
            <span className="flex h-3.5 items-center text-[9px] font-bold uppercase tracking-wide text-text-primary">
              {isToday ? todayLabel : ""}
            </span>
            <span
              // CAL-01: avtomatik to'ldirilgan kunlar BIR VAQTDA emas,
              // birin-ketin "chiqadi" — shu orqali ayol qaysi kunlar
              // qo'shilganini ko'zi bilan kuzatib boradi. `key`ga kechikish
              // qo'shilgan: aks holda React bir xil elementni qayta
              // ishlatib, animatsiyani qaytadan ishga tushirmasdi.
              key={delay === null ? "d" : `d-${delay}`}
              style={delay === null ? undefined : { animationDelay: `${delay}ms` }}
              className={clsx(
                "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition sm:h-10 sm:w-10 sm:text-base",
                delay !== null && "day-fill",
                state === "period" && "bg-primary text-white",
                state === "predicted" && "border-2 border-dashed border-primary text-primary",
                // Ovulyatsiya — to'liq aksent halqa. Unumdor oyna faqat
                // rangli matn, shuning uchun ular chalkashmaydi.
                state === "ovulation" && "ring-2 ring-accent text-accent",
                state === "fertile" && "text-accent",
                // Tahrirlashda BELGILANMAGAN kunlar ham gardishli bo'ladi —
                // "bu yerga bosish mumkin" degan aniq ishora (oddiy rejimda
                // bunday gardish yo'q, aks holda kalendar shovqinli ko'rinadi).
                !state && editing && "border-2 border-border text-text-primary",
                !state && !editing && "text-text-primary",
                isToday && !editing && "ring-2 ring-text-primary/35",
                selected === date && !editing && "ring-2 ring-primary",
                // Noaniqligi katta bashorat — xiraroq (CYCLE-ALGO-16).
                state !== "period" && isFaint(date) && "opacity-45"
              )}
            >
              {editing && state === "period" ? <CheckOutlined sx={{ fontSize: 20 }} /> : i + 1}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function MiniMonth({
  monthDate,
  today,
  dayState,
}: {
  monthDate: Date;
  today: string;
  dayState: (date: string) => DayState;
}) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return (
    <div className="grid grid-cols-7 gap-[3px]">
      {Array.from({ length: firstWeekday }, (_, i) => (
        <span key={`pad-${i}`} className="h-2" />
      ))}
      {Array.from({ length: daysInMonth }, (_, i) => {
        const date = localDateStr(new Date(year, month, i + 1));
        const state = dayState(date);
        return (
          <span
            key={date}
            className={clsx(
              "h-2 w-2 rounded-full",
              state === "period" && "bg-primary",
              state === "predicted" && "bg-primary/35",
              state === "ovulation" && "bg-accent",
              state === "fertile" && "bg-accent/50",
              !state && "bg-border",
              date === today && "ring-2 ring-text-primary/40"
            )}
          />
        );
      })}
    </div>
  );
}

/** CYCLE-ALGO-23: sikl kuni va faza BASHORAT bilan bir xil qiymatlardan
 * hisoblanadi.
 *
 * Ilgari bu yerda xom `cycle_settings` (onboarding javobi) ishlatilardi,
 * katakchalarning RANGI esa `data.forecast`dan — ya'ni `cycle_logs`dan
 * o'rganilgan qiymatlardan — kelardi. Ikki manba mos kelmaganda bitta kun
 * haqida ikki xil gap aytilardi: katakcha "bashorat qilingan hayz" deb
 * chizilgan, uni bosganda ochilgan kartada esa "Ovulyatsiya" yozilgan
 * (foydalanuvchi ko'rgan holat: 13-oktabr, "Sikl 15-kuni · Ovulyatsiya",
 * holbuki o'sha kun bashorat qilingan hayzning birinchi kuni edi). */
function effectiveCycleParams(data: CycleResponse) {
  return {
    start: data.prediction?.lastPeriodStart ?? data.settings.lastPeriodStart,
    cycleLength: data.prediction?.averageCycleLength || data.settings.averageCycleLength || 28,
    periodLength: data.prediction?.averagePeriodLength || data.settings.averagePeriodLength || DEFAULT_PERIOD_LENGTH,
    // CYCLE-ALGO-24: ovulyatsiya o'rni — bashorat bilan bir xil.
    lutealPhaseDays: data.prediction?.lutealPhaseDays,
  };
}

function cycleDayFor(date: string, data: CycleResponse): number | null {
  const { start, cycleLength } = effectiveCycleParams(data);
  if (!start) return null;
  const diff = Math.round((new Date(date).getTime() - new Date(start).getTime()) / 86400000);
  if (diff < 0) return null;
  return (diff % cycleLength) + 1;
}

/** Berilgan kun uchun sikl fazasi — sikl kuni ma'lum bo'lsa. */
function phaseFor(date: string, data: CycleResponse): ReturnType<typeof getCyclePhase> | null {
  const day = cycleDayFor(date, data);
  if (day === null) return null;
  const { cycleLength, periodLength, lutealPhaseDays } = effectiveCycleParams(data);
  return getCyclePhase(day, cycleLength, periodLength, lutealPhaseDays);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
