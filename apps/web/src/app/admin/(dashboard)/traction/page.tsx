"use client";

// Traction Dashboard — foydalanuvchi so'roviga ko'ra ("Demo Day'ni kutma,
// birinchi kundan raqamlarni yig'"): AARRR ko'rsatkichlari bitta ekranda.
// Ma'lumot manbai: server/repo.ts#getTractionSummary — imkon qadar MAVJUD
// jadvallardan haqiqiy hisoblanadi. Ikkita metrika ("Eng ko'p tashlab
// ketiladigan onboarding bosqichi" va manba bo'yicha QR-skanerlar) YANGI
// kuzatuv talab qildi (`onboarding_step:*`/`qr_scan:*` hodisalari) — shu
// sabab bugungi kundan boshlab yig'iladi, tarixiy ma'lumot yo'q; shunday
// holatlarda "hali yetarli ma'lumot yo'q" ko'rsatiladi, 0 emas.

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import type { TractionSummary } from "@mammoai/shared";
import { Card } from "@/components/ui";
import { Emoji } from "@/components/Emoji";

const DAY_OPTIONS = [7, 14, 30, 90];

function pctLabel(v: number | null): string {
  return v === null ? "—" : `${v}%`;
}

function StatCard({ icon, label, value, hint }: { icon: string; label: string; value: string | number; hint?: string }) {
  return (
    <Card className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
        <Emoji e={icon} />
        {label}
      </div>
      <div className="mt-1 text-2xl font-extrabold text-text-primary">{value}</div>
      {hint && <div className="text-xs text-text-muted">{hint}</div>}
    </Card>
  );
}

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

function EmptyHint({ text }: { text: string }) {
  return <p className="text-sm text-text-muted">{text}</p>;
}

function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-1 flex items-center gap-2">
      <span className="text-lg">
        <Emoji e={icon} />
      </span>
      <div>
        <h2 className="text-base font-bold text-text-primary">{title}</h2>
        {subtitle && <p className="text-xs text-text-secondary">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function AdminTractionPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<TractionSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi.traction
      .get(days)
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Yuklashda xatolik"));
  }, [days]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">🚀 Traction Dashboard</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Acquisition → Activation → Engagement → Retention → Product → Growth — birinchi kundan yig&apos;ilayotgan raqamlar
          </p>
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

      {error && <Card className="border border-danger/20 bg-danger/5 text-sm font-medium text-danger">{error}</Card>}
      {!data && !error && <Card className="py-10 text-center text-sm text-text-muted">Yuklanmoqda…</Card>}

      {data && (
        <>
          {/* ACQUISITION */}
          <div className="flex flex-col gap-3">
            <SectionHeader icon="📣" title="Acquisition (jalb qilish)" subtitle={`So'nggi ${data.periodDays} kun`} />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <StatCard
                icon="📱"
                label="QR skanerlar"
                value={data.acquisition.qrScansTotal}
                hint={data.acquisition.qrScansTotal === 0 ? "Bugundan boshlab yig'ilmoqda" : undefined}
              />
              <StatCard icon="🌐" label="Sayt tashrifchilari" value={data.acquisition.websiteVisitors} />
              <StatCard icon="✈️" label="Telegram /start" value={data.acquisition.telegramStarts} />
              <StatCard icon="✅" label="Ro'yxatdan o'tishlar" value={data.acquisition.registrations} />
              <StatCard
                icon="🔁"
                label="Konversiya (start→ro'yxat)"
                value={pctLabel(data.acquisition.conversionRate)}
                hint="Telegram bot orqali tasdiqlash majburiy bo'lgani uchun"
              />
            </div>
            {(data.acquisition.qrScansBySource.length > 0 || data.acquisition.qrSignupsBySource.length > 0) && (
              <Card>
                <h3 className="mb-3 text-sm font-bold text-text-primary">QR manba bo&apos;yicha (skaner → ro&apos;yxat)</h3>
                <div className="flex flex-col gap-3">
                  {data.acquisition.qrSignupsBySource.length === 0 && <EmptyHint text="Hali ma'lumot yo'q" />}
                  {data.acquisition.qrSignupsBySource.map((s) => {
                    const scans = data.acquisition.qrScansBySource.find((x) => x.source === s.source)?.count ?? 0;
                    return (
                      <RankedBar
                        key={s.source}
                        label={s.source}
                        sublabel={scans > 0 ? `${scans} skaner` : undefined}
                        valueLabel={`${s.count} ro'yxat`}
                        value={s.count}
                        max={Math.max(1, ...data.acquisition.qrSignupsBySource.map((x) => x.count))}
                      />
                    );
                  })}
                </div>
              </Card>
            )}
          </div>

          {/* ACTIVATION */}
          <div className="flex flex-col gap-3">
            <SectionHeader icon="⚡" title="Activation (faollashish)" subtitle={`Jami ${data.activation.totalUsers} foydalanuvchidan`} />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { icon: "📝", label: "Onboardingni tugatdi", value: data.activation.completedOnboarding },
                { icon: "🩸", label: "Birinchi hayzni kiritdi", value: data.activation.loggedFirstPeriod },
                { icon: "🩹", label: "Birinchi simptomni qo'shdi", value: data.activation.addedFirstSymptom },
                { icon: "✨", label: "Chatbotdan foydalandi", value: data.activation.usedChatbot },
              ].map((m) => (
                <StatCard
                  key={m.label}
                  icon={m.icon}
                  label={m.label}
                  value={m.value}
                  hint={data.activation.totalUsers > 0 ? `${Math.round((m.value / data.activation.totalUsers) * 100)}%` : undefined}
                />
              ))}
            </div>
          </div>

          {/* ENGAGEMENT */}
          <div className="flex flex-col gap-3">
            <SectionHeader icon="🔥" title="Engagement (faollik)" subtitle="DAU/WAU/MAU — doim 1/7/30 kunlik oyna" />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
              <StatCard icon="☀️" label="DAU" value={data.engagement.dau} />
              <StatCard icon="📅" label="WAU" value={data.engagement.wau} />
              <StatCard icon="🗓️" label="MAU" value={data.engagement.mau} />
              <StatCard icon="🧭" label="Seans/foydalanuvchi" value={data.engagement.sessionsPerActiveUser} hint="30 kunlik" />
              <StatCard icon="🩸" label="Simptom/foydalanuvchi" value={data.engagement.symptomsLoggedPerUser} hint="Jami" />
              <StatCard icon="💬" label="Xabar/foydalanuvchi" value={data.engagement.chatMessagesPerUser} hint="Jami" />
            </div>
          </div>

          {/* RETENTION */}
          <div className="flex flex-col gap-3">
            <SectionHeader icon="🔄" title="Retention (qaytish)" subtitle="Ro'yxatdan o'tgan kundan aynan N kun keyin qaytganlar foizi" />
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Day 1", pct: data.retention.d1, cohort: data.retention.d1CohortSize },
                { label: "Day 7", pct: data.retention.d7, cohort: data.retention.d7CohortSize },
                { label: "Day 30", pct: data.retention.d30, cohort: data.retention.d30CohortSize },
              ].map((r) => (
                <Card key={r.label} className="flex flex-col items-center gap-1 py-5 text-center">
                  <div className="text-xs font-semibold text-text-secondary">{r.label}</div>
                  <div className="text-3xl font-extrabold text-text-primary">{pctLabel(r.pct)}</div>
                  <div className="text-xs text-text-muted">{r.cohort > 0 ? `${r.cohort} kishilik kohort` : "Hali yetarli kun o'tmagan"}</div>
                </Card>
              ))}
            </div>
          </div>

          {/* PRODUCT */}
          <div className="flex flex-col gap-3">
            <SectionHeader icon="🧩" title="Product" subtitle={`So'nggi ${data.periodDays} kun`} />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <h3 className="mb-3 text-sm font-bold text-text-primary">Eng ko&apos;p ishlatilgan bo&apos;limlar</h3>
                <div className="flex flex-col gap-3">
                  {data.product.mostUsedFeatures.length === 0 && <EmptyHint text="Hali ma'lumot yo'q" />}
                  {data.product.mostUsedFeatures.map((f) => (
                    <RankedBar
                      key={f.label}
                      label={f.label}
                      valueLabel={`${f.viewCount} ko'rish`}
                      value={f.viewCount}
                      max={Math.max(1, ...data.product.mostUsedFeatures.map((x) => x.viewCount))}
                    />
                  ))}
                </div>
              </Card>

              <Card>
                <h3 className="mb-3 text-sm font-bold text-text-primary">Eng ko&apos;p tashlab ketiladigan onboarding bosqichi</h3>
                <div className="flex flex-col gap-3">
                  {data.product.mostAbandonedOnboardingSteps.length === 0 && (
                    <EmptyHint text="Hali ma'lumot yo'q — bugundan boshlab yig'ilmoqda" />
                  )}
                  {data.product.mostAbandonedOnboardingSteps.map((s) => (
                    <RankedBar
                      key={s.step}
                      label={s.step}
                      valueLabel={`${s.count} kishi`}
                      value={s.count}
                      max={Math.max(1, ...data.product.mostAbandonedOnboardingSteps.map((x) => x.count))}
                    />
                  ))}
                </div>
              </Card>

              <Card>
                <h3 className="mb-3 text-sm font-bold text-text-primary">Chatbotdagi eng ko&apos;p mavzular</h3>
                <p className="mb-2 text-xs text-text-muted">Taxminiy, kalit so&apos;z asosida (NLP emas)</p>
                <div className="flex flex-col gap-3">
                  {data.product.mostCommonQuestionTopics.length === 0 && <EmptyHint text="Hali ma'lumot yo'q" />}
                  {data.product.mostCommonQuestionTopics.map((t) => (
                    <RankedBar
                      key={t.topic}
                      label={t.topic}
                      valueLabel={`${t.count} xabar`}
                      value={t.count}
                      max={Math.max(1, ...data.product.mostCommonQuestionTopics.map((x) => x.count))}
                    />
                  ))}
                </div>
              </Card>

              <Card>
                <h3 className="mb-3 text-sm font-bold text-text-primary">Eng ko&apos;p qayd etilgan simptomlar</h3>
                <div className="flex flex-col gap-3">
                  {data.product.mostCommonSymptoms.length === 0 && <EmptyHint text="Hali ma'lumot yo'q" />}
                  {data.product.mostCommonSymptoms.map((s) => (
                    <RankedBar
                      key={s.symptom}
                      label={s.symptom}
                      valueLabel={`${s.count} marta`}
                      value={s.count}
                      max={Math.max(1, ...data.product.mostCommonSymptoms.map((x) => x.count))}
                    />
                  ))}
                </div>
              </Card>
            </div>
          </div>

          {/* QUALITY / BUGS */}
          <div className="flex flex-col gap-3">
            <SectionHeader icon="🐞" title="Shikoyatlar" subtitle="Fikr-mulohazalar bo'limidagi 👎 va matnli izohlar" />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <StatCard icon="👎" label="Manfiy baho" value={data.quality.complaintsCount} hint={`So'nggi ${data.periodDays} kun`} />
              <Card className="lg:col-span-2">
                <h3 className="mb-3 text-sm font-bold text-text-primary">So&apos;nggi izohlar</h3>
                <div className="flex flex-col gap-2">
                  {data.quality.recentComplaints.length === 0 && <EmptyHint text="Hali izoh yo'q" />}
                  {data.quality.recentComplaints.map((c, i) => (
                    <p key={i} className="rounded-xl bg-surface-muted px-3 py-2 text-xs text-text-secondary">
                      {c.message}
                    </p>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          {/* GROWTH */}
          <div className="flex flex-col gap-3">
            <SectionHeader
              icon="🌱"
              title="Growth (o'sish segmentlari)"
              subtitle="QR manba nomi bo'yicha — maktab-/universitet-/klinika- prefiksi bilan belgilang"
            />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <StatCard icon="🏫" label="Maktab" value={data.growth.school} />
              <StatCard icon="🎓" label="Universitet" value={data.growth.university} />
              <StatCard icon="🏥" label="Klinika" value={data.growth.clinic} />
              <StatCard icon="🌿" label="Organik" value={data.growth.organic} hint="QR-belgisiz to'g'ridan-to'g'ri" />
              <StatCard icon="🔗" label="Referral" value="—" hint="Hali kuzatilmayapti" />
            </div>
          </div>

          {/* REVENUE */}
          <div className="flex flex-col gap-3">
            <SectionHeader icon="💰" title="Revenue" subtitle="Kelajakda" />
            <Card className="bg-surface-muted text-sm text-text-secondary">
              Pullik reja hali yo&apos;q — Premium konversiya / ARPU / CAC / LTV monetizatsiya qo&apos;shilgach shu yerda paydo bo&apos;ladi.
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
