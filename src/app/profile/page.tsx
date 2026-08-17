"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Pencil, Save, Sparkles, X } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { RequireAuth } from "@/components/RequireAuth";
import { Button, Card, Field, Input, LinkButton } from "@/components/ui";
import { RiskBadge } from "@/components/RiskBadge";
import { useAuth } from "@/lib/auth-context";
import { RISK_DESCRIPTIONS, getAttemptsForUser, getLatestAttemptForUser } from "@/lib/store";
import type { QuizAttempt } from "@/lib/types";
import { formatDate } from "@/lib/format";

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
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    passportSeries: "",
    phone: "",
  });
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName,
        lastName: user.lastName,
        birthDate: user.birthDate,
        passportSeries: user.passportSeries,
        phone: user.phone ?? "",
      });
      setAttempts(getAttemptsForUser(user.id));
    }
  }, [user]);

  if (!user) return null;

  const latest = getLatestAttemptForUser(user.id);

  function handleSave() {
    updateProfile(form);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="flex min-h-full flex-col bg-slate-50">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Profil</h1>
            <p className="mt-1 text-sm text-slate-500">
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
              <Button variant="ghost" onClick={() => setEditing(false)}>
                <X size={15} />
                Bekor qilish
              </Button>
              <Button onClick={handleSave}>
                <Save size={15} />
                Saqlash
              </Button>
            </div>
          )}
        </div>

        {saved && (
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
            <CheckCircle2 size={16} />
            Ma&apos;lumotlar muvaffaqiyatli saqlandi.
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
                <p className="text-sm font-medium text-slate-900">{user.firstName}</p>
              )}
            </Field>
            <Field label="Familiya">
              {editing ? (
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              ) : (
                <p className="text-sm font-medium text-slate-900">{user.lastName}</p>
              )}
            </Field>
            <Field label="Email" hint="Email o'zgartirib bo'lmaydi">
              <p className="text-sm font-medium text-slate-500">{user.email}</p>
            </Field>
            <Field label="Telefon raqam">
              {editing ? (
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+998 90 123 45 67"
                />
              ) : (
                <p className="text-sm font-medium text-slate-900">
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
                <p className="text-sm font-medium text-slate-900">
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
                <p className="text-sm font-medium text-slate-900">{user.passportSeries}</p>
              )}
            </Field>
          </div>
        </Card>

        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Test natijalari</h2>
          <LinkButton href="/test" variant="secondary">
            <Sparkles size={15} />
            Yangi test topshirish
          </LinkButton>
        </div>

        {latest && (
          <Card className="mt-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  So&apos;nggi natija · {formatDate(latest.createdAt)}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <RiskBadge level={latest.riskLevel} />
                  <span className="text-sm text-slate-500">
                    {latest.percent}% xavf ko&apos;rsatkichi
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              {RISK_DESCRIPTIONS[latest.riskLevel]}
            </p>
          </Card>
        )}

        {attempts.length > 1 && (
          <Card className="mt-4 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3">Sana</th>
                  <th className="px-5 py-3">Xavf darajasi</th>
                  <th className="px-5 py-3">Ko&apos;rsatkich</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attempts.map((a) => (
                  <tr key={a.id}>
                    <td className="px-5 py-3 text-slate-600">{formatDate(a.createdAt)}</td>
                    <td className="px-5 py-3">
                      <RiskBadge level={a.riskLevel} size="sm" />
                    </td>
                    <td className="px-5 py-3 text-slate-600">{a.percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {attempts.length === 0 && (
          <Card className="mt-4 p-6 text-center text-sm text-slate-500">
            Siz hali test topshirmagansiz.{" "}
            <a href="/test" className="font-semibold text-blue-600">
              Hoziroq boshlang
            </a>
            .
          </Card>
        )}
      </main>
    </div>
  );
}
