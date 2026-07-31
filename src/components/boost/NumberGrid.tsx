"use client";

import { useEffect, useRef, useState } from "react";

export type TapResult = "ok" | "wrong" | "ignore";

interface NumberGridProps {
  /** 3×3 に並べる 1〜9(シャッフル済) */
  grid: number[];
  /** 次にタップすべき数字。これ未満はタップ済み表示+無効 */
  nextNumber: number;
  /** タップ結果を返す("wrong" のときそのセルをシェイク) */
  onTap: (value: number) => TapResult;
}

const SHAKE_MS = 320;

/**
 * ナンバーラッシュの 3×3 グリッド。計時ゲームのため pointerdown で反応し、
 * キーボード(Enter/Space)は click(detail=0)で拾う。
 * 誤タップはペナルティなし・CSSシェイクのみ(テンポ優先)。
 */
export function NumberGrid({ grid, nextNumber, onTap }: NumberGridProps) {
  const [shakeIdx, setShakeIdx] = useState<number | null>(null);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (shakeTimerRef.current !== null) clearTimeout(shakeTimerRef.current);
    };
  }, []);

  function tap(value: number, index: number) {
    if (onTap(value) === "wrong") {
      if (shakeTimerRef.current !== null) clearTimeout(shakeTimerRef.current);
      setShakeIdx(index);
      shakeTimerRef.current = setTimeout(() => {
        shakeTimerRef.current = null;
        setShakeIdx(null);
      }, SHAKE_MS);
    }
  }

  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-xs mx-auto select-none">
      {grid.map((value, i) => {
        const tapped = value < nextNumber;
        const justTapped = tapped && value === nextNumber - 1;
        return (
          <button
            key={value}
            type="button"
            aria-disabled={tapped}
            onPointerDown={() => {
              if (!tapped) tap(value, i);
            }}
            onClick={(e) => {
              // マウス/タッチは pointerdown 済み。detail=0(キーボード)のみ処理
              if (e.detail === 0 && !tapped) tap(value, i);
            }}
            className={`aspect-square min-h-[72px] rounded-2xl flex items-center justify-center text-4xl font-extrabold transition-colors ${
              tapped
                ? "bg-linear-to-b from-primary to-primary-deep text-primary-ink shadow-sm"
                : "bg-surface-2 text-ink border border-hairline shadow-md"
            } ${justTapped ? "boost-pop ring-2 ring-gold-soft" : ""} ${shakeIdx === i ? "boost-shake" : ""}`}
          >
            {value}
          </button>
        );
      })}
    </div>
  );
}
