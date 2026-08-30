"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { adminApi } from "@/lib/admin-api";
import { LoadingSpinner } from "@/components/ui";

const NAV_ITEMS: { href: string; label: string; icon: string; exact?: boolean }[] = [
  { href: "/admin", label: "Boshqaruv paneli", icon: "📊", exact: true },
  { href: "/admin/users", label: "Foydalanuvchilar", icon: "👥" },
  { href: "/admin/clinics", label: "Klinikalar", icon: "🏥" },
  { href: "/admin/articles", label: "Maqolalar", icon: "📰" },
];

/** Admin sessiyasini tekshiradi va sidebar+asosiy joylashuvni chizadi. Sessiya
 * bo'lmasa /admin/login'ga yo'naltiradi — login sahifasining o'zi bu shell'dan
 * tashqarida (App Router segment guruhi), shu sababli qaytadan tekshirilmaydi. */
export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<"checking" | "ok">("checking");

  useEffect(() => {
    let cancelled = false;
    adminApi
      .me()
      .then(() => {
        if (!cancelled) setStatus("ok");
      })
      .catch(() => {
        if (!cancelled) router.replace("/admin/login");
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleLogout() {
    try {
      await adminApi.logout();
    } finally {
      router.replace("/admin/login");
    }
  }

  if (status === "checking") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <LoadingSpinner label="Sessiya tekshirilmoqda…" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="flex w-64 shrink-0 flex-col bg-nav px-4 py-6">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-lg shadow-md shadow-primary/30">
            🛡️
          </div>
          <div>
            <div className="text-sm font-bold leading-tight text-white">MammoAI</div>
            <div className="text-[11px] leading-tight text-white/50">Admin panel</div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition",
                  active ? "bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-primary/25" : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <span className="text-base leading-none">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="tap-target flex items-center gap-3 rounded-2xl px-3.5 text-sm font-semibold text-white/60 transition hover:bg-white/5 hover:text-white"
        >
          <span className="text-base leading-none">🚪</span>
          Chiqish
        </button>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto px-8 py-8">{children}</main>
    </div>
  );
}
