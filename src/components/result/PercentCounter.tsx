"use client";

import { useEffect, useState } from "react";
import type { Zone } from "@/lib/engine/types";
import { zoneClasses } from "@/lib/ui/zone";

/**
 * %数字表示(§4.4)。animate=true(new=1)のとき 0 から約1.2秒 ease-out で
 * カウントアップ。prefers-reduced-motion では即時表示。
 */
export function PercentCounter({
  value,
  zone,
  animate,
}: {
  value: number;
  zone: Zone;
  animate: boolean;
}) {
  const [shown, setShown] = useState(animate ? 0 : value);

  useEffect(() => {
    let raf = 0;
    if (
      !animate ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      raf = requestAnimationFrame(() => setShown(value));
      return () => cancelAnimationFrame(raf);
    }
    const durationMs = 1200;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animate, value]);

  const color = zoneClasses[zone].text;
  return (
    <div
      role="img"
      aria-label={`${value}%`}
      className="flex items-baseline justify-center"
    >
      <span
        aria-hidden
        className={`font-mono text-8xl font-extrabold leading-none tracking-tight ${color}`}
        style={{
          textShadow:
            "0 1px 0 rgba(255,255,255,0.75), 0 3px 6px rgba(28,58,102,0.3)",
        }}
      >
        {shown}
      </span>
      <span
        aria-hidden
        className={`font-mono text-4xl font-bold ${color}`}
        style={{
          textShadow:
            "0 1px 0 rgba(255,255,255,0.75), 0 2px 4px rgba(28,58,102,0.3)",
        }}
      >
        %
      </span>
    </div>
  );
}
