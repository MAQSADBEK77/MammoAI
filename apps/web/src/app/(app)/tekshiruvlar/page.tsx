"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ChecklistItem } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Badge, Button, Card, ScreenHeader } from "@/components/ui";

export default function ChecklistPage() {
  const { dict } = useI18n();
  const router = useRouter();
  const [items, setItems] = useState<ChecklistItem[] | null>(null);

  useEffect(() => {
    api.checklist.list().then(setItems);
  }, []);

  if (!items) return <p className="text-text-secondary">{dict.common.loading}</p>;

  async function complete(id: string) {
    setItems(await api.checklist.complete(id));
  }

  const statusTone = { pending: "muted", done: "success", overdue: "danger" } as const;
  const statusLabel = {
    pending: dict.checklist.statusPending,
    done: dict.checklist.statusDone,
    overdue: dict.checklist.statusOverdue,
  } as const;

  return (
    <div className="space-y-4 pb-6">
      <ScreenHeader title={dict.checklist.title} />

      <button onClick={() => router.push("/xavf-testi")} className="block w-full text-left">
        <Card>
          <p className="font-semibold text-text-primary">{dict.checklist.riskQuizCardTitle}</p>
        </Card>
      </button>

      {items.length === 0 && <p className="text-text-secondary">—</p>}

      {items.map((item) => {
        const info = dict.checklist.items[item.type];
        return (
          <Card key={item.id} className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-text-primary">{info.title}</p>
              <div className="flex flex-col items-end gap-1">
                <Badge tone={statusTone[item.status]}>{statusLabel[item.status]}</Badge>
                <Badge tone={item.isFree ? "success" : "warning"}>{item.isFree ? dict.common.free : dict.common.paid}</Badge>
              </div>
            </div>
            <p className="text-sm text-text-secondary">{info.why}</p>
            {item.dueDate && item.status !== "done" && (
              <p className="text-xs text-text-muted">{item.dueDate}</p>
            )}
            {item.status !== "done" && (
              <div className="flex gap-2 pt-1">
                <Button variant="secondary" onClick={() => complete(item.id)}>
                  {dict.checklist.markDoneButton}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => router.push(`/klinikalar?checklistItemId=${item.id}`)}
                >
                  {dict.checklist.findClinicButton}
                </Button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
