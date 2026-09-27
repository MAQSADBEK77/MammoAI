"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import {
  KICK_TARGET,
  currentKickSession,
  summarizeKickSession,
} from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Card } from "@/components/ui";

/**
 * PREG-KICKS-01 — harakat sanagichi.
 *
 * Ilgari bu bitta qator edi: "Bugun: 14 ta tepki" va tugma. Raqam
 * to'g'ri, lekin FOYDASIZ: 14 ta ko'pmi yoki kammi — ayol bilmaydi,
 * chunki hech qanday chegara aytilmagan va vaqt hisobga olinmagan.
 *
 * Endi sanoq SEANS bilan ishlaydi (2 soat / 10 harakat) va uchta
 * holatdan birini aytadi: davom eting, yetdi, yoki kam. Uchinchisi
 * eng muhimi — harakatning kamayishi homila holatini baholashda
 * ayolning o'zi payqay oladigan kam sonli belgilardan biri.
 */
export function KickCounter({
  kickTimes,
  onChange,
}: {
  kickTimes: string[];
  onChange: (next: string[]) => void;
}) {
  const { dict } = useI18n();
  const t = dict.pregnancy;
  /**
   * Mahalliy (hali serverga yetib bormagan) bosishlar.
   *
   * O'lchandi: production bazasiga bitta so'rov ~1 soniya ketadi. Agar
   * tugma shu vaqt davomida o'chirilsa — chaqaloq ketma-ket tepayotgan
   * paytdagi bosishlarning YARMI yo'qoladi. Sanagich uchun bu jiddiy
   * xato: raqam kam ko'rinsa, ayol behuda qo'rqadi.
   *
   * Shuning uchun sanoq DARHOL oshadi, so'rov esa orqada ketadi.
   */
  const [pending, setPending] = useState<string[]>([]);
  /** Vaqt holatda saqlanadi — render paytida `Date.now()` chaqirish
   *  sof emas (React qoidasi, ContractionTimer'dagi kabi). */
  const [now, setNow] = useState<Date | null>(null);
  /** Ayol "yangi seans" deganda oldingi yozuvlar ekranda ko'rinmasin. */
  const [ignoreBefore, setIgnoreBefore] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setNow(new Date());
    const first = setTimeout(update, 0);
    const id = setInterval(update, 30000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const merged = [...new Set([...kickTimes, ...pending])];
  const visibleTimes = ignoreBefore ? merged.filter((k) => k > ignoreBefore) : merged;
  const reference = now ?? new Date(0);
  const session = now ? currentKickSession(visibleTimes, reference) : null;
  const summary = summarizeKickSession(session, reference);

  async function tap() {
    const localAt = new Date().toISOString();
    setPending((cur) => [...cur, localAt]);
    try {
      const res = await api.pregnancy.logKick();
      // Server ro'yxati to'liq — mahalliy nusxalar endi kerak emas.
      // (Ular serverdagi yozuv bilan bir necha yuz millisekundga farq
      // qiladi, shuning uchun vaqt bo'yicha emas, butunlay tozalanadi.)
      setPending((cur) => cur.filter((t) => t > localAt));
      onChange(res.kickTimes);
    } catch {
      // Tarmoq uzilsa bosish yo'qolmasin: mahalliy sanoqda qoladi va
      // keyingi muvaffaqiyatli so'rovda server raqami bilan almashadi.
    }
  }

  return (
    <Card className="space-y-4">
      <div>
        <p className="text-base font-bold text-text-primary">{t.kicksTitle}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{t.kicksHint}</p>
      </div>

      {/* Seans yopilgach (10 taga yetdi yoki 2 soat tugadi) tugma
          BOSILMAYDI. Aks holda doirada "12", matnda esa "10 / 10"
          turardi — ikki xil raqam ayolga sanoq buzuq degan taassurot
          beradi. Davom etish uchun "Yangi seans" bor. */}
      {summary.open ? (
        <button
          type="button"
          onClick={tap}
          className="bg-pregnancy-accent mx-auto grid h-32 w-32 place-items-center rounded-full text-center text-white transition active:scale-[0.97]"
        >
          <span>
            <span className="block text-3xl font-extrabold leading-none">{summary.count}</span>
            <span className="mt-1 block text-xs font-semibold opacity-90">{t.kicksButton}</span>
          </span>
        </button>
      ) : (
        <div
          className={clsx(
            "mx-auto grid h-32 w-32 place-items-center rounded-full text-center",
            summary.lowCount ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
          )}
        >
          <span className="text-3xl font-extrabold leading-none">{Math.min(summary.count, KICK_TARGET)}</span>
        </div>
      )}

      <div className="text-center">
        <p className="text-sm font-bold text-text-primary">{t.kicksProgress(Math.min(summary.count, KICK_TARGET))}</p>
        {summary.count > 0 && <p className="text-xs text-text-secondary">{t.kicksElapsed(summary.elapsedMin)}</p>}
      </div>

      {/* Progress chizig'i — raqamdan ko'ra tezroq o'qiladi. */}
      <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
        <div
          className={clsx("h-full rounded-full transition-all", summary.lowCount ? "bg-danger" : "bg-pregnancy-accent")}
          style={{ width: `${Math.min(100, (summary.count / KICK_TARGET) * 100)}%` }}
        />
      </div>

      {summary.reachedTarget && (
        <div className="rounded-2xl bg-success/10 p-3">
          <p className="text-sm font-bold text-success">{t.kicksDone}</p>
          <p className="mt-1 text-xs leading-relaxed text-text-secondary">{t.kicksDoneHint}</p>
        </div>
      )}

      {summary.lowCount && (
        <div className="rounded-2xl bg-danger/10 p-3">
          <p className="text-sm font-bold text-danger">{t.kicksLow}</p>
          <p className="mt-1 text-xs leading-relaxed text-text-secondary">{t.kicksLowHint}</p>
        </div>
      )}

      {!summary.open && summary.count > 0 && (
        <button
          type="button"
          onClick={() => {
          setIgnoreBefore(new Date().toISOString());
          setPending([]);
        }}
          className="text-pregnancy-accent w-full text-sm font-bold"
        >
          {t.kicksReset}
        </button>
      )}

      <p className="text-[11px] leading-relaxed text-text-muted">{t.kicksDisclaimer}</p>
    </Card>
  );
}
