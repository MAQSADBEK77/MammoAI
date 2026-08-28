"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Baby, ListChecks, MapPin, User } from "lucide-react";
import clsx from "clsx";
import { useI18n } from "@/lib/i18n";

export function BottomNav() {
  const pathname = usePathname();
  const { dict } = useI18n();

  const items = [
    { href: "/tsikl", label: dict.nav.cycle, icon: Calendar },
    { href: "/homiladorlik", label: dict.nav.pregnancy, icon: Baby },
    { href: "/tekshiruvlar", label: dict.nav.checklist, icon: ListChecks },
    { href: "/klinikalar", label: dict.nav.clinics, icon: MapPin },
    { href: "/profil", label: dict.nav.profile, icon: User },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-2xl items-stretch justify-between px-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "tap-target flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium",
                active ? "text-primary" : "text-text-muted"
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.4 : 2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
