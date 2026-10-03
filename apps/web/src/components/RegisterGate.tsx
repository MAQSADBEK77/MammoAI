"use client";

import { useRouter } from "next/navigation";
import { LockOutlined } from "@mui/icons-material";
import { canUseFeature, type GatedFeature } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { Button, Card } from "@/components/ui";

/**
 * AUTH-05 — hisob talab qiladigan funksiya uchun qulf.
 *
 * Ilova ANONIM ishlatiladi: ayol hech narsa aytmasdan kiradi va siklini
 * belgilaydi. Ayrim funksiyalar esa hisob talab qiladi — ular pul turadi
 * (AI yordamchi), javobgarlik talab qiladi (jamiyatga yozish) yoki
 * tashqi kanalga bog'langan (eslatma, hamkor).
 *
 * MUHIM: bu komponent HIMOYA EMAS, tushuntirish. Haqiqiy qulf serverda
 * (`requireRegisteredUser`) — bu yerdagisi faqat ayol devorga urilib
 * "nega ishlamadi?" deb qolmasligi uchun.
 *
 * Sabab har bir funksiya uchun ALOHIDA yoziladi: "ro'yxatdan o'ting"
 * degan quruq talab ishonchni kamaytiradi, "nega" esa oshiradi.
 */
export function RegisterGate({ feature, children }: { feature: GatedFeature; children: React.ReactNode }) {
  const { dict } = useI18n();
  const { user } = useSession();
  const router = useRouter();

  if (canUseFeature(feature, user)) return <>{children}</>;

  const t = dict.registerGate;
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-muted">
          <LockOutlined sx={{ fontSize: 20 }} className="text-text-secondary" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-text-primary">{t.title}</p>
          <p className="mt-0.5 text-sm text-text-secondary">{t.reasons[feature]}</p>
        </div>
      </div>
      <Button onClick={() => router.push("/kirish")} className="w-full">
        {t.action}
      </Button>
      {/* Qolgan hamma narsa ochiqligini aytib qo'yish shart — aks holda
          qulf "ilova yopildi" degan taassurot qoldiradi. */}
      <p className="text-xs text-text-tertiary">{t.note}</p>
    </Card>
  );
}
