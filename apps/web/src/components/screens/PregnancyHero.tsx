"use client";

import { CalendarMonthOutlined, InfoOutlined } from "@mui/icons-material";
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
}) {
  return (
    <div className="bg-aurora-pregnancy -mx-4 -mt-4 rounded-b-[2.5rem] px-4 pb-7 pt-4">
      {/* Burger tugmasi bu yerda YO'Q — ilova sarlavhasida allaqachon bitta
          bor va ikkitasi yonma-yon turgani chalkashlik berardi. */}
      <div className="flex items-center justify-between">
        <span className="h-10 w-10" aria-hidden />
        <p className="text-base font-bold text-white">{dateLabel}</p>
        <button
          type="button"
          onClick={onOpenCalendar}
          aria-label={dateLabel}
          className="grid h-10 w-10 place-items-center rounded-full bg-white/25 text-white backdrop-blur"
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
              <span className={clsx("text-[10px] font-bold uppercase tracking-wide", isToday ? "text-white" : "text-white/70")}>
                {isToday ? todayLabel : d.weekdayLabel}
              </span>
              <span
                className={clsx(
                  "grid h-9 w-9 place-items-center rounded-full text-sm font-bold transition-colors",
                  isToday ? "bg-white text-secondary" : isSelected ? "bg-white/35 text-white" : "text-white/90"
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
          <span className="text-[1.75rem] font-extrabold leading-tight text-white">{weekDayLabel}</span>
          <InfoOutlined sx={{ fontSize: 18 }} className="text-white/80" />
        </button>
        <button
          type="button"
          onClick={onOpenDetails}
          className="tap-target rounded-full bg-white px-7 text-sm font-bold text-secondary shadow-sm active:scale-[0.98]"
        >
          {detailsLabel}
        </button>
      </div>
    </div>
  );
}
