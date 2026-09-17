"use client";

// WEB3-16: `apps/web/src/app/` bo'ylab error.tsx/not-found.tsx/global-error.tsx
// UMUMAN yo'q edi — endi ochiq marketing sayt (Median/Telegram orqali ham
// ochiladigan) bo'lgani uchun noto'g'ri havola Next.js'ning standart
// (brendlanmagan, oq-qora) sahifasini ko'rsatardi. Bu — noto'g'ri
// manzil (masalan yozib xato qilingan link) uchun ilovaning o'z dizayni
// bilan mos, brendlangan 404 sahifasi.
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui";

export default function NotFound() {
  const { dict } = useI18n();
  const l = dict.errorPages;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <span className="text-6xl font-extrabold text-primary/30">404</span>
      <h1 className="text-xl font-bold text-text-primary">{l.notFoundTitle}</h1>
      <p className="max-w-sm text-sm text-text-secondary">{l.notFoundBody}</p>
      <Link href="/">
        <Button>{l.goHomeButton}</Button>
      </Link>
    </div>
  );
}
