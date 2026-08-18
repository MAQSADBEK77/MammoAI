"use client";

import { useEffect, useState } from "react";
import { BellRing, CheckCircle2, Pencil, Save, Sparkles, X } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { RequireAuth } from "@/components/RequireAuth";
import { Button, Card, Field, Input, LinkButton } from "@/components/ui";
import { RiskBadge } from "@/components/RiskBadge";
import { RiskHistoryChart } from "@/components/RiskHistoryChart";
import { useAuth } from "@/lib/auth-context";
import { RISK_DESCRIPTIONS, apiGetMyAttempts } from "@/lib/store";
import type { QuizAttempt } from "@/lib/types";
import { formatDate } from "@/lib/format";

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
      setSaveError(err instanceof Error ? err.message : "Saqlab bo'lmadi.");
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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profil</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Shaxsiy ma&apos;lumotlaringizni ko&apos;ring va tahrirlang.
            </p>
          </div>
          {!editing ? (
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <Pencil size={15} />
              Tahrirlash
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
                <X size={15} />
                Bekor qilish
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save size={15} />
                {saving ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </div>
          )}
        </div>

        {dueForRetest && (
          <div className="animate-fade-in-up mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 dark:border-blue-500/20 dark:bg-blue-500/10">
            <div className="flex items-center gap-2.5 text-sm text-blue-800 dark:text-blue-200">
              <BellRing size={16} className="shrink-0" />
              <span>
                Oxirgi testdan {daysSinceLatest} kun o&apos;tdi — muntazam nazorat uchun
                qayta topshirishni tavsiya qilamiz.
              </span>
            </div>
            <LinkButton href="/test" variant="secondary" className="shrink-0">
              Qayta topshirish
            </LinkButton>
          </div>
        )}

        {saved && (
          <p className="animate-fade-in-up mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
            <CheckCircle2 size={16} />
            Ma&apos;lumotlar muvaffaqiyatli saqlandi.
          </p>
        )}
        {saveError && (
          <p className="animate-fade-in-up mt-4 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
            {saveError}
          </p>
        )}

        <Card className="mt-6 p-6 lg:p-8">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            <Field label="Ism">
              {editing ? (
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                />
              ) : (
                <p className="text-sm font-medium text-slate-900 dark:text-white">{user.firstName}</p>
              )}
            </Field>
            <Field label="Familiya">
              {editing ? (
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              ) : (
                <p className="text-sm font-medium text-slate-900 dark:text-white">{user.lastName}</p>
              )}
            </Field>
            <Field label="Email" hint="Email o'zgartirib bo'lmaydi">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{user.email}</p>
            </Field>
            <Field label="Telefon raqam">
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
            <Field label="Tug'ilgan sana">
              {editing ? (
                <Input
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
                />
              ) : (
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {formatDate(user.birthDate)}
                </p>
              )}
            </Field>
            <Field label="Passport seriya raqami">
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
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Test natijalari</h2>
          <LinkButton href="/test" variant="secondary">
            <Sparkles size={15} />
            Yangi test topshirish
          </LinkButton>
        </div>

        {latest && (
          <Card className="mt-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  So&apos;nggi natija · {formatDate(latest.createdAt)}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <RiskBadge level={latest.riskLevel} />
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {latest.percent}% xavf ko&apos;rsatkichi
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              {RISK_DESCRIPTIONS[latest.riskLevel]}
            </p>
          </Card>
        )}

        {attempts.length > 1 && (
          <Card className="mt-4 p-6">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Xavf darajasi vaqt bo&apos;yicha
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
                  <th className="px-5 py-3">Sana</th>
                  <th className="px-5 py-3">Xavf darajasi</th>
                  <th className="px-5 py-3">Ko&apos;rsatkich</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {attempts.map((a) => (
                  <tr key={a.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatDate(a.createdAt)}</td>
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
            Siz hali test topshirmagansiz.{" "}
            <a href="/test" className="font-semibold text-blue-600 dark:text-blue-400">
              Hoziroq boshlang
            </a>
            .
          </Card>
        )}
      </main>
    </div>
  );
}
