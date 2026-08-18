"use client";

import { useEffect, useState } from "react";
import { BellRing, CheckCircle2, KeyRound, MessageSquareText, Pencil, Save, Send, Sparkles, X } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { RequireAuth } from "@/components/RequireAuth";
import { Button, Card, Field, Input, LinkButton, Textarea } from "@/components/ui";
import { RiskBadge, getRiskDescription } from "@/components/RiskBadge";
import { RiskHistoryChart } from "@/components/RiskHistoryChart";
import { useAuth } from "@/lib/auth-context";
import {
  apiChangePassword,
  apiGetMyAttempts,
  apiGetTelegramStatus,
  apiLinkTelegram,
  apiSubmitFeedback,
  apiUnlinkTelegram,
  type TelegramStatus,
} from "@/lib/store";
import type { QuizAttempt } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n/types";
import { formatDate } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/context";

// Widely recommended cadence for a screening/self-check reminder.
const RETEST_REMINDER_DAYS = 90;

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}

function ProfileContent() {
  const { user, updateProfile } = useAuth();
  const { t, language } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    passportSeries: "",
    phone: "",
  });
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [daysSinceLatest, setDaysSinceLatest] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      birthDate: user.birthDate,
      passportSeries: user.passportSeries,
      phone: user.phone ?? "",
    });
    apiGetMyAttempts().then((userAttempts) => {
      setAttempts(userAttempts);
      const latestAttempt = userAttempts[0];
      setDaysSinceLatest(
        latestAttempt
          ? Math.floor((Date.now() - new Date(latestAttempt.createdAt).getTime()) / (1000 * 60 * 60 * 24))
          : null
      );
    });
  }, [user]);

  if (!user) return null;

  const latest = attempts[0] ?? null;
  const dueForRetest = daysSinceLatest !== null && daysSinceLatest >= RETEST_REMINDER_DAYS;

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      await updateProfile(form);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t.profile.saveError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="animate-fade-in mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.profile.title}</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.profile.subtitle}</p>
          </div>
          {!editing ? (
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <Pencil size={15} />
              {t.profile.edit}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
                <X size={15} />
                {t.common.cancel}
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save size={15} />
                {saving ? t.common.saving : t.common.save}
              </Button>
            </div>
          )}
        </div>

        {dueForRetest && (
          <div className="animate-fade-in-up mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 dark:border-blue-500/20 dark:bg-blue-500/10">
            <div className="flex items-center gap-2.5 text-sm text-blue-800 dark:text-blue-200">
              <BellRing size={16} className="shrink-0" />
              <span>{t.profile.retestBanner.replace("{days}", String(daysSinceLatest))}</span>
            </div>
            <LinkButton href="/test" variant="secondary" className="shrink-0">
              {t.profile.retestButton}
            </LinkButton>
          </div>
        )}

        {saved && (
          <p className="animate-fade-in-up mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
            <CheckCircle2 size={16} />
            {t.profile.saved}
          </p>
        )}
        {saveError && (
          <p className="animate-fade-in-up mt-4 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
            {saveError}
          </p>
        )}

        <Card className="mt-6 p-6 lg:p-8">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            <Field label={t.auth.firstName}>
              {editing ? (
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                />
              ) : (
                <p className="text-sm font-medium text-slate-900 dark:text-white">{user.firstName}</p>
              )}
            </Field>
            <Field label={t.auth.lastName}>
              {editing ? (
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              ) : (
                <p className="text-sm font-medium text-slate-900 dark:text-white">{user.lastName}</p>
              )}
            </Field>
            <Field label={t.auth.email} hint={t.profile.emailHint}>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{user.email}</p>
            </Field>
            <Field label={t.profile.phone}>
              {editing ? (
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+998 90 123 45 67"
                />
              ) : (
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {user.phone || "—"}
                </p>
              )}
            </Field>
            <Field label={t.auth.birthDate}>
              {editing ? (
                <Input
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
                />
              ) : (
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {formatDate(user.birthDate, language)}
                </p>
              )}
            </Field>
            <Field label={t.profile.passportSeries}>
              {editing ? (
                <Input
                  value={form.passportSeries}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, passportSeries: e.target.value.toUpperCase() }))
                  }
                />
              ) : (
                <p className="text-sm font-medium text-slate-900 dark:text-white">{user.passportSeries}</p>
              )}
            </Field>
          </div>
        </Card>

        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t.profile.testResultsTitle}</h2>
          <LinkButton href="/test" variant="secondary">
            <Sparkles size={15} />
            {t.profile.newTestButton}
          </LinkButton>
        </div>

        {latest && (
          <Card className="mt-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  {t.profile.latestResultLabel} · {formatDate(latest.createdAt, language)}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <RiskBadge level={latest.riskLevel} />
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {latest.percent}% {t.profile.riskPercentLabel}
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              {getRiskDescription(t, latest.riskLevel)}
            </p>
          </Card>
        )}

        {attempts.length > 1 && (
          <Card className="mt-4 p-6">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {t.profile.historyTitle}
            </h3>
            <div className="mt-4">
              <RiskHistoryChart attempts={attempts} />
            </div>
          </Card>
        )}

        {attempts.length > 1 && (
          <Card className="mt-4 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:bg-slate-900 dark:text-slate-500">
                <tr>
                  <th className="px-5 py-3">{t.profile.tableDate}</th>
                  <th className="px-5 py-3">{t.profile.tableRisk}</th>
                  <th className="px-5 py-3">{t.profile.tableScore}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {attempts.map((a) => (
                  <tr key={a.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatDate(a.createdAt, language)}</td>
                    <td className="px-5 py-3">
                      <RiskBadge level={a.riskLevel} size="sm" />
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{a.percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {attempts.length === 0 && (
          <Card className="mt-4 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {t.profile.noAttempts}{" "}
            <a href="/test" className="font-semibold text-blue-600 dark:text-blue-400">
              {t.profile.startNow}
            </a>
            .
          </Card>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <TelegramCard t={t} />
          <ChangePasswordCard t={t} />
          <FeedbackCard t={t} />
        </div>
      </main>
    </div>
  );
}

function TelegramCard({ t }: { t: Dictionary }) {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reload() {
    apiGetTelegramStatus().then(setStatus);
  }

  useEffect(reload, []);

  // While waiting for the user to press /start in Telegram, poll for the
  // connection to land instead of making them manually refresh.
  useEffect(() => {
    if (!linking) return;
    const interval = setInterval(reload, 3000);
    const timeout = setTimeout(() => setLinking(false), 60_000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [linking]);

  useEffect(() => {
    if (status?.connected) setLinking(false);
  }, [status?.connected]);

  async function connect() {
    setError(null);
    try {
      const { token, botUsername } = await apiLinkTelegram();
      if (botUsername) {
        window.open(`https://t.me/${botUsername}?start=${token}`, "_blank", "noopener");
      }
      setLinking(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.errorGeneric);
    }
  }

  async function disconnect() {
    await apiUnlinkTelegram();
    reload();
  }

  if (!status?.configured) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
          <Send size={16} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t.profile.telegramTitle}</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">{t.profile.telegramSubtitle}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {status.connected ? (
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle2 size={12} />
              {t.profile.telegramConnected}
            </span>
            <Button variant="ghost" size="sm" onClick={disconnect}>
              {t.profile.telegramDisconnectButton}
            </Button>
          </>
        ) : (
          <Button variant="secondary" size="sm" onClick={connect} disabled={linking}>
            <Send size={14} />
            {linking ? "..." : t.profile.telegramConnectButton}
          </Button>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </Card>
  );
}

function ChangePasswordCard({ t }: { t: Dictionary }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (newPassword.length < 6) {
      setError(t.auth.errorPasswordLength);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError(t.auth.errorPasswordMismatch);
      return;
    }
    setSaving(true);
    try {
      await apiChangePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.errorGeneric);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
          <KeyRound size={16} />
        </span>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t.profile.changePasswordTitle}</h3>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <Field label={t.profile.currentPassword}>
          <Input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.profile.newPassword}>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
          <Field label={t.profile.confirmNewPassword}>
            <Input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
        </div>

        {saved && (
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {t.profile.passwordChanged}
          </p>
        )}
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

        <Button
          variant="secondary"
          onClick={handleSubmit}
          disabled={saving || !currentPassword || !newPassword}
          className="self-start"
        >
          {saving ? t.profile.changingPasswordButton : t.profile.changePasswordButton}
        </Button>
      </div>
    </Card>
  );
}

function FeedbackCard({ t }: { t: Dictionary }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!message.trim()) return;
    setError(null);
    setSending(true);
    try {
      await apiSubmitFeedback(message.trim());
      setMessage("");
      setSent(true);
      setTimeout(() => setSent(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.profile.feedbackError);
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
          <MessageSquareText size={16} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t.profile.feedbackTitle}</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">{t.profile.feedbackSubtitle}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <Textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t.profile.feedbackPlaceholder}
        />

        {sent && (
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{t.profile.feedbackSuccess}</p>
        )}
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

        <Button variant="secondary" onClick={handleSubmit} disabled={sending || !message.trim()} className="self-start">
          {sending ? t.profile.feedbackSendingButton : t.profile.feedbackButton}
        </Button>
      </div>
    </Card>
  );
}
