"use client";

/**
 * PRICE-SIGNAL-01 — paywallda narxni KO'RSATADIGAN va javob so'raydigan blok.
 *
 * Nega kerak: productionda paywall uchta joyda ishlaydi, lekin narx hech
 * qayerda yozilmagan va to'lash yo'li yo'q. Ayol "Premium kerak" degan
 * yozuvni ko'radi, nima qilishni bilmaydi va chiqib ketadi. Yagona yozilgan
 * so'rov matni shunday edi: "Premium kk".
 *
 * Nega SOTUV emas, SO'ROV: Payme/Click integratsiyasi yuridik shaxs va
 * merchant shartnomasi talab qiladi — hali yo'q. Shuning uchun bu blok
 * hech narsa va'da qilmaydi va buni OCHIQ yozadi. Tugma "sotib olish"
 * emas: savol "qaysi narx sizga mos keladi?".
 *
 * Nega BITTA bosish: har qo'shimcha qadam javob berganlar sonini kamaytiradi,
 * ya'ni o'lchovni yomonlashtiradi. Tanlovning o'zi — javob.
 *
 * "Qimmat" varianti qolgan ikkitasi bilan BIR XIL ko'rinishda turadi va
 * yashirilmaydi: maqsad rozilik yig'ish emas, HAQIQATNI bilish. Agar u
 * kichikroq yoki pastroq qilib qo'yilsa, o'lchov o'z-o'zini aldagan bo'lardi.
 */

import { useCallback, useEffect, useState } from "react";
import { CheckRounded } from "@mui/icons-material";
import {
  PREMIUM_MONTHLY_UZS,
  PREMIUM_YEARLY_UZS,
  formatUzs,
  yearlySavingsPercent,
  type PremiumInterestChoice,
  type PremiumInterestSource,
} from "@mammoai/shared";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export function PremiumPricing({ source }: { source: PremiumInterestSource }) {
  const { dict } = useI18n();
  const [choice, setChoice] = useState<PremiumInterestChoice | null>(null);
  const [sending, setSending] = useState(false);
  const [reopened, setReopened] = useState(false);

  useEffect(() => {
    let alive = true;
    api.premium
      .getInterest()
      .then((res) => {
        if (alive) setChoice(res.choice);
      })
      .catch(() => {
        // O'qib bo'lmasa narx baribir ko'rsatiladi — bu blokning asosiy ishi.
      });
    return () => {
      alive = false;
    };
  }, []);

  const answer = useCallback(
    async (next: PremiumInterestChoice) => {
      setSending(true);
      try {
        await api.premium.setInterest({ choice: next, source });
        setChoice(next);
        setReopened(false);
      } catch {
        // Jimgina o'tkazib yuboriladi: bu o'lchov, ayolning vazifasi emas —
        // xato oynasi chiqarib uni bezovta qilishning ma'nosi yo'q.
      } finally {
        setSending(false);
      }
    },
    [source]
  );

  if (choice !== null && !reopened) {
    return (
      <div className="flex w-full flex-col items-center gap-1.5 text-center">
        <CheckRounded sx={{ fontSize: 20 }} className="text-text-primary" />
        <p className="text-sm text-text-primary">
          {choice === "too_expensive" ? dict.pricing.thanksTooExpensive : dict.pricing.thanksAccepted}
        </p>
        <button
          type="button"
          onClick={() => setReopened(true)}
          className="text-xs font-semibold text-text-secondary underline"
        >
          {dict.pricing.changeAnswer}
        </button>
      </div>
    );
  }

  const savings = yearlySavingsPercent();

  return (
    <div className="flex w-full flex-col gap-2.5">
      <h3 className="text-center text-sm font-bold text-text-primary">{dict.pricing.question}</h3>

      <div className="grid grid-cols-2 gap-2">
        <PlanTile
          label={dict.pricing.monthlyLabel}
          amount={dict.pricing.amount(formatUzs(PREMIUM_MONTHLY_UZS))}
          unit={dict.pricing.perMonth}
          disabled={sending}
          onClick={() => answer("monthly")}
        />
        <PlanTile
          label={dict.pricing.yearlyLabel}
          amount={dict.pricing.amount(formatUzs(PREMIUM_YEARLY_UZS))}
          unit={dict.pricing.perYear}
          badge={savings > 0 ? dict.pricing.savingsBadge(savings) : undefined}
          disabled={sending}
          onClick={() => answer("yearly")}
        />
      </div>

      <button
        type="button"
        disabled={sending}
        onClick={() => answer("too_expensive")}
        className="border-border text-text-secondary rounded-2xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
      >
        {dict.pricing.tooExpensive}
      </button>

      <p className="text-center text-xs leading-relaxed text-text-secondary">{dict.pricing.honestNote}</p>
    </div>
  );
}

function PlanTile({
  label,
  amount,
  unit,
  badge,
  disabled,
  onClick,
}: {
  label: string;
  amount: string;
  unit: string;
  badge?: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="bg-surface-muted tap-target flex flex-col items-center gap-0.5 rounded-[22px] p-3 text-center transition active:scale-[0.98] disabled:opacity-50"
    >
      <span className="text-xs font-semibold text-text-secondary">{label}</span>
      <span className="text-base font-bold text-text-primary">{amount}</span>
      <span className="text-xs text-text-secondary">{unit}</span>
      {/* Joy band qilib turadi: badge faqat bitta kartada bor, lekin
          ikkalasining balandligi bir xil qolishi kerak. */}
      <span className="text-xs font-semibold text-text-primary">{badge ?? "\u00A0"}</span>
    </button>
  );
}
