"use client";

import { CalendarMonthOutlined, InfoOutlined } from "@mui/icons-material";
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
  avatarUrl,
  initials,
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
  /** Menyu tugmasining ekran o'quvchi uchun nomi. */
  menuLabel: string;
  avatarUrl: string | null;
  initials: string | null;
}) {
  const { openDrawer } = useAppDrawer();
  // 3-haftada ~72px, 40-haftada ~208px — referensdagi o'sish.
  const imageSize = Math.round(72 + (Math.min(40, Math.max(3, week)) - 3) * (136 / 37));
  return (
    <div
      className="bg-aurora-pregnancy-soft -mx-4 -mt-2 rounded-b-[50%_2.5rem] px-4 pb-9"
      style={{ paddingTop: "calc(var(--tg-safe-area-top) + 1rem)" }}
    >
      <div className="flex items-center justify-between">
        {/* Referensda chapda BURGER emas, AVATAR turadi. U ham menyuni
            ochadi — ya'ni funksiya bir xil, lekin ekran issiqroq
            ko'rinadi: ayol o'zini ko'radi, tizim tugmasini emas. */}
        <button type="button" onClick={openDrawer} aria-label={menuLabel} className="-ml-1 shrink-0">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- foydalanuvchi avatari
            <img src={avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-white/70" />
          ) : (
            <span className="bg-pregnancy-accent grid h-10 w-10 place-items-center rounded-full text-sm font-bold text-white ring-2 ring-white/70">
              {initials ?? "\u00b7"}
            </span>
          )}
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
        {/* PREG-HERO-06 — rasm fonga SINGIB ketadi.
            Rasmlarning o'zi yaxshi (iliq, yumshoq, Flo uslubiga yaqin),
            lekin biz ularni qattiq chegarali DOIRA + SOYA ichiga
            solardik — natijada ular fonga "yopishtirilgan stiker"
            bo'lib ko'rinardi. Referensda esa homila suzib turadi:
            chegarasi yo'q, chetlari fonga eriydi.

            Orqasida yumshoq yorug'lik — referensdagi "qorin ichidagi
            nur" hissi. U CSS bilan chiziladi, rasm kerak emas. */}
        <div className="relative flex h-56 items-center justify-center">
          <span
            aria-hidden
            className="absolute rounded-full"
            style={{
              width: imageSize * 1.9,
              height: imageSize * 1.9,
              background: "radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 68%)",
            }}
          />
          <PregnancyWeekImage
            week={week}
            icon={sizeIcon}
            className="relative object-cover"
            style={{
              width: imageSize,
              height: imageSize,
              WebkitMaskImage: "radial-gradient(circle, #000 52%, transparent 74%)",
              maskImage: "radial-gradient(circle, #000 52%, transparent 74%)",
            }}
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
