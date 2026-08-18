"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { apiDeleteFeedback, apiGetAdminFeedback, type AdminFeedbackItem } from "@/lib/store";
import { formatDateTime } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/context";

export default function AdminFeedbackPage() {
  const { t, language } = useLanguage();
  const [items, setItems] = useState<AdminFeedbackItem[]>([]);

  function reload() {
    apiGetAdminFeedback().then(setItems);
  }

  useEffect(reload, []);

  async function handleDelete(id: string) {
    if (!window.confirm(t.adminFeedback.deleteConfirm)) return;
    try {
      await apiDeleteFeedback(id);
      reload();
    } catch {
      window.alert(t.adminFeedback.deleteError);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.adminFeedback.title}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.adminFeedback.subtitle}</p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:bg-slate-900 dark:text-slate-500">
              <tr>
                <th className="px-5 py-3">{t.adminFeedback.colUser}</th>
                <th className="px-5 py-3">{t.adminFeedback.colMessage}</th>
                <th className="px-5 py-3">{t.adminFeedback.colSource}</th>
                <th className="px-5 py-3">{t.adminFeedback.colDate}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((f) => (
                <tr key={f.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                    {f.userFirstName ? (
                      <>
                        {f.userFirstName} {f.userLastName}
                        <div className="text-xs font-normal text-slate-400 dark:text-slate-500">{f.userEmail}</div>
                      </>
                    ) : (
                      t.adminFeedback.anonymous
                    )}
                  </td>
                  <td className="max-w-md px-5 py-3 whitespace-pre-line text-slate-600 dark:text-slate-300">
                    {f.message}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={f.source === "bot" ? "blue" : "slate"}>
                      {f.source === "bot" ? t.adminFeedback.sourceBot : t.adminFeedback.sourceSite}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                    {formatDateTime(f.createdAt, language)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleDelete(f.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                      title={t.adminFeedback.deleteTitle}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400 dark:text-slate-500">
                    {t.adminFeedback.empty}
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
