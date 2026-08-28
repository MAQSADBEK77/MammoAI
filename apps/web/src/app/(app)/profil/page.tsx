"use client";

import { useState } from "react";
import type { Language } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { Button, Card, ScreenHeader } from "@/components/ui";
import clsx from "clsx";

export default function ProfilePage() {
  const { dict, language, setLanguage } = useI18n();
  const { user, refresh } = useSession();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [exporting, setExporting] = useState(false);

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

  return (
    <div className="space-y-5 pb-6">
      <ScreenHeader title={dict.profile.title} />

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

      <Card className="space-y-3">
        <p className="text-sm font-semibold text-text-secondary">{dict.profile.accessibilityTitle}</p>

        <div className="flex items-center justify-between">
          <span className="text-text-primary">{dict.profile.fontSizeLabel}</span>
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
        </div>

        <div className="flex items-center justify-between">
          <span className="text-text-primary">{dict.profile.highContrastLabel}</span>
          <button
            onClick={() => save({ highContrast: !user.highContrast })}
            className={clsx(
              "tap-target w-14 rounded-full transition",
              user.highContrast ? "bg-primary" : "bg-surface-muted"
            )}
          >
            <span
              className={clsx(
                "block h-6 w-6 rounded-full bg-white shadow transition-transform",
                user.highContrast ? "translate-x-7" : "translate-x-1"
              )}
            />
          </button>
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
