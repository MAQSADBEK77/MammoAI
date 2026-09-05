"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import type { AnalyticsSummary, AnalyticsUserSummary } from "@mammoai/shared";
import { Card, Button } from "@/components/ui";
import { Emoji } from "@/components/Emoji";
import { SignupsChart } from "../_components/SignupsChart";

const PAGE_SIZE = 20;
const DAY_OPTIONS = [7, 14, 30, 90];

function formatDuration(ms: number): string {
  if (!ms || ms < 1000) return "0 son";
  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours} soat ${minutes} daq`;
  if (minutes > 0) return `${minutes} daq ${seconds} son`;
  return `${seconds} son`;
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function StatCard({ icon, label, value, hint }: { icon: string; label: string; value: string | number; hint?: string }) {
  return (
    <Card className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
        <Emoji e={icon} />
        {label}
      </div>
      <div className="mt-1 text-3xl font-extrabold text-text-primary">{value}</div>
      {hint && <div className="text-xs text-text-muted">{hint}</div>}
    </Card>
  );
}

/** Bitta seriyali (magnitude) ranking — brend rangi bitta, legend shart emas. */
function RankedBar({ label, sublabel, valueLabel, value, max }: { label: string; sublabel?: string; valueLabel: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs font-semibold text-text-secondary">
        <span className="truncate">
          {label}
          {sublabel && <span className="ml-1.5 font-normal text-text-muted">{sublabel}</span>}
        </span>
        <span className="shrink-0 text-text-muted">{valueLabel}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
        <div className="h-full rounded-full bg-primary/70" style={{ width: `${Math.max(pct, 3)}%` }} />
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(14);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [users, setUsers] = useState<AnalyticsUserSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  useEffect(() => {
    adminApi.analytics
      .summary(days)
      .then((res) => {
        setSummary(res);
        setSummaryError(null);
      })
      .catch((err) => setSummaryError(err instanceof Error ? err.message : "Yuklashda xatolik"));
  }, [days]);

  const loadUsers = useCallback((currentSearch: string, currentOffset: number) => {
    setUsersLoading(true);
    setUsersError(null);
    adminApi.analytics
      .users({ search: currentSearch || undefined, limit: PAGE_SIZE, offset: currentOffset })
      .then((res) => {
        setUsers(res.users);
        setTotal(res.total);
      })
      .catch((err) => setUsersError(err instanceof Error ? err.message : "Yuklashda xatolik"))
      .finally(() => setUsersLoading(false));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setOffset(0);
      loadUsers(search, 0);
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const maxPageDuration = Math.max(1, ...(summary?.topPages.map((p) => p.totalDurationMs) ?? [1]));
  const maxButtonCount = Math.max(1, ...(summary?.topButtons.map((b) => b.count) ?? [1]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Analitika</h1>
          <p className="mt-1 text-sm text-text-secondary">Foydalanuvchilar qaysi sahifada qancha vaqt o&apos;tkazgani va nimani bosgani</p>
        </div>
        <div className="flex rounded-full border border-border bg-surface p-1">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                days === d ? "bg-primary text-white" : "text-text-secondary hover:bg-surface-muted"
              }`}
            >
              {d} kun
            </button>
          ))}
        </div>
      </div>

      {summaryError && <Card className="border border-danger/20 bg-danger/5 text-sm font-medium text-danger">{summaryError}</Card>}

      {!summary && !summaryError && <Card className="py-10 text-center text-sm text-text-muted">Yuklanmoqda…</Card>}

      {summary && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon="🧭" label="Jami seanslar" value={summary.totals.sessions} hint={`So'nggi ${days} kun`} />
            <StatCard icon="📄" label="Sahifa ko'rishlar" value={summary.totals.pageviews} />
            <StatCard icon="👆" label="Tugma bosishlar" value={summary.totals.clicks} />
            <StatCard icon="⏱️" label="O'rtacha seans davomiyligi" value={formatDuration(summary.totals.avgSessionDurationMs)} />
          </div>

          <Card>
            <div className="mb-4">
              <h2 className="text-base font-bold text-text-primary">Kunlik faollik</h2>
              <p className="text-xs text-text-secondary">Har bir ustun — o&apos;sha kuni ilovada bo&apos;lgan alohida seanslar soni</p>
            </div>
            <SignupsChart data={summary.dailyActivity.map((d) => ({ day: d.day, count: d.sessions }))} />
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="mb-4 text-base font-bold text-text-primary">Eng ko&apos;p vaqt o&apos;tkazilgan sahifalar</h2>
              <div className="flex flex-col gap-3">
                {summary.topPages.length === 0 && <p className="text-sm text-text-muted">Hali ma&apos;lumot yo&apos;q</p>}
                {summary.topPages.map((p) => (
                  <RankedBar
                    key={p.path}
                    label={p.path}
                    sublabel={`${p.viewCount} ko'rish`}
                    valueLabel={formatDuration(p.totalDurationMs)}
                    value={p.totalDurationMs}
                    max={maxPageDuration}
                  />
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="mb-4 text-base font-bold text-text-primary">Eng ko&apos;p bosilgan tugmalar</h2>
              <div className="flex flex-col gap-3">
                {summary.topButtons.length === 0 && <p className="text-sm text-text-muted">Hali ma&apos;lumot yo&apos;q</p>}
                {summary.topButtons.map((b) => (
                  <RankedBar
                    key={`${b.label}-${b.path}`}
                    label={b.label}
                    sublabel={b.path ?? undefined}
                    valueLabel={`${b.count} marta`}
                    value={b.count}
                    max={maxButtonCount}
                  />
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      <Card className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-0">
          <div>
            <h2 className="text-base font-bold text-text-primary">Foydalanuvchilar faolligi</h2>
            <p className="text-xs text-text-secondary">Har bir mijoz ilovada qancha vaqt o&apos;tkazgani — chuqur tahlil uchun</p>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism yoki telefon bo'yicha qidirish…"
            className="tap-target w-64 rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {usersError && <p className="px-5 pt-4 text-sm font-medium text-danger">{usersError}</p>}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-text-muted">
                <th className="px-5 py-3">Foydalanuvchi</th>
                <th className="px-5 py-3">Seanslar</th>
                <th className="px-5 py-3">Jami vaqt</th>
                <th className="px-5 py-3">Eng ko&apos;p ko&apos;rgan sahifa</th>
                <th className="px-5 py-3">Oxirgi faollik</th>
              </tr>
            </thead>
            <tbody>
              {usersLoading && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-text-muted">
                    Yuklanmoqda…
                  </td>
                </tr>
              )}
              {!usersLoading && users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-text-muted">
                    Hali hech kim uchun ma&apos;lumot yo&apos;q
                  </td>
                </tr>
              )}
              {!usersLoading &&
                users.map((u) => (
                  <tr key={u.userId} className="border-b border-border/60 last:border-0 hover:bg-surface-muted/60">
                    <td className="px-5 py-3">
                      <div className="font-semibold text-text-primary">{u.name ?? "Ism kiritilmagan"}</div>
                      <div className="text-xs text-text-muted">{u.phone ?? u.userId}</div>
                    </td>
                    <td className="px-5 py-3 text-text-secondary">{u.sessionsCount}</td>
                    <td className="px-5 py-3 font-semibold text-text-primary">{formatDuration(u.totalDurationMs)}</td>
                    <td className="px-5 py-3 text-text-secondary">{u.topPath ?? "—"}</td>
                    <td className="px-5 py-3 text-text-secondary">{formatDateTime(u.lastActiveAt)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-5 pt-4">
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
                loadUsers(search, next);
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
                loadUsers(search, next);
              }}
            >
              Keyingi
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
