"use client";

import { CalendarMonthOutlined, InfoOutlined, Menu as MenuIcon } from "@mui/icons-material";
import { useAppDrawer } from "@/components/AppDrawer";
import clsx from "clsx";
import { PregnancyWeekImage } from "@/components/PregnancyWeekImage";

/**
 * PREG-HERO-01 — homiladorlik rejimining yuqori bloki.
 *
 * Naqsh egasi yuborgan Flo ekranidan olindi va uchta narsani birlashtiradi:
 *
 *   1. ILIQ GRADIENT butun tepani egallaydi va pastdan YUMALOQ tugaydi —
 *      karta emas, muhit. Ilgari bizda o'rtada suzuvchi binafsha karta
 *      turardi: u ekranning 60% ini egallab, faqat haftani aytardi.
 *   2. HAFTA CHIZIG'I tepada — sikl rejimida allaqachon bor, homiladorlikda
 *      esa yo'q edi. Homilador ayol ham kunlar bo'ylab yuradi (belgilash,
 *      o'tgan kunni ko'rish), shuning uchun bu yerda ham kerak.
 *   3. "N hafta, M kun" — HAFTA EMAS, hafta VA KUN. Homiladorlikda kun
 *      ham muhim: 37 hafta 0 kun bilan 37 hafta 6 kun boshqa-boshqa
 *      maslahat degani.
 *
 * Rasm markazda va katta — u bu ekranning yuragi, bezak emas.
 */

export interface PregnancyHeroDay {
  date: string;
  /** Hafta kunining qisqa nomi ("Du", "Se", ...). */
  weekdayLabel: string;
  dayNumber: number;
}

export function PregnancyHero({
  dateLabel,
  onOpenCalendar,
  days,
  today,
  selectedDate,
  onSelectDay,
  todayLabel,
  week,
  sizeIcon,
  weekDayLabel,
  detailsLabel,
  onOpenDetails,
  menuLabel,
}: {
  dateLabel: string;
  onOpenCalendar: () => void;
  days: PregnancyHeroDay[];
  today: string;
  selectedDate: string | null;
  onSelectDay: (date: string) => void;
  /** Bugungi kun ustidagi yorliq ("BUGUN"). */
  todayLabel: string;
  week: number;
  /** Rasm yuklanmasa ishlatiladigan zaxira belgi. */
  sizeIcon: string;
  /** "8 hafta, 3 kun". */
  weekDayLabel: string;
  detailsLabel: string;
  onOpenDetails: () => void;
  /** Burger tugmasining ekran o'quvchi uchun nomi. */
  menuLabel: string;
}) {
  const { openDrawer } = useAppDrawer();
  return (
    <div
      className="bg-aurora-pregnancy-soft -mx-4 -mt-2 rounded-b-[2.5rem] px-4 pb-7"
      style={{ paddingTop: "calc(var(--tg-safe-area-top) + 1rem)" }}
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={openDrawer}
          aria-label={menuLabel}
          className="grid h-10 w-10 place-items-center rounded-full bg-surface text-text-secondary shadow-sm"
        >
          <MenuIcon sx={{ fontSize: 20 }} />
        </button>
        <p className="text-base font-bold text-text-primary">{dateLabel}</p>
        <button
          type="button"
          onClick={onOpenCalendar}
          aria-label={dateLabel}
          className="grid h-10 w-10 place-items-center rounded-full bg-surface text-secondary shadow-sm"
        >
          <CalendarMonthOutlined sx={{ fontSize: 20 }} />
        </button>
      </div>

      {/* Hafta chizig'i — bugungi kun oq doirada, tanlangani ochroq. */}
      <div className="mt-4 grid grid-cols-7 gap-1">
        {days.map((d) => {
          const isToday = d.date === today;
          const isSelected = d.date === (selectedDate ?? today);
          return (
            <button
              key={d.date}
              type="button"
              onClick={() => onSelectDay(d.date)}
              className="flex flex-col items-center gap-1 py-1"
            >
              <span className={clsx("text-[10px] font-bold uppercase tracking-wide", isToday ? "text-secondary" : "text-text-muted")}>
                {isToday ? todayLabel : d.weekdayLabel}
              </span>
              <span
                className={clsx(
                  "grid h-9 w-9 place-items-center rounded-full text-sm font-bold transition-colors",
                  isToday ? "bg-secondary text-white shadow-sm" : isSelected ? "bg-surface text-text-primary" : "text-text-secondary"
                )}
              >
                {d.dayNumber}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <PregnancyWeekImage week={week} icon={sizeIcon} />
        <button type="button" onClick={onOpenDetails} className="flex items-center gap-1.5">
          <span className="text-[1.75rem] font-extrabold leading-tight text-secondary">{weekDayLabel}</span>
          <InfoOutlined sx={{ fontSize: 18 }} className="text-secondary/60" />
        </button>
        <button
          type="button"
          onClick={onOpenDetails}
          className="tap-target rounded-full bg-surface px-7 text-sm font-bold text-secondary shadow-md shadow-secondary/10 active:scale-[0.98]"
        >
          {detailsLabel}
        </button>
      </div>
    </div>
  );
}
