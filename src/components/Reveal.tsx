"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

/** Fades + slides children in once they scroll into view. Plays once. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    // Safety net: never leave content invisible if the observer doesn't fire
    // (e.g. a page that's screenshotted/printed without a real scroll).
    const fallback = setTimeout(() => setVisible(true), 1500);
    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={clsx(visible ? "animate-fade-in-up" : "opacity-0", className)}
      style={visible ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
