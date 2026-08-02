"use client";

import { useEffect, useRef, useState } from "react";
import { playBellSoft } from "@/lib/audio/sfx";
import { t } from "@/lib/i18n";
import { PvtInstruction } from "./PvtInstruction";

/** 測定開始前の6秒カウントダウン(§4.3)。Task A のタスク名称と説明も添える。 */
export function Countdown({ onDone }: { onDone: () => void }) {
  const [count, setCount] = useState(6);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (count <= 1) {
        // 開始の合図(グラスベル)。計時は PvtTask 側の rAF 基準で不変
        playBellSoft();
        onDoneRef.current();
      } else {
        setCount(count - 1);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [count]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 text-center select-none">
      <p className="text-sm text-ink-2">{t("measure.countdown.ready")}</p>
      <p className="font-mono text-8xl font-bold text-ink" aria-live="polite">
        {count}
      </p>
      <div className="flex flex-col items-center gap-2">
        <p className="text-3xl font-bold text-ink">
          {t("measure.taskTitle", { name: t("task.pvt.label") })}
        </p>
        <PvtInstruction className="text-sm text-ink-2" />
      </div>
      {/* 白いヘアライン+小さな気泡とガラスダイヤのアクセント(装飾・アクア調) */}
      <div aria-hidden className="flex w-full max-w-56 items-center gap-3">
        <span className="h-px flex-1 bg-linear-to-r from-transparent to-white/90" />
        <span className="size-1.5 rounded-full bg-white/70 ring-1 ring-white/80 shadow-sm" />
        <span className="size-2.5 rotate-45 rounded-[2px] bg-linear-to-b from-aqua-btn to-aqua-btn-deep shadow-md shadow-primary/40 ring-1 ring-white/70" />
        <span className="size-1.5 rounded-full bg-white/70 ring-1 ring-white/80 shadow-sm" />
        <span className="h-px flex-1 bg-linear-to-l from-transparent to-white/90" />
      </div>
    </div>
  );
}
