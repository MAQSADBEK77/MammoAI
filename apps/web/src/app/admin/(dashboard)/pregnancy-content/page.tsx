"use client";

// CONTENT-001: homiladorlikning har bir haftasi uchun matnni ilova relizisiz
// yangilash — Maqolalar/Klinikalar admin ekranlari bilan bir xil naqsh.

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import type { PregnancyWeekContent } from "@mammoai/shared";
import { Card, Button } from "@/components/ui";

const ALL_WEEKS = Array.from({ length: 42 }, (_, i) => i + 1);

export default function AdminPregnancyContentPage() {
  const [weeks, setWeeks] = useState<Map<number, PregnancyWeekContent> | null>(null);
  const [openWeek, setOpenWeek] = useState<number | null>(null);
  const [draft, setDraft] = useState<{ sizeLabel: string; babyDevelopment: string; motherChanges: string }>({
    sizeLabel: "",
    babyDevelopment: "",
    motherChanges: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi.pregnancyContent.list().then((res) => setWeeks(new Map(res.weeks.map((w) => [w.week, w]))));
  }, []);

  function openWeekEditor(week: number) {
    const existing = weeks?.get(week);
    setDraft({ sizeLabel: existing?.sizeLabel ?? "", babyDevelopment: existing?.babyDevelopment ?? "", motherChanges: existing?.motherChanges ?? "" });
    setOpenWeek(week);
    setError(null);
  }

  async function save() {
    if (openWeek === null) return;
    if (!draft.sizeLabel.trim() || !draft.babyDevelopment.trim() || !draft.motherChanges.trim()) {
      setError("Barcha maydonlar to'ldirilishi kerak");
      return;
    }
    setSaving(true);
    try {
      const res = await adminApi.pregnancyContent.update(openWeek, draft);
      setWeeks((prev) => {
        const next = new Map(prev);
        next.set(openWeek, res.content);
        return next;
      });
      setOpenWeek(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Homiladorlik kontenti</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Har bir hafta uchun o&apos;lcham-qiyoslash, chaqaloq rivojlanishi va onaning o&apos;zgarishlari — ilova ichida
          ko&apos;rsatiladi, o&apos;zgartirish uchun yangi versiya chiqarish shart emas.
        </p>
      </div>

      {!weeks ? (
        <Card className="py-10 text-center text-sm text-text-muted">Yuklanmoqda…</Card>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_WEEKS.map((week) => {
            const content = weeks.get(week);
            return (
              <button key={week} type="button" onClick={() => openWeekEditor(week)} className="text-left">
                <Card interactive className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-text-primary">{week}-hafta</p>
                    {!content && <span className="text-xs font-medium text-warning">Bo&apos;sh</span>}
                  </div>
                  <p className="truncate text-xs text-text-muted">{content?.sizeLabel ?? "Hali kiritilmagan"}</p>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      {openWeek !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpenWeek(null)}>
          <Card className="flex w-full max-w-lg flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <p className="text-lg font-bold text-text-primary">{openWeek}-hafta</p>
            {error && <p className="text-sm font-medium text-danger">{error}</p>}
            <div>
              <p className="mb-1 text-xs font-semibold text-text-secondary">O&apos;lcham-qiyoslash (masalan &quot;limon&quot;)</p>
              <input
                value={draft.sizeLabel}
                onChange={(e) => setDraft((d) => ({ ...d, sizeLabel: e.target.value }))}
                className="tap-target w-full rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary"
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-text-secondary">Chaqaloq rivojlanishi</p>
              <textarea
                value={draft.babyDevelopment}
                onChange={(e) => setDraft((d) => ({ ...d, babyDevelopment: e.target.value }))}
                rows={3}
                className="w-full resize-y rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-text-secondary">Onaning o&apos;zgarishlari</p>
              <textarea
                value={draft.motherChanges}
                onChange={(e) => setDraft((d) => ({ ...d, motherChanges: e.target.value }))}
                rows={3}
                className="w-full resize-y rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" className="px-4! py-2! text-xs" onClick={() => setOpenWeek(null)} disabled={saving}>
                Bekor qilish
              </Button>
              <Button className="px-4! py-2! text-xs" onClick={save} disabled={saving}>
                {saving ? "Saqlanmoqda…" : "Saqlash"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
