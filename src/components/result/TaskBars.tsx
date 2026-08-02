"use client";

import { useEffect, useState } from "react";
import type { TaskScores } from "@/lib/engine/types";
import { t } from "@/lib/i18n";

const TASKS = ["pvt", "math", "stroop"] as const;
/** バー・値ラベルの上限クリップ(基準比%) */
const MAX_PERCENT = 120;

/**
 * タスク別内訳(§4.4)。norm×100 を「基準比%」として3本の横バーで表示。
 * アクア・ガラステーマ: 「水の入ったガラス管」風
 * (トラック=白ガラス管、塗り=青の水グラデ+上面ハイライト)・値ラベル併記。
 * 値ラベルは濃紺(text-ink)。
 */
export function TaskBars({ norm }: { norm: TaskScores }) {
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {TASKS.map((task) => {
        const value = Math.min(Math.round(norm[task] * 100), MAX_PERCENT);
        const widthPct = (value / MAX_PERCENT) * 100;
        return (
          <div
            key={task}
            className="grid grid-cols-[4.5rem_1fr_3.5rem] items-center gap-3"
          >
            <span className="text-sm text-ink-2">{t(`task.${task}.label`)}</span>
            <div className="h-4 rounded-full bg-white/50 border border-white/80 shadow-[inset_0_1px_3px_rgba(28,58,102,0.18)] overflow-hidden">
              <div
                className="relative h-full rounded-full bg-linear-to-r from-[#7db8e8] to-[#3e7fd0] motion-safe:transition-[width] motion-safe:duration-700 motion-safe:ease-out"
                style={{ width: grown ? `${widthPct}%` : "0%" }}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-1 top-0.5 h-[38%] rounded-full bg-linear-to-b from-white/70 to-white/0"
                />
              </div>
            </div>
            <span className="text-sm font-mono font-bold text-ink text-right">
              {value}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
