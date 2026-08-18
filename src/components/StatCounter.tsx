"use client";

import { useEffect, useRef, useState } from "react";

/** Counts up from 0 to `value` once it scrolls into view. Re-animates if `value` changes later (e.g. once async data arrives). */
export function StatCounter({
  value,
  suffix = "",
  prefix = "",
  duration = 1200,
  className,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Scoped to this effect run (not a ref) — each time `value` changes we
    // get a fresh guard, so a stale run from an earlier (e.g. placeholder
    // "0") value can never block the real one from animating in later.
    let cancelled = false;

    function run() {
      if (cancelled) return;
      const start = performance.now();
      const tick = (now: number) => {
        if (cancelled) return;
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(eased * value));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          run();
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    // Safety net: guarantee the real value lands even if the observer never fires.
    const fallback = setTimeout(run, 1500);

    return () => {
      cancelled = true;
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
