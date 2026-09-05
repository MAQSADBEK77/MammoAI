"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { adminApi, AdminApiError } from "@/lib/admin-api";
import { Button } from "@/components/ui";
import { Emoji } from "@/components/Emoji";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await adminApi.login(password);
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Kirishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-nav px-4">
      {/* Fon — Aurora uslubidagi yumshoq nurlar, kirish sahifasini "shunchaki forma" bo'lishdan chiqaradi. */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-secondary/30 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm animate-fade-in-up rounded-[28px] border border-white/10 bg-nav-light/60 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/30">
            <Emoji e="🛡️" size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">MammoAI Admin</h1>
            <p className="mt-1 text-sm text-white/60">Boshqaruv paneliga kirish uchun parolni kiriting</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin paroli"
            className="tap-target w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40"
          />
          {error && (
            <p className="rounded-xl bg-danger/15 px-3 py-2 text-sm font-medium text-danger" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading || !password} className="w-full">
            {loading ? "Tekshirilmoqda…" : "Kirish"}
          </Button>
        </form>
      </div>
    </div>
  );
}
