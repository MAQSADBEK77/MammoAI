"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { adminApi, type YandexMetrikaDashboardResponse } from "@/lib/admin-api";
import type { AnalyticsSummary, AnalyticsUserSummary } from "@mammoai/shared";
import { Card, Button, ErrorState } from "@/components/ui";
import { Emoji } from "@/components/Emoji";
import { SignupsChart } from "../_components/SignupsChart";

const PAGE_SIZE = 20;
const DAY_OPTIONS = [7, 14, 30, 90];

function formatDuration(ms: number): string {
  if (!ms || ms < 1000) return "0 son";
  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours} soat ${minutes} daq`;
  if (minutes > 0) return `${minutes} daq ${seconds} son`;
  return `${seconds} son`;
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function StatCard({ icon, label, value, hint }: { icon: string; label: string; value: string | number; hint?: string }) {
  return (
    <Card className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
        <Emoji e={icon} />
        {label}
      </div>
      <div className="mt-1 text-3xl font-extrabold text-text-primary">{value}</div>
      {hint && <div className="text-xs text-text-muted">{hint}</div>}
    </Card>
  );
}

/** Bitta seriyali (magnitude) ranking — brend rangi bitta, legend shart emas. */
function RankedBar({ label, sublabel, valueLabel, value, max }: { label: string; sublabel?: string; valueLabel: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs font-semibold text-text-secondary">
        <span className="truncate">
          {label}
          {sublabel && <span className="ml-1.5 font-normal text-text-muted">{sublabel}</span>}
        </span>
        <span className="shrink-0 text-text-muted">{valueLabel}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
        <div className="h-full rounded-full bg-primary/70" style={{ width: `${Math.max(pct, 3)}%` }} />
      </div>
    </div>
  );
}

function formatCachedAt(iso: string): string {
  const ageMs = Date.now() - new Date(iso).getTime();
  const ageMin = Math.round(ageMs / 60000);
  if (ageMin <= 0) return "hozirgina";
  if (ageMin === 1) return "1 daqiqa oldin";
  if (ageMin < 60) return `${ageMin} daqiqa oldin`;
  const ageHours = Math.round(ageMin / 60);
  return `${ageHours} soat oldin`;
}

/**
 * YANDEX-METRIKA-04: mammo.uz'ga ulangan Yandex Metrika hisobidan (haqiqiy
 * VEB-TASHRIF analitikasi) tortib olingan ma'lumot — ATAYLAB alohida bo'lim,
 * yuqoridagi ICHKI `analytics_events` (ilova ichidagi harakat) bilan
 * ARALASHTIRILMAYDI: ikkalasi BOSHQA-BOSHQA narsani o'lchaydi.
 */
function YandexMetrikaSection() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<YandexMetrikaDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback((selectedDays: number, force: boolean) => {
    if (force) setRefreshing(true);
    setError(null);
    adminApi.yandexMetrika
      .dashboard(selectedDays, force)
      .then((res) => setData(res))
      .catch((err) => setError(err instanceof Error ? err.message : "Yuklashda xatolik"))
      .finally(() => {
        if (force) setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    // FIX: setState'ni to'g'ridan-to'g'ri effekt ichida emas, keyingi
    // macrotask'da chaqirish uchun (react-hooks/set-state-in-effect) —
    // xuddi shu naqsh telegram-bot/page.tsx'da ham ishlatiladi.
    const timeout = setTimeout(() => load(days, false), 0);
    return () => clearTimeout(timeout);
  }, [days, load]);

  const maxTraffic = Math.max(1, ...(data && data.configured ? data.trafficSources.map((t) => t.visits) : [1]));
  const maxDevice = Math.max(1, ...(data && data.configured ? data.devices.map((d) => d.visits) : [1]));
  const maxPageviews = Math.max(1, ...(data && data.configured ? data.topPages.map((p) => p.pageviews) : [1]));
  const maxGeoVisits = Math.max(1, ...(data && data.configured ? data.geography.map((g) => g.visits) : [1]));

  return (
    <Card className="flex flex-col gap-6 border border-border/60">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-text-primary">
            <Emoji e="🌐" /> Yandex Metrika (tashqi veb-trafik)
          </h2>
          <p className="mt-1 text-xs text-text-secondary">
            mammo.uz&apos;ga ulangan Yandex Metrika hisobidan — bu YUQORIDAGI ichki foydalanuvchi-harakati bilan bir xil
            narsa EMAS, saytga tashqi tashrif statistikasi
          </p>
        </div>
        {data?.configured && (
          <div className="flex items-center gap-2">
            <div className="flex rounded-full border border-border bg-surface p-1">
              {DAY_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    days === d ? "bg-primary text-white" : "text-text-secondary hover:bg-surface-muted"
                  }`}
                >
                  {d} kun
                </button>
              ))}
            </div>
            <Button variant="secondary" className="px-4! py-2! text-xs" disabled={refreshing} onClick={() => load(days, true)}>
              {refreshing ? "Yangilanmoqda…" : "🔄 Yangilash"}
            </Button>
          </div>
        )}
      </div>

      {error && <Card className="border border-danger/20 bg-danger/5 text-sm font-medium text-danger">{error}</Card>}

      {!data && !error && <p className="py-6 text-center text-sm text-text-muted">Yuklanmoqda…</p>}

      {data && !data.configured && (
        <Card className="flex flex-col items-center gap-3 border border-border/60 bg-surface-muted/40 py-10 text-center">
          <Emoji e="🌐" size={32} />
          <p className="text-sm font-semibold text-text-primary">Yandex Metrika hali ulanmagan</p>
          <p className="max-w-sm text-xs text-text-secondary">
            Counter ID va OAuth tokenni sozlab, saytga haqiqiy tashqi tashrif analitikasini shu yerda ko&apos;ring.
          </p>
          <Link href="/admin/yandex-metrika">
            <Button className="px-5! py-2! text-sm">Sozlash</Button>
          </Link>
        </Card>
      )}

      {data && data.configured && (
        <>
          <p className="-mt-2 text-xs text-text-muted">Yangilangan: {formatCachedAt(data.cachedAt)}</p>

          {/* OVERNIGHT-05: 🧭/🙋/📄/⏱️'ning mahalliy Twemoji SVG fayli yo'q
              edi — "buzuq rasm" belgisi ko'rinardi. Mavjud to'plamdan
              almashtirildi. */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard icon="📊" label="Tashriflar" value={data.totals.visits} hint={`So'nggi ${days} kun`} />
            <StatCard icon="👥" label="Foydalanuvchilar" value={data.totals.users} />
            <StatCard icon="📖" label="Sahifa ko'rishlar" value={data.totals.pageviews} />
            <StatCard icon="🚪" label="Sakrash darajasi" value={`${data.totals.bounceRatePct}%`} />
            <StatCard icon="📅" label="O'rtacha davomiylik" value={formatDuration(data.totals.avgVisitDurationSec * 1000)} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card variant="flat">
              <h3 className="mb-3 text-sm font-bold text-text-primary">Kunlik tashriflar</h3>
              <SignupsChart data={data.daily.map((d) => ({ day: d.date, count: d.visits }))} />
            </Card>
            <Card variant="flat">
              <h3 className="mb-3 text-sm font-bold text-text-primary">Kunlik foydalanuvchilar</h3>
              <SignupsChart data={data.daily.map((d) => ({ day: d.date, count: d.users }))} />
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card variant="flat">
              <h3 className="mb-3 text-sm font-bold text-text-primary">Trafik manbalari</h3>
              <div className="flex flex-col gap-3">
                {data.trafficSources.length === 0 && <p className="text-sm text-text-muted">Hali ma&apos;lumot yo&apos;q</p>}
                {data.trafficSources.map((t) => (
                  <RankedBar key={t.label} label={t.label} valueLabel={`${t.visits} ta`} value={t.visits} max={maxTraffic} />
                ))}
              </div>
            </Card>
            <Card variant="flat">
              <h3 className="mb-3 text-sm font-bold text-text-primary">Qurilma turi</h3>
              <div className="flex flex-col gap-3">
                {data.devices.length === 0 && <p className="text-sm text-text-muted">Hali ma&apos;lumot yo&apos;q</p>}
                {data.devices.map((d) => (
                  <RankedBar key={d.label} label={d.label} valueLabel={`${d.visits} ta`} value={d.visits} max={maxDevice} />
                ))}
              </div>
            </Card>
          </div>

          <Card variant="flat">
            <h3 className="mb-3 text-sm font-bold text-text-primary">Eng ko&apos;p ko&apos;rilgan sahifalar</h3>
            <div className="flex flex-col gap-3">
              {data.topPages.length === 0 && <p className="text-sm text-text-muted">Hali ma&apos;lumot yo&apos;q</p>}
              {data.topPages.map((p) => (
                <RankedBar key={p.path} label={p.path} valueLabel={`${p.pageviews} ko'rish`} value={p.pageviews} max={maxPageviews} />
              ))}
            </div>
          </Card>

          <Card variant="flat">
            <h3 className="mb-3 text-sm font-bold text-text-primary">Geografiya</h3>
            <div className="flex flex-col gap-3">
              {data.geography.length === 0 && <p className="text-sm text-text-muted">Hali ma&apos;lumot yo&apos;q</p>}
              {data.geography.map((g) => (
                <RankedBar
                  key={`${g.country}-${g.city}`}
                  label={g.city}
                  sublabel={g.country}
                  valueLabel={`${g.visits} ta`}
                  value={g.visits}
                  max={maxGeoVisits}
                />
              ))}
            </div>
          </Card>
        </>
      )}
    </Card>
  );
}

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(14);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [users, setUsers] = useState<AnalyticsUserSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  // UX-04: ilgari "qayta urinish" tugmasi yo'q edi — faqat xato-banner.
  const loadSummary = useCallback(() => {
    setSummaryError(null);
    adminApi.analytics
      .summary(days)
      .then((res) => {
        setSummary(res);
        setSummaryError(null);
      })
      .catch((err) => setSummaryError(err instanceof Error ? err.message : "Yuklashda xatolik"));
  }, [days]);

  useEffect(() => {
    const timeout = setTimeout(loadSummary, 0);
    return () => clearTimeout(timeout);
  }, [loadSummary]);

  // FIX2-03: tez ketma-ket kiritilgan qidiruv so'rovlari orasida tartib
  // kafolati yo'q edi — eskisi keyinroq qaytsa, yangi natijani bosib
  // yuborardi. Har bir chaqiruvga o'sib boruvchi ID biriktiriladi, faqat ENG
  // SO'NGGI so'rov natijasi qabul qilinadi.
  const latestRequestId = useRef(0);

  const loadUsers = useCallback((currentSearch: string, currentOffset: number) => {
    const requestId = ++latestRequestId.current;
    setUsersLoading(true);
    setUsersError(null);
    adminApi.analytics
      .users({ search: currentSearch || undefined, limit: PAGE_SIZE, offset: currentOffset })
      .then((res) => {
        if (latestRequestId.current !== requestId) return;
        setUsers(res.users);
        setTotal(res.total);
      })
      .catch((err) => {
        if (latestRequestId.current !== requestId) return;
        setUsersError(err instanceof Error ? err.message : "Yuklashda xatolik");
      })
      .finally(() => {
        if (latestRequestId.current === requestId) setUsersLoading(false);
      });
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setOffset(0);
      loadUsers(search, 0);
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const maxPageDuration = Math.max(1, ...(summary?.topPages.map((p) => p.totalDurationMs) ?? [1]));
  const maxButtonCount = Math.max(1, ...(summary?.topButtons.map((b) => b.count) ?? [1]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary">Analitika</h1>
            {/* Yandex Metrica uslubidagi "hozir onlayn" — pulslovchi nuqta bilan,
                `days` filtridan mustaqil (doim so'nggi 5 daqiqa). */}
            {summary && (
              <div className="flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-bold text-success">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                Hozir onlayn: {summary.liveNow}
              </div>
            )}
          </div>
          <p className="mt-1 text-sm text-text-secondary">Foydalanuvchilar qaysi sahifada qancha vaqt o&apos;tkazgani va nimani bosgani</p>
        </div>
        <div className="flex rounded-full border border-border bg-surface p-1">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                days === d ? "bg-primary text-white" : "text-text-secondary hover:bg-surface-muted"
              }`}
            >
              {d} kun
            </button>
          ))}
        </div>
      </div>

      {summaryError ? (
        <ErrorState message={summaryError} retry={{ label: "Qayta urinish", onClick: loadSummary }} />
      ) : (
        !summary && <Card className="py-10 text-center text-sm text-text-muted">Yuklanmoqda…</Card>
      )}

      {summary && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard icon="📊" label="Jami seanslar" value={summary.totals.sessions} hint={`So'nggi ${days} kun`} />
            <StatCard icon="📖" label="Sahifa ko'rishlar" value={summary.totals.pageviews} />
            <StatCard icon="📱" label="Tugma bosishlar" value={summary.totals.clicks} />
            <StatCard icon="📅" label="O'rtacha seans davomiyligi" value={formatDuration(summary.totals.avgSessionDurationMs)} />
            {/* Yandex Metrica/Google Analytics'dagi klassik "bounce rate" —
                bitta sahifa ko'rib, hech narsa bosmasdan ketganlar foizi. */}
            <StatCard icon="🚪" label="Tashlab ketish (bounce rate)" value={`${summary.bounceRatePct}%`} hint="1 sahifa, 0 bosish" />
          </div>

          <Card>
            <div className="mb-4">
              <h2 className="text-base font-bold text-text-primary">Kunlik faollik</h2>
              <p className="text-xs text-text-secondary">Har bir ustun — o&apos;sha kuni ilovada bo&apos;lgan alohida seanslar soni</p>
            </div>
            <SignupsChart data={summary.dailyActivity.map((d) => ({ day: d.day, count: d.sessions }))} />
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="mb-4 text-base font-bold text-text-primary">Eng ko&apos;p vaqt o&apos;tkazilgan sahifalar</h2>
              <div className="flex flex-col gap-3">
                {summary.topPages.length === 0 && <p className="text-sm text-text-muted">Hali ma&apos;lumot yo&apos;q</p>}
                {summary.topPages.map((p) => (
                  <RankedBar
                    key={p.path}
                    label={p.path}
                    sublabel={`${p.viewCount} ko'rish`}
                    valueLabel={formatDuration(p.totalDurationMs)}
                    value={p.totalDurationMs}
                    max={maxPageDuration}
                  />
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="mb-4 text-base font-bold text-text-primary">Eng ko&apos;p bosilgan tugmalar</h2>
              <div className="flex flex-col gap-3">
                {summary.topButtons.length === 0 && <p className="text-sm text-text-muted">Hali ma&apos;lumot yo&apos;q</p>}
                {summary.topButtons.map((b) => (
                  <RankedBar
                    key={`${b.label}-${b.path}`}
                    label={b.label}
                    sublabel={b.path ?? undefined}
                    valueLabel={`${b.count} marta`}
                    value={b.count}
                    max={maxButtonCount}
                  />
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <div className="mb-4">
              <h2 className="text-base font-bold text-text-primary">Sahifama-sahifa qolib ketish (exit rate)</h2>
              <p className="text-xs text-text-secondary">
                Har bir sahifa uchun ALOHIDA: shu sahifani ko&apos;rgan foydalanuvchilarning necha foizi aynan SHU YERDAN
                (boshqa sahifaga o&apos;tmasdan) chiqib ketgan — umumiy son emas. Eng yuqori foiz — eng ko&apos;p tashlab
                ketilayotgan sahifa. Shovqin uchun kamida 5 ta tashrifi bo&apos;lgan sahifalar ko&apos;rsatiladi.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {summary.pageDropOff.length === 0 && <p className="text-sm text-text-muted">Hali ma&apos;lumot yo&apos;q</p>}
              {summary.pageDropOff.map((p) => (
                <RankedBar
                  key={p.path}
                  label={p.path}
                  sublabel={`${p.entries} tashrif`}
                  valueLabel={`${p.exitRatePct}% (${p.exits} ta)`}
                  value={p.exitRatePct}
                  max={100}
                />
              ))}
            </div>
          </Card>

          <Card>
            <div className="mb-4">
              <h2 className="text-base font-bold text-text-primary">QR-funnel ro&apos;yxatdan o&apos;tishlar</h2>
              <p className="text-xs text-text-secondary">
                <code className="rounded bg-surface-muted px-1">/baholash?src=...</code> havolasi orqali kelib, ro&apos;yxatdan o&apos;tganlar (manba bo&apos;yicha)
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {summary.qrSignups.length === 0 && <p className="text-sm text-text-muted">Hali ma&apos;lumot yo&apos;q</p>}
              {summary.qrSignups.map((q) => (
                <RankedBar
                  key={q.source}
                  label={q.source}
                  valueLabel={`${q.count} ta`}
                  value={q.count}
                  max={Math.max(1, ...summary.qrSignups.map((s) => s.count))}
                />
              ))}
            </div>
          </Card>
        </>
      )}

      <Card className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-0">
          <div>
            <h2 className="text-base font-bold text-text-primary">Foydalanuvchilar faolligi</h2>
            <p className="text-xs text-text-secondary">Har bir mijoz ilovada qancha vaqt o&apos;tkazgani — chuqur tahlil uchun</p>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism yoki telefon bo'yicha qidirish…"
            className="tap-target w-64 rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {usersError && <p className="px-5 pt-4 text-sm font-medium text-danger">{usersError}</p>}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-text-muted">
                <th className="px-5 py-3">Foydalanuvchi</th>
                <th className="px-5 py-3">Seanslar</th>
                <th className="px-5 py-3">Jami vaqt</th>
                <th className="px-5 py-3">Eng ko&apos;p ko&apos;rgan sahifa</th>
                <th className="px-5 py-3">Oxirgi faollik</th>
              </tr>
            </thead>
            <tbody>
              {usersLoading && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-text-muted">
                    Yuklanmoqda…
                  </td>
                </tr>
              )}
              {!usersLoading && users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-text-muted">
                    Hali hech kim uchun ma&apos;lumot yo&apos;q
                  </td>
                </tr>
              )}
              {!usersLoading &&
                users.map((u) => (
                  <tr key={u.userId} className="border-b border-border/60 last:border-0 hover:bg-surface-muted/60">
                    <td className="px-5 py-3">
                      <div className="font-semibold text-text-primary">{u.name ?? "Ism kiritilmagan"}</div>
                      <div className="text-xs text-text-muted">{u.phone ?? u.userId}</div>
                    </td>
                    <td className="px-5 py-3 text-text-secondary">{u.sessionsCount}</td>
                    <td className="px-5 py-3 font-semibold text-text-primary">{formatDuration(u.totalDurationMs)}</td>
                    <td className="px-5 py-3 text-text-secondary">{u.topPath ?? "—"}</td>
                    <td className="px-5 py-3 text-text-secondary">{formatDateTime(u.lastActiveAt)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-5 pt-4">
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
                loadUsers(search, next);
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
                loadUsers(search, next);
              }}
            >
              Keyingi
            </Button>
          </div>
        </div>
      </Card>

      <YandexMetrikaSection />
    </div>
  );
}
