"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Megaphone, Send } from "lucide-react";
import { Button, Card, Field, Input, Textarea } from "@/components/ui";
import {
  apiDisconnectAdminTelegramBot,
  apiGetAdminTelegramSettings,
  apiSaveAdminTelegramBot,
  apiSendAdminTelegramBroadcast,
  type AdminTelegramSettings,
} from "@/lib/store";
import { useT } from "@/lib/i18n/context";

export default function AdminSettingsPage() {
  const t = useT();
  const [settings, setSettings] = useState<AdminTelegramSettings | null>(null);
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [broadcastText, setBroadcastText] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);
  const [broadcastResult, setBroadcastResult] = useState<string | null>(null);

  function reload() {
    apiGetAdminTelegramSettings().then(setSettings);
  }

  useEffect(reload, []);

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      await apiSaveAdminTelegramBot(token.trim());
      setToken("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.errorGeneric);
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect() {
    if (!window.confirm(t.adminSettings.disconnectConfirm)) return;
    await apiDisconnectAdminTelegramBot();
    reload();
  }

  async function handleBroadcast() {
    if (!broadcastText.trim()) return;
    if (!window.confirm(t.adminSettings.broadcastConfirm)) return;
    setBroadcastError(null);
    setBroadcastResult(null);
    setBroadcasting(true);
    try {
      const { sent, failed } = await apiSendAdminTelegramBroadcast(broadcastText.trim());
      setBroadcastResult(
        failed > 0
          ? t.adminSettings.broadcastPartial.replace("{sent}", String(sent)).replace("{failed}", String(failed))
          : t.adminSettings.broadcastSuccess.replace("{sent}", String(sent))
      );
      setBroadcastText("");
    } catch (err) {
      setBroadcastError(err instanceof Error ? err.message : t.adminSettings.broadcastError);
    } finally {
      setBroadcasting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.adminSettings.title}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.adminSettings.subtitle}</p>
      </div>

      <Card className="max-w-xl p-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <Send size={18} />
          </span>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t.adminSettings.telegramTitle}</h2>
        </div>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t.adminSettings.telegramSubtitle}</p>

        {settings?.configured ? (
          <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 dark:bg-emerald-500/10">
            <span className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 size={16} />
              {t.adminSettings.connectedAs} @{settings.botUsername}
            </span>
            <Button variant="ghost" size="sm" onClick={handleDisconnect}>
              {t.adminSettings.disconnectButton}
            </Button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">{t.adminSettings.notConnected}</p>
        )}

        <div className="mt-5 flex flex-col gap-3">
          <Field label={t.adminSettings.tokenLabel} hint={t.adminSettings.tokenHint}>
            <Input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={t.adminSettings.tokenPlaceholder}
            />
          </Field>

          {saved && (
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {t.adminSettings.connectedAs} @{settings?.botUsername}
            </p>
          )}
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

          <Button onClick={handleSave} disabled={saving || !token.trim()} className="self-start">
            {saving ? t.adminSettings.savingButton : t.adminSettings.saveButton}
          </Button>
        </div>
      </Card>

      {settings?.configured && (
        <Card className="max-w-xl p-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <Megaphone size={18} />
            </span>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t.adminSettings.broadcastTitle}</h2>
          </div>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t.adminSettings.broadcastSubtitle}</p>

          <div className="mt-5 flex flex-col gap-3">
            <Textarea
              rows={4}
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              placeholder={t.adminSettings.broadcastPlaceholder}
            />

            {broadcastResult && (
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{broadcastResult}</p>
            )}
            {broadcastError && <p className="text-xs text-red-600 dark:text-red-400">{broadcastError}</p>}

            <Button onClick={handleBroadcast} disabled={broadcasting || !broadcastText.trim()} className="self-start">
              {broadcasting ? t.adminSettings.broadcastSendingButton : t.adminSettings.broadcastButton}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
