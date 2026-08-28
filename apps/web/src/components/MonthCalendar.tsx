"use client";

import clsx from "clsx";

export type DayMarker = "period" | "predicted" | "fertile";

const WEEKDAY_LABELS_UZ = ["D", "S", "S", "Ch", "P", "J", "Sh"];

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function MonthCalendar({
  monthDate,
  markers,
  today,
  onSelectDate,
}: {
  monthDate: Date;
  markers: Record<string, DayMarker>;
  today: string;
  onSelectDate?: (date: string) => void;
}) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  // Dushanba (Bazor kuni emas) — 1-ustundan boshlanadigan tur, D=Yakshanba boshiga moslashtiramiz.
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (string | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toDateStr(new Date(year, month, i + 1))),
  ];

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-text-muted">
        {WEEKDAY_LABELS_UZ.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const marker = markers[date];
          const isToday = date === today;
          return (
            <button
              key={date}
              onClick={() => onSelectDate?.(date)}
              className={clsx(
                "tap-target flex aspect-square items-center justify-center rounded-full text-sm font-medium transition",
                marker === "period" && "bg-primary text-white",
                marker === "predicted" && "bg-primary-light text-primary-dark",
                marker === "fertile" && !marker.includes("period") && "bg-accent-light text-accent",
                !marker && "text-text-secondary hover:bg-surface-muted",
                isToday && !marker && "ring-2 ring-primary"
              )}
            >
              {Number(date.slice(-2))}
            </button>
          );
        })}
      </div>
    </div>
  );
}
