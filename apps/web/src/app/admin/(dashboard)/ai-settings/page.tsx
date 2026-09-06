"use client";

import { useEffect, useState } from "react";
import { adminApi, type AiSettings } from "@/lib/admin-api";
import { Card, Button, Badge } from "@/components/ui";

function inputClass() {
  return "tap-target w-full rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
}

export default function AdminAiSettingsPage() {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [keyInput, setKeyInput] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    adminApi.aiSettings
      .get()
      .then(setSettings)
      .catch((err) => setError(err instanceof Error ? err.message : "Yuklashda xatolik"));
  }

  useEffect(() => {
    const timeout = setTimeout(load, 0);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveKey() {
    if (!keyInput.trim()) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await adminApi.aiSettings.update({ apiKey: keyInput.trim() });
      setKeyInput("");
      setSuccess("Kalit saqlandi.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-text-primary">AI Yordamchi</h1>
        <Card className="py-10 text-center text-sm text-text-muted">Yuklanmoqda…</Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">AI Yordamchi</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Foydalanuvchilarning &quot;Yordamchi&quot; bo&apos;limidagi suhbatlarini Claude (Anthropic) API orqali boshqaradi.
        </p>
      </div>

      {error && <Card className="border border-danger/20 bg-danger/5 text-sm font-medium text-danger">{error}</Card>}
      {success && <Card className="border border-success/20 bg-success/5 text-sm font-medium text-success">{success}</Card>}

      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-text-primary">Holat</h2>
          {settings.hasKey ? <Badge tone="success">Sozlangan</Badge> : <Badge tone="warning">Sozlanmagan</Badge>}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-text-secondary">Anthropic API kaliti</p>
          {settings.maskedKey && <p className="text-xs text-text-muted">Joriy: {settings.maskedKey}</p>}
          <div className="flex gap-2">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="sk-ant-..."
              className={inputClass()}
            />
            <Button onClick={saveKey} disabled={saving || !keyInput.trim()} className="shrink-0 px-5!">
              {saving ? "Saqlanmoqda…" : "Saqlash"}
            </Button>
          </div>
          <p className="text-xs text-text-muted">
            Kalitni <code className="rounded bg-surface-muted px-1">console.anthropic.com</code> → API Keys bo&apos;limidan olish mumkin.
          </p>
        </div>
      </Card>
    </div>
  );
}
