"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function RequireAuth({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else if (adminOnly && user.role !== "admin") {
      router.replace("/");
    }
  }, [loading, user, adminOnly, router]);

  if (loading || !user || (adminOnly && user.role !== "admin")) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-400">
        Yuklanmoqda...
      </div>
    );
  }

  return <>{children}</>;
}
