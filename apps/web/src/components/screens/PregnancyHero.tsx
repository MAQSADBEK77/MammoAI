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
  // 3-haftada ~72px, 40-haftada ~208px — referensdagi o'sish.
  const imageSize = Math.round(72 + (Math.min(40, Math.max(3, week)) - 3) * (136 / 37));
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
          className="text-pregnancy-accent -ml-2 grid h-10 w-10 place-items-center rounded-full"
        >
          <MenuIcon sx={{ fontSize: 20 }} />
        </button>
        <p className="text-lg font-bold text-text-primary">{dateLabel}</p>
        <button
          type="button"
          onClick={onOpenCalendar}
          aria-label={dateLabel}
          className="text-pregnancy-accent -mr-2 grid h-10 w-10 place-items-center rounded-full"
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
              <span className={clsx("text-[10px] font-bold uppercase tracking-wide", isToday ? "text-pregnancy-accent" : "text-text-muted")}>
                {isToday ? todayLabel : d.weekdayLabel}
              </span>
              <span
                className={clsx(
                  "grid h-9 w-9 place-items-center rounded-full text-sm font-bold transition-colors",
                  isToday
                    ? "bg-surface text-pregnancy-accent shadow-md"
                    : isSelected
                      ? "bg-surface/60 text-text-primary"
                      : "text-text-secondary"
                )}
              >
                {d.dayNumber}
              </span>
              {/* Referensda bugungi kun ostida kichik nuqta turadi — u
                  "shu kunda qayd bor" degani emas, shunchaki joriy kunni
                  yana bir marta belgilaydi. */}
              <span
                className={clsx("h-1 w-1 rounded-full", isToday ? "bg-pregnancy-accent/60" : "bg-transparent")}
                aria-hidden
              />
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        {/* PREG-HERO-04: rasm HAFTAGA QARAB o'sadi — referensda 3-haftada
            u juda kichik, oxirida esa butun maydonni egallaydi. Bu shunchaki
            bezak emas: o'sishning o'zi ma'lumot. */}
        <div className="flex h-52 items-center justify-center">
          <PregnancyWeekImage
            week={week}
            icon={sizeIcon}
            className="rounded-full object-cover shadow-lg"
            style={{ width: imageSize, height: imageSize }}
          />
        </div>
        <button type="button" onClick={onOpenDetails} className="flex items-center gap-1.5">
          <span className="text-pregnancy-accent text-[1.75rem] font-extrabold leading-tight">{weekDayLabel}</span>
          <InfoOutlined sx={{ fontSize: 18 }} className="text-pregnancy-accent opacity-60" />
        </button>
        <button
          type="button"
          onClick={onOpenDetails}
          className="text-pregnancy-accent tap-target rounded-full bg-surface px-7 text-sm font-bold shadow-md active:scale-[0.98]"
        >
          {detailsLabel}
        </button>
      </div>
    </div>
  );
}
