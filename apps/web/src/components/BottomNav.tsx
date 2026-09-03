"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Baby, ListChecks, Users, MapPin, User } from "lucide-react";
import clsx from "clsx";
import { goalToLandingTab } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";

export function BottomNav() {
  const pathname = usePathname();
  const { dict } = useI18n();
  const { onboardingProfile } = useSession();
  // Homiladorlik rejimida "Tsikl" tabi keraksiz — Homiladorlik alohida bor.
  const isPregnancyMode = onboardingProfile ? goalToLandingTab(onboardingProfile.primaryGoal) === "pregnancy" : false;

  const items = [
    !isPregnancyMode && { href: "/tsikl", label: dict.nav.cycle, icon: Calendar },
    { href: "/jamiyat", label: dict.nav.community, icon: Users },
    { href: "/homiladorlik", label: dict.nav.pregnancy, icon: Baby },
    { href: "/tekshiruvlar", label: dict.nav.checklist, icon: ListChecks },
    { href: "/klinikalar", label: dict.nav.clinics, icon: MapPin },
    { href: "/profil", label: dict.nav.profile, icon: User },
  ].filter((item): item is { href: string; label: string; icon: typeof Calendar } => Boolean(item));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+12px)]">
      <div className="bg-aurora-nav flex w-full max-w-md items-stretch justify-between gap-1 rounded-[32px] px-2 py-2 shadow-2xl shadow-black/30">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="tap-target flex flex-1 flex-col items-center justify-center gap-0.5 rounded-3xl py-1.5 text-[10px] font-bold text-white/50 transition"
            >
              <span
                className={clsx(
                  "flex h-10 w-10 items-center justify-center rounded-full transition",
                  active && "bg-gradient-to-br from-primary to-secondary"
                )}
              >
                <Icon size={20} strokeWidth={active ? 2.4 : 2} className={active ? "text-white" : "text-white/50"} />
              </span>
              <span className={active ? "text-white" : "text-white/50"}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
