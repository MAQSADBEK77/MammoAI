"use client";

import { useEffect, useState } from "react";
import type { PregnancyResponse } from "@mammoai/shared";
import { getMilestoneForWeek } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { Button, Card, ScreenHeader, ProgressBar } from "@/components/ui";
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
  const greeting = `🤰 ${dict.common.greeting(onboardingProfile?.name ?? null, new Date().getHours())}`;

  return (
    <div className="space-y-5 pb-6">
      <ScreenHeader title={greeting} subtitle={dict.pregnancy.trimester(status.trimester)} />

      <Card
        className="space-y-4 text-center animate-fade-in-up"
        style={{ background: "linear-gradient(135deg, #e8f5e9 0%, #e3f2fd 100%)" }}
      >
        <SizeIllustration icon={milestone.icon} />
        <h2 className="text-2xl font-extrabold text-text-primary">{dict.pregnancy.weekLabel(status.currentWeek)}</h2>
        <p className="text-text-secondary">{dict.pregnancy.sizeComparison(sizeLabel)}</p>
        <ProgressBar value={progressPct} />
        <p className="text-sm font-semibold text-primary-dark">{dict.pregnancy.daysRemaining(status.daysRemaining)}</p>
      </Card>

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
            <Card key={v.id} className="py-3">
              <p className="font-medium text-text-primary">{v.label}</p>
              <p className="text-sm text-text-secondary">
                {v.date}
                {v.clinicName ? ` · ${v.clinicName}` : ""}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
