"use client";

import { useEffect, useState } from "react";
import type { TaskScores } from "@/lib/engine/types";
import { t } from "@/lib/i18n";

const TASKS = ["pvt", "math", "stroop"] as const;
/** バー・値ラベルの上限クリップ(基準比%) */
const MAX_PERCENT = 120;

/**
 * タスク別内訳(§4.4)。norm×100 を「基準比%」として3本の横バーで表示。
 * 単一系列のため青1色系(リッチテーマの光沢ブルーグラデーション)・値ラベル併記。
 * トラックは surface-3(淡い青灰)、値ラベルは濃紺(text-ink)。
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
            <div className="h-3 rounded-full bg-surface-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-linear-to-r from-[#5da3ef] to-primary-deep motion-safe:transition-[width] motion-safe:duration-700 motion-safe:ease-out"
                style={{ width: grown ? `${widthPct}%` : "0%" }}
              />
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
