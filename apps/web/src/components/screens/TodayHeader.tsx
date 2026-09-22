"use client";

import { useRef, useState } from "react";
import clsx from "clsx";
import { Avatar } from "@mui/material";
import { CalendarMonthOutlined } from "@mui/icons-material";
import { Emoji } from "@/components/Emoji";
import { useI18n } from "@/lib/i18n";
import { TodayStatusCircle } from "@/components/screens/TodayBackdrop";
import { PetArt } from "@/components/pets/PetArt";
import type { Pet } from "@mammoai/shared";

/**
 * TODAY-01 — "Bugun" bosh ekranining yuqori bloki (foydalanuvchi bergan
 * referens skrinshot bo'yicha 1:1): yuqori qator → hafta chizig'i → katta
 * ikki qatorli markaziy blok → uchta dumaloq tezkor amal.
 *
 * FAQAT ko'rinish (presentational) — hech qanday ma'lumot yuklamaydi va
 * holat saqlamaydi. Butun mantiq CycleScreen'da qoladi, shu orqali "klassik"
 * ko'rinish bilan yonma-yon yashay oladi va ikkalasi bir xil ma'lumotni
 * ko'rsatishi kafolatlanadi.
 *
 * Ranglar `--color-primary` tokeni orqali olinadi (qattiq yozilgan pushti
 * emas) — ilovaning mavjud rejim-rangi tizimi shu tokenni almashtiradi, ya'ni
 * `cycle` rejimida referensdagi pushti, `planning_pregnancy` rejimida esa
 * o'sha rejimning turkuaz rangi chiqadi (globals.css: [data-mode=...]).
 */

/** Hafta chizig'idagi bir kunning holati — rang/shakl shu bo'yicha tanlanadi. */
export type TodayDayMarker = "period" | "predicted" | "fertile" | null;

export interface TodayDay {
  date: string;
  dateObj: Date;
  marker: TodayDayMarker;
  /** O'sha kunga qayd etilgan narsalar — kun ostidagi kichik belgilar
   * (referensda bugungi kun ostida ikkita kichik emoji turibdi). */
  emojis: string[];
}

export interface TodayHeaderProps {
  avatarUrl: string | null;
  initials: string | null;
  /** Avatar ustidagi kichik nuqta — bugun hali hech narsa qayd etilmaganini
   * bildiradi (referensdagi bildirishnoma nuqtasining ma'noli muqobili). */
  showAvatarDot: boolean;
  onOpenDrawer: () => void;
  streakDays: number | null;
  todayLabel: string;
  onOpenCalendar: () => void;

  days: TodayDay[];
  today: string;
  selectedDate: string | null;
  onSelectDay: (date: string) => void;

  /** Markaziy blok. `label` bo'lsa — kichik yorliq + KATTA qiymat (referens
   * "Period:" / "Day 6"). Bo'lmasa — bitta o'rtacha o'lchamli qator (masalan
   * "oxirgi hayz sanasini belgilang" kabi holatlar). */
  heroLabel: string | null;
  heroValue: string;
  heroTapHint: string | null;
  onHeroClick: (() => void) | null;
  /** Vaqtinchalik holat (masalan "bashoratlar yangilandi") — berilgan bo'lsa,
   * markaziy blok o'rniga katta doira ko'rsatiladi. */
  heroStatus: { label: string; done: boolean } | null;
  /** PET-01: 18 yoshgacha bo'lgan foydalanuvchining uy hayvoni. `null` —
   * ko'rsatilmaydi (tanlanmagan yoki foydalanuvchi katta yoshda). */
  pet: Pet | null;
  onPetTap: () => void;

  actions: TodayAction[];
}

export interface TodayAction {
  key: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  /** Asosiy amal — to'ldirilgan (brend rangidagi) doira. */
  primary?: boolean;
  active?: boolean;
}

export function TodayHeader({
  avatarUrl,
  initials,
  showAvatarDot,
  onOpenDrawer,
  streakDays,
  todayLabel,
  onOpenCalendar,
  days,
  today,
  selectedDate,
  onSelectDay,
  heroLabel,
  heroValue,
  heroTapHint,
  onHeroClick,
  heroStatus,
  pet,
  onPetTap,
  actions,
}: TodayHeaderProps) {
  const { dict } = useI18n();

  // TODAY-07: karusel BUGUNgi kun markazda turgan holda ochiladi. Buni effekt
  // bilan qilish ishonchsiz — `days` ma'lumot yuklangach o'zgaradi va effekt
  // element DOM'ga tushishidan oldin ham ishlashi mumkin (kalendarda aynan shu
  // sabab bir yil oldingi oy ochilib qolgandi). Shuning uchun bugungi tugma
  // DOM'ga BIRIKKAN paytda, bir marta o'rnatiladi.
  const stripRef = useRef<HTMLDivElement>(null);
  const didCenterToday = useRef(false);

  function attachToday(el: HTMLButtonElement | null) {
    const strip = stripRef.current;
    if (!el || !strip || didCenterToday.current) return;
    didCenterToday.current = true;
    // rAF — element biriktirildi, lekin joylashuv hali yakunlanmagan bo'lishi
    // mumkin, ya'ni o'lchamlar hali 0 bo'lishi ehtimoli bor.
    requestAnimationFrame(() => {
      const stripBox = strip.getBoundingClientRect();
      const elBox = el.getBoundingClientRect();
      // `offsetLeft` EMAS: u eng yaqin joylashtirilgan (positioned) ota
      // elementga nisbatan hisoblanadi, bu esa bu komponentdan tashqarida
      // bo'lishi mumkin. Qirralar farqi har qanday holatda to'g'ri ishlaydi.
      strip.scrollLeft += elBox.left - stripBox.left - (stripBox.width - elBox.width) / 2;
    });
  }

  return (
    <div className="space-y-4">
      {/* 1. Yuqori qator — chapda avatar (+streak), o'rtada ANIQ markazlashgan
          sana, o'ngda kalendar. `grid-cols-[1fr_auto_1fr]` ataylab: oddiy
          `justify-between`da chap guruh o'ngdagidan kengroq bo'lgani uchun
          sana biroz chapga siljib qolardi. */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenDrawer}
            aria-label={dict.common.openMenu}
            className="tap-target relative shrink-0 rounded-full active:scale-95"
          >
            <Avatar
              src={avatarUrl ?? undefined}
              sx={{
                width: 44,
                height: 44,
                bgcolor: "var(--color-primary-light)",
                color: "var(--color-primary-dark)",
                fontWeight: 700,
              }}
            >
              {!avatarUrl && (initials ?? <Emoji e="👋" size={20} />)}
            </Avatar>
            {showAvatarDot && (
              <span className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-background bg-primary" />
            )}
          </button>
          {!!streakDays && (
            <span className="flex items-center gap-0.5 text-base font-extrabold text-text-primary">
              <Emoji e="⚡" size={18} />
              {streakDays}
            </span>
          )}
        </div>

        <p className="text-center text-lg font-bold text-text-primary">{todayLabel}</p>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onOpenCalendar}
            aria-label={dict.cycle.calendarTitle}
            className="tap-target flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-primary active:scale-95"
          >
            <CalendarMonthOutlined sx={{ fontSize: 26 }} />
          </button>
        </div>
      </div>

      {/* 2. Kunlar karuseli (TODAY-07 — foydalanuvchi so'rovi: "can you make
          that like carusel i can see other dates as well by scrolling").
          Ilgari bu qat'iy `grid-cols-7` edi, ya'ni faqat 7 kun ko'rinardi va
          boshqa sanaga o'tish uchun to'liq kalendarni ochish kerak bo'lardi.

          `-mx-4` + `px-4`: sahifaning o'z chap/o'ng chekkasi 16px (layout
          `px-4`). Surilish maydoni ekran chekkasigacha yetishi, lekin kunlar
          avvalgi joyidan boshlanishi kerak — shuning uchun konteyner
          chekkadan chiqariladi, ichki qatorga esa o'sha 16px qaytariladi.
          Aks holda birinchi/oxirgi kun chekkaga yopishib qolardi.

          Kun kengligi QAT'IY (w-12): `flex-1` bo'lsa kunlar ekranga
          sig'dirish uchun qisilib, karusel ma'nosini yo'qotardi. Shu sababli
          RESP-01dagi "tor ekranda kichraytirish" ham endi kerak emas —
          sig'masa shunchaki suriladi. */}
      <div ref={stripRef} className="no-scrollbar -mx-4 overflow-x-auto overscroll-x-contain">
        <div className="flex w-max gap-0.5 px-4 sm:gap-1">
        {days.map(({ date, dateObj, marker, emojis }) => {
          const isToday = date === today;
          const isSelected = date === selectedDate;
          return (
            <button
              key={date}
              ref={isToday ? attachToday : undefined}
              type="button"
              onClick={() => onSelectDay(date)}
              className="tap-target flex w-12 shrink-0 flex-col items-center gap-1.5 rounded-2xl py-1"
            >
              <span
                className={clsx(
                  "text-[10px] font-bold uppercase tracking-wide",
                  isToday ? "text-text-primary" : "text-text-muted"
                )}
              >
                {isToday ? dict.cycle.heroTodayLabel : dict.common.weekdaysShort[dateObj.getDay()]}
              </span>
              {/* Referensda kunning RANGI holatiga (hayz / bashorat / unumdor
                  oyna) bog'liq, BUGUN esa ustiga qo'shimcha oq halqa va soya
                  oladi — ya'ni ikkalasi bir-birini almashtirmaydi, ustma-ust
                  qo'llanadi (skrinshotdagi "25" ham pushti, ham halqali). */}
              <span
                className={clsx(
                  "flex items-center justify-center rounded-full font-bold transition",
                  // Kun kengligi qat'iy bo'lgani uchun o'lcham ham ekran
                  // kengligiga bog'lanmaydi — hamma qurilmada bir xil.
                  isToday ? "h-11 w-11 text-base ring-4 ring-surface" : "h-9 w-9 text-sm",
                  marker === "period" && "bg-primary text-white",
                  marker === "predicted" && "border-2 border-dashed border-primary text-primary",
                  marker === "fertile" && "text-accent",
                  !marker && (isToday ? "bg-surface text-text-primary" : "text-text-primary"),
                  isToday && "shadow-md",
                  !isToday && isSelected && "ring-2 ring-primary/50"
                )}
              >
                {dateObj.getDate()}
              </span>
              {/* Belgilar qatori — balandligi DOIM band qilinadi (emoji
                  bo'lmasa ham), aks holda bir kunga yozuv qo'shilishi butun
                  chiziqni sakratib yuborardi. */}
              <span className="flex h-5 items-center justify-center">
                {emojis.slice(0, 2).map((e, i) => (
                  <span
                    key={`${date}-${i}`}
                    className={clsx(
                      "flex h-5 w-5 items-center justify-center rounded-full bg-surface shadow-sm",
                      i > 0 && "-ml-1.5"
                    )}
                  >
                    <Emoji e={e} size={12} />
                  </span>
                ))}
              </span>
            </button>
          );
        })}
        </div>
      </div>

      {/* 3. Markaziy blok — referensda ekranning eng katta, eng sokin qismi:
          faqat kichik yorliq va uning ostida juda katta qiymat. */}
      <div className="relative">
        {/* PET-01: hayvon markaziy blokning o'ng pastida "o'tiradi" —
            referensdagidek. Bosilsa boshqasini tanlash varag'i ochiladi. */}
        {pet && <HomePet pet={pet} onTap={onPetTap} label={dict.pets.sectionTitle} />}
      {heroStatus ? (
        <TodayStatusCircle label={heroStatus.label} done={heroStatus.done} />
      ) : (
      <button
        type="button"
        onClick={() => onHeroClick?.()}
        disabled={!onHeroClick}
        className="block w-full px-4 py-16 text-center disabled:cursor-default"
      >
        {heroLabel ? (
          <>
            <p className="text-2xl font-semibold text-text-primary">{heroLabel}</p>
            <p className="mt-2 text-6xl font-extrabold leading-none tracking-tight text-text-primary sm:text-7xl">{heroValue}</p>
          </>
        ) : (
          <p className="text-2xl font-extrabold leading-snug text-text-primary">{heroValue}</p>
        )}
        {heroTapHint && <p className="mt-3 text-sm font-bold text-primary">{heroTapHint}</p>}
      </button>
      )}
      </div>

      {/* 4. Tezkor amallar — dumaloq tugmalar, yozuv doira OSTIDA. */}
      <div className="flex items-start justify-center gap-5 sm:gap-7">
        {actions.map(({ key, icon, label, onClick, primary, active }) => (
          <button
            key={key}
            type="button"
            onClick={onClick}
            className="tap-target flex w-[4.5rem] flex-col items-center gap-2 active:scale-95 sm:w-20"
          >
            <span
              className={clsx(
                "flex h-16 w-16 items-center justify-center rounded-full shadow-md transition sm:h-[72px] sm:w-[72px]",
                primary
                  ? "bg-primary text-white"
                  : active
                    ? "bg-primary-light/50 text-primary-dark"
                    : "bg-surface text-text-primary"
              )}
            >
              {icon}
            </span>
            <span className="text-center text-sm font-semibold leading-tight text-text-primary">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** PET-03: bosh ekrandagi hayvon — doimiy yengil harakatda; bosilganda esa
 * bir martalik "sakrash" bilan javob beradi (bolalar uchun mo'ljallangan
 * o'ynoqi detal). Animatsiya CSS'da (globals.css), bu yerda faqat bosishga
 * javoban klassni qayta ulash mantig'i. */
function HomePet({ pet, onTap, label }: { pet: Pet; onTap: () => void; label: string }) {
  const [pouncing, setPouncing] = useState(false);

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        setPouncing(true);
        onTap();
      }}
      className="absolute -bottom-4 right-0 z-10"
    >
      <span
        className={clsx("pet-idle block", pouncing && "pet-pounce")}
        onAnimationEnd={(e) => {
          // Faqat "sakrash" tugaganda o'chiramiz — doimiy harakat (pet-idle)
          // ham shu elementda, uning tugashi hech qachon kuzatilmaydi
          // (infinite), lekin ehtiyot shart nomi bo'yicha tekshiriladi.
          if (e.animationName.includes("pounce")) setPouncing(false);
        }}
      >
        <PetArt pet={pet} size={124} />
      </span>
    </button>
  );
}
