"use client";

// Gamifikatsiya — "Yutuqlar" kartasi (Profil ekrani). O'zi mustaqil ma'lumot
// yuklaydi (server/repo.ts+api/gamification/route.ts) — Profil sahifasining
// asosiy holatiga bog'liq emas, shu bilan o'sha faylni kattalashtirmaydi.
// Ommaviy reyting YO'Q (izoh: packages/shared/src/logic/gamification.ts).

import { useEffect, useState } from "react";
import clsx from "clsx";
import type { BadgeId } from "@mammoai/shared";
import { BADGE_DEFINITIONS } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Card } from "@/components/ui";
import { Emoji } from "@/components/Emoji";

export function AchievementsCard() {
  const { dict } = useI18n();
  const [stats, setStats] = useState<{ currentStreakDays: number; longestStreakDays: number; totalLogsCount: number; badges: BadgeId[] } | null>(
    null
  );

  useEffect(() => {
    api.gamification.get().then(setStats).catch(() => {});
  }, []);

  if (!stats) return null;

  return (
    <Card className="flex flex-col gap-4">
      <p className="text-sm font-bold text-text-primary">{dict.gamification.achievementsTitle}</p>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xl font-extrabold text-text-primary">{stats.currentStreakDays}</p>
          <p className="text-[11px] text-text-muted">{dict.gamification.currentStreakLabel}</p>
        </div>
        <div>
          <p className="text-xl font-extrabold text-text-primary">{stats.longestStreakDays}</p>
          <p className="text-[11px] text-text-muted">{dict.gamification.longestStreakLabel}</p>
        </div>
        <div>
          <p className="text-xl font-extrabold text-text-primary">{stats.totalLogsCount}</p>
          <p className="text-[11px] text-text-muted">{dict.gamification.totalLogsLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {BADGE_DEFINITIONS.map((def) => {
          const earned = stats.badges.includes(def.id);
          const label = dict.gamification.badges[def.id];
          return (
            <div key={def.id} className="flex flex-col items-center gap-1" title={`${label.name} — ${label.desc}`}>
              <div
                className={clsx(
                  "flex h-12 w-12 items-center justify-center rounded-full text-xl",
                  earned ? "bg-primary" : "bg-surface-muted grayscale opacity-40"
                )}
              >
                <Emoji e={def.icon} size={20} />
              </div>
              <p className="text-center text-[9px] font-semibold leading-tight text-text-secondary">{label.name}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
