"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";

function formatDay(day: string | undefined): string {
  if (!day) return "";
  const [, month, date] = day.split("-");
  return `${date}.${month}`;
}

/**
 * So'nggi kunlik ro'yxatdan o'tishlar — bitta qator (magnitude), shu sababli
 * yagona brend rangi (primary), legend shart emas (sarlavha o'zi tavsiflaydi),
 * ingichka ustunlar yumaloq yuqori uchlar bilan, hover'da tooltip.
 */
export function SignupsChart({ data }: { data: { day: string; count: number }[] }) {
  const max = useMemo(() => Math.max(1, ...data.map((d) => d.count)), [data]);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  return (
    <div>
      <div className="flex h-36 items-end gap-[3px]">
        {data.map((d, i) => {
          const heightPct = (d.count / max) * 100;
          const isHovered = hoverIndex === i;
          return (
            <div
              key={d.day}
              className="group relative flex h-full flex-1 items-end justify-center"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex((h) => (h === i ? null : h))}
            >
              {isHovered && (
                <div className="pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-nav px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-lg">
                  {formatDay(d.day)} · {d.count} ta
                </div>
              )}
              <div
                className={clsx("w-full max-w-[9px] rounded-t-[4px] transition-colors", isHovered ? "bg-primary-dark" : "bg-primary/60")}
                style={{ height: `${Math.max(heightPct, 3)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[11px] font-medium text-text-muted">
        <span>{formatDay(data[0]?.day)}</span>
        <span>{formatDay(data[data.length - 1]?.day)}</span>
      </div>
    </div>
  );
}
