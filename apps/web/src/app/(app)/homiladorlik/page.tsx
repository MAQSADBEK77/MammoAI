"use client";

import { useEffect, useState } from "react";
import { CalendarClock, ChevronRight, Hourglass, Stethoscope } from "lucide-react";
import type { PregnancyResponse } from "@mammoai/shared";
import { getMilestoneForWeek } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { Button, Card, FloatingTag, ScreenHeader } from "@/components/ui";
import { SizeIllustration } from "@/components/SizeIllustration";

export default function PregnancyPage() {
  const { dict } = useI18n();
  const { onboardingProfile } = useSession();
  const [data, setData] = useState<PregnancyResponse | null>(null);
  const [lmpInput, setLmpInput] = useState("");
  const [addingVisit, setAddingVisit] = useState(false);
  const [visitLabel, setVisitLabel] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [visitClinic, setVisitClinic] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.pregnancy.get().then(setData);
  }, []);

  if (!data) return <p className="text-text-secondary">{dict.common.loading}</p>;

  if (!data.status) {
    return (
      <div className="space-y-4">
        <ScreenHeader title={dict.pregnancy.title} />
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG, next/image optimizatsiyasi kerak emas */}
          <img src="/illustrations/expecting.svg" alt="" className="h-40 w-auto" />
        </div>
        <Card className="space-y-3">
          <p className="text-sm text-text-secondary">{dict.onboarding.lastCheckupQuestion}</p>
          <input
            type="date"
            value={lmpInput}
            onChange={(e) => setLmpInput(e.target.value)}
            className="tap-target w-full rounded-2xl border border-border bg-surface px-4 text-text-primary outline-none focus:border-primary"
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
  const sizeLabel = dict.pregnancy.sizes[milestone.sizeComparisonKey.replace("size.", "") as keyof typeof dict.pregnancy.sizes];
  const progressPct = (status.currentWeek / 40) * 100;
  const weeksRemaining = Math.max(0, 40 - status.currentWeek);
  const greeting = `${dict.common.greeting(onboardingProfile?.name ?? null, new Date().getHours())} 👋`;

  return (
    <div className="space-y-5 pb-6">
      <ScreenHeader title={greeting} subtitle={dict.pregnancy.trimester(status.trimester)} />

      {/* Homiladorlik "sayohati" kartasi — binafsha gradient fon, markazda
          o'lcham-illyustratsiya, ustida suzuvchi statistik yorliqlar. */}
      <div className="bg-aurora-pregnancy animate-fade-in-up space-y-5 rounded-[32px] p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-full bg-white/20 p-3">
            <SizeIllustration icon={milestone.icon} />
          </div>
          <h2 className="text-2xl font-extrabold text-white">{dict.pregnancy.weekLabel(status.currentWeek)}</h2>
          <p className="max-w-[280px] text-white/85">{dict.pregnancy.sizeComparison(sizeLabel)}</p>
        </div>

        <div className="flex justify-center gap-3">
          <FloatingTag icon={<CalendarClock size={18} className="text-secondary" />} value={String(status.currentWeek)} label={dict.pregnancy.completedWeekLabel} />
          <FloatingTag icon={<Hourglass size={18} className="text-secondary" />} value={String(weeksRemaining)} label={dict.pregnancy.remainingWeekLabel} />
        </div>

        <div className="space-y-2">
          <div className="h-3 w-full overflow-hidden rounded-full bg-white/25">
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }} />
          </div>
          <p className="text-sm font-semibold text-white">{dict.pregnancy.daysRemaining(status.daysRemaining)}</p>
        </div>
      </div>

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
            <input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className="tap-target w-full rounded-2xl border border-border bg-surface px-4 text-text-primary outline-none focus:border-primary"
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
                <Stethoscope size={20} className="text-white" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-text-primary">{v.label}</p>
                <p className="text-sm text-text-secondary">
                  {v.date}
                  {v.clinicName ? ` · ${v.clinicName}` : ""}
                </p>
              </div>
              <ChevronRight size={18} className="text-text-muted" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
