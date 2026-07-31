"use client";

/* eslint-disable react-hooks/purity --
 * 反応時間の計測(§2・受け入れ基準4)には performance.now() が必須。
 * 呼び出しはイベント・タイマーコールバック内のみで、レンダー中には実行されない。 */

import { useEffect, useRef, useState } from "react";
import { playMeasureBad, playMeasureGood } from "@/lib/audio/sfx";
import { scoringConfig } from "@/lib/config";
import type { MathProblem } from "@/lib/engine/mathGen";
import type { MathResult } from "@/lib/engine/types";
import { t } from "@/lib/i18n";

/**
 * Task B: 単純計算 30秒(§3.1)。
 * 大きく式を表示し、4択(2×2)を pointerdown で即答 → 即次問。
 * 30秒(config.math.durationMs)経過で即終了。durationMs は実測値を記録。
 *
 * pause対応(§4.3): 中断ダイアログ表示中はタイマーを停止し、再開時に
 * 開始時刻をポーズ時間ぶん前進させて、ダイアログ表示時間がスコアの
 * 「経過秒」やRTに混入しないようにする。
 */

interface MathTaskProps {
  problems: MathProblem[];
  /** 中断確認ダイアログ表示中 */
  paused: boolean;
  onDone: (result: MathResult) => void;
}

/** 連打・二重発火防止のタップ間ガード */
const TAP_GUARD_MS = 200;

export function MathTask({ problems, paused, onDone }: MathTaskProps) {
  const cfg = scoringConfig.math;
  const [index, setIndex] = useState(0);
  const [remainSec, setRemainSec] = useState(Math.ceil(cfg.durationMs / 1000));

  const startRef = useRef(0);
  const problemStartRef = useRef(0);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);
  const rtListRef = useRef<number[]>([]);
  const lastTapRef = useRef(0);
  const doneRef = useRef(false);
  const pausedAtRef = useRef(0);
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const secTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  function clearTimers() {
    if (endTimerRef.current !== null) {
      clearTimeout(endTimerRef.current);
      endTimerRef.current = null;
    }
    if (secTimerRef.current !== null) {
      clearInterval(secTimerRef.current);
      secTimerRef.current = null;
    }
  }

  function armTimers(remainingMs: number) {
    clearTimers();
    endTimerRef.current = setTimeout(finish, remainingMs);
    secTimerRef.current = setInterval(() => {
      const left = cfg.durationMs - (performance.now() - startRef.current);
      setRemainSec(Math.max(0, Math.ceil(left / 1000)));
    }, 200);
  }

  function finish() {
    if (doneRef.current) return;
    doneRef.current = true;
    clearTimers();
    onDoneRef.current({
      correct: correctRef.current,
      wrong: wrongRef.current,
      rtList: rtListRef.current,
      durationMs: Math.min(
        cfg.durationMs,
        Math.round(performance.now() - startRef.current),
      ),
    });
  }

  function handleAnswer(choice: number) {
    if (doneRef.current || pausedAtRef.current > 0) return;
    const now = performance.now();
    if (now - lastTapRef.current < TAP_GUARD_MS) return;
    lastTapRef.current = now;
    const p = problems[index];
    if (!p) return;
    rtListRef.current.push(Math.round(now - problemStartRef.current));
    // 効果音は判定確定後(RT記録の後)に鳴らす
    if (choice === p.answer) {
      correctRef.current += 1;
      playMeasureGood();
    } else {
      wrongRef.current += 1;
      playMeasureBad();
    }
    if (index + 1 >= problems.length) {
      // 出題を使い切った場合も実測時間で終了
      finish();
      return;
    }
    problemStartRef.current = now;
    setIndex(index + 1);
  }

  useEffect(() => {
    // 開発時の効果二重実行にも耐えるよう、開始時に全カウンタを初期化
    startRef.current = performance.now();
    problemStartRef.current = startRef.current;
    correctRef.current = 0;
    wrongRef.current = 0;
    rtListRef.current = [];
    lastTapRef.current = 0;
    doneRef.current = false;
    pausedAtRef.current = 0;
    armTimers(cfg.durationMs);
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // pause: タイマー停止 → 再開時に開始時刻をポーズ分シフトして残り時間で再開
  useEffect(() => {
    if (doneRef.current) return;
    if (paused) {
      if (pausedAtRef.current === 0) {
        pausedAtRef.current = performance.now();
        clearTimers();
      }
    } else if (pausedAtRef.current > 0) {
      const pauseDur = performance.now() - pausedAtRef.current;
      pausedAtRef.current = 0;
      startRef.current += pauseDur;
      problemStartRef.current += pauseDur;
      const remaining = cfg.durationMs - (performance.now() - startRef.current);
      if (remaining <= 0) {
        finish();
        return;
      }
      armTimers(remaining);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const p = problems[index];
  if (!p) return null;

  return (
    <div className="flex-1 flex flex-col px-5 pb-8 select-none">
      <p className="pt-3 text-center font-mono text-sm text-ink-mute">
        {t("measure.secondsLeft", { sec: remainSec })}
      </p>
      <div className="flex-1 flex items-center justify-center">
        <p className="font-mono text-6xl text-ink tracking-wider">
          {p.a} {p.op === "-" ? "−" : "+"} {p.b}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {p.choices.map((c, i) => (
          <button
            key={`${index}-${i}`}
            type="button"
            onPointerDown={() => handleAnswer(c)}
            onClick={(e) => {
              // キーボード操作(§7): detail===0 はキーボード由来の click
              if (e.detail === 0) handleAnswer(c);
            }}
            className="py-6 rounded-2xl bg-surface-2 border border-hairline shadow-md font-mono text-3xl text-ink active:bg-surface-3"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
