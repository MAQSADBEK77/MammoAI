"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PrintOutlined, WorkspacePremiumRounded } from "@mui/icons-material";
import type { DoctorReport } from "@mammoai/shared";
import { ApiError, formatDateDisplay } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Button, Card, ErrorState, LoadingSpinner, ScreenHeader } from "@/components/ui";
import { Emoji } from "@/components/Emoji";

/**
 * REPORT-01 — shifokor uchun hisobot.
 *
 * Ayol ginekolog qabuliga kiradi va birinchi savol har doim bir xil:
 * "oxirgi hayzingiz qachon edi, sikllaringiz qanday?". U xotiradan javob
 * beradi — noaniq, ba'zan xato. Qabul vaqti qisqa, yozuvlar qog'ozda.
 *
 * Bu sahifa shu ma'lumotni o'qishga tayyor holda beradi: telefonda
 * ko'rsatish yoki chop etish mumkin.
 */
export default function DoctorReportPage() {
  const { dict } = useI18n();
  const router = useRouter();
  const [data, setData] = useState<{ report: DoctorReport; name: string | null } | null>(null);
  const [needsPremium, setNeedsPremium] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(() => {
    setLoadError(false);
    setNeedsPremium(false);
    api.doctorReport
      .get()
      .then(setData)
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 402) setNeedsPremium(true);
        else setLoadError(true);
      });
  }, []);

  useEffect(() => {
    const timeout = setTimeout(load, 0);
    return () => clearTimeout(timeout);
  }, [load]);

  if (loadError) {
    return <ErrorState message={dict.common.errorGeneric} retry={{ label: dict.common.retryButton, onClick: load }} />;
  }

  if (needsPremium) {
    return (
      <div className="flex flex-col gap-4">
        <ScreenHeader title={dict.doctorReport.title} subtitle={dict.doctorReport.subtitle} />
        <Card className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="bg-aurora-cycle flex h-14 w-14 items-center justify-center rounded-full">
            <WorkspacePremiumRounded sx={{ fontSize: 26 }} className="text-white" />
          </div>
          <h2 className="text-lg font-bold text-text-primary">{dict.doctorReport.premiumTitle}</h2>
          <p className="max-w-sm text-sm text-text-secondary">{dict.doctorReport.premiumBody}</p>
          <Button className="mt-2" onClick={() => router.push("/fikr")}>
            {dict.chat.premiumCta}
          </Button>
        </Card>
      </div>
    );
  }

  if (!data) return <LoadingSpinner label={dict.common.loading} />;
  const r = data.report;

  const rows: { label: string; value: string }[] = [
    { label: dict.doctorReport.lastPeriod, value: r.lastPeriodStart ? formatDateDisplay(r.lastPeriodStart) : "—" },
    {
      label: dict.doctorReport.cycleLength,
      value:
        r.averageCycleLength !== null
          ? dict.doctorReport.cycleRange(r.averageCycleLength, r.shortestCycle ?? 0, r.longestCycle ?? 0)
          : "—",
    },
    { label: dict.doctorReport.cyclesObserved, value: String(r.cyclesObserved) },
    { label: dict.doctorReport.loggedDays, value: String(r.loggedDays) },
    { label: dict.doctorReport.age, value: r.age !== null ? String(r.age) : "—" },
    {
      label: dict.doctorReport.familyHistory,
      value: r.familyHistory === null ? dict.common.dontKnow : r.familyHistory ? dict.common.yes : dict.common.no,
    },
  ];

  return (
    <div className="space-y-4 pb-6">
      {/* `print:` — chop etishda faqat hisobot qoladi, tugmalar va
          navigatsiya chiqmaydi. */}
      <div className="print:hidden">
        <ScreenHeader title={dict.doctorReport.title} subtitle={dict.doctorReport.subtitle} />
      </div>

      <Card className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-bold text-text-primary">{data.name ?? dict.doctorReport.title}</p>
            <p className="text-xs text-text-muted">
              {dict.doctorReport.generatedOn(formatDateDisplay(r.generatedAt))}
              {r.periodCovered && ` · ${formatDateDisplay(r.periodCovered.from)} – ${formatDateDisplay(r.periodCovered.to)}`}
            </p>
          </div>
          <Emoji e="🩺" size={22} />
        </div>

        {/* Ma'lumot kam bo'lsa buni SHIFOKORGA aytish kerak — aks holda u
            bu raqamlarni ishonchli o'lchov deb qabul qilishi mumkin. */}
        {r.hasLimitedData && (
          <div className="rounded-2xl border border-warning/20 bg-warning/5 px-4 py-3">
            <p className="text-xs leading-relaxed text-text-secondary">{dict.doctorReport.limitedDataNotice}</p>
          </div>
        )}

        <dl className="divide-y divide-border">
          {rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-4 py-2">
              <dt className="text-sm text-text-secondary">{row.label}</dt>
              <dd className="text-sm font-semibold text-text-primary">{row.value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {r.topSymptoms.length > 0 && (
        <Card className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-text-muted">{dict.doctorReport.symptomsTitle}</p>
          <ul className="space-y-1">
            {r.topSymptoms.map((s) => (
              <li key={s.symptom} className="flex justify-between gap-3 text-sm">
                <span className="text-text-secondary">{dict.cycle.symptoms[s.symptom]}</span>
                <span className="font-semibold text-text-primary">{dict.doctorReport.days(s.days)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {r.overdueCheckups.length > 0 && (
        <Card className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-danger">{dict.doctorReport.overdueTitle}</p>
          <ul className="space-y-1">
            {r.overdueCheckups.map((c) => (
              <li key={c.type} className="text-sm text-text-secondary">
                {dict.checklist.items[c.type].title}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {r.completedCheckups.length > 0 && (
        <Card className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-text-muted">{dict.doctorReport.completedTitle}</p>
          <ul className="space-y-1">
            {r.completedCheckups.map((c) => (
              <li key={c.type} className="flex justify-between gap-3 text-sm">
                <span className="text-text-secondary">{dict.checklist.items[c.type].title}</span>
                {c.completedAt && <span className="text-text-muted">{formatDateDisplay(c.completedAt)}</span>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <p className="px-1 text-xs leading-relaxed text-text-muted">{dict.doctorReport.disclaimer}</p>

      <Button onClick={() => window.print()} className="w-full print:hidden">
        <PrintOutlined sx={{ fontSize: 18 }} className="mr-2" />
        {dict.doctorReport.printButton}
      </Button>
    </div>
  );
}
