"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Language } from "@mammoai/shared";
import { goalToLandingTab, cssGradient, colors } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { Button, Card } from "@/components/ui";
import clsx from "clsx";
import { Type, Eye, CalendarClock, NotebookPen } from "lucide-react";

export default function ProfilePage() {
  const { dict, language, setLanguage } = useI18n();
  const { user, onboardingProfile, refresh } = useSession();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [logsCount, setLogsCount] = useState<number | null>(null);
  const [actionFlash, setActionFlash] = useState<string | null>(null);

  useEffect(() => {
    api.cycle.get().then((res) => setLogsCount(res.logs.length));
  }, []);

  if (!user) return null;

  async function save(patch: Parameters<typeof api.me.update>[0]) {
    setSaving(true);
    try {
      await api.me.update(patch);
      await refresh();
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } finally {
      setSaving(false);
    }
  }

  async function exportData() {
    setExporting(true);
    try {
      const data = await api.me.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mammoai-malumotlar.json";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  function flash(message: string) {
    setActionFlash(message);
    setTimeout(() => setActionFlash(null), 2000);
  }

  async function shareApp() {
    const url = typeof window !== "undefined" ? window.location.origin : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: dict.common.appName, text: dict.profile.shareAppMessage, url });
      } catch {
        // Foydalanuvchi bekor qildi — hech narsa qilinmaydi.
      }
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      flash(dict.profile.shareAppLinkCopied);
    }
  }

  const modeIcon = onboardingProfile
    ? goalToLandingTab(onboardingProfile.primaryGoal) === "pregnancy"
      ? "🤰"
      : goalToLandingTab(onboardingProfile.primaryGoal) === "checkups"
        ? "🩺"
        : "🩸"
    : null;

  const initials = (user.name?.trim()?.[0] ?? "👋").toUpperCase();
  const daysActive = Math.max(0, Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / 86400000));

  return (
    <div className="space-y-5 pb-6">
      {/* Profil "shaxsiy" kartasi — pushti→binafsha gradient, avatar, maqsad
          yorlig'i va haqiqiy foydalanish statistikasi. */}
      <div className="bg-aurora-profile animate-fade-in-up space-y-4 rounded-[32px] p-6">
        <div className="flex items-center gap-3.5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/20 text-2xl font-extrabold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="truncate text-xl font-extrabold text-white">{user.name?.trim() || dict.profile.noNameFallback}</p>
            {modeIcon && onboardingProfile && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
                {modeIcon} {dict.onboarding.goals[onboardingProfile.primaryGoal]}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 rounded-2xl bg-white/15 px-3.5 py-3">
            <CalendarClock size={18} className="text-white" />
            <div>
              <p className="text-sm font-extrabold text-white">{dict.profile.statsDaysValue(daysActive)}</p>
              <p className="text-[11px] text-white/75">{dict.profile.statsDaysLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-white/15 px-3.5 py-3">
            <NotebookPen size={18} className="text-white" />
            <div>
              <p className="text-sm font-extrabold text-white">{logsCount ?? 0}</p>
              <p className="text-[11px] text-white/75">{dict.profile.statsLogsLabel}</p>
            </div>
          </div>
        </div>
      </div>

      <Card className="space-y-3">
        <p className="text-sm font-semibold text-text-secondary">{dict.profile.languageLabel}</p>
        <div className="flex gap-2">
          {(["uz", "ru"] as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => {
                setLanguage(lang);
                save({ language: lang });
              }}
              className={clsx(
                "tap-target flex-1 rounded-2xl border-2 font-semibold",
                language === lang ? "border-primary bg-primary-light text-primary-dark" : "border-border bg-surface text-text-primary"
              )}
            >
              {lang === "uz" ? "O'zbekcha" : "Русский"}
            </button>
          ))}
        </div>
      </Card>

      <Card className="space-y-3">
        <label className="block text-sm font-semibold text-text-secondary">{dict.profile.nameLabel}</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => save({ name: name || null })}
          className="tap-target w-full rounded-2xl border border-border bg-surface px-4 text-text-primary outline-none focus:border-primary"
        />
        <label className="block text-sm font-semibold text-text-secondary">{dict.profile.phoneLabel}</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onBlur={() => save({ phone: phone || null })}
          placeholder={dict.profile.phonePlaceholder}
          className="tap-target w-full rounded-2xl border border-border bg-surface px-4 text-text-primary outline-none focus:border-primary"
        />
      </Card>

      <Card className="space-y-1">
        <p className="mb-2 text-sm font-semibold text-text-secondary">{dict.profile.accessibilityTitle}</p>

        <SettingsRow icon={Type} label={dict.profile.fontSizeLabel}>
          <div className="flex gap-2">
            <button
              onClick={() => save({ fontScale: "normal" })}
              className={clsx(
                "tap-target rounded-full px-4 text-sm font-semibold",
                user.fontScale === "normal" ? "bg-primary text-white" : "bg-surface-muted text-text-secondary"
              )}
            >
              {dict.profile.fontSizeNormal}
            </button>
            <button
              onClick={() => save({ fontScale: "large" })}
              className={clsx(
                "tap-target rounded-full px-4 text-sm font-semibold",
                user.fontScale === "large" ? "bg-primary text-white" : "bg-surface-muted text-text-secondary"
              )}
            >
              {dict.profile.fontSizeLarge}
            </button>
          </div>
        </SettingsRow>

        <SettingsRow icon={Eye} label={dict.profile.highContrastLabel}>
          <Toggle checked={user.highContrast} onChange={() => save({ highContrast: !user.highContrast })} />
        </SettingsRow>

        <SettingsRow icon="🔔" label={dict.profile.notificationsLabel} last>
          <Toggle checked={user.notificationsEnabled} onChange={() => save({ notificationsEnabled: !user.notificationsEnabled })} />
        </SettingsRow>
      </Card>

      <Link href="/maxfiylik">
        <Card interactive className="space-y-1">
          <SettingsRow icon="🔒" label={dict.profile.securityTitle} last>
            <span className="text-sm text-primary-dark">{dict.profile.privacyPolicyLink}</span>
          </SettingsRow>
        </Card>
      </Link>

      <Card className="space-y-1">
        <SettingsRow icon="❓" label={dict.profile.helpTitle} last>
          <span className="text-right text-sm text-text-secondary">{dict.profile.helpPhoneValue}</span>
        </SettingsRow>
      </Card>

      <div className="bg-aurora-pregnancy rounded-[28px] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 text-xl">✨</div>
          <div>
            <p className="font-semibold text-white">{dict.profile.premiumTitle}</p>
            <p className="mt-1 text-sm text-white/80">{dict.profile.premiumSubtitle}</p>
          </div>
        </div>
      </div>

      <Card className="space-y-1">
        <button
          className="-mx-2 w-[calc(100%+16px)] rounded-2xl px-2 text-left transition hover:bg-surface-muted active:scale-[0.99]"
          onClick={() => flash(dict.profile.rateAppComingSoon)}
        >
          <SettingsRow icon="⭐" label={dict.profile.rateAppButton} />
        </button>
        <button
          className="-mx-2 w-[calc(100%+16px)] rounded-2xl px-2 text-left transition hover:bg-surface-muted active:scale-[0.99]"
          onClick={shareApp}
        >
          <SettingsRow icon="📱" label={dict.profile.shareAppButton} last />
        </button>
      </Card>

      <Button variant="secondary" className="w-full" onClick={exportData} disabled={exporting}>
        {dict.profile.exportButton}
      </Button>

      {(saving || savedFlash || actionFlash) && (
        <p className="text-center text-sm text-text-muted">
          {actionFlash ?? (savedFlash ? dict.profile.savedMessage : dict.common.loading)}
        </p>
      )}
    </div>
  );
}

function SettingsRow({
  icon,
  label,
  children,
  last,
}: {
  /** Lucide komponenti (aniq mos emoji topilmagan holatlar uchun) yoki manba
   * ilovadagi ("Uzbek Women's Health Tracker" — src/App.tsx) aynan emoji. */
  icon: typeof Type | string;
  label: string;
  children?: React.ReactNode;
  last?: boolean;
}) {
  const Icon = typeof icon === "string" ? null : icon;
  return (
    <div className={clsx("flex items-center justify-between gap-3 py-2.5", !last && "border-b border-border")}>
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full text-lg shadow-sm"
          style={{ background: cssGradient(colors.primary) }}
        >
          {Icon ? <Icon size={18} className="text-white" /> : (icon as string)}
        </div>
        <span className="font-medium text-text-primary">{label}</span>
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={clsx("tap-target w-14 rounded-full transition", checked ? "bg-primary" : "bg-surface-muted")}>
      <span className={clsx("block h-6 w-6 rounded-full bg-white shadow transition-transform", checked ? "translate-x-7" : "translate-x-1")} />
    </button>
  );
}
