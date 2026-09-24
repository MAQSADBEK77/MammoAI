"use client";

import { useEffect, useRef, useState, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";
import {
  Button as MuiButton,
  IconButton as MuiIconButton,
  Card as MuiCard,
  Chip as MuiChip,
  LinearProgress,
  Backdrop,
  Portal,
  ToggleButtonGroup,
  ToggleButton,
  Avatar,
} from "@mui/material";
import { Emoji } from "./Emoji";

// Foydalanuvchi so'roviga ko'ra ("hamma joyga Material UI ishlat — iconlardan
// tortib buttonlargacha hammasiga 100%") — ilovaning umumiy UI-kit qatlami
// endi to'g'ridan-to'g'ri @mui/material komponentlari ustiga qurilgan. Eski
// komponent nomlari/prop shakllari saqlab qolindi, shunda ularni chaqiruvchi
// o'nlab ekranlarni o'zgartirish shart bo'lmadi — faqat shu faylning ICHKI
// implementatsiyasi MUI'ga o'tdi (haqiqiy Material bosish effekti, soya,
// tipografiya). Brend ranglari (pushti/binafsha/moviy-yashil) MUI temasi
// orqali saqlanadi — lib/mui-theme.tsx'ga qarang.

type ButtonVariant = "primary" | "secondary" | "ghost" | "dark" | "danger";

// MUI'ning standart `.Mui-disabled` uslubi background/matn rangini ikkalasini
// ham mustaqil kulrang tusga almashtiradi — natijada ba'zi variantlarda ikkalasi
// bir-biriga juda yaqinlashib, matn deyarli o'qilmay qoladi ("background bilan
// text rangi bir xil bo'lib qolgan" xatosi). Tuzatish: disabled holatda ham ASL
// rang juftligi saqlanadi, faqat butun tugma birga xiralashadi (opacity) — bu
// matn/fon orasidagi nisbiy kontrastni har doim saqlaydi.
function buttonSx(variant: ButtonVariant) {
  switch (variant) {
    case "primary":
      return {
        background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
        color: "#fff",
        boxShadow: "0 8px 20px -6px color-mix(in srgb, var(--color-primary) 45%, transparent)",
        "&:hover": { filter: "brightness(1.05)", boxShadow: "0 8px 20px -6px color-mix(in srgb, var(--color-primary) 55%, transparent)" },
        "&.Mui-disabled": {
          background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
          color: "#fff",
          opacity: 0.45,
          boxShadow: "none",
        },
      };
    case "secondary":
      return {
        // Fon "secondary-light" — background/surface/text kabi qorong'u rejimda
        // ALMASHMAYDIGAN doimiy och-binafsha rang (design-tokens.ts). Matn rangi
        // avval `var(--color-text-primary)` edi — bu qorong'u rejimda deyarli
        // OQ rangga aylanadi va och-binafsha fon ustida deyarli o'qilmay qoladi
        // (past kontrast). Shuning uchun matn ham fon kabi DOIMIY to'q rangda.
        backgroundColor: "var(--color-secondary-light)",
        color: "#1F2937",
        "&:hover": { filter: "brightness(0.97)" },
        "&.Mui-disabled": { backgroundColor: "var(--color-secondary-light)", color: "#1F2937", opacity: 0.5 },
      };
    // CONFIRM-01: qaytarib bo'lmaydigan amallar uchun (akkauntni o'chirish,
    // postni o'chirish) — tasdiqlash oynasida oqibat rang orqali ham
    // ko'rinib turishi kerak, faqat matn bilan emas.
    case "danger":
      return {
        backgroundColor: "var(--color-danger)",
        color: "#fff",
        "&:hover": { filter: "brightness(1.05)" },
        "&.Mui-disabled": { backgroundColor: "var(--color-danger)", color: "#fff", opacity: 0.45 },
      };
    case "dark":
      return {
        backgroundColor: "var(--color-nav)",
        color: "#fff",
        "&:hover": { filter: "brightness(1.1)" },
        "&.Mui-disabled": { backgroundColor: "var(--color-nav)", color: "#fff", opacity: 0.45 },
      };
    case "ghost":
    default:
      return {
        backgroundColor: "transparent",
        color: "var(--color-text-secondary)",
        "&:hover": { backgroundColor: "var(--color-surface-muted)" },
        "&.Mui-disabled": { backgroundColor: "transparent", color: "var(--color-text-secondary)", opacity: 0.5 },
      };
  }
}

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> & { variant?: ButtonVariant }) {
  return (
    <MuiButton
      disableElevation
      className={clsx("tap-target", className)}
      sx={{ fontWeight: 700, borderRadius: 999, px: 3, ...buttonSx(variant) }}
      {...(props as object)}
    >
      {children}
    </MuiButton>
  );
}

/** <a> sifatida chiziladi — <button>ni <a> ichiga joylashtirish noto'g'ri HTML bo'lardi. */
export function LinkButton({
  variant = "primary",
  className,
  children,
  ...props
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "color"> & { variant?: ButtonVariant }) {
  return (
    <MuiButton
      component="a"
      disableElevation
      className={clsx("tap-target", className)}
      sx={{ fontWeight: 700, borderRadius: 999, px: 3, display: "inline-flex", ...buttonSx(variant) }}
      {...(props as object)}
    >
      {children}
    </MuiButton>
  );
}

/** Doiraviy shisha/oq ikona-tugma — suzuvchi orqaga/menyu/qo'ng'iroq tugmalari uchun. */
export function IconButton({
  icon,
  onClick,
  tone = "surface",
  size = 44,
  className,
  ariaLabel,
}: {
  icon: ReactNode;
  onClick?: () => void;
  tone?: "surface" | "glass" | "dark" | "primary";
  size?: number;
  className?: string;
  // FIX2-06: ilgari umuman yo'q edi — chaqiruvchilar hech qachon
  // qo'sha olmasdi, skrin-rider uchun tugma vazifasi noma'lum bo'lib qolardi.
  ariaLabel: string;
}) {
  const toneSx =
    tone === "surface"
      ? { backgroundColor: "var(--color-surface)", boxShadow: "0 4px 14px color-mix(in srgb, var(--color-text-primary) 6%, transparent)", "&:hover": { backgroundColor: "var(--color-surface-muted)" } }
      : tone === "dark"
        ? { backgroundColor: "var(--color-nav)", color: "#fff", "&:hover": { filter: "brightness(1.1)" } }
        : tone === "primary"
          ? { backgroundColor: "var(--color-primary)", color: "#fff", "&:hover": { filter: "brightness(1.05)" } }
          : {
              backgroundColor: "var(--glass-light-strong)",
              border: "1px solid var(--glass-border)",
              backdropFilter: "blur(10px)",
              // Qattiq yozilgan oq emas — `--glass-light-strong` allaqachon
              // rejimga qarab (yorug'/qorong'u) to'g'ri rangga aylanadi,
              // hover holatida shunchaki birozgina yorqinlashtiriladi.
              "&:hover": { filter: "brightness(1.08)" },
            };
  return (
    <MuiIconButton onClick={onClick} className={className} aria-label={ariaLabel} sx={{ width: size, height: size, ...toneSx }}>
      {icon}
    </MuiIconButton>
  );
}

type CardVariant = "default" | "glass" | "flat";

export function Card({
  className,
  children,
  variant = "default",
  /** Karta button/Link ichida ("bosiladigan" ro'yxat elementi) bo'lsa true qiling —
   * hover'da yumshoq ko'tarilish/soya, bosilganda kichrayish qo'shiladi. */
  interactive,
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: CardVariant; interactive?: boolean }) {
  return (
    <MuiCard
      className={clsx(interactive && "cursor-pointer active:scale-[0.99]", className)}
      sx={{
        borderRadius: "28px",
        p: 2.5,
        transition: "all 200ms",
        backgroundColor: variant === "flat" ? "var(--color-surface-muted)" : variant === "glass" ? "var(--glass-light)" : "var(--color-surface)",
        border: variant === "glass" ? "1px solid var(--glass-border)" : "none",
        backdropFilter: variant === "glass" ? "blur(16px)" : "none",
        boxShadow: variant === "default" ? "0 4px 16px color-mix(in srgb, var(--color-text-primary) 5%, transparent)" : "none",
        ...(interactive && {
          "&:hover": { transform: "translateY(-2px)", boxShadow: "0 12px 28px color-mix(in srgb, var(--color-text-primary) 10%, transparent)" },
        }),
      }}
      {...props}
    >
      {children}
    </MuiCard>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  avatarUri,
  right,
}: {
  title: ReactNode;
  subtitle?: string;
  avatarUri?: string | null;
  right?: ReactNode;
}) {
  if (avatarUri !== undefined || right) {
    return (
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          {avatarUri !== undefined && (
            <Avatar src={avatarUri ?? undefined} sx={{ width: 48, height: 48, bgcolor: "var(--color-primary-light)" }}>
              {!avatarUri && <Emoji e="👋" size={22} />}
            </Avatar>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-bold text-text-primary">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-text-secondary">{subtitle}</p>}
          </div>
        </div>
        {right}
      </div>
    );
  }

  return (
    <div className="mb-5">
      <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
    </div>
  );
}

export function Badge({
  tone = "muted",
  children,
}: {
  tone?: "muted" | "success" | "warning" | "danger" | "primary";
  children: ReactNode;
}) {
  const toneSx: Record<string, object> = {
    muted: { backgroundColor: "var(--color-surface-muted)", color: "var(--color-text-secondary)" },
    success: { backgroundColor: "color-mix(in srgb, var(--color-success) 15%, transparent)", color: "var(--color-success)" },
    warning: { backgroundColor: "color-mix(in srgb, var(--color-warning) 15%, transparent)", color: "var(--color-warning)" },
    danger: { backgroundColor: "color-mix(in srgb, var(--color-danger) 15%, transparent)", color: "var(--color-danger)" },
    primary: { backgroundColor: "var(--color-primary-light)", color: "var(--color-primary-dark)" },
  };
  return (
    <MuiChip
      label={children}
      size="small"
      sx={{ height: "auto", py: 0.5, fontWeight: 700, fontSize: "0.75rem", "& .MuiChip-label": { px: 1.5 }, ...toneSx[tone] }}
    />
  );
}

/**
 * TOAST-01 — amal natijasi haqidagi qisqa xabar.
 *
 * Nega kerak: Profil sahifasida natija xabari sahifa OQIMINING oxirida,
 * kulrang rangda va muvaffaqiyat bilan BIR XIL ko'rinishda chizilardi.
 * Rejim tanlash kartalari esa sahifaning tepasida. Natijada server xatosi
 * (rejim saqlanmadi) ekrandan tashqarida, ko'rinmas joyda paydo bo'lib,
 * 2 soniyada yo'qolardi — foydalanuvchi "bosyapman, hech narsa
 * bo'lmayapti" deb xabar berdi va sababi aynan shu edi.
 *
 * Endi u ekranga nisbatan qat'iy joylashadi (pastki navigatsiya ustida),
 * xato qizil rangda va uzoqroq turadi — o'qishga ulguriladi.
 */
export function Toast({ message, tone = "info" }: { message: string; tone?: "info" | "success" | "error" }) {
  const toneClass =
    tone === "error"
      ? "bg-danger text-white"
      : tone === "success"
        ? "bg-success text-white"
        : "bg-nav text-white";
  return (
    <div
      // `role="status"` + `aria-live` — skrin-rider ham xabarni o'qiydi.
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4"
      style={{ bottom: "calc(var(--bottom-nav-height) + 1rem)" }}
    >
      <p className={clsx("animate-fade-in-up max-w-sm rounded-full px-4 py-2.5 text-center text-sm font-semibold shadow-lg", toneClass)}>
        {message}
      </p>
    </div>
  );
}

/** Suzuvchi shisha-effekt yorliq — gradient qahramon banner ustiga qo'yiladigan statistika. */
export function FloatingTag({ icon, value, label }: { icon?: ReactNode; value: string; label: string }) {
  return (
    <div className="floating-tag flex items-center gap-2 rounded-2xl px-3.5 py-2.5">
      {icon}
      <div>
        <div className="text-base font-extrabold leading-tight text-text-primary">{value}</div>
        <div className="text-[11px] leading-tight text-text-secondary">{label}</div>
      </div>
    </div>
  );
}

/** Katta raqamli statistika plitkasi (referens: "Heart Rate 85 bpm"). */
export function StatTile({
  icon,
  label,
  value,
  unit,
  tone = "muted",
  active,
  interactive,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
  unit?: string;
  tone?: "primary" | "secondary" | "accent" | "muted";
  active?: boolean;
  /** Karta bosiladigan bo'lsa (masalan qiymat kiritish uchun) true qiling. */
  interactive?: boolean;
}) {
  const toneBg = active
    ? tone === "primary"
      ? "var(--color-primary)"
      : tone === "secondary"
        ? "var(--color-secondary)"
        : tone === "accent"
          ? "var(--color-accent)"
          : "var(--color-nav)"
    : "var(--color-surface)";
  return (
    <MuiCard
      className={clsx("flex-1", interactive && "cursor-pointer active:scale-[0.98]")}
      sx={{
        borderRadius: "24px",
        p: 2,
        transition: "all 200ms",
        backgroundColor: toneBg,
        boxShadow: active ? "0 8px 20px color-mix(in srgb, var(--color-nav) 20%, transparent)" : "0 4px 16px color-mix(in srgb, var(--color-text-primary) 5%, transparent)",
        ...(interactive && { "&:hover": { transform: "translateY(-2px)", filter: "brightness(1.03)" } }),
      }}
    >
      <div className={clsx("flex items-center gap-1.5 text-xs font-semibold", active ? "text-white/75" : "text-text-secondary")}>
        {icon}
        {label}
      </div>
      <div className={clsx("mt-3 text-2xl font-extrabold", active ? "text-white" : "text-text-primary")}>
        {value}
        {unit && <span className={clsx("text-sm font-semibold", active ? "text-white/75" : "text-text-secondary")}> {unit}</span>}
      </div>
    </MuiCard>
  );
}

/** Pilla-shaklidagi segmentli almashtirgich (referens: "Weeks | Months | Trimesters"). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_, v) => v && onChange(v)}
      sx={{
        backgroundColor: "var(--color-surface-muted)",
        borderRadius: "999px",
        p: 0.5,
        gap: 0.5,
        width: "100%",
        "& .MuiToggleButtonGroup-grouped": { border: 0, borderRadius: "999px !important", flex: 1 },
      }}
    >
      {options.map((opt) => (
        <ToggleButton
          key={opt.value}
          value={opt.value}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.75rem",
            color: "var(--color-text-secondary)",
            "&.Mui-selected": { backgroundColor: "var(--color-primary)", color: "#fff", "&:hover": { backgroundColor: "var(--color-primary)" } },
          }}
        >
          {opt.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

export function ProgressBar({ value, tone = "primary" }: { value: number; tone?: "primary" | "secondary" | "accent" }) {
  const barColor = tone === "secondary" ? "var(--color-secondary)" : tone === "accent" ? "var(--color-accent)" : "var(--color-primary)";
  return (
    <LinearProgress
      variant="determinate"
      value={Math.min(100, Math.max(0, value))}
      sx={{
        height: 12,
        borderRadius: 999,
        backgroundColor: "var(--color-surface-muted)",
        "& .MuiLinearProgress-bar": { borderRadius: 999, backgroundColor: barColor },
      }}
    />
  );
}

/** Flow/kayfiyat/simptom kabi belgilarni tanlash tugmasi — foydalanuvchi
 * ko'rsatgan referens uslubga mos: doira ichida emoji, yorliq esa doiradan
 * TASHQARIDA, pastda (Figma/Flo referens — filangan to'rtburchak chip emas,
 * "doira ikonka + tagida matn" naqshi). Tanlangan holatda faqat doira fon
 * rangi o'zgaradi, matn rangi ham primary'ga o'tadi — yorliqning o'zi fon
 * olmaydi (mobile: components/ui.tsx'dagi bir xil komponent bilan bir xil
 * naqsh). */
export function IconChip({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon?: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <ToggleButton
      value={label}
      selected={!!active}
      onChange={() => onClick?.()}
      disableRipple
      sx={{
        flexDirection: "column",
        gap: 0.5,
        borderRadius: "16px !important",
        border: "none",
        px: 0.5,
        py: 0.5,
        textTransform: "none",
        fontSize: "0.75rem",
        fontWeight: 500,
        color: "var(--color-text-secondary)",
        backgroundColor: "transparent",
        "&:hover": { backgroundColor: "color-mix(in srgb, var(--color-text-secondary) 8%, transparent)" },
        "&.Mui-selected": {
          backgroundColor: "transparent",
          color: "var(--color-primary)",
          "&:hover": { backgroundColor: "color-mix(in srgb, var(--color-primary) 8%, transparent)" },
        },
      }}
    >
      {icon && (
        <span
          className="flex items-center justify-center rounded-full text-xl leading-none"
          style={{
            width: 56,
            height: 56,
            backgroundColor: active ? "var(--color-primary)" : "var(--color-surface-muted)",
          }}
        >
          {icon}
        </span>
      )}
      <span className="text-center leading-tight">{label}</span>
    </ToggleButton>
  );
}

/**
 * Brendlangan yuklash indikatori — foydalanuvchi ilgari aynan shu 8 nuqtali
 * "orbit" dizaynni so'ragan (globals.css .loader), shuning uchun MUI'ga
 * o'tishda ham saqlab qolindi — faqat orqa fon endi MUI Backdrop orqali
 * (haqiqiy Material modal-fon xatti-harakati bilan).
 */
// WEB3-14 + keyingi foydalanuvchi so'rovi (2026-09-17, "Yuklanmoqda... text
// chiqmasin"): `label` VIZUAL ravishda ko'rsatilmaydi — faqat aylanuvchi
// spinner ko'rinadi, avvalgidek. Lekin WEB3-14'ning asosiy maqsadi
// (ekran-o'quvchilar uchun holat e'lon qilish) saqlanib qoladi: matn
// `sr-only` bilan vizual jihatdan yashirilgan, lekin DOM'da bor va
// `role="status"`/`aria-live="polite"` orqali skrin-rider'ga baribir
// o'qib beriladi.
// UX-00: `inline` — bir bo'lim (masalan tab ichidagi Statistika panel)
// o'zining ma'lumotini kutayotganda butun ekranni fixed Backdrop bilan
// bosib qo'ymasin (avval YordamchiScreen buni markazlashtiruvchi <div>ga
// o'rab qo'ygan edi, lekin Backdrop `position: fixed` bo'lgani uchun bu
// hech qanday amaliy farq qilmasdi). `inline` bo'lsa oddiy, joyida turuvchi
// spinner — hali ham bir xil `.loader` uslubi, faqat orqa fon/blursiz.
export function LoadingSpinner({ label, inline = false }: { label?: string; inline?: boolean }) {
  const spinner = (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-3">
      <span className="loader" />
      {label && <span className="sr-only">{label}</span>}
    </div>
  );

  if (inline) {
    return <div className="flex flex-1 items-center justify-center py-10">{spinner}</div>;
  }

  return (
    // OVERNIGHT-14: bu Backdrop ilgari (app)/layout.tsx'dagi `PageTransition`
    // (Framer Motion `motion.div`, `animate={{ y: 0 }}`) ICHIDA render
    // bo'lardi — animatsiya davomida faol bo'lgan CSS `transform` ota-
    // elementni `position: fixed` uchun YANGI "containing block"ka
    // aylantiradi (CSS spetsifikatsiyasi), shuning uchun bu Backdrop butun
    // ekran o'rniga faqat o'sha motion.div'ning kichik hududida (odatda
    // sahifa yuqorisida) cho'zilib qolardi — "loader tepada bir necha
    // millisekund turib, keyin (animatsiya tugab, transform olib
    // tashlanganda) pastga/markazga sakrab tushishi" shundan edi. `Portal`
    // bilan `document.body`ga to'g'ridan-to'g'ri chiqarib, bu muammo CSS
    // darajasida BUTUNLAY yo'q qilinadi — endi hech qanday ota-element
    // transformidan qat'iy nazar doim haqiqiy ekran bo'yicha markazlashadi.
    <Portal>
      <Backdrop
        open
        // Xira/blur holati hech qachon "yarim tugallangan" ko'rinishda
        // ko'rinmasin (foydalanuvchi so'roviga ko'ra) — o'tish animatsiyasi
        // o'chirilgan, darhol to'liq holatda paydo bo'ladi.
        transitionDuration={0}
        sx={{
          position: "fixed",
          inset: 0,
          // BottomNav'dan (z-20) PASTROQ — aks holda sahifa o'z ma'lumotini
          // yuklayotganda bu Backdrop pastki menyuni ham xira/bosilmas qilib
          // qo'yardi ("pastki menyu blur tagida qolib qolishi" degan xato
          // shundan kelib chiqqan edi). Endi pastki menyu har doim ustida —
          // sahifa hali yuklanayotgan bo'lsa ham darhol boshqa bo'limga o'tish
          // mumkin, kutish shart emas.
          zIndex: 15,
          backgroundColor: "color-mix(in srgb, var(--color-background) 30%, transparent)",
          backdropFilter: "blur(12px)",
        }}
      >
        {spinner}
      </Backdrop>
    </Portal>
  );
}

/**
 * UX-00: "yuklab bo'lmadi" holati — ilgari FIX-UX-08/WEB3-10/11/12'da
 * bir nechta ekranda ALOHIDA-ALOHIDA qo'lda yozilgan bir xil
 * Card+matn+"Qayta urinish"-tugma naqshini BIR JOYGA birlashtiradi.
 * Matn/tugma nomi chaqiruvchidan keladi — bu fayl i18n'dan mustaqil
 * qoladi (`LoadingSpinner`ning `label` propi bilan bir xil naqsh);
 * odatda `dict.common.errorGeneric`/`dict.common.retryButton` ishlatiladi,
 * lekin ekran o'ziga xos, iliqroq xabar ham berishi mumkin.
 */
export function ErrorState({
  message,
  icon,
  retry,
  /** Dialog/DialogContent kabi allaqachon o'z konteyneriga ega joyda —
   * qo'shimcha Card bilan o'rab qo'ymaslik uchun. */
  bare = false,
}: {
  message: string;
  icon?: ReactNode;
  retry?: { label: string; onClick: () => void };
  bare?: boolean;
}) {
  const body = (
    <div className={clsx("flex flex-col items-center gap-3 text-center", bare ? "py-4" : "py-8")}>
      {icon && <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">{icon}</span>}
      <p className="text-sm text-text-secondary">{message}</p>
      {retry && <Button onClick={retry.onClick}>{retry.label}</Button>}
    </div>
  );
  return bare ? body : <Card className="text-center">{body}</Card>;
}

/**
 * UX-00: "hali hech narsa yo'q" holati — Jamiyat lentasining bo'sh-holati
 * (matn + ixtiyoriy amal-tugmasi) BUTUN ilova bo'ylab qayta ishlatiladigan
 * yagona naqshga aylantirildi (ilgari faqat shu bitta ekranda bor edi,
 * qolganlari oddiy xira matn bilan cheklangan edi). `illustrationSrc` —
 * ekran allaqachon `useIllustrations().resolve(...)` orqali olgan
 * rasmni shu yerga uzatishi mumkin (yangi illyustratsiya-slot turi
 * qo'shilmadi — mavjud ekran-darajasidagi rasm qayta ishlatiladi).
 */
export function EmptyState({
  title,
  message,
  illustrationSrc,
  action,
  bare = false,
}: {
  title?: string;
  message: string;
  illustrationSrc?: string;
  action?: { label: string; onClick: () => void };
  bare?: boolean;
}) {
  const body = (
    <div className={clsx("flex flex-col items-center gap-3 text-center", bare ? "py-4" : "py-8")}>
      {illustrationSrc && (
        // eslint-disable-next-line @next/next/no-img-element -- kichik statik SVG, next/image shart emas
        <img src={illustrationSrc} alt="" className="h-24 w-auto" />
      )}
      {title && <p className="font-semibold text-text-primary">{title}</p>}
      <p className="text-sm text-text-secondary">{message}</p>
      {action && (
        <Button variant="secondary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
  return bare ? body : <Card className="text-center">{body}</Card>;
}

// iOS'dagi "wheel" pastga-tepaga varaqlanadigan tanlagichga o'xshab, scroll-snap
// orqali (yosh/bo'y/vazn/sana kabi raqamli tanlovlar uchun — uchinchi tomon
// kutubxonasiz). Generic <T> — sonlar (yosh, sm, kg) HAM, oy kabi nomlangan
// qiymatlar HAM (label orqali) ishlatilishi mumkin.
const WHEEL_ITEM_HEIGHT = 48;
const WHEEL_VISIBLE_ROWS = 5;

/**
 * WHEEL-FIX-01 — g'ildirak tanlagich.
 *
 * XABAR QILINGAN XATO: "ba'zilarda animatsiya ishlamay qolyapti va
 * ba'zilarda 1923 bo'lib qolgan". 1923 — bu tug'ilgan yillar ro'yxatining
 * ENG BIRINCHI elementi, ya'ni ayol g'ildirakka umuman tegmasa ham unga
 * yosh "tanlab" qo'yilgan bo'lardi.
 *
 * SABABI ikkita va ikkalasi ham tuzatildi:
 *
 *   1) `settle()` DASTURIY scrolldan ham ishga tushardi. Mount paytida
 *      boshlang'ich `scrollTop` o'rnatiladi; agar o'sha lahzada element
 *      hali o'lchamga ega bo'lmasa, brauzer qiymatni 0 ga QIRQADI
 *      (`scrollTop`ni scroll qilib bo'lmaydigan elementga berib bo'lmaydi).
 *      Keyin scroll hodisasi kelib, `settle()` 0-indeksni "foydalanuvchi
 *      tanladi" deb hisoblab, `onChange(options[0])` chaqirardi — ya'ni
 *      eng birinchi yil. Endi `settle()` HAQIQIY teginishdan keyingina
 *      ishlaydi.
 *
 *   2) Qiymat OLDINDAN tanlangan turardi. Endi u bo'sh (`null`) bo'lishi
 *      mumkin: markazda "Tanlang" yozuvi turadi va "Davom etish" o'chiq
 *      bo'ladi. Shunda hatto scroll butunlay ishlamay qolsa ham, ilova
 *      ayolga tegishli bo'lmagan sanani YOZIB QO'YMAYDI — eng yomoni,
 *      u tanlashni so'raydi.
 */
export function WheelPicker<T>({
  options,
  value,
  onChange,
  label,
  suffix,
  compact,
  placeholder,
  restIndex,
}: {
  options: T[];
  /** `null` — hali hech narsa tanlanmagan (markazda `placeholder` turadi). */
  value: T | null;
  onChange: (value: T) => void;
  /** Har bir qatorda ko'rsatiladigan matn — berilmasa, qiymatning o'zi (String()). */
  label?: (option: T) => ReactNode;
  /** Har bir qatorga qo'shiladigan birlik yorlig'i (masalan "sm", "kg", "fut"). */
  suffix?: string;
  /** Bir nechta ustunni yonma-yon joylashtirish uchun (fut+dyuym, kun/oy/yil) —
   * markazlashtirilgan `max-w-xs` o'rniga to'liq enini egallaydi, tashqi flex
   * konteyner eni belgilaydi. */
  compact?: boolean;
  /** `value` bo'sh bo'lganda markazda ko'rinadigan yozuv (masalan "Tanlang"). */
  placeholder?: string;
  /** `value` bo'sh bo'lganda g'ildirak qaysi qatordan boshlanishi. Bu TANLOV
   * emas — shunchaki qulay boshlang'ich nuqta (masalan tug'ilgan yil uchun
   * ro'yxatning eng chetidan ko'ra o'rtasi). */
  restIndex?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const settleTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  /** Ayol g'ildirakka HAQIQATAN tegdimi. Shusiz hech qachon `onChange`
   * chaqirilmaydi — yuqoridagi (1) izohga qarang. */
  const touched = useRef(false);
  const padCount = Math.floor(WHEEL_VISIBLE_ROWS / 2);
  const index = value === null ? -1 : options.indexOf(value);

  const showPlaceholder = value === null && !!placeholder;
  /** "Tanlang" qatori qaysi o'ringa QO'YILADI. */
  const restAt = Math.min(Math.max(restIndex ?? Math.floor(options.length / 2), 0), options.length);

  /**
   * Ekranda ko'rinadigan qatorlar. "Tanlang" yilni YOPMAYDI, balki ular
   * ORASIGA qo'shiladi — foydalanuvchi ko'rsatgan referensda ham shunday:
   *   2003 / 2004 / [Select] / 2005 / 2006
   * Birinchi urinishda u yilning USTIDA turardi va natijada bitta yil
   * ko'rinmay qolardi (2000 dan keyin birdan 2002). Bu shunchaki chiroyli
   * emas edi: ro'yxat uzluksiz ko'rinmasa, ayol qaysi yilda turganini
   * noto'g'ri o'qiydi.
   */
  const rows: { key: string; option: T | null }[] = showPlaceholder
    ? [
        ...options.slice(0, restAt).map((o, i) => ({ key: `o${i}`, option: o })),
        { key: "placeholder", option: null },
        ...options.slice(restAt).map((o, i) => ({ key: `o${restAt + i}`, option: o })),
      ]
    : options.map((o, i) => ({ key: `o${i}`, option: o }));

  /** Ko'rinadigan indeksdan HAQIQIY variant indeksiga. */
  function toOptionIndex(rowIdx: number): number {
    const raw = showPlaceholder && rowIdx >= restAt ? rowIdx - 1 : rowIdx;
    return Math.min(Math.max(raw, 0), options.length - 1);
  }

  /** Boshlang'ich (dam olish) holatidagi scroll o'rni. */
  const parkedTop = (index >= 0 ? index : restAt) * WHEEL_ITEM_HEIGHT;

  // Boshlang'ich (va variantlar soni o'zgarganidagi) joylashuv.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // rAF — element DOM'ga tushgan, lekin joylashuv hali yakunlanmagan
    // bo'lishi mumkin. O'sha holatda `scrollTop` 0 ga qirqilib, g'ildirak
    // ro'yxatning boshida turib qolardi (xabar qilingan xatoning ko'rinadigan
    // tomoni — "animatsiya ishlamayapti").
    requestAnimationFrame(() => {
      if (containerRef.current) containerRef.current.scrollTop = parkedTop;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.length]);

  // "Tanlang" qatori ro'yxatdan chiqqan lahzada qatorlar bittaga siljiydi —
  // tanlangan yil markazda qolishi uchun scrollni qayta tenglaymiz.
  const hadPlaceholder = useRef(showPlaceholder);
  useEffect(() => {
    if (hadPlaceholder.current && !showPlaceholder && index >= 0 && containerRef.current) {
      containerRef.current.scrollTop = index * WHEEL_ITEM_HEIGHT;
    }
    hadPlaceholder.current = showPlaceholder;
  }, [showPlaceholder, index]);

  function settle() {
    const el = containerRef.current;
    // Foydalanuvchi tegmagan bo'lsa — bu dasturiy scroll, tanlov EMAS.
    if (!el || !touched.current) return;
    // Hali hech narsa tanlanmagan bo'lsa, SHUNCHAKI TEGISH yetarli emas:
    // g'ildirak haqiqatan SURILGAN bo'lishi kerak. Aks holda ekranga bir
    // marta tegib qo'yish ham yilni tanlab yuborardi.
    if (showPlaceholder && Math.abs(el.scrollTop - parkedTop) < 4) return;
    const rowIdx = Math.min(Math.max(Math.round(el.scrollTop / WHEEL_ITEM_HEIGHT), 0), rows.length - 1);
    const picked = options[toOptionIndex(rowIdx)];
    if (!showPlaceholder) el.scrollTo({ top: rowIdx * WHEEL_ITEM_HEIGHT, behavior: "smooth" });
    if (picked !== value) onChange(picked);
  }

  function handleScroll() {
    if (settleTimeout.current) clearTimeout(settleTimeout.current);
    settleTimeout.current = setTimeout(settle, 120);
  }

  function markTouched() {
    touched.current = true;
  }

  // Zamonaviy brauzerlarda `scrollend` — debounce'dan aniqroq va tezroq.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !("onscrollend" in window)) return;
    el.addEventListener("scrollend", settle);
    return () => el.removeEventListener("scrollend", settle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className={clsx("relative w-full", !compact && "mx-auto max-w-xs")} style={{ height: WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ROWS }}>
      {/* Markaziy tanlangan qatorni ko'rsatuvchi doimiy band — scroll ostida.
          ONB-PLAIN-01: ilgari band pushti RAMKA bilan chizilgan edi. Endi u
          shunchaki yumshoq kulrang maydon: tanlangan qiymatning o'zi yirik va
          qora bo'lgani uchun ramka ortiqcha bo'lib, ekranga shovqin qo'shardi. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 z-0 -translate-y-1/2 rounded-2xl bg-surface-muted"
        style={{ height: WHEEL_ITEM_HEIGHT }}
      />
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onPointerDown={markTouched}
        onTouchStart={markTouched}
        onWheel={markTouched}
        onKeyDown={markTouched}
        // Band endi SHAFFOF EMAS (kulrang to'ldirilgan), shuning uchun
        // ro'yxat undan YUQORIDA turishi shart — aks holda tanlangan
        // qiymatning o'zi band ostida qolib ko'rinmay qoladi.
        className="tap-target relative z-10 h-full overflow-y-auto scroll-smooth"
        style={{
          scrollSnapType: "y mandatory",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)",
          maskImage: "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)",
        }}
      >
        <div style={{ height: WHEEL_ITEM_HEIGHT * padCount }} />
        {rows.map((row) => (
          <div
            key={row.key}
            className={clsx(
              "flex items-center justify-center transition-colors",
              // Tanlangan qiymat (yoki "Tanlang") qolganlaridan ANIQ ajralib
              // turadi: yirik va qora, qolganlari kichik va och.
              row.option === null || row.option === value
                ? "text-3xl font-extrabold text-text-primary"
                : "text-xl font-semibold text-text-muted"
            )}
            style={{ height: WHEEL_ITEM_HEIGHT, scrollSnapAlign: "center" }}
          >
            {row.option === null ? (
              <span className="text-2xl">{placeholder}</span>
            ) : (
              <>
                {label ? label(row.option) : String(row.option)}
                {suffix && <span className="ml-1 text-base font-normal text-text-muted">{suffix}</span>}
              </>
            )}
          </div>
        ))}
        <div style={{ height: WHEEL_ITEM_HEIGHT * padCount }} />
      </div>
    </div>
  );
}

function daysInMonth(year: number, month: number): number {
  // Oyning 0-kuni — aslida OLDINGI oyning oxirgi kuni (JS Date xususiyati).
  return new Date(year, month, 0).getDate();
}

function parseYMD(value: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

function formatYMD(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * "Kun / Oy / Yil" — uchta WheelPicker yonma-yon, iOS'dagi sana tanlagichga
 * o'xshab (foydalanuvchi so'rovi: "iphonedagidek scroll orqali qilishi kerak
 * hamma joyida" — avvalgi HTML <input type="date"> o'rnini bosadi). Qiymat
 * har doim "YYYY-MM-DD" ko'rinishida — mavjud state/API bilan bir xil.
 */
export function DateWheelPicker({
  value,
  onChange,
  monthLabels,
  minYear,
  maxYear,
}: {
  value: string;
  onChange: (value: string) => void;
  /** 12 ta oy nomi, 0-indeks = Yanvar (dict.common.months). */
  monthLabels: string[];
  minYear: number;
  maxYear: number;
}) {
  const today = new Date();
  const parsed = parseYMD(value);
  const year = parsed && parsed.year >= minYear && parsed.year <= maxYear ? parsed.year : Math.min(Math.max(today.getFullYear(), minYear), maxYear);
  const month = parsed?.month ?? today.getMonth() + 1;
  const maxDay = daysInMonth(year, month);
  const day = Math.min(parsed?.day ?? today.getDate(), maxDay);

  const years: number[] = [];
  for (let y = minYear; y <= maxYear; y++) years.push(y);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  function update(next: { year?: number; month?: number; day?: number }) {
    const y = next.year ?? year;
    const m = next.month ?? month;
    const d = Math.min(next.day ?? day, daysInMonth(y, m));
    onChange(formatYMD(y, m, d));
  }

  // `value` bo'sh (hali umuman tanlanmagan) bo'lsa — g'ildirak baribir BIRON
  // sanani ko'rsatadi (bugungi kun), shuning uchun tashqi holat ham darhol
  // shu bilan mos qilinadi (aks holda "Keyingisi" tugmasi foydalanuvchi biror
  // g'ildirakni chindan siljitmaguncha faollashmay qolardi — ekranda sana
  // ko'rinib turgani holda).
  useEffect(() => {
    if (!parsed) onChange(formatYMD(year, month, day));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-xs gap-2">
      <WheelPicker compact options={days} value={day} onChange={(d) => update({ day: d })} />
      <WheelPicker compact options={months} value={month} label={(m) => monthLabels[m - 1]} onChange={(m) => update({ month: m })} />
      <WheelPicker compact options={years} value={year} onChange={(y) => update({ year: y })} />
    </div>
  );
}
