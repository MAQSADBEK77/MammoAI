"use client";

import { useEffect, useState } from "react";
import { Card, Select } from "@/components/ui";
import { RiskBadge } from "@/components/RiskBadge";
import { RISK_LABELS, apiGetAdminAttempts } from "@/lib/store";
import type { QuizAttempt, RiskLevel } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

export default function AdminResultsPage() {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [filter, setFilter] = useState<"all" | RiskLevel>("all");

  useEffect(() => {
    apiGetAdminAttempts().then(setAttempts);
  }, []);

  const filtered = attempts.filter((a) => filter === "all" || a.riskLevel === filter);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Test natijalari</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Barcha foydalanuvchilarning barcha test urinishlari.
          </p>
        </div>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value as "all" | RiskLevel)}
          className="w-auto"
        >
          <option value="all">Barcha darajalar</option>
          {(Object.keys(RISK_LABELS) as RiskLevel[]).map((level) => (
            <option key={level} value={level}>
              {RISK_LABELS[level]}
            </option>
          ))}
        </Select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:bg-slate-900 dark:text-slate-500">
              <tr>
                <th className="px-5 py-3">Foydalanuvchi</th>
                <th className="px-5 py-3">Sana</th>
                <th className="px-5 py-3">Ko&apos;rsatkich</th>
                <th className="px-5 py-3">Xavf darajasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((a) => (
                <tr key={a.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                    {a.userFirstName ? `${a.userFirstName} ${a.userLastName}` : "Noma'lum foydalanuvchi"}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatDateTime(a.createdAt)}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {a.percent}% ({a.totalScore}/{a.maxScore})
                  </td>
                  <td className="px-5 py-3">
                    <RiskBadge level={a.riskLevel} size="sm" />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-400 dark:text-slate-500">
                    Natijalar topilmadi.
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
