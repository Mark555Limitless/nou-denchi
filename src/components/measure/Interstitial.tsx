"use client";

import { useEffect, useRef, useState } from "react";
import { playBellSoft } from "@/lib/audio/sfx";
import { t } from "@/lib/i18n";

/**
 * タスク間のインタースティシャル(§4.3)。
 * 2026-08-03 ユーザー指示[6][7]: 覚醒度の待機画面(Countdown)と同じ
 * レイアウト・動きに統一 — 「つぎのタスク」を「まもなくスタート」と同じ位置に置き、
 * 6・5・4…の6秒自動カウントダウンで次タスクへ遷移する。
 */

interface InterstitialProps {
  /** 次タスク名(common の task.*.label を渡す) */
  label: string;
  /** 説明(\n 区切りの複数行可) */
  desc: string;
  /** 中断確認ダイアログ表示中はカウントダウンを止める */
  paused: boolean;
  onDone: () => void;
}

export function Interstitial({ label, desc, paused, onDone }: InterstitialProps) {
  const [count, setCount] = useState(6);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  // マウント時に次タスクの合図(グラスベル)。開発時の効果二重実行では1回に抑える
  const playedRef = useRef(false);
  useEffect(() => {
    if (playedRef.current) return;
    playedRef.current = true;
    playBellSoft();
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => {
      if (count <= 1) {
        onDoneRef.current();
      } else {
        setCount(count - 1);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [count, paused]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 text-center select-none">
      <p className="text-[21px] text-ink-faint">
        {t("measure.interstitial.next")}
      </p>
      <p className="font-mono text-8xl font-bold text-ink" aria-live="polite">
        {count}
      </p>
      <div className="flex flex-col items-center gap-2">
        <p className="text-3xl font-bold text-ink">
          {t("measure.taskTitle", { name: label })}
        </p>
        <p className="whitespace-pre-line text-[21px] leading-snug text-ink-faint">
          {desc}
        </p>
      </div>
      {/* 白いヘアラインのアクセント(装飾。Countdown と同一) */}
      <div aria-hidden className="flex w-full max-w-56 items-center gap-3">
        <span className="h-px flex-1 bg-linear-to-r from-transparent to-white/90" />
        <span className="size-1.5 rounded-full bg-white/70 ring-1 ring-white/80 shadow-sm" />
        <span className="h-px flex-1 bg-linear-to-l from-transparent to-white/90" />
      </div>
    </div>
  );
}
