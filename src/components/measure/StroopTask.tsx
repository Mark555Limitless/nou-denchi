"use client";

/* eslint-disable react-hooks/purity --
 * 反応時間の計測(§2・受け入れ基準4)には performance.now() が必須。
 * 呼び出しはイベント・タイマーコールバック内のみで、レンダー中には実行されない。 */

import { useEffect, useRef, useState } from "react";
import { playMeasureBad, playMeasureGood } from "@/lib/audio/sfx";
import { scoringConfig, stroopInkHex } from "@/lib/config";
import { computeInterference } from "@/lib/engine/scoring";
import {
  STROOP_COLORS,
  STROOP_WORD_JA,
  type StroopColor,
  type StroopQuestion,
} from "@/lib/engine/stroopGen";
import type { StroopResult } from "@/lib/engine/types";
import { t } from "@/lib/i18n";

/**
 * Task C: ストループ 20問または30秒(§3.1)。
 * 単語を ink 色で大きく表示し、回答は STROOP_COLORS 固定順の横並びボタン。
 * 各ボタンは色スウォッチ+ひらがなラベルで冗長化(§7 色覚多様性対応)。
 *
 * pause対応(§4.3): MathTask と同様、中断ダイアログ表示時間を
 * 経過秒・RTから除外する。
 */

interface StroopTaskProps {
  questions: StroopQuestion[];
  /** 中断確認ダイアログ表示中 */
  paused: boolean;
  /** トレーニング用: 出題数上限の上書き(未指定時は questions.length=従来挙動) */
  maxQuestionsOverride?: number;
  /** トレーニング用: 制限時間の上書き(未指定時は config 値=従来挙動) */
  durationMsOverride?: number;
  /** トレーニング用: 残り秒表示を隠す(時間無制限相当モード)。既定は false */
  hideTimer?: boolean;
  onDone: (result: StroopResult) => void;
}

/** 連打・二重発火防止のタップ間ガード */
const TAP_GUARD_MS = 200;

export function StroopTask({
  questions,
  paused,
  maxQuestionsOverride,
  durationMsOverride,
  hideTimer = false,
  onDone,
}: StroopTaskProps) {
  const cfg = scoringConfig.stroop;
  const durationMs = durationMsOverride ?? cfg.durationMs;
  const totalQuestions = Math.min(
    questions.length,
    maxQuestionsOverride ?? questions.length,
  );
  const [index, setIndex] = useState(0);
  const [remainSec, setRemainSec] = useState(Math.ceil(durationMs / 1000));

  const startRef = useRef(0);
  const qStartRef = useRef(0);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);
  const rtListRef = useRef<number[]>([]);
  /** 干渉量算出用: 正答試行のみのRT(§3.2) */
  const congruentRtsRef = useRef<number[]>([]);
  const incongruentRtsRef = useRef<number[]>([]);
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
      const left = durationMs - (performance.now() - startRef.current);
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
      interferenceMs: computeInterference(
        congruentRtsRef.current,
        incongruentRtsRef.current,
      ),
      durationMs: Math.min(
        durationMs,
        Math.round(performance.now() - startRef.current),
      ),
    });
  }

  function handleAnswer(color: StroopColor) {
    if (doneRef.current || pausedAtRef.current > 0) return;
    const now = performance.now();
    if (now - lastTapRef.current < TAP_GUARD_MS) return;
    lastTapRef.current = now;
    const q = questions[index];
    if (!q) return;
    const rt = Math.round(now - qStartRef.current);
    rtListRef.current.push(rt);
    // 効果音は判定確定後(RT記録の後)に鳴らす
    if (color === q.ink) {
      correctRef.current += 1;
      if (q.congruent) congruentRtsRef.current.push(rt);
      else incongruentRtsRef.current.push(rt);
      playMeasureGood();
    } else {
      wrongRef.current += 1;
      playMeasureBad();
    }
    if (index + 1 >= totalQuestions) {
      finish();
      return;
    }
    qStartRef.current = now;
    setIndex(index + 1);
  }

  useEffect(() => {
    // 開発時の効果二重実行にも耐えるよう、開始時に全カウンタを初期化
    startRef.current = performance.now();
    qStartRef.current = startRef.current;
    correctRef.current = 0;
    wrongRef.current = 0;
    rtListRef.current = [];
    congruentRtsRef.current = [];
    incongruentRtsRef.current = [];
    lastTapRef.current = 0;
    doneRef.current = false;
    pausedAtRef.current = 0;
    armTimers(durationMs);
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
      qStartRef.current += pauseDur;
      const remaining = durationMs - (performance.now() - startRef.current);
      if (remaining <= 0) {
        finish();
        return;
      }
      armTimers(remaining);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const q = questions[index];
  if (!q) return null;

  return (
    <div className="flex-1 flex flex-col px-4 pb-8 select-none">
      {/* 左は✕ボタンと重ならないよう余白を取る */}
      <div className="flex justify-between pt-3 pl-12 font-mono text-sm text-ink-2">
        <span>
          {t("measure.progress", { n: index + 1, total: totalQuestions })}
        </span>
        {!hideTimer && (
          <span>{t("measure.secondsLeft", { sec: remainSec })}</span>
        )}
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-5">
        <p className="text-[21px] text-ink-faint">{t("measure.stroop.hint")}</p>
        <p
          className="text-6xl font-bold"
          style={{ color: stroopInkHex[q.ink] }}
        >
          {STROOP_WORD_JA[q.word]}
        </p>
      </div>
      {/* 回答ボタン: STROOP_COLORS 固定順・固定位置(§3.1) */}
      <div className="grid grid-cols-4 gap-2">
        {STROOP_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onPointerDown={() => handleAnswer(c)}
            onClick={(e) => {
              // キーボード操作(§7): detail===0 はキーボード由来の click
              if (e.detail === 0) handleAnswer(c);
            }}
            className="flex flex-col items-center gap-1.5 py-3.5 rounded-2xl bg-white/70 backdrop-blur border border-white/80 shadow-glass active:bg-white/90"
          >
            <span
              aria-hidden
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: stroopInkHex[c] }}
            />
            <span className="text-sm text-ink">{STROOP_WORD_JA[c]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
