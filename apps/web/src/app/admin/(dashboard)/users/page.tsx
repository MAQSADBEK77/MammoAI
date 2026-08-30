"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, type AdminUserSummary } from "@/lib/admin-api";
import { Card, Badge, Button } from "@/components/ui";

const PAGE_SIZE = 20;

const GOAL_LABELS: Record<string, string> = {
  cycle: "Sikl",
  pregnancy: "Homiladorlik",
  planning_pregnancy: "Rejalashtirish",
  wellbeing: "Sog'lik",
  checkups: "Tekshiruvlar",
  understand_body: "Tanani bilish",
  skin: "Teri",
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback((currentSearch: string, currentOffset: number) => {
    setLoading(true);
    setError(null);
    adminApi.users
      .list({ search: currentSearch || undefined, limit: PAGE_SIZE, offset: currentOffset })
      .then((res) => {
        setUsers(res.users);
        setTotal(res.total);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Yuklashda xatolik"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setOffset(0);
      load(search, 0);
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function handleDelete(user: AdminUserSummary) {
    const confirmed = window.confirm(`${user.name ?? user.phone ?? user.id} foydalanuvchisini butunlay o'chirishni tasdiqlaysizmi?`);
    if (!confirmed) return;
    setDeletingId(user.id);
    try {
      await adminApi.users.delete(user.id);
      load(search, offset);
    } catch (err) {
      setError(err instanceof Error ? err.message : "O'chirishda xatolik");
    } finally {
      setDeletingId(null);
    }
  }

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Foydalanuvchilar</h1>
          <p className="mt-1 text-sm text-text-secondary">Jami {total} ta ro&apos;yxatdan o&apos;tgan foydalanuvchi</p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ism, telefon yoki email bo'yicha qidirish…"
          className="tap-target w-72 rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {error && (
        <Card className="border border-danger/20 bg-danger/5 text-sm font-medium text-danger">{error}</Card>
      )}

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-text-muted">
                <th className="px-5 py-3">Foydalanuvchi</th>
                <th className="px-5 py-3">Til</th>
                <th className="px-5 py-3">Maqsad</th>
                <th className="px-5 py-3">Sikl yozuvlari</th>
                <th className="px-5 py-3">Oxirgi faollik</th>
                <th className="px-5 py-3">Ro&apos;yxatdan o&apos;tgan</th>
                <th className="px-5 py-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-text-muted">
                    Yuklanmoqda…
                  </td>
                </tr>
              )}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-text-muted">
                    Hech narsa topilmadi
                  </td>
                </tr>
              )}
              {!loading &&
                users.map((u) => (
                  <tr key={u.id} className="border-b border-border/60 last:border-0 hover:bg-surface-muted/60">
                    <td className="px-5 py-3">
                      <div className="font-semibold text-text-primary">{u.name ?? "Ism kiritilmagan"}</div>
                      <div className="text-xs text-text-muted">{u.phone ?? u.email ?? u.id}</div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone="muted">{u.language === "ru" ? "RU" : "UZ"}</Badge>
                    </td>
                    <td className="px-5 py-3 text-text-secondary">{u.primaryGoal ? (GOAL_LABELS[u.primaryGoal] ?? u.primaryGoal) : "—"}</td>
                    <td className="px-5 py-3 text-text-secondary">{u.cycleLogsCount}</td>
                    <td className="px-5 py-3 text-text-secondary">{formatDate(u.lastActiveAt)}</td>
                    <td className="px-5 py-3 text-text-secondary">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(u)}
                        disabled={deletingId === u.id}
                        className="rounded-full px-3 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger/10 disabled:opacity-50"
                      >
                        {deletingId === u.id ? "O'chirilmoqda…" : "O'chirish"}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted">
          {page}-sahifa / {pageCount}
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="px-4! py-2! text-xs"
            disabled={offset === 0}
            onClick={() => {
              const next = Math.max(0, offset - PAGE_SIZE);
              setOffset(next);
              load(search, next);
            }}
          >
            Oldingi
          </Button>
          <Button
            variant="secondary"
            className="px-4! py-2! text-xs"
            disabled={offset + PAGE_SIZE >= total}
            onClick={() => {
              const next = offset + PAGE_SIZE;
              setOffset(next);
              load(search, next);
            }}
          >
            Keyingi
          </Button>
        </div>
      </div>
    </div>
  );
}
