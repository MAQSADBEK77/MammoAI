"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { localDateStr, type CyclePhase } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";

export type DayMarker = "period" | "predicted";

// Har bir tsikl fazasi uchun fon rangi — PhaseCard bilan bir xil palitra
// (menstrual=primary, follicular=secondary, ovulation=accent, luteal=success),
// shunda kalendar pastidagi faza kartasi bilan ranglar mos keladi.
const PHASE_BG: Record<Exclude<CyclePhase, "menstrual">, string> = {
  follicular: "bg-secondary/15 text-text-secondary",
  ovulation: "bg-accent/15 text-text-secondary",
  luteal: "bg-success/15 text-text-secondary",
};

export function MonthCalendar({
  monthDate,
  markers,
  phaseMarkers,
  ovulationDate,
  today,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: {
  monthDate: Date;
  markers: Record<string, DayMarker>;
  /** Har bir kun uchun hisoblangan tsikl fazasi (App.pdf/foydalanuvchi so'rovi:
   * "hayz/follikul/ovulyatsiya/lyuteal fazalari kalendarda ranglar bilan
   * ajralib tursin") — istalgan oy uchun (o'tgan/kelgusi) ishlaydi, chunki
   * oxirgi hayz sanasidan davriy formula bilan hisoblanadi. */
  phaseMarkers?: Record<string, CyclePhase>;
  /** Bashorat qilingan ovulyatsiya kuni — kichik nuqta bilan ko'rsatiladi (App.pdf §12). */
  ovulationDate?: string | null;
  today: string;
  /** Foydalanuvchi bosib tanlagan kun — pastdagi ma'lumot paneli shu kunga
   * qarab o'zgaradi (kalendar ostida "prognoz" App.pdf/Figma referens). */
  selectedDate?: string | null;
  onSelectDate?: (date: string) => void;
  /** Oldingi/keyingi oyga o'tish — berilmasa tugma ko'rsatilmaydi. */
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
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
        <button
          type="button"
          onClick={onPrevMonth}
          disabled={!onPrevMonth}
          className="tap-target flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted disabled:opacity-0"
        >
          <ChevronLeft sx={{ fontSize: 18 }} />
        </button>
        <p className="font-bold text-text-primary">
          {dict.common.months[month]} {year}
        </p>
        <button
          type="button"
          onClick={onNextMonth}
          disabled={!onNextMonth}
          className="tap-target flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted disabled:opacity-0"
        >
          <ChevronRight sx={{ fontSize: 18 }} />
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] font-medium text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary" /> {dict.cycle.calendarLegendPeriod}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-secondary" /> {dict.cycle.calendarLegendFollicular}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accent" /> {dict.cycle.calendarLegendOvulation}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-success" /> {dict.cycle.calendarLegendLuteal}
        </span>
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
          const phase = phaseMarkers?.[date];
          const isToday = date === today;
          const isOvulation = date === ovulationDate;
          const isSelected = date === selectedDate;
          const phaseBg = !marker && phase && phase !== "menstrual" ? PHASE_BG[phase] : null;
          // Hayz davri (haqiqiy yoki bashorat qilingan) — border bilan boshqa
          // fazalar (yumshoq fon rangi)dan ajralib turadi. Bugungi kun belgisi
          // esa qasddan boshqa rangda (neytral), aks holda ikkalasi bir xil
          // pushti rangda bo'lib, hayz kuni bugun bo'lganda chalkashib ketardi.
          const isMenstrualDay = marker === "period" || marker === "predicted" || (!marker && phase === "menstrual");
          return (
            <button
              key={date}
              onClick={() => onSelectDate?.(date)}
              className={clsx(
                "tap-target relative flex aspect-square items-center justify-center rounded-full text-sm font-medium transition",
                marker === "period" && "bg-primary text-white",
                marker === "predicted" && "bg-primary-light text-primary-dark",
                !marker && !phaseBg && phase === "menstrual" && "bg-primary-light text-primary-dark",
                !marker && phaseBg && phaseBg,
                !marker && !phase && "text-text-secondary hover:bg-surface-muted",
                isMenstrualDay && "border-2 border-primary-dark",
                isSelected ? "ring-2 ring-offset-1 ring-primary-dark" : isToday && "ring-2 ring-text-primary"
              )}
            >
              {Number(date.slice(-2))}
              {isOvulation && <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-accent" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
