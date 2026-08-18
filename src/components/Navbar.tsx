"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { Activity, LayoutDashboard, LogOut, ShieldCheck, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useT } from "@/lib/i18n/context";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const t = useT();

  const LINKS = [
    { href: "/test", label: t.nav.test, public: false },
    { href: "/qollanma", label: t.nav.guide, public: true },
    { href: "/profile", label: t.nav.profile, public: false },
  ];

  return (
    <header className="print:hidden sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-md shadow-blue-900/20">
            <Activity size={18} className="text-white" strokeWidth={2.25} />
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            MammoAI
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {LINKS.filter((link) => link.public || user).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                )}
              >
                {link.label}
              </Link>
            ))}
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className={clsx(
                "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/admin")
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              )}
            >
              <ShieldCheck size={15} />
              {t.nav.admin}
            </Link>
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          {user ? (
            <>
              <Link
                href="/profile"
                className="hidden items-center gap-1.5 text-sm font-medium text-slate-600 sm:flex dark:text-slate-300"
              >
                <UserIcon size={15} />
                {user.firstName}
              </Link>
              <button
                onClick={async () => {
                  await logout();
                  router.push("/");
                }}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-red-600 cursor-pointer dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-red-400"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">{t.nav.logout}</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 sm:px-3.5 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {t.nav.login}
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 px-3 py-2 text-sm font-semibold text-white shadow-md shadow-blue-900/20 hover:from-blue-600 hover:to-blue-800 sm:px-4"
              >
                <LayoutDashboard size={15} className="hidden sm:inline" />
                {t.nav.signup}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
