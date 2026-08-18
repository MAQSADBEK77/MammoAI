"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { apiGetAuditLog, type AuditLogEntry } from "@/lib/store";
import { formatDateTime } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/context";

export default function AdminAuditPage() {
  const { t, language } = useLanguage();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    apiGetAuditLog().then(setEntries);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.adminAudit.title}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.adminAudit.subtitle}</p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:bg-slate-900 dark:text-slate-500">
              <tr>
                <th className="px-5 py-3">{t.adminAudit.colDate}</th>
                <th className="px-5 py-3">{t.adminAudit.colAdmin}</th>
                <th className="px-5 py-3">{t.adminAudit.colAction}</th>
                <th className="px-5 py-3">{t.adminAudit.colTarget}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {entries.map((e) => (
                <tr key={e.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-5 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                    {formatDateTime(e.createdAt, language)}
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{e.adminName}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">{e.action}</code>
                  </td>
                  <td className="max-w-md px-5 py-3 truncate text-slate-500 dark:text-slate-400">{e.target}</td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-400 dark:text-slate-500">
                    {t.adminAudit.empty}
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
