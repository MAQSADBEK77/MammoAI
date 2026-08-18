"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  BellRing,
  Calendar,
  CheckCircle2,
  Copy,
  Download,
  KeyRound,
  LogOut,
  MessageSquareText,
  Pencil,
  Plus,
  Save,
  Send,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { RequireAuth } from "@/components/RequireAuth";
import { Button, Card, Field, Input, LinkButton, Textarea } from "@/components/ui";
import { RiskBadge, getRiskDescription } from "@/components/RiskBadge";
import { RiskHistoryChart } from "@/components/RiskHistoryChart";
import { useAuth } from "@/lib/auth-context";
import {
  apiChangePassword,
  apiCreateFamilyMember,
  apiDeleteFamilyMember,
  apiGetFamilyMemberAttempts,
  apiGetFamilyMembers,
  apiGetMyAttempts,
  apiGetReferral,
  apiGetSelfExamMonths,
  apiGetTelegramStatus,
  apiGetVapidPublicKey,
  apiLinkTelegram,
  apiLogoutEverywhere,
  apiSetSelfExamDone,
  apiSubscribePush,
  apiSubmitFeedback,
  apiUnlinkTelegram,
  apiUnsubscribePush,
  type FamilyMember,
  type TelegramStatus,
} from "@/lib/store";
import { urlBase64ToUint8Array } from "@/lib/push";
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
            <h1 className="text-2xl font-bold text-pink-900 dark:text-white">{t.profile.title}</h1>
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
          <div className="animate-fade-in-up mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-pink-100 bg-pink-50 px-4 py-3 dark:border-pink-500/20 dark:bg-pink-500/10">
            <div className="flex items-center gap-2.5 text-sm text-pink-800 dark:text-pink-200">
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
                <p className="text-sm font-medium text-pink-900 dark:text-white">{user.firstName}</p>
              )}
            </Field>
            <Field label={t.auth.lastName}>
              {editing ? (
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              ) : (
                <p className="text-sm font-medium text-pink-900 dark:text-white">{user.lastName}</p>
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
                <p className="text-sm font-medium text-pink-900 dark:text-white">
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
                <p className="text-sm font-medium text-pink-900 dark:text-white">
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
                <p className="text-sm font-medium text-pink-900 dark:text-white">{user.passportSeries}</p>
              )}
            </Field>
          </div>
        </Card>

        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-lg font-bold text-pink-900 dark:text-white">{t.profile.testResultsTitle}</h2>
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
            <a href="/test" className="font-semibold text-pink-600 dark:text-pink-400">
              {t.profile.startNow}
            </a>
            .
          </Card>
        )}

        <FamilyMembersCard t={t} />

        <Card className="mt-8 p-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400">
              <Calendar size={16} />
            </span>
            <h3 className="text-sm font-semibold text-pink-900 dark:text-white">{t.profile.selfExamTitle}</h3>
          </div>
          <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">{t.profile.selfExamSubtitle}</p>
          <SelfExamCalendar />
        </Card>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <TelegramCard t={t} />
          <BrowserPushCard t={t} />
          <ChangePasswordCard t={t} />
          <ReferralCard t={t} />
          <SessionsCard t={t} />
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
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400">
          <Send size={16} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-pink-900 dark:text-white">{t.profile.telegramTitle}</h3>
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

function BrowserPushCard({ t }: { t: Dictionary }) {
  const [supported, setSupported] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSupported(false);
      return;
    }
    navigator.serviceWorker.ready.then((reg) => reg.pushManager.getSubscription()).then((sub) => setSubscribed(Boolean(sub)));
  }, []);

  async function enable() {
    setError(null);
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError(t.profile.pushPermissionDenied);
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const publicKey = await apiGetVapidPublicKey();
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
      await apiSubscribePush(sub.toJSON());
      setSubscribed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await apiUnsubscribePush(sub.endpoint);
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } finally {
      setBusy(false);
    }
  }

  if (!supported) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400">
          <Bell size={16} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-pink-900 dark:text-white">{t.profile.pushTitle}</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">{t.profile.pushSubtitle}</p>
        </div>
      </div>
      <div className="mt-4">
        {subscribed ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle2 size={12} />
              {t.profile.pushEnabled}
            </span>
            <Button variant="ghost" size="sm" onClick={disable} disabled={busy}>
              {t.profile.pushDisableButton}
            </Button>
          </div>
        ) : (
          <Button variant="secondary" size="sm" onClick={enable} disabled={busy}>
            <Bell size={14} />
            {t.profile.pushEnableButton}
          </Button>
        )}
        {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
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
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400">
          <KeyRound size={16} />
        </span>
        <h3 className="text-sm font-semibold text-pink-900 dark:text-white">{t.profile.changePasswordTitle}</h3>
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
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400">
          <MessageSquareText size={16} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-pink-900 dark:text-white">{t.profile.feedbackTitle}</h3>
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

function FamilyMembersCard({ t }: { t: Dictionary }) {
  const { language } = useLanguage();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [attemptsByMember, setAttemptsByMember] = useState<Record<string, QuizAttempt[]>>({});
  const [adding, setAdding] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [relation, setRelation] = useState("");
  const [saving, setSaving] = useState(false);

  function reload() {
    apiGetFamilyMembers().then(async (list) => {
      setMembers(list);
      const entries = await Promise.all(
        list.map(async (m) => [m.id, await apiGetFamilyMemberAttempts(m.id)] as const)
      );
      setAttemptsByMember(Object.fromEntries(entries));
    });
  }

  useEffect(reload, []);

  async function handleAdd() {
    if (!firstName.trim()) return;
    setSaving(true);
    try {
      await apiCreateFamilyMember({ firstName: firstName.trim(), lastName: lastName.trim(), relation: relation.trim() });
      setFirstName("");
      setLastName("");
      setRelation("");
      setAdding(false);
      reload();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t.profile.familyDeleteConfirm)) return;
    await apiDeleteFamilyMember(id);
    reload();
  }

  return (
    <Card className="mt-8 p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400">
            <Users size={16} />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-pink-900 dark:text-white">{t.profile.familyTitle}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">{t.profile.familySubtitle}</p>
          </div>
        </div>
        {!adding && (
          <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
            <UserPlus size={14} />
            {t.profile.familyAddButton}
          </Button>
        )}
      </div>

      {adding && (
        <div className="mt-4 grid gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700 sm:grid-cols-3">
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={t.profile.familyNamePlaceholder} />
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={t.profile.familyLastNamePlaceholder} />
          <Input value={relation} onChange={(e) => setRelation(e.target.value)} placeholder={t.profile.familyRelationPlaceholder} />
          <div className="flex gap-2 sm:col-span-3">
            <Button size="sm" onClick={handleAdd} disabled={saving || !firstName.trim()}>
              <Plus size={14} />
              {t.common.save}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
              {t.common.cancel}
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {members.map((m) => {
          const attempts = attemptsByMember[m.id] ?? [];
          const latest = attempts[0];
          return (
            <div
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700"
            >
              <div>
                <p className="text-sm font-medium text-pink-900 dark:text-white">
                  {m.firstName} {m.lastName}
                  {m.relation && <span className="ml-1.5 text-xs font-normal text-slate-400">({m.relation})</span>}
                </p>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                  {latest ? (
                    <>
                      {t.profile.familyLatestResult}: {latest.percent}% ·{" "}
                      {formatDate(latest.createdAt, language)}
                    </>
                  ) : (
                    t.profile.familyNoAttempts
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {latest && <RiskBadge level={latest.riskLevel} size="sm" />}
                <LinkButton href="/test" variant="ghost" className="text-xs">
                  {t.profile.familyTakeTest}
                </LinkButton>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
        {members.length === 0 && !adding && (
          <p className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">{t.profile.familyEmpty}</p>
        )}
      </div>
    </Card>
  );
}

const SHORT_MONTHS = {
  uz: ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"],
  // Same borrowed month names as Russian, so the abbreviations coincide.
  "uz-cyrl": ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"],
  ru: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
} as const;

function SelfExamCalendar() {
  const { language } = useLanguage();
  const [months, setMonths] = useState<string[]>([]);
  const year = new Date().getFullYear();

  useEffect(() => {
    apiGetSelfExamMonths().then(setMonths);
  }, []);

  async function toggle(month: string) {
    const done = !months.includes(month);
    const next = await apiSetSelfExamDone(month, done);
    setMonths(next);
  }

  const MONTH_LABELS = SHORT_MONTHS[language];

  return (
    <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
      {MONTH_LABELS.map((label, i) => {
        const month = `${year}-${String(i + 1).padStart(2, "0")}`;
        const done = months.includes(month);
        const isFuture = month > `${year}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
        return (
          <button
            key={month}
            onClick={() => toggle(month)}
            disabled={isFuture}
            className={`rounded-xl border px-2 py-2.5 text-xs font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 ${
              done
                ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function ReferralCard({ t }: { t: Dictionary }) {
  const [referral, setReferral] = useState<{ code: string; count: number } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    apiGetReferral().then(setReferral);
  }, []);

  function copyLink() {
    if (!referral) return;
    const url = `${window.location.origin}/sign-up?ref=${referral.code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400">
          <UserPlus size={16} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-pink-900 dark:text-white">{t.profile.referralTitle}</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">{t.profile.referralSubtitle}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={copyLink} disabled={!referral}>
          <Copy size={14} />
          {copied ? t.profile.referralCopied : t.profile.referralCopyButton}
        </Button>
        {referral && (
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {referral.count} {t.profile.referralCountLabel}
          </span>
        )}
      </div>
    </Card>
  );
}

function SessionsCard({ t }: { t: Dictionary }) {
  const [done, setDone] = useState(false);

  async function handleLogoutEverywhere() {
    if (!window.confirm(t.profile.logoutEverywhereConfirm)) return;
    await apiLogoutEverywhere();
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400">
          <LogOut size={16} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-pink-900 dark:text-white">{t.profile.sessionsTitle}</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">{t.profile.sessionsSubtitle}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={handleLogoutEverywhere}>
          {t.profile.logoutEverywhereButton}
        </Button>
        <a href="/api/profile/export" download>
          <Button variant="ghost" size="sm">
            <Download size={14} />
            {t.profile.exportDataButton}
          </Button>
        </a>
        {done && <p className="mt-2 w-full text-xs font-medium text-emerald-600 dark:text-emerald-400">{t.profile.logoutEverywhereDone}</p>}
      </div>
    </Card>
  );
}
