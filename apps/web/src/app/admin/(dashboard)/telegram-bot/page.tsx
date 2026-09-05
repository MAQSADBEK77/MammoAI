"use client";

import { useEffect, useState } from "react";
import { adminApi, type TelegramBotSettings } from "@/lib/admin-api";
import { Card, Button, Badge } from "@/components/ui";

function inputClass() {
  return "tap-target w-full rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
}

export default function AdminTelegramBotPage() {
  const [settings, setSettings] = useState<TelegramBotSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [tokenInput, setTokenInput] = useState("");
  const [savingToken, setSavingToken] = useState(false);

  const [name, setName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  function load() {
    adminApi.telegramBot
      .get()
      .then((res) => {
        setSettings(res);
        setName(res.name ?? "");
        setShortDescription(res.shortDescription ?? "");
        setDescription(res.description ?? "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Yuklashda xatolik"));
  }

  useEffect(() => {
    const timeout = setTimeout(load, 0);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveToken() {
    if (!tokenInput.trim()) return;
    setSavingToken(true);
    setError(null);
    setSuccess(null);
    try {
      await adminApi.telegramBot.update({ token: tokenInput.trim() });
      setTokenInput("");
      setSuccess("Token saqlandi va webhook o'rnatildi.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saqlashda xatolik — token noto'g'ri bo'lishi mumkin");
    } finally {
      setSavingToken(false);
    }
  }

  async function saveProfile() {
    setSavingProfile(true);
    setError(null);
    setSuccess(null);
    try {
      await adminApi.telegramBot.update({ name, description, shortDescription });
      setSuccess("Bot profili yangilandi.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saqlashda xatolik");
    } finally {
      setSavingProfile(false);
    }
  }

  if (!settings) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-text-primary">Telegram bot</h1>
        <Card className="py-10 text-center text-sm text-text-muted">Yuklanmoqda…</Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Telegram bot</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Foydalanuvchilar telefon raqamini shu bot orqali tasdiqlaydi (onboarding&apos;dagi &quot;Telegram orqali tasdiqlang&quot; bosqichi)
        </p>
      </div>

      {error && <Card className="border border-danger/20 bg-danger/5 text-sm font-medium text-danger">{error}</Card>}
      {success && <Card className="border border-success/20 bg-success/5 text-sm font-medium text-success">{success}</Card>}

      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-text-primary">Holat</h2>
          {settings.hasToken ? (
            settings.tokenValid ? (
              <Badge tone="success">Ulangan — @{settings.username}</Badge>
            ) : (
              <Badge tone="danger">Token noto&apos;g&apos;ri</Badge>
            )
          ) : (
            <Badge tone="warning">Sozlanmagan</Badge>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-text-secondary">Bot tokeni (@BotFather dan)</p>
          {settings.maskedToken && <p className="text-xs text-text-muted">Joriy: {settings.maskedToken}</p>}
          <div className="flex gap-2">
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="123456789:AAH..."
              className={inputClass()}
            />
            <Button onClick={saveToken} disabled={savingToken || !tokenInput.trim()} className="shrink-0 px-5!">
              {savingToken ? "Saqlanmoqda…" : "Saqlash"}
            </Button>
          </div>
          <p className="text-xs text-text-muted">
            Saqlaganda avtomatik tekshiriladi va webhook shu saytga (
            <code className="rounded bg-surface-muted px-1">/api/telegram/webhook</code>) o&apos;rnatiladi — qo&apos;shimcha sozlash shart emas.
          </p>
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-base font-bold text-text-primary">Bot profili</h2>
        <p className="-mt-2 text-xs text-text-muted">
          Profil rasmini (avatar) Telegram Bot API orqali o&apos;zgartirib bo&apos;lmaydi — buni faqat @BotFather&apos;da qo&apos;lda (
          <code className="rounded bg-surface-muted px-1">/setuserpic</code>) qilish mumkin.
        </p>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-secondary">Bot nomi</label>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={64} className={inputClass()} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-secondary">Qisqa tavsif (bot ochilganda ko&apos;rinadi, 120 belgigacha)</label>
          <textarea
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            maxLength={120}
            rows={2}
            className={`${inputClass()} h-auto! resize-none py-3`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-secondary">To&apos;liq tavsif (bot profilida, 512 belgigacha)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={512}
            rows={4}
            className={`${inputClass()} h-auto! resize-none py-3`}
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={saveProfile} disabled={savingProfile || !settings.hasToken}>
            {savingProfile ? "Saqlanmoqda…" : "Profilni saqlash"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
