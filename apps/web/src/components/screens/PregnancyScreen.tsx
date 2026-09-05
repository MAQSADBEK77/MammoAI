"use client";

import { useEffect, useState } from "react";
import { AccessTimeOutlined as CalendarClock, CalendarMonthOutlined as CalendarDays, ChevronRight, HourglassEmptyOutlined as Hourglass, MedicalServicesOutlined as Stethoscope, FavoriteBorderOutlined as Heart, MonitorHeartOutlined as Activity, MonitorWeightOutlined as Scale, DeviceThermostatOutlined as Thermometer } from "@mui/icons-material";
import type { PregnancyResponse, VitalType } from "@mammoai/shared";
import { getMilestoneForWeek, getVitalTone, localDateStr, formatDateDisplay } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useIllustrations } from "@/lib/illustrations";
import { Emoji } from "@/components/Emoji";
import { api } from "@/lib/api";
import { Badge, Button, Card, FloatingTag, LoadingSpinner, ScreenHeader } from "@/components/ui";
import { SizeIllustration } from "@/components/SizeIllustration";

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
  const [lmpInput, setLmpInput] = useState("");
  const [addingVisit, setAddingVisit] = useState(false);
  const [visitLabel, setVisitLabel] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [visitClinic, setVisitClinic] = useState("");
  const [saving, setSaving] = useState(false);
  const [loggingVital, setLoggingVital] = useState<VitalType | null>(null);
  const [vitalInput, setVitalInput] = useState("");
  const [savingVital, setSavingVital] = useState(false);
  const [vitalError, setVitalError] = useState<string | null>(null);

  useEffect(() => {
    api.pregnancy.get().then(setData);
  }, []);

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
  const greeting = (
    <>
      {dict.common.greeting(onboardingProfile?.name ?? null, new Date().getHours())} <Emoji e="👋" size={20} />
    </>
  );

  const todayStr = localDateStr();
  const nextVisit = data.visits.find((v) => v.date >= todayStr) ?? null;
  const nextVisitDaysLeft = nextVisit
    ? Math.max(0, Math.round((new Date(nextVisit.date + "T00:00:00Z").getTime() - new Date(todayStr + "T00:00:00Z").getTime()) / 86400000))
    : null;

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
          <FloatingTag icon={<CalendarClock sx={{ fontSize: 18 }} className="text-secondary" />} value={String(status.currentWeek)} label={dict.pregnancy.completedWeekLabel} />
          <FloatingTag icon={<Hourglass sx={{ fontSize: 18 }} className="text-secondary" />} value={String(weeksRemaining)} label={dict.pregnancy.remainingWeekLabel} />
        </div>

        <div className="space-y-2">
          <div className="h-3 w-full overflow-hidden rounded-full bg-white/25">
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }} />
          </div>
          <p className="text-sm font-semibold text-white">{dict.pregnancy.daysRemaining(status.daysRemaining)}</p>
        </div>
      </div>

      {/* Sog'liq ko'rsatkichlari — foydalanuvchi o'zi qayd etadigan tezkor-jurnal. */}
      <div className="space-y-2">
        <p className="text-base font-bold text-text-primary">{dict.pregnancy.vitalsTitle}</p>
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
      </div>

      {/* Navbatdagi ko'rik — haqiqiy `visits` ma'lumotidan. Bosilganda tashrif
          qo'shish shakli ochiladi — strelka shunchaki bezak emas. */}
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
    </div>
  );
}
