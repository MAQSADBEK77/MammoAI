"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Language } from "@mammoai/shared";
import { goalToLandingTab } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { Badge, Button, Card, ScreenHeader } from "@/components/ui";
import clsx from "clsx";
import { Type, Eye, Bell, Shield, HelpCircle, Crown, BarChart3 } from "lucide-react";

export default function ProfilePage() {
  const { dict, language, setLanguage } = useI18n();
  const { user, onboardingProfile, refresh } = useSession();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [logsCount, setLogsCount] = useState<number | null>(null);

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

  const modeIcon = onboardingProfile
    ? goalToLandingTab(onboardingProfile.primaryGoal) === "pregnancy"
      ? "🤰"
      : goalToLandingTab(onboardingProfile.primaryGoal) === "checkups"
        ? "🩺"
        : "🩸"
    : null;

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center justify-between">
        <ScreenHeader title={dict.profile.title} />
        {modeIcon && onboardingProfile && (
          <Badge tone="primary">
            {modeIcon} {dict.onboarding.goals[onboardingProfile.primaryGoal]}
          </Badge>
        )}
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

        <SettingsRow icon={Bell} label={dict.profile.notificationsLabel} last>
          <Toggle checked={user.notificationsEnabled} onChange={() => save({ notificationsEnabled: !user.notificationsEnabled })} />
        </SettingsRow>
      </Card>

      <Card className="space-y-1">
        <SettingsRow icon={BarChart3} label={dict.profile.statsTitle} last>
          <span className="text-sm text-text-secondary">{dict.profile.statsLogsCount(logsCount ?? 0)}</span>
        </SettingsRow>
      </Card>

      <Card className="space-y-1">
        <Link href="/maxfiylik">
          <SettingsRow icon={Shield} label={dict.profile.securityTitle} last>
            <span className="text-sm text-primary-dark">{dict.profile.privacyPolicyLink}</span>
          </SettingsRow>
        </Link>
      </Card>

      <Card className="space-y-1">
        <SettingsRow icon={HelpCircle} label={dict.profile.helpTitle} last>
          <span className="text-right text-sm text-text-secondary">{dict.profile.helpPhoneValue}</span>
        </SettingsRow>
      </Card>

      <Card className="bg-secondary-light/40">
        <div className="flex items-center gap-3">
          <Crown className="text-secondary" size={22} />
          <div>
            <p className="font-semibold text-text-primary">{dict.profile.premiumTitle}</p>
            <p className="mt-1 text-sm text-text-secondary">{dict.profile.premiumSubtitle}</p>
          </div>
        </div>
      </Card>

      <Button variant="secondary" className="w-full" onClick={exportData} disabled={exporting}>
        {dict.profile.exportButton}
      </Button>

      {(saving || savedFlash) && (
        <p className="text-center text-sm text-text-muted">{savedFlash ? dict.profile.savedMessage : dict.common.loading}</p>
      )}
    </div>
  );
}

function SettingsRow({
  icon: Icon,
  label,
  children,
  last,
}: {
  icon: typeof Type;
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={clsx("flex items-center justify-between gap-3 py-2.5", !last && "border-b border-border")}>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light/60">
          <Icon size={18} className="text-primary-dark" />
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
