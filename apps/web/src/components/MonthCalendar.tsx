"use client";

import clsx from "clsx";
import { localDateStr } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";

export type DayMarker = "period" | "predicted";

export function MonthCalendar({
  monthDate,
  markers,
  ovulationDate,
  today,
  onSelectDate,
}: {
  monthDate: Date;
  markers: Record<string, DayMarker>;
  /** Bashorat qilingan ovulyatsiya kuni — kichik nuqta bilan ko'rsatiladi (App.pdf §12). */
  ovulationDate?: string | null;
  today: string;
  onSelectDate?: (date: string) => void;
}) {
  const { dict } = useI18n();
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (string | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => localDateStr(new Date(year, month, i + 1))),
  ];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-bold text-text-primary">
          {dict.common.months[month]} {year}
        </p>
        <div className="flex items-center gap-3 text-[11px] font-medium text-text-secondary">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary" /> {dict.cycle.calendarLegendPeriod}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-secondary" /> {dict.cycle.calendarLegendOvulation}
          </span>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-text-muted">
        {dict.common.weekdaysShort.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const marker = markers[date];
          const isToday = date === today;
          const isOvulation = date === ovulationDate;
          return (
            <button
              key={date}
              onClick={() => onSelectDate?.(date)}
              className={clsx(
                "tap-target relative flex aspect-square items-center justify-center rounded-full text-sm font-medium transition",
                marker === "period" && "bg-primary text-white",
                marker === "predicted" && "bg-primary-light text-primary-dark",
                !marker && "text-text-secondary hover:bg-surface-muted",
                isToday && !marker && "ring-2 ring-primary"
              )}
            >
              {Number(date.slice(-2))}
              {isOvulation && <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-secondary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
