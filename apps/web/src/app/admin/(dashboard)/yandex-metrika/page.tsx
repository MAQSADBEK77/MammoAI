"use client";

import { useEffect, useState } from "react";
import { adminApi, type YandexMetrikaSettings } from "@/lib/admin-api";
import { Card, Button, Badge } from "@/components/ui";

function inputClass() {
  return "tap-target w-full rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
}

/** YANDEX-METRIKA-01: sozlama sahifasi — Telegram bot/AI Yordamchi
 * sahifalari bilan bir xil naqsh (`app_settings`da saqlash, token hech qachon
 * to'liq mijozga qaytmaydi). "Saqlash" va "Ulanishni tekshirish" ATAYLAB
 * ikkita alohida tugma — saqlash darhol tekshirmaydi, tekshirish esa har doim
 * SAQLANGAN qiymatlar bilan ishlaydi. */
export default function AdminYandexMetrikaPage() {
  const [settings, setSettings] = useState<YandexMetrikaSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [tokenInput, setTokenInput] = useState("");
  const [counterIdInput, setCounterIdInput] = useState("");
  const [saving, setSaving] = useState(false);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  function load() {
    adminApi.yandexMetrika
      .get()
      .then((res) => {
        setSettings(res);
        setCounterIdInput(res.counterId ?? "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Yuklashda xatolik"));
  }

  useEffect(() => {
    const timeout = setTimeout(load, 0);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    const patch: { token?: string; counterId?: string } = {};
    if (tokenInput.trim()) patch.token = tokenInput.trim();
    if (counterIdInput.trim()) patch.counterId = counterIdInput.trim();
    if (!patch.token && !patch.counterId) return;

    setSaving(true);
    setError(null);
    setSuccess(null);
    setTestResult(null);
    try {
      await adminApi.yandexMetrika.update(patch);
      setTokenInput("");
      setSuccess("Sozlamalar saqlandi. Endi \"Ulanishni tekshirish\"ni bosing.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  }

  async function testConnection() {
    setTesting(true);
    setError(null);
    setSuccess(null);
    setTestResult(null);
    try {
      const res = await adminApi.yandexMetrika.test();
      setTestResult({ ok: true, message: res.message });
    } catch (err) {
      setTestResult({ ok: false, message: err instanceof Error ? err.message : "Ulanishni tekshirishda xatolik" });
    } finally {
      setTesting(false);
    }
  }

  if (!settings) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-text-primary">Yandex Metrika</h1>
        <Card className="py-10 text-center text-sm text-text-muted">Yuklanmoqda…</Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Yandex Metrika</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Saytga (mammo.uz) allaqachon ulangan Yandex Metrika hisobingizdan tashrifchi-analitikasini{" "}
          <code className="rounded bg-surface-muted px-1">/admin/analitika</code> sahifasida ko&apos;rsatish uchun
        </p>
      </div>

      {error && <Card className="border border-danger/20 bg-danger/5 text-sm font-medium text-danger">{error}</Card>}
      {success && <Card className="border border-success/20 bg-success/5 text-sm font-medium text-success">{success}</Card>}

      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-text-primary">Holat</h2>
          {settings.hasToken && settings.counterId ? (
            <Badge tone="success">Sozlangan</Badge>
          ) : (
            <Badge tone="warning">Sozlanmagan</Badge>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-text-secondary">Hisoblagich (Counter) ID</p>
          {settings.counterId && <p className="text-xs text-text-muted">Joriy: {settings.counterId}</p>}
          <input
            value={counterIdInput}
            onChange={(e) => setCounterIdInput(e.target.value)}
            placeholder="masalan 112748907"
            className={inputClass()}
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-text-secondary">OAuth token (Reporting API uchun)</p>
          {settings.maskedToken && <p className="text-xs text-text-muted">Joriy: {settings.maskedToken}</p>}
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="y0_AgAAAA..."
            className={inputClass()}
          />
          <p className="text-xs text-text-muted">
            Token{" "}
            <a
              href="https://yandex.ru/dev/metrika/ru/intro/authorization"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-primary underline"
            >
              yandex.ru/dev/metrika
            </a>
            dagi &quot;Debug&quot; usuli orqali olinadi — bir marta, muddatsiz amal qiladi.
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving || (!tokenInput.trim() && !counterIdInput.trim())}>
            {saving ? "Saqlanmoqda…" : "Saqlash"}
          </Button>
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-base font-bold text-text-primary">Ulanishni tekshirish</h2>
        <p className="text-xs text-text-secondary">
          Saqlangan counter ID va token bilan Yandex Metrika&apos;ga haqiqiy, kichik so&apos;rov yuboradi — token/counter ID
          to&apos;g&apos;ri ekanini tasdiqlaydi.
        </p>
        {testResult && (
          <Card
            className={
              testResult.ok
                ? "border border-success/20 bg-success/5 text-sm font-medium text-success"
                : "border border-danger/20 bg-danger/5 text-sm font-medium text-danger"
            }
          >
            {testResult.message}
          </Card>
        )}
        <div className="flex justify-end">
          <Button
            variant="secondary"
            onClick={testConnection}
            disabled={testing || !settings.hasToken || !settings.counterId}
          >
            {testing ? "Tekshirilmoqda…" : "Ulanishni tekshirish"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
