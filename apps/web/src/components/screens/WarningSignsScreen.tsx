"use client";

import { CallOutlined } from "@mui/icons-material";
import clsx from "clsx";
import { EMERGENCY_NUMBER, warningSignsByAction, type WarningAction } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { ScreenHeader } from "@/components/ui";

/**
 * PREG-RED-01 — xavfli belgilar.
 *
 * Tartib SHOSHILINCHLIK bo'yicha, mavzu bo'yicha emas: ayol bu ekranni
 * xavotirda ochadi va birinchi ko'rgan narsasi eng jiddiy holat
 * bo'lishi kerak.
 *
 * 103 tugmasi ekranning tepasida va har doim joyida turadi — ro'yxatni
 * oxirigacha o'qishni talab qilish bu yerda o'rinsiz.
 */
const ACTION_STYLE: Record<WarningAction, { chip: string; bar: string }> = {
  emergency: { chip: "bg-danger/12 text-danger", bar: "bg-danger" },
  maternity: { chip: "bg-warning/15 text-warning", bar: "bg-warning" },
  today: { chip: "bg-primary/10 text-primary", bar: "bg-primary" },
};

export function WarningSignsScreen() {
  const { dict } = useI18n();
  const t = dict.pregnancy;

  return (
    <div className="space-y-4 pb-8">
      <ScreenHeader title={t.warningTitle} subtitle={t.warningSubtitle} />

      <a
        href={`tel:${EMERGENCY_NUMBER}`}
        className="bg-danger flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold text-white shadow-sm active:scale-[0.98]"
      >
        <CallOutlined sx={{ fontSize: 20 }} />
        {t.warningCall}
      </a>

      {warningSignsByAction().map(([action, signs]) => (
        <section key={action} className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <span className={clsx("h-4 w-1 rounded-full", ACTION_STYLE[action].bar)} aria-hidden />
            <h2 className="text-sm font-extrabold text-text-primary">{t.warningActions[action]}</h2>
          </div>
          <div className="space-y-2">
            {signs.map((sign) => {
              const entry = t.warningList[sign.id as keyof typeof t.warningList];
              return (
                <div key={sign.id} className="rounded-3xl bg-surface p-4 shadow-sm">
                  <p className="text-sm font-bold leading-snug text-text-primary">{entry?.name ?? sign.id}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{entry?.note}</p>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <p className="px-1 text-[11px] leading-relaxed text-text-muted">{t.warningNote}</p>
    </div>
  );
}
