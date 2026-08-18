"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";
import { Field, Input, Button } from "@/components/ui";
import { apiResetPassword } from "@/lib/store";
import { useT } from "@/lib/i18n/context";

export default function ForgotPasswordPage() {
  const t = useT();

  const [email, setEmail] = useState("");
  const [passportSeries, setPassportSeries] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError(t.auth.errorPasswordLength);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError(t.auth.errorPasswordMismatch);
      return;
    }

    setSubmitting(true);
    try {
      await apiResetPassword({
        email: email.trim(),
        passportSeries: passportSeries.trim().toUpperCase(),
        birthDate,
        newPassword,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      footerText=""
      footerLinkText={t.forgotPassword.backToLogin}
      footerHref="/login"
    >
      <h2 className="text-xl font-bold text-white">{t.forgotPassword.title}</h2>
      <p className="mt-1 text-sm text-blue-200/70">{t.forgotPassword.subtitle}</p>

      {done ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-xl bg-emerald-500/10 px-4 py-6 text-center">
          <CheckCircle2 size={28} className="text-emerald-400" />
          <p className="text-sm text-emerald-200">{t.forgotPassword.successMessage}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <Field label={t.auth.email} htmlFor="email" dark>
            <Input
              id="email"
              type="email"
              dark
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t.auth.birthDate} htmlFor="birthDate" dark>
              <Input
                id="birthDate"
                type="date"
                dark
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </Field>
            <Field label={t.auth.passportSeries} htmlFor="passportSeries" dark hint={t.auth.passportHint}>
              <Input
                id="passportSeries"
                dark
                required
                value={passportSeries}
                onChange={(e) => setPassportSeries(e.target.value)}
                placeholder="AB1234567"
              />
            </Field>
          </div>

          <p className="text-xs text-blue-300/60">{t.forgotPassword.hint}</p>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t.forgotPassword.newPassword} htmlFor="newPassword" dark>
              <Input
                id="newPassword"
                type="password"
                dark
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>
            <Field label={t.forgotPassword.confirmNewPassword} htmlFor="confirmNewPassword" dark>
              <Input
                id="confirmNewPassword"
                type="password"
                dark
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
          )}

          <Button type="submit" disabled={submitting} className="mt-1 w-full">
            {submitting ? t.forgotPassword.submittingButton : t.forgotPassword.submitButton}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
