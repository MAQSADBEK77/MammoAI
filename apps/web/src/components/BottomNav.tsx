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
import { useAssistantPeek } from "@/lib/assistant-peek";

export function BottomNav() {
  const pathname = usePathname();
  const { dict } = useI18n();
  const { onboardingProfile, overdueCheckups } = useSession();

  // "Asosiy" — Tsikl/Homiladorlik (rejimga qarab) + Klinikalar birlashtirilgan
  // yagona bosh sahifa. Profil pastki menyuda emas — faqat chap burger menyusi
  // orqali ochiladi. Hamkor esa foydalanuvchi so'roviga ko'ra pastki menyuga
  // qo'shildi. Har bir bandda ikkita ikonka bor — faol bo'lmasa "outlined",
  // faol bo'lsa "filled" (Material konvensiyasi).
  // "Hamkorimni kuzataman" (partner_tracking) foydalanuvchisida shaxsiy
  // sikl/homiladorlik ma'lumoti yo'q — Jamiyat (hayz/homiladorlik mavzusidagi
  // muhokamalar) ular uchun aloqador emas, shuning uchun ko'rsatilmaydi.
  const peeking = useAssistantPeek();
  const isPartnerTracking = onboardingProfile?.primaryGoal === "partner_tracking";
  const items = [
    { href: "/asosiy", label: dict.nav.home, Icon: CalendarMonth, IconOutline: CalendarMonthOutlined },
    ...(isPartnerTracking ? [] : [{ href: "/jamiyat", label: dict.nav.community, Icon: Groups, IconOutline: GroupsOutlined }]),
    { href: "/tekshiruvlar", label: dict.nav.checklist, Icon: FactCheck, IconOutline: FactCheckOutlined },
    { href: "/hamkor", label: dict.nav.partner, Icon: Favorite, IconOutline: FavoriteBorderOutlined },
    // TODAY-04: menyu HAR DOIM tekis — hech qaysi band boshqasidan katta emas
    // (foydalanuvchi so'rovi). Yordamchi "mo'ralab" turganda esa uning O'Z
    // ikonkasi kattalashadi (pastda), oynani unga bog'laydigan "dum"ni
    // TodayAssistantCard chizadi.
    { href: "/yordamchi", label: dict.nav.assistant, Icon: ChatBubble, IconOutline: ChatBubbleOutlineOutlined },
  ];

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
  // TODAY-06: yordamchi oynasi (TodayAssistantCard) AYNAN yordamchi ikonkasidan
  // ochilishi kerak, ya'ni u ikonkaning o'rnini bilishi shart. Ilgari bu o'rin
  // `left-[90%]` deb TAXMIN qilingandi — 5 ta band teng bo'linganda 5-bandning
  // markazi shunga to'g'ri keladi. Lekin "hamkorimni kuzataman" rejimida
  // Jamiyat bandi ko'rsatilmaydi (4 band), va o'sha holda markaz 87.5%da —
  // oyna noto'g'ri joydan ochilardi. Endi o'rin HAQIQATAN o'lchanadi, xuddi
  // balandlik kabi.
  //
  // Qiymat panelning CHAP QIRRASIDAN boshlab piksel bilan yoziladi. Oyna ham,
  // bu panel ham bir xil konteynerda (`fixed inset-x-0 px-4` + `w-full
  // max-w-md`) joylashgani uchun ikkalasining chap qirrasi USTMA-UST tushadi —
  // ya'ni bitta qiymat ikkalasiga birdek yaraydi.
  const panelRef = useRef<HTMLDivElement>(null);
  const assistantRef = useRef<HTMLAnchorElement>(null);
  useLayoutEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const update = () => {
      document.documentElement.style.setProperty("--bottom-nav-height", `${el.offsetHeight}px`);
      const item = assistantRef.current;
      const panel = panelRef.current;
      if (!item || !panel) return;
      const itemBox = item.getBoundingClientRect();
      const panelBox = panel.getBoundingClientRect();
      document.documentElement.style.setProperty(
        "--assistant-anchor-x",
        `${Math.round(itemBox.left + itemBox.width / 2 - panelBox.left)}px`
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
    // `items.length` — bandlar soni o'zgarsa yordamchi ikonkasining o'rni ham
    // o'zgaradi ("hamkorimni kuzataman"da Jamiyat bandi yo'q). Panel balandligi
    // esa o'zgarmaydi, ya'ni ResizeObserver bu holatda ishga tushmaydi va
    // o'lchov eskirib qolardi.
  }, [items.length]);

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
      <div
        ref={panelRef}
        className="flex w-full max-w-md items-stretch justify-between gap-1 rounded-[28px] bg-surface px-1.5 py-2 shadow-xl shadow-black/10 ring-1 ring-border/60"
      >
        {items.map(({ href, label, Icon, IconOutline }) => {
          const active = pathname?.startsWith(href);
          // Yordamchi oynasi ochiq turganda uning ikonkasi KATTALASHADI va
          // aksent rangga o'tadi (foydalanuvchi so'rovi: "icon bigger only
          // when open"). Ilgari buni oynaning O'ZI chizadigan oq "til" ichidagi
          // ikonka bajarardi — u bandning ustiga tushib, "Yordamchi" yozuvini
          // ham berkitib qo'yardi. Endi bandning o'z ikonkasi o'sadi, ya'ni
          // yozuv joyida qoladi va band bosiladigan HAQIQIY havola bo'lib
          // turadi.
          const highlighted = href === "/yordamchi" && peeking;
          const IconComponent = active || highlighted ? Icon : IconOutline;
          // ATTN-01: muddati o'tgan tekshiruvlar soni. Bu shunchaki diqqatni
          // tortish uchun emas — u AYTADI: "ikkita ish kechikkan". Ikonkani
          // kattalashtirish bezak bo'lardi va foydalanuvchi unga ko'nikib
          // qolardi; son esa har safar boshqacha, va unga sabab bor.
          const badge = href === "/tekshiruvlar" ? overdueCheckups : 0;
          return (
            <Link
              key={href}
              ref={href === "/yordamchi" ? assistantRef : undefined}
              href={href}
              className="tap-target flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1 text-[10px] font-bold transition"
            >
              {/* O'lcham `font-size` bilan emas, `scale` bilan o'zgaradi:
                  transform GPU'da ishlaydi va qo'shni bandlarni surib
                  yubormaydi (font-size o'zgarsa qator qayta joylashardi). */}
              <span
                className={clsx(
                  "relative flex items-center justify-center transition-transform duration-300",
                  highlighted && "scale-[1.35]"
                )}
                style={{ transitionTimingFunction: "var(--motion-ease-brand)" }}
              >
                <IconComponent
                  sx={{ fontSize: 24 }}
                  className={active || highlighted ? "text-accent" : "text-text-muted"}
                />
                {badge > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </span>
              <span className={clsx("leading-none", active || highlighted ? "text-accent" : "text-text-muted")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
