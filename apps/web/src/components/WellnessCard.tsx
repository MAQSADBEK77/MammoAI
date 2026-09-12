"use client";

// "Sog'liqni nazorat qilish" (wellbeing) rejimi uchun kunlik suv/kaloriya
// kartasi — faqat shu rejim tanlangan foydalanuvchiga CycleScreen'da
// ko'rsatiladi (goal-ga xos, boshqa rejimlarga ta'sir qilmaydi).

import { useEffect, useState } from "react";
import { WATER_GLASS_ML, waterProgressPercent } from "@mammoai/shared";
import type { WellnessResponse } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Button, Card } from "@/components/ui";
import { Emoji } from "@/components/Emoji";

export function WellnessCard() {
  const { dict } = useI18n();
  const [data, setData] = useState<WellnessResponse | null>(null);
  const [savingWater, setSavingWater] = useState(false);
  const [calorieInput, setCalorieInput] = useState("");
  const [savingCalories, setSavingCalories] = useState(false);

  useEffect(() => {
    api.wellness.get().then(setData).catch(() => {});
  }, []);

  if (!data) return null;

  const percent = waterProgressPercent(data.today.waterMl);

  async function addGlass() {
    setSavingWater(true);
    try {
      setData(await api.wellness.addWater(WATER_GLASS_ML));
    } finally {
      setSavingWater(false);
    }
  }

  async function addCalories() {
    const kcal = Number(calorieInput);
    if (!Number.isFinite(kcal) || kcal <= 0) return;
    setSavingCalories(true);
    try {
      setData(await api.wellness.addCalories(Math.round(kcal)));
      setCalorieInput("");
    } finally {
      setSavingCalories(false);
    }
  }

  return (
    <Card className="animate-fade-in-up space-y-4">
      <p className="text-base font-bold text-text-primary">{dict.wellness.cardTitle}</p>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
            <Emoji e="💧" size={18} />
            {dict.wellness.waterLabel}
          </span>
          <span className="text-sm text-text-secondary">{dict.wellness.waterProgress(data.today.waterMl, data.waterTargetMl)}</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
        </div>
        <Button variant="secondary" className="w-full" disabled={savingWater} onClick={addGlass}>
          {dict.wellness.addGlassButton}
        </Button>
      </div>

      <div className="space-y-2 border-t border-border pt-3">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
          <Emoji e="🍽️" size={18} />
          {dict.wellness.caloriesLabel}
          <span className="ml-auto text-sm font-normal text-text-secondary">{dict.wellness.caloriesUnit(data.today.calories)}</span>
        </span>
        <div className="flex gap-2">
          <input
            type="number"
            value={calorieInput}
            onChange={(e) => setCalorieInput(e.target.value)}
            placeholder={dict.wellness.addCaloriesPlaceholder}
            className="tap-target min-w-0 flex-1 rounded-2xl border border-border bg-surface px-4 text-base text-text-primary outline-none focus:border-primary"
          />
          <Button variant="secondary" disabled={savingCalories} onClick={addCalories}>
            {dict.wellness.addCaloriesButton}
          </Button>
        </div>
      </div>
    </Card>
  );
}
