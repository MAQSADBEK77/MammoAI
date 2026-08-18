"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Archive, BellRing, CheckCircle2, Cpu, Image as ImageIcon, Megaphone, Send } from "lucide-react";
import { Button, Card, Field, Input, Textarea } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import {
  apiDisconnectAdminTelegramBot,
  apiGetAdminGuideMedia,
  apiGetAdminHighRiskInfo,
  apiGetAdminTelegramSettings,
  apiGetBackups,
  apiGetReminderSettings,
  apiGetSystemStatus,
  apiRestoreBackup,
  apiSaveAdminGuideMedia,
  apiSaveAdminHighRiskInfo,
  apiSaveAdminTelegramBot,
  apiSaveReminderSettings,
  apiSendAdminTelegramBroadcast,
  type AdminTelegramSettings,
  type BackupFile,
  type SystemStatus,
} from "@/lib/store";
import { formatDateTime } from "@/lib/format";
import { useLanguage, useT } from "@/lib/i18n/context";

export default function AdminSettingsPage() {
  const t = useT();
  const { user: me } = useAuth();
  const isFullAdmin = me?.role === "admin";
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
        <h1 className="text-2xl font-bold text-pink-900 dark:text-white">{t.adminSettings.title}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.adminSettings.subtitle}</p>
      </div>

      <Card className="max-w-xl p-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400">
            <Send size={18} />
          </span>
          <h2 className="text-base font-semibold text-pink-900 dark:text-white">{t.adminSettings.telegramTitle}</h2>
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
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400">
              <Megaphone size={18} />
            </span>
            <h2 className="text-base font-semibold text-pink-900 dark:text-white">{t.adminSettings.broadcastTitle}</h2>
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
      {isFullAdmin && <SystemStatusCard t={t} />}
      {isFullAdmin && <BackupsCard t={t} />}
    </div>
  );
}

function SystemStatusCard({ t }: { t: ReturnType<typeof useT> }) {
  const [status, setStatus] = useState<SystemStatus | null>(null);

  useEffect(() => {
    apiGetSystemStatus().then(setStatus);
  }, []);

  function formatUptime(seconds: number) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <Card className="max-w-xl p-6">
      <div className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400">
          <Cpu size={18} />
        </span>
        <h2 className="text-base font-semibold text-pink-900 dark:text-white">{t.adminSettings.systemStatusTitle}</h2>
      </div>

      {status && (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-lg font-bold text-pink-900 dark:text-white">{formatUptime(status.appUptimeSeconds)}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{t.adminSettings.uptimeLabel}</p>
          </div>
          <div>
            <p className="text-lg font-bold text-pink-900 dark:text-white">{formatBytes(status.dbSizeBytes)}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{t.adminSettings.dbSizeLabel}</p>
          </div>
          <div>
            <p className="text-lg font-bold text-pink-900 dark:text-white">{status.backupCount}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{t.adminSettings.backupCountLabel}</p>
          </div>
          <div>
            <p className="text-sm font-bold text-pink-900 dark:text-white">
              {status.lastBackupAt ? new Date(status.lastBackupAt).toLocaleString() : t.adminSettings.neverLabel}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{t.adminSettings.lastBackupLabel}</p>
          </div>
        </div>
      )}
    </Card>
  );
}

function BackupsCard({ t }: { t: ReturnType<typeof useT> }) {
  const { language } = useLanguage();
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [target, setTarget] = useState<BackupFile | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGetBackups().then(setBackups);
  }, []);

  function formatBytes(bytes: number) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function handleRestore() {
    if (!target || confirmText !== target.filename) return;
    setRestoring(true);
    setError(null);
    try {
      await apiRestoreBackup(target.filename);
      // The server process exits right after responding (pm2 restarts it) —
      // nothing more to do here but wait it out.
    } catch (err) {
      setError(err instanceof Error ? err.message : t.adminContent.errorSave);
      setRestoring(false);
    }
  }

  return (
    <Card className="max-w-xl p-6">
      <div className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
          <Archive size={18} />
        </span>
        <h2 className="text-base font-semibold text-pink-900 dark:text-white">{t.adminSettings.backupsTitle}</h2>
      </div>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t.adminSettings.backupsSubtitle}</p>

      {restoring ? (
        <p className="mt-5 text-sm font-medium text-amber-600 dark:text-amber-400">{t.adminSettings.restoreInProgress}</p>
      ) : (
        <div className="mt-5 flex flex-col gap-2">
          {backups.map((b) => (
            <div key={b.filename} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-pink-900 dark:text-white">{formatDateTime(b.createdAt, language)}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {b.filename} · {formatBytes(b.sizeBytes)}
                  </p>
                </div>
                {target?.filename !== b.filename && (
                  <Button variant="ghost" size="sm" onClick={() => { setTarget(b); setConfirmText(""); setError(null); }}>
                    {t.adminSettings.restoreButton}
                  </Button>
                )}
              </div>
              {target?.filename === b.filename && (
                <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {t.adminSettings.restoreConfirmPrompt.replace("{filename}", b.filename)}
                  </p>
                  <Input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={t.adminSettings.restoreConfirmPlaceholder}
                  />
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setTarget(null)}>
                      {t.adminSettings.restoreCancel}
                    </Button>
                    <Button variant="danger" size="sm" onClick={handleRestore} disabled={confirmText !== b.filename}>
                      {t.adminSettings.restoreConfirmButton}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {backups.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500">{t.adminSettings.backupsEmpty}</p>}
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
      )}
    </Card>
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
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400">
          <ImageIcon size={18} />
        </span>
        <h2 className="text-base font-semibold text-pink-900 dark:text-white">{t.adminSettings.guideMediaTitle}</h2>
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
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400">
          <BellRing size={18} />
        </span>
        <h2 className="text-base font-semibold text-pink-900 dark:text-white">{t.adminSettings.remindersTitle}</h2>
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
        <h2 className="text-base font-semibold text-pink-900 dark:text-white">{t.adminSettings.highRiskTitle}</h2>
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
