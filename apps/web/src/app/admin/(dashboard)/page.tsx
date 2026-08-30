"use client";

import { useEffect, useState } from "react";
import { adminApi, type AdminStats } from "@/lib/admin-api";
import { Card, LoadingSpinner } from "@/components/ui";
import { SignupsChart } from "./_components/SignupsChart";

const GOAL_LABELS: Record<string, string> = {
  cycle: "Hayz siklini kuzatish",
  pregnancy: "Homiladorlikni kuzatish",
  planning_pregnancy: "Homilador bo'lishni rejalashtirish",
  wellbeing: "Sog'ligini nazorat qilish",
  checkups: "Tekshiruvlarni nazorat qilish",
  understand_body: "Tanani yaxshiroq tushunish",
  skin: "Terini yaxshilash",
};

const LANGUAGE_LABELS: Record<string, string> = { uz: "O'zbekcha", ru: "Ruscha" };

function StatCard({ icon, label, value, hint }: { icon: string; label: string; value: string | number; hint?: string }) {
  return (
    <Card className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
        <span className="text-lg leading-none">{icon}</span>
        {label}
      </div>
      <div className="mt-1 text-3xl font-extrabold text-text-primary">{value}</div>
      {hint && <div className="text-xs text-text-muted">{hint}</div>}
    </Card>
  );
}

function BreakdownBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-semibold text-text-secondary">
        <span>{label}</span>
        <span className="text-text-muted">
          {count} · {pct}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
        <div className="h-full rounded-full bg-primary/70" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .stats()
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : "Statistikani olishda xatolik"));
  }, []);

  if (error) {
    return (
      <Card className="border border-danger/20 bg-danger/5 text-danger">
        <p className="font-semibold">Statistikani yuklab bo&apos;lmadi</p>
        <p className="mt-1 text-sm">{error}</p>
      </Card>
    );
  }

  if (!stats) {
    return <LoadingSpinner label="Statistika yuklanmoqda…" />;
  }

  const totalGoal = stats.goalBreakdown.reduce((sum, g) => sum + g.count, 0);
  const totalLanguage = stats.languageBreakdown.reduce((sum, l) => sum + l.count, 0);
  const contentEntries: { icon: string; label: string; value: number }[] = [
    { icon: "📅", label: "Sikl yozuvlari", value: stats.contentCounts.cycleLogs },
    { icon: "🤰", label: "Homiladorlik ko'riklari", value: stats.contentCounts.pregnancyVisits },
    { icon: "💓", label: "Sog'liq ko'rsatkichlari", value: stats.contentCounts.pregnancyVitals },
    { icon: "✅", label: "Bajarilgan vazifalar", value: stats.contentCounts.checklistCompleted },
    { icon: "🧪", label: "Xavf-testi natijalari", value: stats.contentCounts.riskQuizResults },
    { icon: "📍", label: "Klinikaga yo'naltirishlar", value: stats.contentCounts.referralEvents },
    { icon: "🏥", label: "Klinikalar", value: stats.contentCounts.clinics },
    { icon: "📰", label: "Maqolalar", value: stats.contentCounts.articles },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Boshqaruv paneli</h1>
        <p className="mt-1 text-sm text-text-secondary">Ilova bo&apos;yicha real vaqtdagi statistika</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon="👥" label="Jami foydalanuvchilar" value={stats.totalUsers} />
        <StatCard icon="✨" label="Bugun ro'yxatdan o'tdi" value={stats.newUsersToday} />
        <StatCard icon="📈" label="Shu hafta ro'yxatdan o'tdi" value={stats.newUsersThisWeek} />
        <StatCard icon="🔥" label="Faol (7 kun)" value={stats.activeUsersLast7Days} hint="Kamida bitta yozuv qoldirgan" />
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-text-primary">So&apos;nggi 30 kunlik ro&apos;yxatdan o&apos;tishlar</h2>
            <p className="text-xs text-text-secondary">Har bir ustun — o&apos;sha kuni ro&apos;yxatdan o&apos;tgan foydalanuvchilar soni</p>
          </div>
        </div>
        <SignupsChart data={stats.signupsByDay} />
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-base font-bold text-text-primary">Til bo&apos;yicha taqsimot</h2>
          <div className="flex flex-col gap-3">
            {stats.languageBreakdown.length === 0 && <p className="text-sm text-text-muted">Ma&apos;lumot yo&apos;q</p>}
            {stats.languageBreakdown.map((l) => (
              <BreakdownBar key={l.language} label={LANGUAGE_LABELS[l.language] ?? l.language} count={l.count} total={totalLanguage} />
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-bold text-text-primary">Maqsad bo&apos;yicha taqsimot</h2>
          <div className="flex flex-col gap-3">
            {stats.goalBreakdown.length === 0 && <p className="text-sm text-text-muted">Ma&apos;lumot yo&apos;q</p>}
            {stats.goalBreakdown.map((g) => (
              <BreakdownBar key={g.goal} label={GOAL_LABELS[g.goal] ?? g.goal} count={g.count} total={totalGoal} />
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 text-base font-bold text-text-primary">Kontent statistikasi</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {contentEntries.map((entry) => (
            <div key={entry.label} className="rounded-2xl bg-surface-muted p-3.5">
              <div className="text-lg leading-none">{entry.icon}</div>
              <div className="mt-2 text-xl font-extrabold text-text-primary">{entry.value}</div>
              <div className="text-[11px] leading-tight text-text-secondary">{entry.label}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="border border-warning/20 bg-warning/5">
        <p className="text-sm font-semibold text-text-primary">💡 Server yuklamasi haqida</p>
        <p className="mt-1 text-sm text-text-secondary">
          Vercel serverless muhitida an&apos;anaviy CPU/server-yuklama ko&apos;rsatkichi mavjud emas — shuning uchun bu yerda haqiqiy
          ishlatilish (foydalanuvchi, yozuv, faollik) statistikasi ko&apos;rsatilmoqda. Real trafik/so&apos;rovlar bo&apos;yicha aniq
          ma&apos;lumot uchun{" "}
          <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer" className="font-semibold text-primary underline">
            Vercel dashboard
          </a>
          iga qarang.
        </p>
      </Card>
    </div>
  );
}
