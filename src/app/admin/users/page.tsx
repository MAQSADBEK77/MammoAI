"use client";

import { useEffect, useState } from "react";
import { Search, ShieldCheck, Trash2 } from "lucide-react";
import { Badge, Card, Input } from "@/components/ui";
import { RiskBadge } from "@/components/RiskBadge";
import { apiDeleteUser, apiGetAdminUsers, type AdminUser } from "@/lib/store";
import { formatDate } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/context";

export default function AdminUsersPage() {
  const { t, language } = useLanguage();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reload() {
    apiGetAdminUsers().then(setUsers);
  }

  useEffect(reload, []);

  async function handleDelete(id: string) {
    if (!window.confirm(t.adminUsers.deleteConfirm)) {
      return;
    }
    setError(null);
    try {
      await apiDeleteUser(id);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.adminUsers.deleteError);
    }
  }

  const q = query.trim().toLowerCase();
  const filtered = users.filter((u) => {
    if (!q) return true;
    return (
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.passportSeries.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.adminUsers.title}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.adminUsers.subtitle}</p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.adminUsers.searchPlaceholder}
            className="pl-9"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </p>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:bg-slate-900 dark:text-slate-500">
              <tr>
                <th className="px-5 py-3">{t.adminUsers.colName}</th>
                <th className="px-5 py-3">{t.adminUsers.colContact}</th>
                <th className="px-5 py-3">{t.adminUsers.colBirth}</th>
                <th className="px-5 py-3">{t.adminUsers.colPassport}</th>
                <th className="px-5 py-3">{t.adminUsers.colRegistered}</th>
                <th className="px-5 py-3">{t.adminUsers.colRisk}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 font-medium text-slate-900 dark:text-white">
                      {u.firstName} {u.lastName}
                      {u.role === "admin" && (
                        <Badge tone="blue">
                          <ShieldCheck size={11} className="mr-1 inline" />
                          {t.adminUsers.adminBadge}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    <div>{u.email}</div>
                    {u.phone && <div className="text-xs text-slate-400 dark:text-slate-500">{u.phone}</div>}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatDate(u.birthDate, language)}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{u.passportSeries}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatDate(u.createdAt, language)}</td>
                  <td className="px-5 py-3">
                    {u.latestAttempt ? (
                      <RiskBadge level={u.latestAttempt.riskLevel} size="sm" />
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500">{t.adminUsers.notSubmitted}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {u.role !== "admin" && (
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                        title={t.adminUsers.deleteTitle}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400 dark:text-slate-500">
                    {t.adminUsers.empty}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
