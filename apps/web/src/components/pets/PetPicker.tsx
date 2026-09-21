"use client";

import { useState } from "react";
import clsx from "clsx";
import { Close, CheckOutlined, PetsOutlined } from "@mui/icons-material";
import { DEFAULT_PET, PET_IDS, type PetChoice } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { Portal } from "@/components/Portal";
import { PetArt } from "./PetArt";

/**
 * PET-01 — uy hayvonini tanlash varag'i (referens dizayn: "Choose your pet").
 * Faqat 18 yoshgacha bo'lgan foydalanuvchilarga ko'rsatiladi — chaqiruvchi
 * shu shartni tekshiradi, komponentning o'zi yoshni bilmaydi.
 */
export function PetPicker({
  current,
  onSelect,
  onClose,
}: {
  /** Saqlangan tanlov — `null` bo'lsa hali tanlanmagan (standart mushukcha). */
  current: PetChoice | null;
  onSelect: (pet: PetChoice) => Promise<void> | void;
  onClose: () => void;
}) {
  const { dict } = useI18n();
  const [saving, setSaving] = useState(false);

  async function choose(pet: PetChoice) {
    if (saving) return;
    setSaving(true);
    try {
      await onSelect(pet);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/30" onClick={onClose}>
      <div
        className="animate-fade-in-up rounded-t-[28px] bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + var(--tg-safe-area-bottom) + 20px)" }}
      >
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xl font-extrabold text-text-primary">{dict.pets.chooseTitle}</p>
            <button
              type="button"
              onClick={onClose}
              aria-label={dict.common.close}
              className="tap-target flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-secondary active:scale-95"
            >
              <Close sx={{ fontSize: 16 }} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {/* "Hayvon kerak emas" — referensdagidek birinchi katak. */}
            <PetCell selected={current === "none"} disabled={saving} onClick={() => choose("none")} label={dict.pets.none}>
              <PetsOutlined sx={{ fontSize: 44 }} className="text-text-muted" />
            </PetCell>

            {PET_IDS.map((pet) => (
              <PetCell
                key={pet}
                selected={current === pet || (current === null && pet === DEFAULT_PET)}
                disabled={saving}
                onClick={() => choose(pet)}
                label={dict.pets.names[pet]}
              >
                <PetArt pet={pet} size={72} />
              </PetCell>
            ))}
          </div>
        </div>
      </div>
      </div>
    </Portal>
  );
}

function PetCell({
  children,
  label,
  selected,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "tap-target relative flex aspect-square flex-col items-center justify-center gap-1 rounded-3xl border-2 p-2 transition active:scale-95 disabled:opacity-60",
        selected ? "border-primary bg-primary-light/25" : "border-border bg-surface-muted/50"
      )}
    >
      {children}
      <span className="text-center text-[11px] font-semibold leading-tight text-text-secondary">{label}</span>
      {selected && (
        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
          <CheckOutlined sx={{ fontSize: 13 }} className="text-white" />
        </span>
      )}
    </button>
  );
}
