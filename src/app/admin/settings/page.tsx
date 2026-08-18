"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, BellRing, CheckCircle2, Image as ImageIcon, Megaphone, Send } from "lucide-react";
import { Button, Card, Field, Input, Textarea } from "@/components/ui";
import {
  apiDisconnectAdminTelegramBot,
  apiGetAdminGuideMedia,
  apiGetAdminHighRiskInfo,
  apiGetAdminTelegramSettings,
  apiGetReminderSettings,
  apiSaveAdminGuideMedia,
  apiSaveAdminHighRiskInfo,
  apiSaveAdminTelegramBot,
  apiSaveReminderSettings,
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

      <ReminderSettingsCard t={t} />
      <HighRiskInfoCard t={t} />
      <GuideMediaCard t={t} />
    </div>
  );
}

function GuideMediaCard({ t }: { t: ReturnType<typeof useT> }) {
  const [imageUrls, setImageUrls] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGetAdminGuideMedia().then((m) => {
      setImageUrls(m.imageUrls);
      setVideoUrl(m.videoUrl);
    });
  }, []);

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      await apiSaveAdminGuideMedia(imageUrls, videoUrl);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.errorGeneric);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-xl p-6">
      <div className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
          <ImageIcon size={18} />
        </span>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t.adminSettings.guideMediaTitle}</h2>
      </div>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t.adminSettings.guideMediaSubtitle}</p>

      <div className="mt-5 flex flex-col gap-3">
        <Field label={t.adminSettings.guideMediaImagesLabel}>
          <Textarea rows={4} value={imageUrls} onChange={(e) => setImageUrls(e.target.value)} placeholder={t.adminSettings.guideMediaImagesPlaceholder} />
        </Field>
        <Field label={t.adminSettings.guideMediaVideoLabel}>
          <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder={t.adminSettings.guideMediaVideoPlaceholder} />
        </Field>

        {saved && <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{t.adminSettings.guideMediaSaved}</p>}
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

        <Button onClick={handleSave} disabled={saving} className="self-start">
          {saving ? t.adminSettings.guideMediaSavingButton : t.adminSettings.guideMediaSaveButton}
        </Button>
      </div>
    </Card>
  );
}

function ReminderSettingsCard({ t }: { t: ReturnType<typeof useT> }) {
  const [retestDays, setRetestDays] = useState("90");
  const [selfExamDays, setSelfExamDays] = useState("30");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGetReminderSettings().then((s) => {
      setRetestDays(String(s.retestDays));
      setSelfExamDays(String(s.selfExamDays));
    });
  }, []);

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      await apiSaveReminderSettings({ retestDays: Number(retestDays), selfExamDays: Number(selfExamDays) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.errorGeneric);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-xl p-6">
      <div className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
          <BellRing size={18} />
        </span>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t.adminSettings.remindersTitle}</h2>
      </div>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t.adminSettings.remindersSubtitle}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Field label={t.adminSettings.retestDaysLabel}>
          <Input type="number" min={1} value={retestDays} onChange={(e) => setRetestDays(e.target.value)} />
        </Field>
        <Field label={t.adminSettings.selfExamDaysLabel}>
          <Input type="number" min={1} value={selfExamDays} onChange={(e) => setSelfExamDays(e.target.value)} />
        </Field>
      </div>

      {saved && <p className="mt-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">{t.adminSettings.remindersSaved}</p>}
      {error && <p className="mt-3 text-xs text-red-600 dark:text-red-400">{error}</p>}

      <Button onClick={handleSave} disabled={saving} className="mt-4 self-start">
        {saving ? t.adminSettings.remindersSavingButton : t.adminSettings.remindersSaveButton}
      </Button>
    </Card>
  );
}

function HighRiskInfoCard({ t }: { t: ReturnType<typeof useT> }) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGetAdminHighRiskInfo().then(setText);
  }, []);

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      await apiSaveAdminHighRiskInfo(text);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.errorGeneric);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-xl p-6">
      <div className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
          <AlertTriangle size={18} />
        </span>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t.adminSettings.highRiskTitle}</h2>
      </div>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t.adminSettings.highRiskSubtitle}</p>

      <div className="mt-5 flex flex-col gap-3">
        <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder={t.adminSettings.highRiskPlaceholder} />

        {saved && <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{t.adminSettings.highRiskSaved}</p>}
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

        <Button onClick={handleSave} disabled={saving} className="self-start">
          {saving ? t.adminSettings.highRiskSavingButton : t.adminSettings.highRiskSaveButton}
        </Button>
      </div>
    </Card>
  );
}
