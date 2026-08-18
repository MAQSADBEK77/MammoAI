"use client";

import { useEffect, useState } from "react";
import { ClipboardList, ListChecks, Users2 } from "lucide-react";
import { Card } from "@/components/ui";
import { RISK_STATUS_COLOR, getRiskLabel } from "@/components/RiskBadge";
import { StatCounter } from "@/components/StatCounter";
import { TrendChart } from "@/components/TrendChart";
import {
  apiGetAdminAttempts,
  apiGetAdminTrend,
  apiGetAdminUsers,
  apiGetQuestions,
  type AdminUser,
  type DailyCounts,
} from "@/lib/store";
import { useT } from "@/lib/i18n/context";
import type { RiskLevel } from "@/lib/types";

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users2;
  label: string;
  value: number;
}) {
  return (
    <Card className="p-5 transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
          <Icon size={18} />
        </span>
        <div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            <StatCounter value={value} duration={800} />
          </p>
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500">{label}</p>
        </div>
      </div>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const t = useT();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [attemptsCount, setAttemptsCount] = useState(0);
  const [questionsCount, setQuestionsCount] = useState(0);
  const [distribution, setDistribution] = useState<Record<RiskLevel, number>>({
    past: 0,
    orta: 0,
    yuqori: 0,
  });
  const [trend, setTrend] = useState<DailyCounts[]>([]);

  useEffect(() => {
    apiGetAdminTrend().then(setTrend);
  }, []);

  useEffect(() => {
    Promise.all([apiGetAdminUsers(), apiGetAdminAttempts(), apiGetQuestions()]).then(
      ([allUsers, allAttempts, questions]) => {
        const normalUsers = allUsers.filter((u) => u.role === "user");
        setUsers(normalUsers);
        setAttemptsCount(allAttempts.length);
        setQuestionsCount(questions.length);

        const dist: Record<RiskLevel, number> = { past: 0, orta: 0, yuqori: 0 };
        for (const u of normalUsers) {
          if (u.latestAttempt) dist[u.latestAttempt.riskLevel] += 1;
        }
        setDistribution(dist);
      }
    );
  }, []);

  const maxDist = Math.max(1, ...Object.values(distribution));
  const testedCount = distribution.past + distribution.orta + distribution.yuqori;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.adminOverview.title}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.adminOverview.subtitle}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile icon={Users2} label={t.adminOverview.totalUsers} value={users.length} />
        <StatTile icon={ClipboardList} label={t.adminOverview.totalAttempts} value={attemptsCount} />
        <StatTile icon={ListChecks} label={t.adminOverview.totalQuestions} value={questionsCount} />
      </div>

      <Card className="p-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          {t.adminOverview.distributionTitle}
        </h2>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          {t.adminOverview.distributionSubtitle.replace("{count}", String(testedCount))}
        </p>

        <div className="mt-6 flex flex-col gap-4">
          {(Object.keys(distribution) as RiskLevel[]).map((level) => {
            const count = distribution[level];
            const widthPct = Math.round((count / maxDist) * 100);
            return (
              <div key={level} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-sm font-medium text-slate-600 dark:text-slate-300">
                  {getRiskLabel(t, level)}
                </span>
                <div
                  className="h-3 flex-1 rounded-full transition-colors"
                  style={{ backgroundColor: "var(--meter-track)" }}
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-700 ease-out"
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: RISK_STATUS_COLOR[level],
                    }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t.adminOverview.trendTitle}</h2>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{t.adminOverview.trendSubtitle}</p>
        <div className="mt-6">
          <TrendChart data={trend} />
        </div>
      </Card>
    </div>
  );
}
