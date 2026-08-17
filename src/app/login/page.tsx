"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { Field, Input, Button } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = login(email.trim(), password);
      router.push(user.role === "admin" ? "/admin" : "/test");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi.");
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      footerText="Akkountingiz yo'qmi?"
      footerLinkText="Ro'yxatdan o'tish"
      footerHref="/sign-up"
    >
      <h2 className="text-xl font-bold text-white">Kirish</h2>
      <p className="mt-1 text-sm text-blue-200/70">
        Shaxsiy kabinetingizga kiring.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <Field label="Email" htmlFor="email" dark>
          <Input
            id="email"
            type="email"
            dark
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="siz@example.com"
          />
        </Field>

        <Field label="Parol" htmlFor="password" dark>
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
          {submitting ? "Kirilmoqda..." : "Kirish"}
        </Button>
      </form>

      <p className="mt-5 rounded-lg bg-blue-500/10 px-3 py-2 text-xs text-blue-200/70">
        Admin sifatida kirish uchun: <b>admin@mammoai.uz</b> / <b>admin123</b>
      </p>
    </AuthShell>
  );
}
