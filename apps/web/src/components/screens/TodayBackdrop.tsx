"use client";

import clsx from "clsx";
import { CheckOutlined } from "@mui/icons-material";
import type { CyclePhase } from "@mammoai/shared";

/**
 * TODAY-06 — "Bugun" ekranining foni.
 *
 * Uch marta taxminga tayanib xato qilganimdan keyin, referens skrinshotdagi
 * piksel ranglari haqiqatan O'LCHAB olindi. O'lchov shuni ko'rsatdi:
 *   • gorizontal farq vertikaldan KUCHLIROQ (bir xil balandlikda chapdan
 *     o'ngga #FEEEF1 → #FDBBC9) — ya'ni asosiy qatlam DIAGONAL gradient;
 *   • ekran markazida OCHIQ maydon bor (y≈1000 qatori butun kenglik bo'ylab
 *     #FFE0E6, undan yuqori va pastdagidan ochiqroq) — ya'ni ustidagi
 *     shakllar fonni TO'YINTIRMAYDI, aksincha YORITADI.
 * Ikkalasi ham `.today-backdrop` da (globals.css).
 *
 * Bu yerdagi shakllar esa harakat uchun: ular ham OCHIQ (fon rangida,
 * shaffoflik bilan), shuning uchun sekin suzganda ekran bo'ylab yumshoq
 * yorug'lik oqimi hosil bo'ladi — referensdagi yoy-chiziqlar shundan.
 *
 * TODAY-08 (foydalanuvchi so'rovi, referens bilan): rang endi REJIMGA emas,
 * ayolning HOZIRGI FAZASIGA ergashadi — hayz kunlari pushti, undan keyingi
 * kunlar iliq sariq, va hokazo. Referensda ham aynan shunday: "Period in 6
 * days" ekrani shaftoli-sariq, hayz kunlari esa pushti.
 *
 * Ranglar PhaseCard bilan BIR XIL manbadan (menstrual=primary,
 * follicular=secondary, ovulation=accent, luteal=warning) — bir faza ilovaning
 * turli joylarida turli rangda ko'rinmasligi uchun.
 *
 * `phase` berilmasa (homiladorlik/perimenopauza rejimi yoki ma'lumot yo'q)
 * avvalgidek `--color-primary`ga qaytadi, ya'ni fon REJIM rangini oladi.
 */
const PHASE_TINT: Record<CyclePhase, string> = {
  menstrual: "var(--color-primary)",
  follicular: "var(--color-secondary)",
  ovulation: "var(--color-accent)",
  luteal: "var(--color-warning)",
};

export function TodayBackdrop({ phase }: { phase?: CyclePhase | null }) {
  // CSS o'zgaruvchisi sifatida beriladi: gradient globals.css'da, shakllar esa
  // shu yerda — ikkalasi BITTA qiymatdan oziqlanishi kerak.
  const tint = phase ? PHASE_TINT[phase] : undefined;
  const shade = (pct: number) => `color-mix(in srgb, var(--today-tint, var(--color-primary)) ${pct}%, transparent)`;

  return (
    <div
      aria-hidden
      style={tint ? ({ "--today-tint": tint } as React.CSSProperties) : undefined}
      className="today-backdrop pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* Markaziy yorug' maydon — "Day 6" atrofidagi ochiq soha. Eng yirik
          va eng sezilarli shakl. */}
      <span
        className="today-blob left-[-30%] top-[12%] h-[105vh] w-[105vh] bg-background/55"
        style={{ animationDuration: "34s", animationDelay: "-5s" }}
      />
      {/* Yuqori-chapdagi ikkinchi yorug'lik — referensda eng ochiq burchak
          aynan shu yer. */}
      <span
        className="today-blob left-[-45%] top-[-30%] h-[85vh] w-[85vh] bg-background/45"
        style={{ animationDuration: "47s", animationDelay: "-21s" }}
      />
      {/* Pastki-o'ngdagi YAGONA to'yintiruvchi shakl — o'sha burchak
          referensda eng to'q joy. */}
      <span
        className="today-blob bottom-[-35%] right-[-35%] h-[95vh] w-[95vh]"
        style={{ animationDuration: "41s", animationDelay: "-13s", background: shade(14) }}
      />
    </div>
  );
}

/**
 * Referens dizayndagi katta doira: ilova ochilganda "tahlil qilinmoqda", yozuv
 * saqlangandan keyin esa belgi bilan "bashoratlar yangilandi". Ikkalasi bitta
 * komponent — o'lcham va joylashuv bir xil bo'lishi kerak, aks holda holat
 * almashganda ekran sakrab ketardi.
 */
export function TodayStatusCircle({ label, done }: { label: string; done?: boolean }) {
  return (
    <div className="flex items-center justify-center py-8">
      <div
        className={clsx(
          "motion-breathe flex aspect-square w-[min(74vw,320px)] flex-col items-center justify-center gap-3 rounded-full px-8 text-center shadow-lg",
          done ? "bg-surface" : "bg-gradient-to-b from-primary/35 to-primary/20"
        )}
      >
        {done && <CheckOutlined sx={{ fontSize: 64 }} className="text-text-primary" />}
        <p className="text-lg font-semibold text-text-primary">{label}</p>
      </div>
    </div>
  );
}
