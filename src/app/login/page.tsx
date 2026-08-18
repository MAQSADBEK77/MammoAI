"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { Field, Input, Button } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { useT } from "@/lib/i18n/context";

export default function LoginPage() {
  const { login, loginWithTelegramCode } = useAuth();
  const router = useRouter();
  const t = useT();

  const [mode, setMode] = useState<"password" | "telegram">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user =
        mode === "password" ? await login(email.trim(), password) : await loginWithTelegramCode(code.trim());
      router.push(user.role === "admin" ? "/admin" : "/test");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.errorGeneric);
      setSubmitting(false);
    }
  }

  function toggleMode() {
    setError(null);
    setMode((m) => (m === "password" ? "telegram" : "password"));
  }

  return (
    <AuthShell
      footerText={t.auth.noAccount}
      footerLinkText={t.auth.signupLink}
      footerHref="/sign-up"
    >
      <h2 className="text-xl font-bold text-white">
        {mode === "password" ? t.auth.loginTitle : t.auth.telegramLoginTitle}
      </h2>
      <p className="mt-1 text-sm text-pink-200/70">
        {mode === "password" ? t.auth.loginSubtitle : t.auth.telegramLoginHint}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        {mode === "password" ? (
          <>
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

            <Link
              href="/forgot-password"
              className="-mt-2 self-end text-xs font-medium text-pink-300 hover:text-pink-200"
            >
              {t.auth.forgotPasswordLink}
            </Link>
          </>
        ) : (
          <Field label={t.auth.telegramLoginCodeLabel} htmlFor="tg-code" dark>
            <Input
              id="tg-code"
              inputMode="numeric"
              dark
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder={t.auth.telegramLoginCodePlaceholder}
            />
          </Field>
        )}

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={submitting || (mode === "telegram" && code.trim().length !== 6)}
          className="mt-1 w-full"
        >
          {mode === "password"
            ? submitting
              ? t.auth.submittingLogin
              : t.auth.submitLogin
            : submitting
              ? t.auth.telegramLoginSubmitting
              : t.auth.telegramLoginSubmit}
        </Button>

        <button
          type="button"
          onClick={toggleMode}
          className="self-center text-xs font-medium text-pink-300 hover:text-pink-200 cursor-pointer"
        >
          {mode === "password" ? t.auth.telegramLoginToggle : t.auth.backToPasswordLogin}
        </button>
      </form>

      <p className="mt-5 rounded-lg bg-pink-500/10 px-3 py-2 text-xs text-pink-200/70">
        {t.auth.adminHint} <b>admin@mammoai.uz</b> / <b>admin123</b>
      </p>
    </AuthShell>
  );
}
