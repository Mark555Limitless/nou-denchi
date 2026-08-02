"use client";

import { useEffect, useRef } from "react";
import { playBellSoft } from "@/lib/audio/sfx";
import { t } from "@/lib/i18n";

/**
 * タスク間の6秒自動遷移インタースティシャル(§4.3)。
 * 見出しは measure.taskTitle 経由でタスク名(「処理速度」等)を表示する。
 */

const DURATION_MS = 6000;

interface InterstitialProps {
  /** 次タスク名(common の task.*.label を渡す。見出しは「{label}計測」になる) */
  label: string;
  /** 1行説明 */
  desc: string;
  /** 中断確認ダイアログ表示中は自動遷移を止める */
  paused: boolean;
  onDone: () => void;
}

export function Interstitial({ label, desc, paused, onDone }: InterstitialProps) {
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
    const timer = setTimeout(() => onDoneRef.current(), DURATION_MS);
    return () => clearTimeout(timer);
  }, [paused]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center select-none">
      {/* 白いヘアライン+アクア色に光るガラスの円アクセント(装飾) */}
      <div aria-hidden className="mb-1 flex w-full max-w-56 items-center gap-3">
        <span className="h-px flex-1 bg-linear-to-r from-transparent to-white/90" />
        <span className="size-1.5 rounded-full bg-white/70 ring-1 ring-white/80 shadow-sm" />
        <span className="size-3 rounded-full bg-radial-[at_35%_30%] from-[#8ec4ee] via-aqua-btn to-aqua-btn-deep shadow-md shadow-primary/40 ring-1 ring-white/70" />
        <span className="size-1.5 rounded-full bg-white/70 ring-1 ring-white/80 shadow-sm" />
        <span className="h-px flex-1 bg-linear-to-l from-transparent to-white/90" />
      </div>
      <p className="text-sm text-ink-2">{t("measure.interstitial.next")}</p>
      <h2 className="text-3xl font-bold text-ink">
        {t("measure.taskTitle", { name: label })}
      </h2>
      <p className="text-sm leading-relaxed text-ink-2">{desc}</p>
    </div>
  );
}
