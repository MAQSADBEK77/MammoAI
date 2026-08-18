"use client";

import { useEffect, useState } from "react";
import { Card, Select } from "@/components/ui";
import { RiskBadge, getRiskLabel } from "@/components/RiskBadge";
import { apiGetAdminAttempts } from "@/lib/store";
import type { QuizAttempt, RiskLevel } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/context";

const LEVELS: RiskLevel[] = ["past", "orta", "yuqori"];

export default function AdminResultsPage() {
  const { t, language } = useLanguage();
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.adminResults.title}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.adminResults.subtitle}</p>
        </div>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value as "all" | RiskLevel)}
          className="w-auto"
        >
          <option value="all">{t.adminResults.allLevels}</option>
          {LEVELS.map((level) => (
            <option key={level} value={level}>
              {getRiskLabel(t, level)}
            </option>
          ))}
        </Select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:bg-slate-900 dark:text-slate-500">
              <tr>
                <th className="px-5 py-3">{t.adminResults.colUser}</th>
                <th className="px-5 py-3">{t.adminResults.colDate}</th>
                <th className="px-5 py-3">{t.adminResults.colScore}</th>
                <th className="px-5 py-3">{t.adminResults.colRisk}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((a) => (
                <tr key={a.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                    {a.userFirstName ? `${a.userFirstName} ${a.userLastName}` : t.adminResults.unknownUser}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatDateTime(a.createdAt, language)}</td>
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
                    {t.adminResults.empty}
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
