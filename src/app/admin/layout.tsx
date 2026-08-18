"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { LayoutDashboard, ListChecks, Users2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { RequireAuth } from "@/components/RequireAuth";

const TABS = [
  { href: "/admin", label: "Umumiy ko'rinish", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Foydalanuvchilar", icon: Users2, exact: false },
  { href: "/admin/quiz", label: "Test savollari", icon: ListChecks, exact: false },
  { href: "/admin/results", label: "Natijalar", icon: ListChecks, exact: false },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <RequireAuth adminOnly>
      <div className="flex min-h-full flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">
            {TABS.map((tab) => {
              const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={clsx(
                    "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3.5 py-3.5 text-sm font-medium transition-colors",
                    active
                      ? "border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  )}
                >
                  <tab.icon size={15} />
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
        <main className="animate-fade-in mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          {children}
        </main>
      </div>
    </RequireAuth>
  );
}
