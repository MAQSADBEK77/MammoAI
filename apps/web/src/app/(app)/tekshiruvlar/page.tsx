"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ChecklistResponse } from "@mammoai/shared";
import { formatDateDisplay } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useIllustrations } from "@/lib/illustrations";
import { api } from "@/lib/api";
import { Badge, Button, Card, LoadingSpinner, ScreenHeader, StatTile } from "@/components/ui";
import { CheckCircleOutlined, AccessTimeOutlined, ErrorOutlineOutlined } from "@mui/icons-material";

const STATUS_ICON = { pending: AccessTimeOutlined, done: CheckCircleOutlined, overdue: ErrorOutlineOutlined } as const;
const STATUS_ICON_COLOR = { pending: "text-text-muted", done: "text-success", overdue: "text-danger" } as const;

export default function ChecklistPage() {
  const { dict } = useI18n();
  const { resolve } = useIllustrations();
  const router = useRouter();
  const [data, setData] = useState<ChecklistResponse | null>(null);

  useEffect(() => {
    api.checklist.list().then(setData);
  }, []);

  if (!data) return <LoadingSpinner label={dict.common.loading} />;
  const { readOnly, emptyReason, partnerName } = data;
  // FIX-UX-03: yangi UNIQUE indeks (db.ts) va ON CONFLICT (repo.ts) endi
  // YANGI dublikatlarning oldini oladi, lekin migratsiyadan oldin
  // yaratilgan eski dublikat qatorlar hali ba'zi hisoblarda qolgan bo'lishi
  // mumkin — himoya sifatida, bir xil `type`dan faqat ENG SO'NGGISINI
  // (createdAt bo'yicha) ko'rsatamiz, aks holda "buni qildimmi yoki
  // yo'qmi?" degan chalkashlik yuzaga kelardi.
  const items = Object.values(
    Object.fromEntries(
      [...data.items].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map((item) => [item.type, item])
    )
  );

  async function complete(id: string) {
    // FIX2-29: ilgari serverdan qaytgan BUTUN ro'yxat bilan almashtirilardi
    // — ikkita turli itemni tez ketma-ket "Bajardim" qilsangiz, javoblar
    // so'rov tartibida emas, TARMOQ tartibida qaytishi mumkin edi; sekinroq
    // javob keyinroq kelib, ikkinchi itemni vizual ravishda "bajarilmagan"ga
    // qaytarib qo'yardi. Endi faqat SHU itemning holati optimistik va
    // to'g'ridan-to'g'ri yangilanadi — serverning to'liq snapshot javobiga
    // umuman tayanilmaydi, shuning uchun boshqa itemning holati bilan
    // hech qachon to'qnashmaydi.
    const previousStatus = data?.items.find((item) => item.id === id)?.status;
    setData((prev) =>
      prev ? { ...prev, items: prev.items.map((item) => (item.id === id ? { ...item, status: "done", completedAt: new Date().toISOString() } : item)) } : prev
    );
    try {
      await api.checklist.complete(id);
    } catch {
      // So'rov muvaffaqiyatsiz bo'lsa — optimistik yangilanishni ortga qaytaramiz.
      setData((prev) =>
        prev && previousStatus
          ? { ...prev, items: prev.items.map((item) => (item.id === id ? { ...item, status: previousStatus, completedAt: null } : item)) }
          : prev
      );
    }
  }

  const statusTone = { pending: "muted", done: "success", overdue: "danger" } as const;
  const statusLabel = {
    pending: dict.checklist.statusPending,
    done: dict.checklist.statusDone,
    overdue: dict.checklist.statusOverdue,
  } as const;

  const doneCount = items.filter((i) => i.status === "done").length;
  const pendingCount = items.filter((i) => i.status === "pending").length;
  const overdueCount = items.filter((i) => i.status === "overdue").length;

  return (
    <div className="space-y-4 pb-6">
      <ScreenHeader title={readOnly && partnerName ? dict.checklist.partnerTitle(partnerName) : dict.checklist.title} />

      <div className="flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG, next/image optimizatsiyasi kerak emas */}
        <img src={resolve("screen.tekshiruvlar")} alt="" className="h-32 w-auto" />
      </div>

      {readOnly && emptyReason ? (
        <Card className="text-center text-sm text-text-secondary">
          {emptyReason === "not_linked" ? dict.checklist.partnerNotLinked : dict.checklist.partnerNotShared}
        </Card>
      ) : (
        <div className="animate-fade-in-up flex gap-2.5">
          <StatTile icon={<CheckCircleOutlined sx={{ fontSize: 16 }} />} label={statusLabel.done} value={String(doneCount)} tone="accent" active />
          <StatTile icon={<AccessTimeOutlined sx={{ fontSize: 16 }} />} label={statusLabel.pending} value={String(pendingCount)} tone="secondary" active />
          <StatTile icon={<ErrorOutlineOutlined sx={{ fontSize: 16 }} />} label={statusLabel.overdue} value={String(overdueCount)} tone="primary" active />
        </div>
      )}

      {/* O'z-o'zini tekshirish testi — faqat o'zining checklist'i uchun,
          hamkorining ro'yxatini ko'rayotganda ma'nosiz (bu shaxsiy xavf testi). */}
      {!readOnly && (
        <button onClick={() => router.push("/xavf-testi")} className="block w-full text-left">
          <Card interactive>
            <p className="font-semibold text-text-primary">{dict.checklist.riskQuizCardTitle}</p>
          </Card>
        </button>
      )}

      {!readOnly && items.length === 0 && <p className="text-text-secondary">—</p>}

      {items.map((item) => {
        const info = dict.checklist.items[item.type];
        const StatusIcon = STATUS_ICON[item.status];
        return (
          <Card key={item.id} className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <p className="flex items-start gap-2.5 font-semibold text-text-primary">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-current/10 ${STATUS_ICON_COLOR[item.status]}`}>
                  <StatusIcon sx={{ fontSize: 16 }} />
                </span>
                <span className="pt-1">{info.title}</span>
              </p>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <Badge tone={statusTone[item.status]}>{statusLabel[item.status]}</Badge>
                <Badge tone={item.isFree ? "success" : "warning"}>{item.isFree ? dict.common.free : dict.common.paid}</Badge>
              </div>
            </div>
            <p className="text-sm text-text-secondary">{info.why}</p>
            {item.dueDate && item.status !== "done" && (
              <p className="text-xs text-text-muted">{formatDateDisplay(item.dueDate)}</p>
            )}
            {!readOnly && item.status !== "done" && (
              <div className="flex gap-2 pt-1">
                <Button variant="secondary" onClick={() => complete(item.id)}>
                  {dict.checklist.markDoneButton}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => router.push(`/asosiy?checklistItemId=${item.id}`)}
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
