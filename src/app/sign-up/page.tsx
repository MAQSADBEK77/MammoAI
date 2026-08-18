"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { Field, Input, Button } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";

export default function SignUpPage() {
  const { signUp } = useAuth();
  const router = useRouter();

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
      setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Parollar mos kelmadi.");
      return;
    }
    if (!birthDate) {
      setError("Tug'ilgan sanangizni kiriting.");
      return;
    }
    if (passportSeries.trim().length < 5) {
      setError("Passport seriya raqamini to'g'ri kiriting.");
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
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi.");
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      footerText="Akkountingiz bormi?"
      footerLinkText="Kirish"
      footerHref="/login"
    >
      <h2 className="text-xl font-bold text-white">Ro&apos;yxatdan o&apos;tish</h2>
      <p className="mt-1 text-sm text-blue-200/70">
        Shaxsiy kabinet yaratish uchun ma&apos;lumotlaringizni kiriting.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ism" htmlFor="firstName" dark>
            <Input
              id="firstName"
              dark
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Malika"
            />
          </Field>
          <Field label="Familiya" htmlFor="lastName" dark>
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

        <div className="grid grid-cols-2 gap-3">
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
          <Field label="Parolni tasdiqlang" htmlFor="confirmPassword" dark>
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
          <Field label="Tug'ilgan sana" htmlFor="birthDate" dark>
            <Input
              id="birthDate"
              type="date"
              dark
              required
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </Field>
          <Field label="Passport seriya" htmlFor="passportSeries" dark hint="Masalan: AB1234567">
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

        <Field label="Telefon raqam (ixtiyoriy)" htmlFor="phone" dark>
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
          {submitting ? "Yuborilmoqda..." : "Ro'yxatdan o'tish"}
        </Button>
      </form>
    </AuthShell>
  );
}
