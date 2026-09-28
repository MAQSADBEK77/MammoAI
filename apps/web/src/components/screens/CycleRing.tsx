"use client";

import type { CycleRing as CycleRingData } from "@mammoai/shared";

/**
 * CYCLE-RING-01 — bosh ekrandagi sikl halqasi.
 *
 * Ilgari hero'ning o'rtasida faqat ikki qator matn turardi ("Keyingi
 * hayz: 3 kun") va atrofida taxminan 500 px BO'SH joy qolardi. Halqa
 * shu joyni ma'lumot bilan to'ldiradi: ayol siklning qayerida
 * turganini, hayz va unumdor kunlar qachonligini bir qarashda ko'radi
 * — referenslarning uchalasida ham (Flo, Lalu, Mom+) aynan shunday.
 *
 * Matn halqaning ICHIDA qoladi va o'zgarmaydi: u allaqachon
 * `resolveCycleHero` tomonidan hisoblangan va sinovdan o'tgan.
 *
 * Geometriya `buildCycleRing`da (packages/shared), testlar bilan.
 */
const SIZE = 264;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function arc(from: number, to: number) {
  const length = Math.max(0, to - from) * CIRCUMFERENCE;
  return {
    strokeDasharray: `${length} ${CIRCUMFERENCE - length}`,
    strokeDashoffset: -from * CIRCUMFERENCE,
  };
}

export function CycleRing({ ring, children }: { ring: CycleRingData; children: React.ReactNode }) {
  const markerAngle = ring.progress * 2 * Math.PI - Math.PI / 2;
  const markerX = SIZE / 2 + RADIUS * Math.cos(markerAngle);
  const markerY = SIZE / 2 + RADIUS * Math.sin(markerAngle);

  return (
    <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90" aria-hidden>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-surface"
          opacity={0.75}
        />
        {ring.segments.map((s) => (
          <circle
            key={s.kind}
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="round"
            className={s.kind === "period" ? "stroke-primary" : "stroke-accent"}
            opacity={s.kind === "period" ? 0.9 : 0.55}
            style={arc(s.from, s.to)}
          />
        ))}
        {/* Ovulyatsiya — bitta kun, shuning uchun yoy emas, nuqta. */}
        {ring.ovulationAt !== null && (
          <circle
            cx={SIZE / 2 + RADIUS * Math.cos(ring.ovulationAt * 2 * Math.PI)}
            cy={SIZE / 2 + RADIUS * Math.sin(ring.ovulationAt * 2 * Math.PI)}
            r={4}
            className="fill-accent"
          />
        )}
      </svg>

      {/* Bugungi kun belgisi — halqa ustida oq doira. SVG aylantirilgani
          uchun u alohida, aylantirilmagan qatlamda chiziladi. */}
      <span
        aria-hidden
        className="absolute h-5 w-5 rounded-full border-4 border-primary bg-surface shadow-sm"
        style={{ left: markerX - 10, top: markerY - 10 }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">{children}</div>
    </div>
  );
}
