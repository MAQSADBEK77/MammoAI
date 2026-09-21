"use client";

import clsx from "clsx";
import { CheckOutlined } from "@mui/icons-material";

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
 * Rang `--color-primary` tokeniga bog'langan, ya'ni fon REJIMGA ergashadi:
 * hayz rejimida pushti, "homiladorlikka tayyorgarlik"da yalpiz-turkuaz.
 */
export function TodayBackdrop() {
  return (
    <div aria-hidden className="today-backdrop pointer-events-none fixed inset-0 z-0 overflow-hidden">
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
        className="today-blob bottom-[-35%] right-[-35%] h-[95vh] w-[95vh] bg-primary/14"
        style={{ animationDuration: "41s", animationDelay: "-13s" }}
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
