"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { Field, Input, Button } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { useT } from "@/lib/i18n/context";

export default function SignUpPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const t = useT();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [passportSeries, setPassportSeries] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError(t.auth.errorPasswordLength);
      return;
    }
    if (password !== confirmPassword) {
      setError(t.auth.errorPasswordMismatch);
      return;
    }
    if (!birthDate) {
      setError(t.auth.errorBirthDateRequired);
      return;
    }
    if (passportSeries.trim().length < 5) {
      setError(t.auth.errorPassportInvalid);
      return;
    }

    setSubmitting(true);
    try {
      await signUp({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        birthDate,
        passportSeries: passportSeries.trim().toUpperCase(),
        phone: phone.trim(),
      });
      router.push("/test");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.errorGeneric);
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      footerText={t.auth.haveAccount}
      footerLinkText={t.auth.loginLink}
      footerHref="/login"
    >
      <h2 className="text-xl font-bold text-white">{t.auth.signupTitle}</h2>
      <p className="mt-1 text-sm text-blue-200/70">{t.auth.signupSubtitle}</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.auth.firstName} htmlFor="firstName" dark>
            <Input
              id="firstName"
              dark
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Malika"
            />
          </Field>
          <Field label={t.auth.lastName} htmlFor="lastName" dark>
            <Input
              id="lastName"
              dark
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Karimova"
            />
          </Field>
        </div>

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
          <Field label={t.auth.password} htmlFor="password" dark>
            <Input
              id="password"
              type="password"
              dark
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
          <Field label={t.auth.confirmPassword} htmlFor="confirmPassword" dark>
            <Input
              id="confirmPassword"
              type="password"
              dark
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
        </div>

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

        <Field label={t.auth.phone} htmlFor="phone" dark>
          <Input
            id="phone"
            dark
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+998 90 123 45 67"
          />
        </Field>

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <Button type="submit" disabled={submitting} className="mt-1 w-full">
          {submitting ? t.auth.submittingSignup : t.auth.submitSignup}
        </Button>
      </form>
    </AuthShell>
  );
}
