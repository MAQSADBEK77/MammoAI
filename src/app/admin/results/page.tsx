"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button, Card, Input, Select } from "@/components/ui";
import { RiskBadge, getRiskLabel } from "@/components/RiskBadge";
import { apiGetAdminAttempts } from "@/lib/store";
import type { QuizAttempt, RiskLevel } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/context";
import { downloadCsv } from "@/lib/csv";

const LEVELS: RiskLevel[] = ["past", "orta", "yuqori"];

export default function AdminResultsPage() {
  const { t, language } = useLanguage();
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [filter, setFilter] = useState<"all" | RiskLevel>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    apiGetAdminAttempts().then(setAttempts);
  }, []);

  const filtered = attempts.filter((a) => {
    if (filter !== "all" && a.riskLevel !== filter) return false;
    const day = a.createdAt.slice(0, 10);
    if (fromDate && day < fromDate) return false;
    if (toDate && day > toDate) return false;
    return true;
  });

  function handleExportCsv() {
    downloadCsv(
      "natijalar.csv",
      ["Foydalanuvchi", "Sana", "Foiz", "Ball", "Xavf darajasi"],
      filtered.map((a) => [
        a.userFirstName ? `${a.userFirstName} ${a.userLastName}` : t.adminResults.unknownUser,
        a.createdAt,
        a.percent,
        `${a.totalScore}/${a.maxScore}`,
        a.riskLevel,
      ])
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-pink-900 dark:text-white">{t.adminResults.title}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.adminResults.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-auto" />
          <span className="text-sm text-slate-400">—</span>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-auto" />
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
          <Button variant="secondary" onClick={handleExportCsv}>
            <Download size={15} />
            {t.adminUsers.exportCsv}
          </Button>
        </div>
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
                  <td className="px-5 py-3 font-medium text-pink-900 dark:text-white">
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
