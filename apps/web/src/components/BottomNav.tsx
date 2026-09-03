"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, HomeOutlined, FactCheck, FactCheckOutlined, Groups, GroupsOutlined, Person, PersonOutlined } from "@mui/icons-material";
import clsx from "clsx";
import { useI18n } from "@/lib/i18n";

export function BottomNav() {
  const pathname = usePathname();
  const { dict } = useI18n();

  // "Asosiy" — Tsikl/Homiladorlik (rejimga qarab) + Klinikalar birlashtirilgan
  // yagona bosh sahifa (foydalanuvchi so'roviga ko'ra 4 ta bo'limga siqildi).
  // Har bir bandda ikkita ikonka bor — faol bo'lmasa "outlined", faol bo'lsa
  // "filled" (Material Design'ning navigatsiya konvensiyasi).
  const items = [
    { href: "/asosiy", label: dict.nav.home, Icon: Home, IconOutline: HomeOutlined },
    { href: "/jamiyat", label: dict.nav.community, Icon: Groups, IconOutline: GroupsOutlined },
    { href: "/tekshiruvlar", label: dict.nav.checklist, Icon: FactCheck, IconOutline: FactCheckOutlined },
    { href: "/profil", label: dict.nav.profile, Icon: Person, IconOutline: PersonOutlined },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+12px)]">
      <div className="bg-aurora-nav flex w-full max-w-md items-stretch justify-between gap-1 rounded-[32px] px-2 py-2 shadow-2xl shadow-black/30">
        {items.map(({ href, label, Icon, IconOutline }) => {
          const active = pathname?.startsWith(href);
          const IconComponent = active ? Icon : IconOutline;
          return (
            <Link
              key={href}
              href={href}
              className="tap-target flex flex-1 flex-col items-center justify-center gap-0.5 rounded-3xl py-1.5 text-[10px] font-bold text-white/50 transition"
            >
              <span
                className={clsx(
                  "flex h-11 w-11 items-center justify-center rounded-full transition",
                  active && "bg-gradient-to-br from-primary to-secondary"
                )}
              >
                <IconComponent sx={{ fontSize: 26 }} className={active ? "text-white" : "text-white/50"} />
              </span>
              <span className={active ? "text-white" : "text-white/50"}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
