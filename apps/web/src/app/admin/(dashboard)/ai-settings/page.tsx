"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, type AiProbeResult, type AiProvider, type AiSettings } from "@/lib/admin-api";
import { Card, Button, Badge, ErrorState } from "@/components/ui";
import clsx from "clsx";

function inputClass() {
  return "tap-target w-full rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
}

const PROVIDERS: { value: AiProvider; label: string }[] = [
  { value: "gemini", label: "Google Gemini" },
  { value: "huawei_maas", label: "Huawei Cloud MaaS (GLM/DeepSeek)" },
  { value: "anthropic", label: "Anthropic (Claude)" },
];

// Ochiq manbalarga ko'ra (Huawei'ning o'zi API orqali aniq kvota qoldig'ini
// berish imkoni yo'q) — GLM modellari uchun bepul reja kuniga ~10M token.
// FAQAT taxminiy ma'lumot-nuqta, aniq holatni Huawei konsolidan tekshirish kerak.
const HUAWEI_DAILY_REFERENCE = 10_000_000;

export default function AdminAiSettingsPage() {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  // OVERNIGHT-02: bu ilgari BITTA `error` holati bilan ham boshlang'ich
  // yuklash, ham saqlash-amali xatosini bildirardi — pastdagi `if (!settings)`
  // tekshiruvi har doim BIRINCHI ishga tushgani uchun, yuklash muvaffaqiyatsiz
  // bo'lsa ham `error` matni HECH QACHON ko'rinmasdi ("Yuklanmoqda…" abadiy
  // qolib ketardi) — UX-00 seriyasida butun ilova bo'ylab tuzatilgan xato
  // sinfi, bu (bugungi kechqurun qo'shilgan) sahifada hali bor edi. Endi
  // ikkitasi mustaqil (`loadError` vs `error`), UX-04-Admin'dagi
  // ReportsQueue bilan bir xil naqsh.
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [provider, setProvider] = useState<AiProvider>("gemini");
  const [geminiKeyInput, setGeminiKeyInput] = useState("");
  const [huaweiKeyInput, setHuaweiKeyInput] = useState("");
  const [huaweiModelInput, setHuaweiModelInput] = useState("");
  const [anthropicKeyInput, setAnthropicKeyInput] = useState("");
  const [anthropicModelInput, setAnthropicModelInput] = useState("");
  const [saving, setSaving] = useState(false);
  // AI-RELIABILITY-01: jonli sinov natijalari.
  const [probing, setProbing] = useState(false);
  const [probeResults, setProbeResults] = useState<AiProbeResult[] | null>(null);

  const load = useCallback(() => {
    setLoadError(null);
    adminApi.aiSettings
      .get()
      .then((res) => {
        setSettings(res);
        setProvider(res.provider);
        setHuaweiModelInput(res.huaweiModel);
        setAnthropicModelInput(res.anthropicModel);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Yuklashda xatolik"));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(load, 0);
    return () => clearTimeout(timeout);
  }, [load]);

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

  async function saveAnthropic() {
    if (!anthropicKeyInput.trim() && !anthropicModelInput.trim()) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await adminApi.aiSettings.update({
        anthropicApiKey: anthropicKeyInput.trim() || undefined,
        anthropicModel: anthropicModelInput.trim() || undefined,
      });
      setAnthropicKeyInput("");
      setSuccess("Anthropic sozlamalari saqlandi.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  }

  async function runProbe() {
    setProbing(true);
    setError(null);
    setProbeResults(null);
    try {
      const res = await adminApi.aiSettings.probe();
      setProbeResults(res.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sinovda xatolik");
    } finally {
      setProbing(false);
    }
  }

  if (loadError) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-text-primary">AI Yordamchi</h1>
        <ErrorState message={loadError} retry={{ label: "Qayta urinish", onClick: load }} />
      </div>
    );
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

      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-text-primary">Bugungi foydalanish</h2>
          <span className="text-xs text-text-muted">{PROVIDERS.find((p) => p.value === settings.provider)?.label}</span>
        </div>
        <p className="text-2xl font-extrabold text-text-primary">
          {settings.usageToday.toLocaleString("ru-RU")} <span className="text-sm font-medium text-text-muted">token</span>
        </p>
        {settings.provider === "huawei_maas" && (
          <>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, (settings.usageToday / HUAWEI_DAILY_REFERENCE) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-text-muted">
              Taxminan {Math.round((settings.usageToday / HUAWEI_DAILY_REFERENCE) * 100)}% — ochiq manbalarga ko&apos;ra Huawei MaaS bepul rejasi
              kuniga ~10M token (GLM). Aniq raqamni Huawei konsolidan tekshiring — bu FAQAT bizning o&apos;z hisobimiz.
            </p>
          </>
        )}
        <div className="mt-1 flex items-end gap-1.5">
          {settings.usageHistory.map((d) => {
            const max = Math.max(1, ...settings.usageHistory.map((x) => x.totalTokens));
            const heightPct = d.totalTokens > 0 ? Math.max((d.totalTokens / max) * 100, 4) : 0;
            return (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-16 w-full items-end">
                  <div className="w-full rounded-t bg-primary/70" style={{ height: `${heightPct}%` }} />
                </div>
                <span className="text-[10px] text-text-muted">{d.day.slice(5)}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* AI-RELIABILITY-01: ilgari provayder ishlayaptimi-yo'qmi bilishning
          yagona yo'li foydalanuvchining shikoyati edi. Endi har bir
          provayderga haqiqiy so'rov yuborib, holatini shu yerda ko'rish
          mumkin. */}
      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-text-primary">Holat tekshiruvi</h2>
            <p className="mt-0.5 text-xs text-text-muted">
              Har bir provayderga haqiqiy so&apos;rov yuboradi (oz miqdorda token sarflaydi).
            </p>
          </div>
          <Button onClick={runProbe} disabled={probing} className="shrink-0 px-5!">
            {probing ? "Tekshirilmoqda…" : "Tekshirish"}
          </Button>
        </div>
        {probeResults && (
          <div className="flex flex-col gap-2">
            {probeResults.map((r) => (
              <div key={r.provider} className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-surface-muted px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary">
                    {PROVIDERS.find((p) => p.value === r.provider)?.label ?? r.provider}
                    {r.provider === settings.provider && <span className="ml-2 text-xs font-medium text-text-muted">(joriy)</span>}
                  </p>
                  <p className="mt-0.5 break-words text-xs text-text-secondary">{r.detail}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {r.ok ? <Badge tone="success">Ishlayapti</Badge> : <Badge tone="danger">Ishlamayapti</Badge>}
                  <span className="text-[10px] text-text-muted">{(r.ms / 1000).toFixed(1)}s</span>
                </div>
              </div>
            ))}
            <p className="text-xs text-text-muted">
              Joriy provayder ishlamasa, kaliti bor qolgan provayderlar avtomatik zaxira sifatida ishlatiladi — yordamchi
              faqat HAMMASI yiqilgandagina to&apos;xtaydi.
            </p>
          </div>
        )}
      </Card>

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

      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-text-primary">Anthropic (Claude)</h2>
          {settings.hasAnthropicKey ? <Badge tone="success">Sozlangan</Badge> : <Badge tone="warning">Sozlanmagan</Badge>}
        </div>
        <div className="flex flex-col gap-3">
          {settings.maskedAnthropicKey && <p className="text-xs text-text-muted">Joriy kalit: {settings.maskedAnthropicKey}</p>}
          <input
            type="password"
            value={anthropicKeyInput}
            onChange={(e) => setAnthropicKeyInput(e.target.value)}
            placeholder="sk-ant-..."
            className={inputClass()}
          />
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-text-secondary">Model</p>
            <input
              type="text"
              value={anthropicModelInput}
              onChange={(e) => setAnthropicModelInput(e.target.value)}
              placeholder="claude-haiku-4-5-20251001"
              className={inputClass()}
            />
          </div>
          <Button onClick={saveAnthropic} disabled={saving || (!anthropicKeyInput.trim() && !anthropicModelInput.trim())} className="self-start px-5!">
            Saqlash
          </Button>
          <p className="text-xs text-text-muted">
            <code className="rounded bg-surface-muted px-1">console.anthropic.com</code> orqali olinadi. Hisobda balans bo&apos;lishi SHART —
            balans tugasa API &quot;credit balance is too low&quot; xatosini qaytaradi va provayder ishlamaydi.
          </p>
        </div>
      </Card>
    </div>
  );
}
