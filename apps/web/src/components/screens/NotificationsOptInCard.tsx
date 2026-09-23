"use client";

import { useState } from "react";
import { NotificationsActiveOutlined } from "@mui/icons-material";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { Button, Card } from "@/components/ui";

/**
 * NOTIF-02 — eslatmalarni yoqish taklifi.
 *
 * Nega kerak: NOTIF-01 xatosi tufayli ~100 ayol, Telegram'i bog'langan
 * bo'lishiga qaramay, `notificationsEnabled = false` holatida qolib
 * ketgan — ular "Yoqish"ni bosgan bo'lsa ham, brauzer ruxsati
 * yiqilgani uchun jimgina o'chirilgan edi.
 *
 * NEGA OMMAVIY YOQIB QO'YILMADI: kim xatolik qurboni bo'lgan-u, kim
 * haqiqatan rad etgan — bazadan ajratib bo'lmaydi. Rozilik masalasida
 * taxmin qilish noto'g'ri, ayniqsa sog'liq ilovasida. Shuning uchun
 * tanlov ayolning O'ZIGA qaytariladi.
 *
 * Bir marta ko'rsatiladi: "Keyinroq" deyilsa boshqa bezovta qilmaydi
 * (PROMPT-FREQ-01 dagi kabi `localStorage`, ya'ni qayta yuklash va
 * ilovani yopib-ochishdan omon qoladi).
 */
const DISMISS_KEY = "mammoai_notif_optin_dismissed";

export function NotificationsOptInCard() {
  const { dict } = useI18n();
  const { user, refresh } = useSession();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) !== null;
    } catch {
      // Xotira bloklangan — kartani ko'rsatmaymiz: "Keyinroq" tanlovini
      // eslab qololmasak, har safar takrorlagandan ko'ra jim turgan
      // yaxshiroq.
      return true;
    }
  });
  const [saving, setSaving] = useState(false);

  if (!user || user.notificationsEnabled || dismissed) return null;

  function close() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Eslab qololmadik — bu safar baribir yopiladi.
    }
  }

  async function enable() {
    setSaving(true);
    try {
      await api.me.update({ notificationsEnabled: true });
      await refresh();
      close();
    } catch {
      // Saqlanmadi — kartani yopmaymiz, ayol qayta urinib ko'ra oladi.
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span className="bg-aurora-cycle flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
          <NotificationsActiveOutlined sx={{ fontSize: 20 }} className="text-white" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-text-primary">{dict.notificationsOptIn.title}</p>
          <p className="mt-0.5 text-sm text-text-secondary">{dict.notificationsOptIn.body}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={enable} disabled={saving} className="flex-1">
          {dict.notificationsOptIn.enable}
        </Button>
        <Button variant="ghost" onClick={close} disabled={saving}>
          {dict.notificationsOptIn.later}
        </Button>
      </div>
    </Card>
  );
}
