"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, type AdminFeedbackEntry } from "@/lib/admin-api";
import { Card, Button, Badge } from "@/components/ui";
import { Emoji } from "@/components/Emoji";

const PAGE_SIZE = 20;

function formatDateTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <Card className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
        <Emoji e={icon} />
        {label}
      </div>
      <div className="mt-1 text-3xl font-extrabold text-text-primary">{value}</div>
    </Card>
  );
}

export default function AdminFeedbackPage() {
  const [entries, setEntries] = useState<AdminFeedbackEntry[] | null>(null);
  const [total, setTotal] = useState(0);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [offset, setOffset] = useState(0);

  const load = useCallback((currentOffset: number) => {
    adminApi.feedback.list({ limit: PAGE_SIZE, offset: currentOffset }).then((res) => {
      setEntries(res.responses);
      setTotal(res.total);
      setAverageRating(res.averageRating);
    });
  }, []);

  useEffect(() => {
    load(0);
  }, [load]);

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Fikr-mulohazalar</h1>
        <p className="mt-1 text-sm text-text-secondary">Foydalanuvchilar &quot;Fikr bildirish&quot; menyusi va AI Yordamchi orqali qoldirgan javoblar</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon="💬" label="Jami javoblar" value={total} />
        <StatCard icon="⭐" label="O'rtacha baho (1-5)" value={averageRating !== null ? averageRating.toFixed(1) : "—"} />
      </div>

      <div className="flex flex-col gap-3">
        {entries === null ? (
          <Card className="py-10 text-center text-sm text-text-muted">Yuklanmoqda…</Card>
        ) : entries.length === 0 ? (
          <Card className="py-10 text-center text-sm text-text-muted">Hali fikr-mulohaza yo&apos;q</Card>
        ) : (
          entries.map((entry) => (
            <Card key={entry.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge tone={entry.trigger === "manual" ? "primary" : "muted"}>
                    {entry.trigger === "manual" ? "Menyu" : "AI chat"}
                  </Badge>
                  {entry.rating !== null && (
                    <Badge tone={entry.trigger === "chat_prompt" ? (entry.rating ? "success" : "danger") : "warning"}>
                      {entry.trigger === "chat_prompt" ? (entry.rating ? "👍" : "👎") : `${entry.rating}/5`}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-text-muted">{formatDateTime(entry.createdAt)}</p>
              </div>
              {entry.message && <p className="text-sm text-text-primary">{entry.message}</p>}
              <p className="text-xs text-text-muted">{entry.userPhone ?? "—"}</p>
            </Card>
          ))
        )}
      </div>

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
              load(next);
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
              load(next);
            }}
          >
            Keyingi
          </Button>
        </div>
      </div>
    </div>
  );
}
