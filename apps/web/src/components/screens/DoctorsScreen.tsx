"use client";

import { useCallback, useEffect, useState } from "react";
import { StarRounded, StarBorderRounded } from "@mui/icons-material";
import clsx from "clsx";
import { sortDoctorsByRating, summarizeDoctorRating, canRateDoctor, type DoctorListItem } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Card, LoadingSpinner, ScreenHeader } from "@/components/ui";

/**
 * DOC-01 — shifokorlar katalogi.
 *
 * Nega oddiy katalog EMAS: O'zbekistonda allaqachon kuchli kataloglar
 * bor (kliniki.uz — 1900+ klinika, medlink.uz — 996 shifokor). Ular
 * bilan ro'yxat uzunligida raqobatlashish — yutqazilgan o'yin.
 *
 * Bizning farqimiz ikkita:
 *   1. Baho faqat TASDIQLANGAN tashrifdan keyin qoldiriladi — ya'ni
 *      uni sotib bo'lmaydi. Ekranda bu ochiq aytiladi.
 *   2. Reyting Bayes o'rtachasi bo'yicha: bitta 5 ball ellikta 4.8 dan
 *      yuqori turmaydi (packages/shared/logic/doctor-rating.ts).
 */
export function DoctorsScreen() {
  const { dict } = useI18n();
  const t = dict.doctors;
  const [doctors, setDoctors] = useState<DoctorListItem[] | null>(null);
  const [specialty, setSpecialty] = useState<string | null>(null);
  const [rating, setRating] = useState<{ id: string; value: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.doctors
      .list()
      .then((res) => setDoctors(res.doctors))
      .catch(() => setDoctors([]));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(load, 0);
    return () => clearTimeout(timeout);
  }, [load]);

  if (doctors === null) {
    return (
      <div className="space-y-4 pb-8">
        <ScreenHeader title={t.title} subtitle={t.subtitle} />
        <LoadingSpinner label={dict.common.loading} inline />
      </div>
    );
  }

  // Bazada mutaxassislik ENUM qiymat sifatida saqlanadi ("gynecology"), ayolga
  // esa uning tilidagi nomi ko'rsatilishi kerak. Mos tarjima topilmasa xom
  // qiymat chiqadi — eski/qo'lda kiritilgan yozuv bo'lsa ham ekran buzilmaydi.
  const specialtyLabel = (value: string) =>
    (dict.concerns.specialists as Record<string, string | undefined>)[value] ?? value;
  const specialties = [...new Set(doctors.map((d) => d.specialty))].sort((a, b) =>
    specialtyLabel(a).localeCompare(specialtyLabel(b))
  );
  const visible = sortDoctorsByRating(
    doctors
      .filter((d) => !specialty || d.specialty === specialty)
      .map((d) => ({ ...d, rating: summarizeDoctorRating(d.ratings) }))
  );

  async function act(fn: () => Promise<{ doctors: DoctorListItem[] }>) {
    setBusy(true);
    try {
      setDoctors((await fn()).doctors);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 pb-8">
      <ScreenHeader title={t.title} subtitle={t.subtitle} />

      {doctors.length === 0 ? (
        <Card>
          <p className="text-center text-sm text-text-muted">{t.empty}</p>
        </Card>
      ) : (
        <>
          {specialties.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[null, ...specialties].map((s) => (
                <button
                  key={s ?? "all"}
                  type="button"
                  onClick={() => setSpecialty(s)}
                  className={clsx(
                    "shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors",
                    specialty === s ? "bg-primary text-white" : "bg-surface text-text-secondary"
                  )}
                >
                  {s === null ? t.all : specialtyLabel(s)}
                </button>
              ))}
            </div>
          )}

          <p className="px-1 text-[11px] leading-relaxed text-text-muted">{t.onlyAfterVisit}</p>

          {visible.map((d) => (
            <Card key={d.id} className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold leading-snug text-text-primary">{d.fullName}</p>
                  <p className="text-xs font-semibold text-primary">{specialtyLabel(d.specialty)}</p>
                  {d.qualification && <p className="mt-0.5 text-xs text-text-secondary">{d.qualification}</p>}
                  {d.experienceYears !== null && (
                    <p className="text-xs text-text-muted">{t.years(d.experienceYears)}</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  {d.rating.display ? (
                    <>
                      <p className="flex items-center gap-1 text-base font-extrabold text-text-primary">
                        <StarRounded sx={{ fontSize: 18 }} className="text-warning" />
                        {d.rating.score.toFixed(1)}
                      </p>
                      <p className="text-[11px] text-text-muted">{t.reviews(d.rating.count)}</p>
                    </>
                  ) : (
                    <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-bold text-text-secondary">
                      {t.newDoctor}
                    </span>
                  )}
                </div>
              </div>

              {d.clinic && (
                <div className="rounded-2xl bg-surface-muted p-3">
                  <p className="text-sm font-semibold text-text-primary">{d.clinic.name}</p>
                  {d.clinic.address && <p className="text-xs text-text-secondary">{d.clinic.address}</p>}
                  {d.clinic.phone && (
                    <a href={`tel:${d.clinic.phone}`} className="mt-1 inline-block text-xs font-bold text-primary">
                      {t.callClinic}
                    </a>
                  )}
                </div>
              )}

              {/* Tashrif halqasi: "boraman" -> "bordim" -> baho. */}
              {canRateDoctor({ visitConfirmed: d.visitConfirmed, alreadyRated: d.alreadyRated }) ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-text-primary">{t.rateTitle}</p>
                  <div className="flex justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button key={v} type="button" onClick={() => setRating({ id: d.id, value: v })} aria-label={String(v)}>
                        {(rating?.id === d.id ? rating.value : 0) >= v ? (
                          <StarRounded sx={{ fontSize: 30 }} className="text-warning" />
                        ) : (
                          <StarBorderRounded sx={{ fontSize: 30 }} className="text-text-muted" />
                        )}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={busy || rating?.id !== d.id}
                    onClick={() => act(() => api.doctors.rate(d.id, rating!.value))}
                    className="tap-target w-full rounded-full bg-primary text-sm font-bold text-white disabled:opacity-50"
                  >
                    {t.rateSend}
                  </button>
                </div>
              ) : d.alreadyRated ? (
                <p className="text-center text-xs font-semibold text-success">{t.rated}</p>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => act(() => api.doctors.visit(d.id))}
                    className="tap-target flex-1 rounded-full bg-primary text-sm font-bold text-white disabled:opacity-60"
                  >
                    {t.goButton}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => act(() => api.doctors.confirmVisit(d.id))}
                    className="tap-target flex-1 rounded-full bg-surface-muted text-sm font-semibold text-text-primary disabled:opacity-60"
                  >
                    {t.wentButton}
                  </button>
                </div>
              )}
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
