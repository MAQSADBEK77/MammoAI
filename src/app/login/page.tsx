"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { Field, Input, Button } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { useT } from "@/lib/i18n/context";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const t = useT();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      router.push(user.role === "admin" ? "/admin" : "/test");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.errorGeneric);
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      footerText={t.auth.noAccount}
      footerLinkText={t.auth.signupLink}
      footerHref="/sign-up"
    >
      <h2 className="text-xl font-bold text-white">{t.auth.loginTitle}</h2>
      <p className="mt-1 text-sm text-blue-200/70">{t.auth.loginSubtitle}</p>

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

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <Button type="submit" disabled={submitting} className="mt-1 w-full">
          {submitting ? t.auth.submittingLogin : t.auth.submitLogin}
        </Button>
      </form>

      <p className="mt-5 rounded-lg bg-blue-500/10 px-3 py-2 text-xs text-blue-200/70">
        {t.auth.adminHint} <b>admin@mammoai.uz</b> / <b>admin123</b>
      </p>
    </AuthShell>
  );
}
