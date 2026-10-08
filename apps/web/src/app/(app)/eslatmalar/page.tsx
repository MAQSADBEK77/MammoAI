"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NotificationsActiveOutlined } from "@mui/icons-material";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { Button, Card, LoadingSpinner, ScreenHeader } from "@/components/ui";

/**
 * NOTIF-REENABLE-01 — "eslatmalarni qaytarish" sahifasi.
 *
 * Nega kerak: productionda 119 ayolning Telegram'i bog'langan, lekin
 * bildirishnomasi O'CHIRILGAN. Bu eski xatoning izi — rozilik brauzer
 * ruxsatiga bog'langan edi va ruxsat yiqilsa, ayol "Yoqish"ni bossa ham
 * jimgina o'chirilgan holatda qolardi (NOTIF-01). Onboarding tomoni
 * tuzatildi, lekin ESKI hisoblar o'z holicha qoldi.
 *
 * Ularga ilovadagi karta yetib bormaydi: ilovani ochmasa, ko'rmaydi.
 * Shuning uchun bot xabaridagi tugma to'g'ridan shu sahifani ochadi.
 *
 * Tugmani bosish — rozilikning O'ZI, shuning uchun sahifa ochilishi bilan
 * yoqadi. Agar bu xato bo'lsa, shu yerdayoq bitta bosishda qaytariladi.
 */
export default function EnableRemindersPage() {
  const { dict } = useI18n();
  const { user, refresh } = useSession();
  const router = useRouter();
  const [state, setState] = useState<"working" | "done" | "error">("working");
  const [undoing, setUndoing] = useState(false);

  const enable = useCallback(async () => {
    setState("working");
    try {
      await api.me.update({ notificationsEnabled: true });
      await refresh();
      setState("done");
    } catch {
      setState("error");
    }
  }, [refresh]);

  useEffect(() => {
    const timeout = setTimeout(enable, 0);
    return () => clearTimeout(timeout);
  }, [enable]);

  const t = dict.enableReminders;

  return (
    <div className="space-y-4">
      <ScreenHeader title={t.title} />
      <Card className="flex flex-col items-center gap-3 py-8 text-center">
        {state === "working" && <LoadingSpinner label={dict.common.loading} inline />}

        {state === "done" && (
          <>
            <span className="bg-aurora-cycle flex h-14 w-14 items-center justify-center rounded-full">
              <NotificationsActiveOutlined sx={{ fontSize: 26 }} className="text-white" />
            </span>
            <p className="text-lg font-bold text-text-primary">{t.doneTitle}</p>
            <p className="max-w-sm text-sm leading-relaxed text-text-secondary">{t.doneBody}</p>
            <Button className="mt-2 w-full" onClick={() => router.replace("/asosiy")}>
              {t.continueButton}
            </Button>
            {/* Adashib bosgan bo'lsa — shu yerdayoq qaytaradi, profilni
                qidirib yurmasdan. */}
            <button
              type="button"
              disabled={undoing || !user?.notificationsEnabled}
              onClick={async () => {
                setUndoing(true);
                try {
                  await api.me.update({ notificationsEnabled: false });
                  await refresh();
                  router.replace("/asosiy");
                } finally {
                  setUndoing(false);
                }
              }}
              className="text-sm font-semibold text-text-secondary underline-offset-2 hover:underline disabled:opacity-50"
            >
              {t.undo}
            </button>
          </>
        )}

        {state === "error" && (
          <>
            <p className="text-sm font-medium text-danger">{dict.common.errorGeneric}</p>
            <Button onClick={enable}>{dict.common.retryButton}</Button>
          </>
        )}
      </Card>
    </div>
  );
}
