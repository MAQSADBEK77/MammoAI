"use client";

import { useEffect, useState } from "react";
import { Card, Select } from "@/components/ui";
import { RiskBadge } from "@/components/RiskBadge";
import { RISK_LABELS, getAttempts, getUsers } from "@/lib/store";
import type { QuizAttempt, RiskLevel, User } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

export default function AdminResultsPage() {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [filter, setFilter] = useState<"all" | RiskLevel>("all");

  useEffect(() => {
    const allAttempts = [...getAttempts()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    setAttempts(allAttempts);
    const map: Record<string, User> = {};
    for (const u of getUsers()) map[u.id] = u;
    setUsers(map);
  }, []);

  const filtered = attempts.filter((a) => filter === "all" || a.riskLevel === filter);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Test natijalari</h1>
          <p className="mt-1 text-sm text-slate-500">
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
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3">Foydalanuvchi</th>
                <th className="px-5 py-3">Sana</th>
                <th className="px-5 py-3">Ko&apos;rsatkich</th>
                <th className="px-5 py-3">Xavf darajasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((a) => {
                const u = users[a.userId];
                return (
                  <tr key={a.id}>
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {u ? `${u.firstName} ${u.lastName}` : "Noma'lum foydalanuvchi"}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{formatDateTime(a.createdAt)}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {a.percent}% ({a.totalScore}/{a.maxScore})
                    </td>
                    <td className="px-5 py-3">
                      <RiskBadge level={a.riskLevel} size="sm" />
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-400">
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
