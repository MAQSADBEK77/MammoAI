"use client";

import { useEffect, useState } from "react";
import { ClipboardList, ListChecks, Users2 } from "lucide-react";
import { Card } from "@/components/ui";
import { RISK_STATUS_COLOR } from "@/components/RiskBadge";
import { RISK_LABELS, getAttempts, getQuestions, getUsers } from "@/lib/store";
import type { RiskLevel, User } from "@/lib/types";

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
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon size={18} />
        </span>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-xs font-medium text-slate-400">{label}</p>
        </div>
      </div>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [attemptsCount, setAttemptsCount] = useState(0);
  const [questionsCount, setQuestionsCount] = useState(0);
  const [distribution, setDistribution] = useState<Record<RiskLevel, number>>({
    past: 0,
    orta: 0,
    yuqori: 0,
  });

  useEffect(() => {
    const allUsers = getUsers().filter((u) => u.role === "user");
    const allAttempts = getAttempts();
    setUsers(allUsers);
    setAttemptsCount(allAttempts.length);
    setQuestionsCount(getQuestions().length);

    const latestByUser = new Map<string, (typeof allAttempts)[number]>();
    for (const a of [...allAttempts].sort((x, y) => x.createdAt.localeCompare(y.createdAt))) {
      latestByUser.set(a.userId, a);
    }
    const dist: Record<RiskLevel, number> = { past: 0, orta: 0, yuqori: 0 };
    for (const a of latestByUser.values()) dist[a.riskLevel] += 1;
    setDistribution(dist);
  }, []);

  const maxDist = Math.max(1, ...Object.values(distribution));
  const testedCount = distribution.past + distribution.orta + distribution.yuqori;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Umumiy ko&apos;rinish</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tizimdagi foydalanuvchilar va test natijalari bo&apos;yicha statistika.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile icon={Users2} label="Jami foydalanuvchilar" value={users.length} />
        <StatTile icon={ClipboardList} label="Jami test urinishlari" value={attemptsCount} />
        <StatTile icon={ListChecks} label="Test savollari soni" value={questionsCount} />
      </div>

      <Card className="p-6">
        <h2 className="text-base font-semibold text-slate-900">
          Foydalanuvchilarning joriy xavf darajasi
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Har bir foydalanuvchining eng so&apos;nggi test natijasiga asoslangan ({testedCount} kishi test topshirgan)
        </p>

        <div className="mt-6 flex flex-col gap-4">
          {(Object.keys(distribution) as RiskLevel[]).map((level) => {
            const count = distribution[level];
            const widthPct = Math.round((count / maxDist) * 100);
            return (
              <div key={level} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-sm font-medium text-slate-600">
                  {RISK_LABELS[level]}
                </span>
                <div className="h-3 flex-1 rounded-full" style={{ backgroundColor: "#e1e0d9" }}>
                  <div
                    className="h-full rounded-full transition-[width]"
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: RISK_STATUS_COLOR[level],
                    }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-sm font-semibold text-slate-700">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
