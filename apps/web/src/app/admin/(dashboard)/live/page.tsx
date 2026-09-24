"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adminApi, type LiveActivityResponse } from "@/lib/admin-api";
import { Badge, Card, ErrorState } from "@/components/ui";

/**
 * LIVE-01 — jonli faollik.
 *
 * Nega kerak: kampaniya yuborilgandan keyin "kim kirdi va QANDAY kirdi"
 * degan savolga javob berish uchun har safar qo'lda SQL yozishga to'g'ri
 * kelardi. Endi shu yerda ko'rinadi.
 *
 * Eng muhim ustun — "Manba": `campaign:` yorlig'i ayol kampaniya
 * tugmasidan kelganini ko'rsatadi. Aynan shu xabar ishladimi degan
 * savolga javob beradi.
 */
const REFRESH_MS = 10_000;

function relativeTime(iso: string): string {
  const diffSec = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSec < 60) return `${diffSec} soniya oldin`;
  const min = Math.round(diffSec / 60);
  if (min < 60) return `${min} daqiqa oldin`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `${hours} soat oldin`;
  return `${Math.round(hours / 24)} kun oldin`;
}

function personLabel(e: LiveActivityResponse["events"][number]): string {
  if (e.userName) return e.userName;
  if (e.userPhone) return e.userPhone;
  // Sessiya foydalanuvchiga bog'lanmagan — hali tizimga kirmagan tashrifchi.
  return "Kirmagan tashrifchi";
}

export default function AdminLivePage() {
  const [data, setData] = useState<LiveActivityResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  // Yangilanish orasida eski ma'lumot ko'rsatilib turadi — ekran
  // "miltillamasligi" uchun.
  const firstLoad = useRef(true);

  const load = useCallback(() => {
    adminApi.activity
      .get(100)
      .then((res) => {
        setData(res);
        setLoadError(null);
        setUpdatedAt(new Date());
        firstLoad.current = false;
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Yuklashda xatolik"));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(load, 0);
    return () => clearTimeout(timeout);
  }, [load]);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(load, REFRESH_MS);
    return () => clearInterval(interval);
  }, [load, paused]);

  if (loadError && !data) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-text-primary">Jonli faollik</h1>
        <ErrorState message={loadError} retry={{ label: "Qayta urinish", onClick: load }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Jonli faollik</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Kim kirmoqda va qanday kirmoqda. Har {REFRESH_MS / 1000} soniyada yangilanadi.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {updatedAt && <span className="text-xs text-text-muted">Yangilandi: {updatedAt.toLocaleTimeString("uz-UZ")}</span>}
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="tap-target rounded-full border border-border px-4 py-2 text-sm font-semibold text-text-secondary transition hover:bg-surface-muted"
          >
            {paused ? "Davom ettirish" : "To'xtatish"}
          </button>
        </div>
      </div>

      {data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: "Hozir (5 daq)", value: data.summary.activeLast5Min },
            { label: "15 daqiqada", value: data.summary.activeLast15Min },
            { label: "1 soatda", value: data.summary.activeLastHour },
            { label: "Kampaniya bosishlari", value: data.summary.campaignClicksTotal },
            { label: "Hodisa (1 soat)", value: data.summary.eventsLastHour },
          ].map((s) => (
            <Card key={s.label} className="p-4!">
              <p className="text-2xl font-extrabold text-text-primary">{s.value}</p>
              <p className="mt-0.5 text-xs text-text-muted">{s.label}</p>
            </Card>
          ))}
        </div>
      )}

      <Card className="overflow-hidden p-0!">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-5 py-3">Kim</th>
              <th className="px-5 py-3">Nima qildi</th>
              <th className="px-5 py-3">Manba</th>
              <th className="px-5 py-3">Qachon</th>
            </tr>
          </thead>
          <tbody>
            {(data?.events ?? []).map((e) => {
              const campaign = e.label?.startsWith("campaign:") ? e.label.slice("campaign:".length) : null;
              return (
                <tr key={e.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-text-primary">{personLabel(e)}</p>
                    {e.primaryGoal && <p className="text-xs text-text-muted">{e.primaryGoal}</p>}
                  </td>
                  <td className="px-5 py-3 text-text-secondary">
                    {e.path ?? "—"}
                    {e.type !== "pageview" && <span className="ml-2 text-xs text-text-muted">({e.type})</span>}
                    {e.label && !campaign && <span className="ml-2 text-xs text-text-muted">{e.label}</span>}
                  </td>
                  <td className="px-5 py-3">
                    {campaign ? (
                      <Badge tone="primary">Kampaniya: {campaign}</Badge>
                    ) : (
                      <span className="text-xs text-text-muted">{e.platform ?? "—"}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-text-muted">{relativeTime(e.createdAt)}</td>
                </tr>
              );
            })}
            {data && data.events.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-text-muted">
                  Hali hodisa yo&apos;q.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
