"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WorkspacePremiumRounded } from "@mui/icons-material";
import type { InsightsSummary, SymptomPattern } from "@mammoai/shared";
import { ApiError } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { ScreenHeader, LoadingSpinner, ErrorState, Card, Button } from "@/components/ui";
import { InsightsPanel } from "@/components/screens/InsightsPanel";
import { Emoji } from "@/components/Emoji";

/**
 * STATS-MOVE-01 — sikl statistikasi.
 *
 * Ilgari bu AI Yordamchi ekranining ichida, "Statistika" yorlig'ida
 * turardi. Sababi texnik edi, foydalanuvchi mantig'i emas: statistika
 * Premium, Yordamchi ham Premium edi — shuning uchun ikkalasi bir joyga
 * qo'yilgandi. Lekin ayol o'z siklining statistikasini SIKL sahifasidan
 * qidiradi, yordamchi bilan suhbatdan emas (foydalanuvchi shuni so'radi).
 *
 * Endi u Tsikl sahifasidan ochiladi, Yordamchi esa faqat suhbat.
 */
export function StatisticsScreen() {
  const { dict } = useI18n();
  const router = useRouter();
  const [data, setData] = useState<{ summary: InsightsSummary; patterns: SymptomPattern[]; aiInsight: string | null } | null>(null);
  // Premium emasligi XATO emas — bu kutilgan holat, shuning uchun alohida.
  const [needsPremium, setNeedsPremium] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(() => {
    setLoadError(false);
    setNeedsPremium(false);
    api.insights
      .get()
      .then(setData)
      .catch((err: unknown) => {
        // 402 — Premium talab qilinadi (paywall), boshqasi — haqiqiy xato.
        if (err instanceof ApiError && err.status === 402) setNeedsPremium(true);
        else setLoadError(true);
      });
  }, []);

  useEffect(() => {
    const timeout = setTimeout(load, 0);
    return () => clearTimeout(timeout);
  }, [load]);

  if (loadError) {
    return <ErrorState message={dict.common.errorGeneric} retry={{ label: dict.common.retryButton, onClick: load }} />;
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      <ScreenHeader title={dict.chat.statisticsTab} subtitle={dict.chat.statisticsSubtitle} />

      {needsPremium ? (
        <Card className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="bg-aurora-cycle flex h-14 w-14 items-center justify-center rounded-full">
            <WorkspacePremiumRounded sx={{ fontSize: 26 }} className="text-white" />
          </div>
          <h2 className="text-lg font-bold text-text-primary">{dict.chat.premiumTitle}</h2>
          <p className="max-w-sm text-sm text-text-secondary">{dict.chat.premiumBody}</p>
          <ul className="flex flex-col gap-1.5 self-start text-sm text-text-secondary">
            {[dict.chat.premiumBenefit1, dict.chat.premiumBenefit2, dict.chat.premiumBenefit3].map((b) => (
              <li key={b} className="flex items-center gap-2">
                <Emoji e="✨" size={14} />
                {b}
              </li>
            ))}
          </ul>
          <Button className="mt-2" onClick={() => router.push("/fikr?tema=premium")}>
            {dict.chat.premiumCta}
          </Button>
        </Card>
      ) : data ? (
        <InsightsPanel summary={data.summary} patterns={data.patterns} aiInsight={data.aiInsight} />
      ) : (
        <LoadingSpinner label={dict.common.loading} inline />
      )}
    </div>
  );
}
