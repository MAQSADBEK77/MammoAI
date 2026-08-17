"use client";

import { useEffect, useState } from "react";
import { Search, ShieldCheck, Trash2 } from "lucide-react";
import { Badge, Card, Input } from "@/components/ui";
import { RiskBadge } from "@/components/RiskBadge";
import { deleteUser, getLatestAttemptForUser, getUsers } from "@/lib/store";
import type { User } from "@/lib/types";
import { formatDate } from "@/lib/format";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setUsers(getUsers());
  }, []);

  function handleDelete(id: string) {
    if (!window.confirm("Ushbu foydalanuvchini va uning test natijalarini o'chirmoqchimisiz?")) {
      return;
    }
    deleteUser(id);
    setUsers(getUsers());
  }

  const q = query.trim().toLowerCase();
  const filtered = users.filter((u) => {
    if (!q) return true;
    return (
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.passportSeries.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Foydalanuvchilar</h1>
          <p className="mt-1 text-sm text-slate-500">
            Ro&apos;yxatdan o&apos;tgan barcha foydalanuvchilarning shaxsiy ma&apos;lumotlari.
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ism, email yoki passport bo'yicha qidirish"
            className="pl-9"
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3">F.I.O.</th>
                <th className="px-5 py-3">Email / Telefon</th>
                <th className="px-5 py-3">Tug&apos;ilgan sana</th>
                <th className="px-5 py-3">Passport seriya</th>
                <th className="px-5 py-3">Ro&apos;yxatdan o&apos;tgan</th>
                <th className="px-5 py-3">So&apos;nggi xavf</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u) => {
                const latest = getLatestAttemptForUser(u.id);
                return (
                  <tr key={u.id}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 font-medium text-slate-900">
                        {u.firstName} {u.lastName}
                        {u.role === "admin" && (
                          <Badge tone="blue">
                            <ShieldCheck size={11} className="mr-1 inline" />
                            Admin
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      <div>{u.email}</div>
                      {u.phone && <div className="text-xs text-slate-400">{u.phone}</div>}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{formatDate(u.birthDate)}</td>
                    <td className="px-5 py-3 text-slate-600">{u.passportSeries}</td>
                    <td className="px-5 py-3 text-slate-600">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-3">
                      {latest ? <RiskBadge level={latest.riskLevel} size="sm" /> : (
                        <span className="text-xs text-slate-400">Topshirmagan</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {u.role !== "admin" && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                          title="O'chirish"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400">
                    Hech narsa topilmadi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
