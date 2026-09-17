"use client";

// WEB3-16: sahifa segmentida kutilmagan xato bo'lsa Next.js'ning standart
// (brendlanmagan) xato sahifasi o'rniga shu ko'rsatiladi. Root layout
// (I18nProvider va h.k.) hali ishlab turibdi — faqat SHU segment qulagan,
// shuning uchun `useI18n()`dan xavfsiz foydalanish mumkin (global-error.tsx'dan
// farqli, u yerda root layout'ning o'zi qulagan bo'ladi).
import { useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { dict } = useI18n();
  const l = dict.errorPages;

  useEffect(() => {
    // Kutilmagan xatoni kamida konsolga yozib qo'yamiz (alohida xato-kuzatuv
    // xizmati hali ulanmagan).
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <h1 className="text-xl font-bold text-text-primary">{l.appErrorTitle}</h1>
      <p className="max-w-sm text-sm text-text-secondary">{l.appErrorBody}</p>
      <Button onClick={reset}>{dict.common.retryButton}</Button>
    </div>
  );
}
