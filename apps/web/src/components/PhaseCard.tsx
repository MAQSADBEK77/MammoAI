"use client";

import type { CyclePhase } from "@mammoai/shared";
import { getFertilityLevel, CYCLE_PHASE_EMOJI, colors } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { Emoji } from "@/components/Emoji";

// Joriy tsikl fazasi kartasi — App.pdf'dan keyin, Figma "Make" manbasida topilgan
// haqiqiy dizayn elementi asosida ("Follikul fazasi", "UNUMDOR DAVR" kabi). Har bir
// faza o'ziga xos rangda (menstrual=primary, follicular=secondary, ovulation=accent,
// luteal=warning) gradient fon bilan ko'rsatiladi — manba bundle'ida topilgan
// `linear-gradient(135deg, color 0%, colorBB 100%)` naqshiga asoslangan.
// DIQQAT: luteal aslida "success" (yashil) edi — accent (moviy-yashil) bilan
// deyarli farqlanmasdi (foydalanuvchi kalendarda ikkalasini ajrata olmadi),
// shuning uchun aniq farqlanadigan "warning" (oltin) rangiga o'zgartirildi.

const PHASE_COLOR: Record<CyclePhase, string> = {
  menstrual: colors.primary,
  follicular: colors.secondary,
  ovulation: colors.accent,
  luteal: colors.warning,
};

export function PhaseCard({ phase }: { phase: CyclePhase }) {
  const { dict } = useI18n();
  const color = PHASE_COLOR[phase];
  const fertility = getFertilityLevel(phase);
  const copy = dict.cyclePhase[phase];

  return (
    // TODAY-12 (foydalanuvchi so'rovi: "asosiydagi design moslash kerak"):
    // ilgari bu karta TO'YINGAN gradient fon + oq matn edi. Oq varaq ichida
    // (kun tafsilotlari oynasida) u og'ir, begona blok bo'lib ko'rinardi va
    // ilovaning qolgan qismidagi yengil, yumshoq uslubga mos kelmasdi.
    //
    // Endi u ham ilovaning o'z tilida: faza rangi FON sifatida emas, YENGIL
    // qatlam (10%) va urg'u rangi sifatida ishlatiladi; matn esa odatdagi
    // qora. Faza baribir rang orqali darhol tanilib turadi.
    <div
      className="rounded-3xl p-5"
      style={{ background: `color-mix(in srgb, ${color} 10%, var(--color-surface))` }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-lg font-bold text-text-primary">
          <Emoji e={CYCLE_PHASE_EMOJI[phase]} /> {copy.name}
        </p>
        <span
          className="rounded-full px-3 py-1 text-xs font-bold"
          style={{ background: `color-mix(in srgb, ${color} 18%, var(--color-surface))`, color }}
        >
          {dict.cyclePhase.fertilityLabel}: {dict.cyclePhase.fertilityLevels[fertility]}
        </span>
      </div>
      <p className="mt-2.5 text-sm leading-relaxed text-text-secondary">{copy.description}</p>
    </div>
  );
}
