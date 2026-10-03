"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  MRS_ITEMS,
  resolveMenopauseStage,
  scoreMrs,
  shouldSeeDoctorForMenopause,
  type MenopauseStage,
  type MrsItemId,
  type MrsScore,
} from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { Card, LoadingSpinner, ScreenHeader } from "@/components/ui";

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

export function MenopauseScreen() {
  const { dict, language } = useI18n();
  const t = dict.menopause;
  const router = useRouter();
  const { onboardingProfile } = useSession();

  const [assessments, setAssessments] = useState<
    { id: string; createdAt: string; total: number; severity: string }[] | null
  >(null);
  const [monthsSince, setMonthsSince] = useState<number | null>(null);
  const [testing, setTesting] = useState(false);
  const [answers, setAnswers] = useState<MrsScore>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.menopause
      .get()
      .then((res) => {
        setAssessments(res.assessments);
        setMonthsSince(res.monthsSinceLastPeriod);
      })
      .catch(() => setAssessments([]));
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

  return (
    <div className="space-y-4 pb-8">
      <ScreenHeader title={t.title} subtitle={t[STAGE_LABEL[stage].title] as string} />

      {/* Bosqich */}
      <Card>
        <p className="text-base font-bold text-text-primary">{t[STAGE_LABEL[stage].title] as string}</p>
        <p className="mt-1 text-sm leading-relaxed text-text-secondary">{t[STAGE_LABEL[stage].hint] as string}</p>
      </Card>

      {/* Qon ketish — menopauzadan keyin hech qachon "normal" emas. */}
      {(stage === "menopause" || stage === "postmenopause") && (
        <Card className="bg-danger/10">
          <p className="text-sm font-bold text-danger">{t.bleedTitle}</p>
          <p className="mt-1 text-xs leading-relaxed text-text-secondary">{t.bleedBody}</p>
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
      ) : (
        <Card className="space-y-3">
          <div>
            <p className="text-base font-bold text-text-primary">{t.mrsTitle}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{t.mrsIntro}</p>
          </div>

          {latest && (
            <div className="rounded-2xl bg-surface-muted p-3">
              <p className="text-xs font-semibold text-text-secondary">{t.resultTitle}</p>
              <p className="mt-0.5 text-2xl font-extrabold text-text-primary">
                {latest.total}{" "}
                <span className="text-sm font-bold text-text-secondary">{severityLabel(latest.severity)}</span>
              </p>
              <p className="mt-0.5 text-[11px] text-text-muted">
                {t.lastTaken(new Date(latest.createdAt).toLocaleDateString(language === "ru" ? "ru-RU" : "uz-UZ"))}
              </p>
            </div>
          )}

          {latest && shouldSeeDoctorForMenopause({ total: latest.total, severity: latest.severity as never, byDomain: { somatic: 0, psychological: 0, urogenital: 0 }, unanswered: 0 }) && (
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
