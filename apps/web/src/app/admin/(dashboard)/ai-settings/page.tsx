"use client";

import { useEffect, useState } from "react";
import { adminApi, type AiProvider, type AiSettings } from "@/lib/admin-api";
import { Card, Button, Badge } from "@/components/ui";
import clsx from "clsx";

function inputClass() {
  return "tap-target w-full rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
}

const PROVIDERS: { value: AiProvider; label: string }[] = [
  { value: "gemini", label: "Google Gemini" },
  { value: "huawei_maas", label: "Huawei Cloud MaaS (GLM/DeepSeek)" },
];

export default function AdminAiSettingsPage() {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [provider, setProvider] = useState<AiProvider>("gemini");
  const [geminiKeyInput, setGeminiKeyInput] = useState("");
  const [huaweiKeyInput, setHuaweiKeyInput] = useState("");
  const [huaweiModelInput, setHuaweiModelInput] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    adminApi.aiSettings
      .get()
      .then((res) => {
        setSettings(res);
        setProvider(res.provider);
        setHuaweiModelInput(res.huaweiModel);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Yuklashda xatolik"));
  }

  useEffect(() => {
    const timeout = setTimeout(load, 0);
    return () => clearTimeout(timeout);
  }, []);

  async function saveProvider(next: AiProvider) {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await adminApi.aiSettings.update({ provider: next });
      setProvider(next);
      setSuccess("Provayder o'zgartirildi.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  }

  async function saveGeminiKey() {
    if (!geminiKeyInput.trim()) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await adminApi.aiSettings.update({ geminiApiKey: geminiKeyInput.trim() });
      setGeminiKeyInput("");
      setSuccess("Gemini kaliti saqlandi.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  }

  async function saveHuawei() {
    if (!huaweiKeyInput.trim() && !huaweiModelInput.trim()) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await adminApi.aiSettings.update({
        huaweiApiKey: huaweiKeyInput.trim() || undefined,
        huaweiModel: huaweiModelInput.trim() || undefined,
      });
      setHuaweiKeyInput("");
      setSuccess("Huawei MaaS sozlamalari saqlandi.");
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
          Foydalanuvchilarning &quot;Yordamchi&quot; bo&apos;limidagi suhbatlarini boshqaradigan model va provayder.
        </p>
      </div>

      {error && <Card className="border border-danger/20 bg-danger/5 text-sm font-medium text-danger">{error}</Card>}
      {success && <Card className="border border-success/20 bg-success/5 text-sm font-medium text-success">{success}</Card>}

      <Card className="flex flex-col gap-4">
        <h2 className="text-base font-bold text-text-primary">Joriy provayder</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          {PROVIDERS.map((p) => (
            <button
              key={p.value}
              type="button"
              disabled={saving}
              onClick={() => p.value !== provider && saveProvider(p.value)}
              className={clsx(
                "tap-target flex-1 rounded-2xl border-2 px-4 py-3 text-sm font-semibold transition",
                provider === p.value ? "border-primary bg-primary-light text-primary-dark" : "border-border bg-surface text-text-secondary"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-text-primary">Google Gemini</h2>
          {settings.hasGeminiKey ? <Badge tone="success">Sozlangan</Badge> : <Badge tone="warning">Sozlanmagan</Badge>}
        </div>
        <div className="flex flex-col gap-2">
          {settings.maskedGeminiKey && <p className="text-xs text-text-muted">Joriy: {settings.maskedGeminiKey}</p>}
          <div className="flex gap-2">
            <input type="password" value={geminiKeyInput} onChange={(e) => setGeminiKeyInput(e.target.value)} placeholder="AIza..." className={inputClass()} />
            <Button onClick={saveGeminiKey} disabled={saving || !geminiKeyInput.trim()} className="shrink-0 px-5!">
              Saqlash
            </Button>
          </div>
          <p className="text-xs text-text-muted">
            Kalitni (bepul) <code className="rounded bg-surface-muted px-1">aistudio.google.com/apikey</code> orqali olish mumkin.
          </p>
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-text-primary">Huawei Cloud MaaS</h2>
          {settings.hasHuaweiKey ? <Badge tone="success">Sozlangan</Badge> : <Badge tone="warning">Sozlanmagan</Badge>}
        </div>
        <div className="flex flex-col gap-3">
          {settings.maskedHuaweiKey && <p className="text-xs text-text-muted">Joriy kalit: {settings.maskedHuaweiKey}</p>}
          <div className="flex gap-2">
            <input
              type="password"
              value={huaweiKeyInput}
              onChange={(e) => setHuaweiKeyInput(e.target.value)}
              placeholder="MaaS API kaliti"
              className={inputClass()}
            />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-text-secondary">Model (masalan glm-5.2, deepseek-v4-flash)</p>
            <input
              type="text"
              value={huaweiModelInput}
              onChange={(e) => setHuaweiModelInput(e.target.value)}
              placeholder="glm-5.2"
              className={inputClass()}
            />
          </div>
          <Button onClick={saveHuawei} disabled={saving || (!huaweiKeyInput.trim() && !huaweiModelInput.trim())} className="self-start px-5!">
            Saqlash
          </Button>
          <p className="text-xs text-text-muted">
            ModelArts Studio (MaaS) konsolidan olinadi — modelga ruxsat berilgan bo&apos;lishi kerak (403 xatosi ruxsat yo&apos;qligini bildiradi).
          </p>
        </div>
      </Card>
    </div>
  );
}
