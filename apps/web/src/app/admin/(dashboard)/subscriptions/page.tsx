"use client";

// Obuna (Premium) boshqaruvi — to'lov provayderi hali ulanmagan (Click/Payme
// merchant ro'yxatdan o'tish talab qiladi), shuning uchun HOZIRCHA qo'lda
// faollashtirish yagona yo'l (masalan mijoz to'g'ridan-to'g'ri o'tkazma
// qilgach). Kelajakda haqiqiy to'lov webhook'i ulanganda ham bu yerdagi
// server/repo.ts#grantPremium funksiyasining o'zi ishlatiladi.

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import type { AdminUserSummary } from "@/lib/admin-api";
import type { Subscription } from "@mammoai/shared";
import { Card, Button, Badge } from "@/components/ui";

type SubRow = Subscription & { name: string | null; phone: string | null; active: boolean };

const DURATION_OPTIONS: { label: string; days: number | null }[] = [
  { label: "7 kun", days: 7 },
  { label: "30 kun", days: 30 },
  { label: "90 kun", days: 90 },
  { label: "365 kun", days: 365 },
  { label: "Muddatsiz", days: null },
];

function formatDate(value: string | null): string {
  if (!value) return "Muddatsiz";
  return new Date(value).toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [userSearch, setUserSearch] = useState("");
  const [foundUsers, setFoundUsers] = useState<AdminUserSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [grantingFor, setGrantingFor] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(30);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function loadSubs() {
    setLoading(true);
    adminApi.subscriptions
      .list({ limit: 50 })
      .then((res) => {
        setSubs(res.subscriptions);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const timeout = setTimeout(loadSubs, 0);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const q = userSearch.trim();
    const timeout = setTimeout(() => {
      if (!q) {
        setFoundUsers([]);
        return;
      }
      setSearching(true);
      adminApi.users
        .list({ search: q, limit: 10 })
        .then((res) => setFoundUsers(res.users))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [userSearch]);

  async function grant(userId: string) {
    setError(null);
    try {
      await adminApi.subscriptions.grant(userId, { durationDays: duration, note: note.trim() || null });
      setGrantingFor(null);
      setNote("");
      setUserSearch("");
      setFoundUsers([]);
      loadSubs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
    }
  }

  async function revoke(userId: string) {
    if (!window.confirm("Premium'ni bekor qilmoqchimisiz?")) return;
    await adminApi.subscriptions.revoke(userId);
    loadSubs();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">💎 Obuna (Premium)</h1>
        <p className="mt-1 text-sm text-text-secondary">
          AI Yordamchi + chuqur Statistika — pullik. To&apos;lov provayderi hali ulanmagan, shuning uchun qo&apos;lda faollashtiriladi.
        </p>
      </div>

      <Card className="flex flex-col gap-3">
        <h2 className="text-base font-bold text-text-primary">Yangi Premium berish</h2>
        <input
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
          placeholder="Ism yoki telefon bo'yicha qidirish…"
          className="tap-target w-full rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {searching && <p className="text-xs text-text-muted">Qidirilmoqda…</p>}
        {error && <p className="text-sm font-medium text-danger">{error}</p>}
        {foundUsers.length > 0 && (
          <div className="flex flex-col gap-2">
            {foundUsers.map((u) => (
              <div key={u.id} className="rounded-2xl bg-surface-muted p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-text-primary">{u.name ?? "Ism kiritilmagan"}</p>
                    <p className="text-xs text-text-muted">{u.phone ?? u.id}</p>
                  </div>
                  {grantingFor === u.id ? null : (
                    <Button className="shrink-0 px-4! py-2! text-xs" onClick={() => setGrantingFor(u.id)}>
                      Premium berish
                    </Button>
                  )}
                </div>
                {grantingFor === u.id && (
                  <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
                    <div className="flex flex-wrap gap-1.5">
                      {DURATION_OPTIONS.map((d) => (
                        <button
                          key={d.label}
                          type="button"
                          onClick={() => setDuration(d.days)}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                            duration === d.days ? "bg-primary text-white" : "bg-surface text-text-secondary"
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                    <input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Izoh (masalan: Click orqali to'lagan, 09-11)"
                      className="tap-target w-full rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-primary"
                    />
                    <div className="flex gap-2">
                      <Button variant="ghost" className="px-4! py-2! text-xs" onClick={() => setGrantingFor(null)}>
                        Bekor qilish
                      </Button>
                      <Button className="flex-1 px-4! py-2! text-xs" onClick={() => grant(u.id)}>
                        Tasdiqlash
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-0">
        <div className="p-5 pb-0">
          <h2 className="text-base font-bold text-text-primary">Faol/o&apos;tgan obunalar ({total})</h2>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-text-muted">
                <th className="px-5 py-3">Foydalanuvchi</th>
                <th className="px-5 py-3">Holat</th>
                <th className="px-5 py-3">Amal qiladi</th>
                <th className="px-5 py-3">Izoh</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-text-muted">
                    Yuklanmoqda…
                  </td>
                </tr>
              )}
              {!loading && subs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-text-muted">
                    Hali hech kimga Premium berilmagan
                  </td>
                </tr>
              )}
              {!loading &&
                subs.map((s) => (
                  <tr key={s.userId} className="border-b border-border/60 last:border-0">
                    <td className="px-5 py-3">
                      <div className="font-semibold text-text-primary">{s.name ?? "Ism kiritilmagan"}</div>
                      <div className="text-xs text-text-muted">{s.phone ?? s.userId}</div>
                    </td>
                    <td className="px-5 py-3">
                      {s.active ? <Badge tone="success">Faol</Badge> : <Badge tone="warning">Muddati o&apos;tgan</Badge>}
                    </td>
                    <td className="px-5 py-3 text-text-secondary">{formatDate(s.expiresAt)}</td>
                    <td className="px-5 py-3 text-text-secondary">{s.note ?? "—"}</td>
                    <td className="px-5 py-3 text-right">
                      <Button variant="ghost" className="px-3! py-1.5! text-xs text-danger" onClick={() => revoke(s.userId)}>
                        Bekor qilish
                      </Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
