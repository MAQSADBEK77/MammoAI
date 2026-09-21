"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarMonth,
  CalendarMonthOutlined,
  FactCheck,
  FactCheckOutlined,
  Groups,
  GroupsOutlined,
  Favorite,
  FavoriteBorderOutlined,
  ChatBubble,
  ChatBubbleOutlineOutlined,
} from "@mui/icons-material";
import clsx from "clsx";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";

export function BottomNav() {
  const pathname = usePathname();
  const { dict } = useI18n();
  const { onboardingProfile } = useSession();

  // "Asosiy" — Tsikl/Homiladorlik (rejimga qarab) + Klinikalar birlashtirilgan
  // yagona bosh sahifa. Profil pastki menyuda emas — faqat chap burger menyusi
  // orqali ochiladi. Hamkor esa foydalanuvchi so'roviga ko'ra pastki menyuga
  // qo'shildi. Har bir bandda ikkita ikonka bor — faol bo'lmasa "outlined",
  // faol bo'lsa "filled" (Material konvensiyasi).
  // "Hamkorimni kuzataman" (partner_tracking) foydalanuvchisida shaxsiy
  // sikl/homiladorlik ma'lumoti yo'q — Jamiyat (hayz/homiladorlik mavzusidagi
  // muhokamalar) ular uchun aloqador emas, shuning uchun ko'rsatilmaydi.
  // Chat kabi "butun ekran balandligini o'zi hisoblaydigan" ekranlar
  // (YordamchiScreen) ilgari BU NAVning balandligini QO'LDA taxmin qilingan
  // "rem" son bilan hisobga olardi — turli qurilma/brauzer/WebView (Median,
  // Telegram Mini App)da haqiqiy balandlik farq qilishi mumkin, va taxmin
  // xato bo'lsa chat input aynan shu nav ORQASIGA yashiringan holda
  // ko'rinardi. Endi HAQIQIY o'lchangan balandlik (safe-area bilan birga)
  // `--bottom-nav-height` CSS o'zgaruvchisiga yozib qo'yiladi — istalgan
  // component `calc(100dvh - var(--bottom-nav-height))` kabi ANIQ hisoblay
  // oladi, taxmin qilish shart emas.
  const navRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const update = () => document.documentElement.style.setProperty("--bottom-nav-height", `${el.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const isPartnerTracking = onboardingProfile?.primaryGoal === "partner_tracking";
  const items = [
    { href: "/asosiy", label: dict.nav.home, Icon: CalendarMonth, IconOutline: CalendarMonthOutlined },
    ...(isPartnerTracking ? [] : [{ href: "/jamiyat", label: dict.nav.community, Icon: Groups, IconOutline: GroupsOutlined }]),
    { href: "/tekshiruvlar", label: dict.nav.checklist, Icon: FactCheck, IconOutline: FactCheckOutlined },
    { href: "/hamkor", label: dict.nav.partner, Icon: Favorite, IconOutline: FavoriteBorderOutlined },
    // TODAY-04: menyu HAR DOIM tekis — hech qaysi band boshqasidan katta emas
    // (foydalanuvchi so'rovi). Yordamchi "mo'ralab" turgan paytda uning
    // ustiga chiqadigan oq tab TodayAssistantCard tomonidan chiziladi, ya'ni
    // kartaning O'ZIGA ulangan bo'ladi — "pop up connected to that icon".
    { href: "/yordamchi", label: dict.nav.assistant, Icon: ChatBubble, IconOutline: ChatBubbleOutlineOutlined },
  ];

  return (
    <nav
      ref={navRef}
      className="fixed inset-x-0 bottom-0 z-20 flex justify-center px-4"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + var(--tg-safe-area-bottom) + 12px)" }}
    >
      {/* TODAY-01: Figma referens bo'yicha — to'q "aurora" panel o'rniga ochiq,
          yengil panel; faol band aksent (turkuaz) rangda, qolganlari sokin
          kulrang. Ikonkalar Material konvensiyasi bo'yicha faolda "filled",
          aks holda "outlined" (bu o'zgarmadi). */}
      <div className="flex w-full max-w-md items-stretch justify-between gap-1 rounded-[28px] bg-surface px-1.5 py-2 shadow-xl shadow-black/10 ring-1 ring-border/60">
        {items.map(({ href, label, Icon, IconOutline }) => {
          const active = pathname?.startsWith(href);
          const IconComponent = active ? Icon : IconOutline;
          return (
            <Link
              key={href}
              href={href}
              className="tap-target flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1 text-[10px] font-bold transition"
            >
              <IconComponent sx={{ fontSize: 24 }} className={active ? "text-accent" : "text-text-muted"} />
              <span className={clsx("leading-none", active ? "text-accent" : "text-text-muted")}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
