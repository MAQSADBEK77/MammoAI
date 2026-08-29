"use client";

// Lunari uslubidagi doiraviy sikl-halqasi — bosh ekran (Tsikl) markazida joriy
// kun va progressni ko'rsatadi. Faza kartalari YO'Q (foydalanuvchi tanlovi) —
// faqat vizual progress-indikator.

const SIZE = 200;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CycleRing({
  dayInCycle,
  cycleLength,
  label,
  sublabel,
}: {
  dayInCycle: number;
  cycleLength: number;
  label: string;
  sublabel: string;
}) {
  const progress = Math.min(1, Math.max(0, dayInCycle / cycleLength));
  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="var(--color-primary-light)" strokeWidth={STROKE} />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold text-text-primary">{dayInCycle}</span>
        <span className="text-sm font-medium text-text-secondary">{label}</span>
        <span className="mt-2 max-w-[140px] text-center text-xs text-text-muted">{sublabel}</span>
      </div>
    </div>
  );
}
