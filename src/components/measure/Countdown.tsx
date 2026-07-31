"use client";

import { useEffect, useRef, useState } from "react";
import { playBellSoft } from "@/lib/audio/sfx";
import { t } from "@/lib/i18n";
import { PvtInstruction } from "./PvtInstruction";
import { asset } from "@/lib/ui/asset";

/** 測定開始前の3秒カウントダウン(§4.3)。Task A のタスク名称と1行説明も添える。 */
export function Countdown({ onDone }: { onDone: () => void }) {
  const [count, setCount] = useState(3);
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
      <p className="text-sm text-ink-mute">{t("measure.countdown.ready")}</p>
      <p className="font-mono text-8xl font-bold text-ink" aria-live="polite">
        {count}
      </p>
      <div className="flex flex-col items-center gap-2">
        <p className="text-3xl font-bold text-ink">
          {t("measure.taskTitle", { name: t("task.pvt.label") })}
        </p>
        <PvtInstruction className="text-sm text-ink-2" />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset("/characters/fal.jpg")}
        alt=""
        aria-hidden
        draggable={false}
        className="h-24 w-auto pointer-events-none"
      />
    </div>
  );
}
