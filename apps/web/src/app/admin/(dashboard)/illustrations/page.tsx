"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Dialog } from "@mui/material";
import { Close } from "@mui/icons-material";
import {
  ILLUSTRATION_LIBRARY,
  ILLUSTRATION_CATEGORY_LABEL,
  SLOT_KEYS,
  SLOT_META,
  SLOT_SECTION_LABEL,
  illustrationWebPath,
  type IllustrationSlotKey,
  type IllustrationCategory,
} from "@mammoai/shared";
import { adminApi } from "@/lib/admin-api";
import { Card, LoadingSpinner } from "@/components/ui";

const SECTIONS = Object.keys(SLOT_SECTION_LABEL) as (keyof typeof SLOT_SECTION_LABEL)[];
const CATEGORIES = Array.from(new Set(ILLUSTRATION_LIBRARY.map((i) => i.category))) as IllustrationCategory[];
const LIBRARY_BY_SLUG = new Map(ILLUSTRATION_LIBRARY.map((i) => [i.slug, i]));

/**
 * Ilovaning har bir joyida (onboarding bosqichi, bosh sahifa foni, ekran
 * illyustratsiyasi) qaysi unDraw rasmi ko'rsatilishini boshqaradi — foydalanuvchi
 * so'roviga ko'ra: "hammasiga iconni tanlayman admin paneldan tanlaydigan qilib
 * qo'y, ko'pgina variantlarim bo'lsin, hammasida o'zgartira olay".
 */
export default function AdminIllustrationsPage() {
  const [slots, setSlots] = useState<Record<IllustrationSlotKey, string> | null>(null);
  const [pickerSlot, setPickerSlot] = useState<IllustrationSlotKey | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<IllustrationCategory | "all">("all");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    adminApi.illustrations
      .list()
      .then((res) => setSlots(res.slots))
      .catch((err) => setError(err instanceof Error ? err.message : "Yuklashda xatolik"));
  }

  useEffect(() => {
    load();
  }, []);

  async function pick(slug: string) {
    if (!pickerSlot) return;
    setSaving(true);
    setError(null);
    try {
      const res = await adminApi.illustrations.update(pickerSlot, slug);
      setSlots(res.slots);
      setPickerSlot(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  }

  if (!slots) return <LoadingSpinner label="Yuklanmoqda…" />;

  const filteredLibrary = categoryFilter === "all" ? ILLUSTRATION_LIBRARY : ILLUSTRATION_LIBRARY.filter((i) => i.category === categoryFilter);

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-2xl font-extrabold text-text-primary">Illyustratsiyalar</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {`Ilovaning har bir bo'limida qaysi rasm ko'rsatilishini tanlang — ${ILLUSTRATION_LIBRARY.length} ta variant mavjud.`}
        </p>
        {error && <p className="mt-2 text-sm font-semibold text-danger">{error}</p>}
      </div>

      {SECTIONS.map((section) => (
        <div key={section}>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-text-muted">{SLOT_SECTION_LABEL[section]}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SLOT_KEYS.filter((k) => SLOT_META[k].section === section).map((slotKey) => {
              const current = LIBRARY_BY_SLUG.get(slots[slotKey]);
              return (
                <Card key={slotKey} className="flex items-center gap-4 p-4!">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-surface-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element -- SVG, next/image optimizatsiyasi kerak emas */}
                    <img src={illustrationWebPath(slots[slotKey])} alt="" className="h-14 w-14 object-contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-text-primary">{SLOT_META[slotKey].label}</p>
                    <p className="truncate text-xs text-text-muted">{current?.name ?? slots[slotKey]}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setPickerSlot(slotKey);
                        setCategoryFilter("all");
                      }}
                      className="mt-2 text-xs font-bold text-primary hover:underline"
                    >
                      {"O'zgartirish"}
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      <Dialog open={pickerSlot !== null} onClose={() => setPickerSlot(null)} fullScreen>
        <div className="flex h-full flex-col bg-background">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h2 className="text-lg font-bold text-text-primary">{pickerSlot ? SLOT_META[pickerSlot].label : ""}</h2>
              <p className="text-xs text-text-muted">Qaysi rasmni tanlaysiz?</p>
            </div>
            <button
              type="button"
              onClick={() => setPickerSlot(null)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted transition hover:bg-border"
            >
              <Close fontSize="small" />
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto border-b border-border px-6 py-3">
            <button
              type="button"
              onClick={() => setCategoryFilter("all")}
              className={clsx(
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition",
                categoryFilter === "all" ? "bg-primary text-white" : "bg-surface-muted text-text-secondary"
              )}
            >
              Barchasi
            </button>
            {CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={clsx(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition",
                  categoryFilter === cat ? "bg-primary text-white" : "bg-surface-muted text-text-secondary"
                )}
              >
                {ILLUSTRATION_CATEGORY_LABEL[cat]}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {filteredLibrary.map((item) => {
                const active = pickerSlot !== null && slots[pickerSlot] === item.slug;
                return (
                  <button
                    type="button"
                    key={item.slug}
                    disabled={saving}
                    onClick={() => pick(item.slug)}
                    className={clsx(
                      "flex flex-col items-center gap-2 rounded-2xl border-2 bg-surface p-3 text-center transition active:scale-[0.97] disabled:opacity-50",
                      active ? "border-primary shadow-lg shadow-primary/20" : "border-transparent hover:border-primary-light"
                    )}
                  >
                    <div className="flex h-20 w-full items-center justify-center rounded-xl bg-surface-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element -- SVG, next/image optimizatsiyasi kerak emas */}
                      <img src={illustrationWebPath(item.slug)} alt="" className="h-16 w-16 object-contain" />
                    </div>
                    <span className="line-clamp-1 text-[11px] font-semibold text-text-primary">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
