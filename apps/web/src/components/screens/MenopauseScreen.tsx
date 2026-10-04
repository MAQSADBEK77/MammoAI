"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import type { CycleLog, FlowLevel, Mood, Symptom } from "@mammoai/shared";
import {
  DAILY_SYMPTOMS,
  localDateStr,
  symptomOptionsForGoal,
  MRS_DOMAIN_MAX,
  MRS_ITEMS,
  MRS_TOTAL_MAX,
  resolveMenopauseStage,
  scoreMrs,
  shouldSeeDoctorForMenopause,
  type MenopauseAssessment,
  type MenopauseStage,
  type MrsDomain,
  type MrsItemId,
  type MrsScore,
} from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { Card, LoadingSpinner, ScreenHeader } from "@/components/ui";
import { LogSheet } from "@/components/screens/LogSheet";

/**
 * MENO-02 — klimaks rejimining ekrani.
 *
 * Ilgari bu rejim bitta kartadan iborat edi: "sikl tartibsiz bo'lishi
 * mumkin". Ya'ni ayoldan sikl kuzatuvi OLIB QO'YILGAN, lekin o'rniga
 * hech narsa berilmagan. Holbuki bu davr 7-10 yil davom etadi.
 *
 * Ekran uchta savolga javob beradi:
 *   1. Men qayerdaman? — bosqich (perimenopauza/menopauza/postmenopauza)
 *   2. Ahvolim qanday? — MRS bali va uning dinamikasi
 *   3. Nima qilay? — shifokor yoki skrining
 *
 * Eng tepada esa qon ketish haqidagi ogohlantirish turadi: menopauzadan
 * keyin u bachadon saratonining eng erta belgisi bo'lishi mumkin.
 */
const STAGE_LABEL: Record<MenopauseStage, { title: keyof Labels; hint: keyof Labels }> = {
  premenopause: { title: "stagePre", hint: "stageHintPeri" },
  perimenopause: { title: "stagePeri", hint: "stageHintPeri" },
  menopause: { title: "stageMeno", hint: "stageHintMeno" },
  postmenopause: { title: "stagePost", hint: "stageHintPost" },
};

type Labels = ReturnType<typeof useI18n>["dict"]["menopause"];

const FLOW_LEVELS: FlowLevel[] = ["spotting", "light", "medium", "heavy"];
const MOODS: Mood[] = ["happy", "calm", "tired", "sad", "irritable", "anxious"];

/** Natija qaysi og'irlik oralig'ida turganini KO'RSATADIGAN chiziq.
 *  Raqamning o'zi ("22") ayolga hech narsa demaydi — chegaralar aytadi. */
function SeverityBar({ total, lowLabel, highLabel }: { total: number; lowLabel: string; highLabel: string }) {
  const pct = Math.min(100, (total / MRS_TOTAL_MAX) * 100);
  return (
    <div className="mt-2">
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
        <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${pct}%` }} />
        {/* Og'irlik chegaralari: 5 / 9 / 17 */}
        {[5, 9, 17].map((edge) => (
          <span
            key={edge}
            className="absolute top-0 h-full w-px bg-surface/50"
            style={{ left: `${(edge / MRS_TOTAL_MAX) * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] font-medium text-text-muted">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

function DomainRow({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-28 shrink-0 text-[11px] font-semibold text-text-secondary">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
        <div className="h-full rounded-full bg-primary/70" style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right text-[11px] font-bold text-text-primary">
        {value}/{max}
      </span>
    </div>
  );
}

export function MenopauseScreen() {
  const { dict } = useI18n();
  const t = dict.menopause;
  const router = useRouter();
  const { onboardingProfile } = useSession();

  const [assessments, setAssessments] = useState<MenopauseAssessment[] | null>(null);
  const [monthsSince, setMonthsSince] = useState<number | null>(null);
  const [testing, setTesting] = useState(false);
  const [answers, setAnswers] = useState<MrsScore>({});
  const [saving, setSaving] = useState(false);

  /* MENO-05: bu rejimda kunlik qayd oynasi UMUMAN yo'q edi — uni
     CycleScreen ushlab turadi, u esa klimaks rejimida chizilmaydi.
     Natijada "Bugungi belgilar" tugmasi /tsikl'ga olib borardi, u esa
     /asosiy'ga qaytaradi, ya'ni tugma o'z-o'ziga aylanardi. Endi oyna
     shu ekranning o'zida. */
  const [logging, setLogging] = useState(false);
  const [logDate, setLogDate] = useState<string>(() => localDateStr());
  const [logs, setLogs] = useState<CycleLog[]>([]);
  const [flow, setFlow] = useState<FlowLevel | null>(null);
  const [mood, setMood] = useState<Mood | null>(null);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [logSaving, setLogSaving] = useState(false);

  const openLogging = useCallback(
    (date: string, list: CycleLog[]) => {
      const existing = list.find((l) => l.date === date);
      setLogDate(date);
      setFlow(existing?.flow ?? null);
      setMood(existing?.mood ?? null);
      setSymptoms(existing?.symptoms ?? []);
      setLogging(true);
    },
    []
  );

  async function saveLog() {
    setLogSaving(true);
    try {
      const res = await api.cycle.logDay({ date: logDate, flow, mood, symptoms });
      setLogs(res.logs);
      setLogging(false);
    } finally {
      setLogSaving(false);
    }
  }

  const load = useCallback(() => {
    api.menopause
      .get()
      .then((res) => {
        setAssessments(res.assessments);
        setMonthsSince(res.monthsSinceLastPeriod);
      })
      .catch(() => setAssessments([]));
    // Qayd oynasini oldindan to'ldirish uchun — xatosi jim o'tadi, chunki
    // bu faqat qulaylik, ekranning o'zi unga bog'liq emas.
    api.cycle
      .get()
      .then((res) => setLogs(res.logs))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timeout = setTimeout(load, 0);
    return () => clearTimeout(timeout);
  }, [load]);

  // Bosqich YOSHGA emas, oxirgi hayzga qarab aniqlanadi (server
  // hisoblab beradi). Ma'lumot yo'q bo'lsa — perimenopauza, bu rejimni
  // tanlagan ayol uchun xavfsiz taxmin: menopauzaga xos ogohlantirish
  // (qon ketish) noto'g'ri holatda ko'rsatilmaydi.
  const stage = resolveMenopauseStage({
    age: onboardingProfile?.age ?? null,
    monthsSinceLastPeriod: monthsSince,
    cyclesIrregular: true,
  });

  const latest = assessments?.[0] ?? null;
  const live = scoreMrs(answers);

  async function save() {
    setSaving(true);
    try {
      const res = await api.menopause.save(answers as Record<string, number>);
      setAssessments(res.assessments);
      setTesting(false);
      setAnswers({});
    } finally {
      setSaving(false);
    }
  }

  const severityLabel = (s: string) =>
    s === "severe" ? t.sevSevere : s === "moderate" ? t.sevModerate : s === "mild" ? t.sevMild : t.sevNone;

  /** "3 okt" ko'rinishidagi qisqa sana.
   *
   *  `toLocaleDateString` ISHLATILMAYDI: o'zbek tili uchun brauzer
   *  "M10 3" kabi natija qaytaradi (oy nomi o'rniga "M10"). Ilovaning
   *  o'z oy nomlari har uchala tilda to'g'ri va tarjima bilan birga
   *  turadi. */
  const shortDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const month = dict.common.months[d.getMonth()] ?? "";
    return `${d.getDate()} ${month.slice(0, 3).toLowerCase()}`;
  };

  const latestResult = latest ? scoreMrs(latest.scores as MrsScore) : null;
  const history = (assessments ?? []).slice(0, 6).reverse();

  return (
    <div className="space-y-4 pb-8">
      {/* Sarlavha ostida bosqich IZOHI turadi, nomi esa quyidagi chipda —
          ilgari ikkalasi ham bir xil so'zni takrorlardi. */}
      <ScreenHeader title={t.title} subtitle={t[STAGE_LABEL[stage].hint] as string} />

      {/* Qon ketish ogohlantirishi ENG TEPADA: u shoshilinch, qolgani esa
          kuzatuv. Ilgari u bosqich kartasidan keyin turardi. */}
      {(stage === "menopause" || stage === "postmenopause") && (
        <Card className="border border-danger/20 bg-danger/10">
          <p className="text-sm font-bold text-danger">{t.bleedTitle}</p>
          <p className="mt-1 text-xs leading-relaxed text-text-secondary">{t.bleedBody}</p>
        </Card>
      )}

      {/* HERO — bosqich va natija BITTA kartada. Ilgari ular ikkita alohida
          karta edi va ekranda eng katta raqam umuman yo'q edi. */}
      {!testing && assessments !== null && (
        <Card className="space-y-3">
          <span className="inline-block rounded-full bg-surface-muted px-3 py-1 text-[11px] font-bold text-text-secondary">
            {t[STAGE_LABEL[stage].title] as string}
          </span>

          {latestResult ? (
            <>
              <div className="flex items-end gap-2">
                <p className="text-4xl font-extrabold leading-none text-text-primary">
                  {t.scoreOf(latest!.total, MRS_TOTAL_MAX)}
                </p>
                <p className="pb-0.5 text-sm font-bold text-text-secondary">{severityLabel(latest!.severity)}</p>
              </div>
              <SeverityBar total={latest!.total} lowLabel={t.sevNone} highLabel={t.sevSevere} />
              <div className="space-y-1.5 pt-1">
                {(Object.keys(MRS_DOMAIN_MAX) as MrsDomain[]).map((d) => (
                  <DomainRow key={d} label={t.domains[d]} value={latestResult.byDomain[d]} max={MRS_DOMAIN_MAX[d]} />
                ))}
              </div>
              <p className="text-[11px] text-text-muted">{t.lastTaken(shortDate(latest!.createdAt))}</p>
            </>
          ) : (
            <div>
              <p className="text-base font-bold text-text-primary">{t.mrsTitle}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{t.mrsIntro}</p>
            </div>
          )}

          {latestResult && shouldSeeDoctorForMenopause(latestResult) && (
            <p className="rounded-2xl bg-warning/10 p-3 text-xs leading-relaxed text-text-primary">{t.doctorHint}</p>
          )}

          <button
            type="button"
            onClick={() => {
              setAnswers({});
              setTesting(true);
            }}
            className="tap-target w-full rounded-full bg-primary text-sm font-bold text-white"
          >
            {latest ? t.retake : t.start}
          </button>
        </Card>
      )}

      {/* DINAMIKA — jadval har bir urinishni saqlaydi, lekin ekran faqat
          oxirgisini ko'rsatardi. Holbuki davolash yordam berayotganini
          AYNAN o'zgarish ko'rsatadi. */}
      {!testing && history.length >= 2 && (
        <Card className="space-y-2">
          <div>
            <p className="text-base font-bold text-text-primary">{t.dynamicsTitle}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{t.dynamicsHint}</p>
          </div>
          <div className="flex h-24 items-end justify-between gap-2 pt-1">
            {history.map((a) => (
              <div key={a.id} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-text-secondary">{a.total}</span>
                <div
                  className="w-full rounded-t-md bg-primary/70"
                  style={{ height: `${Math.max(4, (a.total / MRS_TOTAL_MAX) * 64)}px` }}
                />
                <span className="text-[9px] text-text-muted">{shortDate(a.createdAt)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* KUNLIK QAYD — bu rejimda har kuni qilinadigan ish umuman yo'q edi.
          Simptom kuzatuvi esa aynan shu davrning asosiy vositasi. */}
      {!testing && (
        <Card className="space-y-2">
          <p className="text-base font-bold text-text-primary">{t.todayTitle}</p>
          <p className="text-sm leading-relaxed text-text-secondary">{t.todayBody}</p>
          <button
            type="button"
            onClick={() => openLogging(localDateStr(), logs)}
            className="tap-target mt-1 w-full rounded-full bg-primary text-sm font-bold text-white"
          >
            {t.todayCta}
          </button>
        </Card>
      )}

      {/* MRS */}
      {testing ? (
        <Card className="space-y-4">
          <div>
            <p className="text-base font-bold text-text-primary">{t.mrsTitle}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{t.mrsIntro}</p>
          </div>
          <div className="space-y-4">
            {MRS_ITEMS.map((item) => (
              <div key={item.id}>
                <p className="text-sm font-semibold text-text-primary">{t.items[item.id as MrsItemId]}</p>
                <div className="mt-2 flex gap-1.5">
                  {t.levels.map((label, value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAnswers((a) => ({ ...a, [item.id]: value }))}
                      className={clsx(
                        "flex-1 rounded-xl py-2 text-[11px] font-semibold leading-tight transition-colors",
                        answers[item.id as MrsItemId] === value
                          ? "bg-primary text-white"
                          : "bg-surface-muted text-text-secondary"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTesting(false)}
              className="tap-target flex-1 rounded-full bg-surface-muted text-sm font-semibold text-text-secondary"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || live.unanswered > 0}
              className="tap-target flex-1 rounded-full bg-primary text-sm font-bold text-white disabled:opacity-50"
            >
              {t.save}
            </button>
          </div>
        </Card>
      ) : assessments === null ? (
        <LoadingSpinner label={dict.common.loading} inline />
      ) : null}

      {logging && (
        <LogSheet
          date={logDate}
          today={localDateStr()}
          onChangeDate={(d) => openLogging(d, logs)}
          flowLevels={FLOW_LEVELS}
          flow={flow}
          onToggleFlow={(f) => setFlow(flow === f ? null : f)}
          symptomList={symptomOptionsForGoal(DAILY_SYMPTOMS, onboardingProfile?.primaryGoal)}
          symptoms={symptoms}
          onToggleSymptom={(sym) =>
            setSymptoms((prev) => (prev.includes(sym) ? prev.filter((x) => x !== sym) : [...prev, sym]))
          }
          moods={MOODS}
          mood={mood}
          onToggleMood={(m) => setMood(mood === m ? null : m)}
          advanced={null}
          onClose={() => setLogging(false)}
          onSave={saveLog}
          onDelete={null}
          saving={logSaving}
          deleting={false}
        />
      )}

      {/* Skrining — bu yoshda eng muhim qism. */}
      <Card className="space-y-2">
        <p className="text-base font-bold text-text-primary">{t.screeningTitle}</p>
        <p className="text-sm leading-relaxed text-text-secondary">{t.screeningBody}</p>
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => router.push("/tekshiruvlar")}
            className="tap-target flex-1 rounded-full bg-primary text-sm font-bold text-white"
          >
            {t.screeningCta}
          </button>
          <button
            type="button"
            onClick={() => router.push("/shifokorlar")}
            className="tap-target flex-1 rounded-full bg-surface-muted text-sm font-semibold text-text-primary"
          >
            {t.doctorsCta}
          </button>
        </div>
      </Card>
    </div>
  );
}
