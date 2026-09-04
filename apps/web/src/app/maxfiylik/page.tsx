"use client";

import { useI18n } from "@/lib/i18n";
import { Card, ScreenHeader } from "@/components/ui";

/**
 * Maxfiylik siyosati — App.pdf §3. Umumiy uslubdagi matn; loyiha jamoasi buni
 * yuridik jihatdan ko'rib chiqilgan to'liq matn bilan almashtirishi tavsiya etiladi.
 */
export default function PrivacyPolicyPage() {
  const { dict } = useI18n();

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <ScreenHeader title={dict.privacy.title} />
      <Card className="space-y-4 text-sm leading-relaxed text-text-secondary">
        <p>{dict.privacy.body}</p>
        <p>{dict.privacy.dataCollected}</p>
        <p>{dict.privacy.noSelling}</p>
        <p>{dict.privacy.accountSecurity}</p>
        <p>{dict.privacy.medicalDisclaimer}</p>
        <p>{dict.privacy.notForChildren}</p>
        <p>{dict.privacy.deletion}</p>
        <p>{dict.privacy.operator}</p>
        <p>{dict.privacy.contact}</p>
      </Card>
    </div>
  );
}
