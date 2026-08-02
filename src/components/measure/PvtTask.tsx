"use client";

/* eslint-disable react-hooks/purity --
 * 反応時間の計測(§2・受け入れ基準4)には performance.now() が必須。
 * 呼び出しはイベント・タイマー・rAF コールバック内のみで、レンダー中には実行されない。 */

import { useEffect, useRef, useState } from "react";
import {
  playMeasureBad,
  playPvtFalseStart,
  playPvtTap,
} from "@/lib/audio/sfx";
import { scoringConfig } from "@/lib/config";
import { createRng, type Rng } from "@/lib/engine/prng";
import type { PvtResult } from "@/lib/engine/types";
import { t } from "@/lib/i18n";
import { PvtInstruction } from "./PvtInstruction";

/**
 * Task A: PVT簡易版(§3.1)。
 * 2〜6秒のランダム待機(シード決定論)→ 円出現 → 画面のどこでも pointerdown
 * (またはキーボードの Space/Enter)で反応。
 * RT基準時刻は state 更新後 rAF 2段で描画反映に極力近づける。
 *
 * 競合対策: 各試行に「トークン」を割り当て、rAF・タイムアウトのコールバックは
 * 発行時のトークンが現在と一致する場合のみ有効。刺激出現の直前タップ
 * (旧レンダー参照の False Start)でも、進行中の rAF/タイマーを完全に破棄して
 * 架空のタイムアウト試行が記録されないようにする。
 */

type PvtPhase = "waiting" | "shown" | "feedback" | "falseStart";

interface PvtTaskProps {
  seed: string;
  /** 中断確認ダイアログ表示中は試行を止める(再開時はその試行を新しい待機でやり直し) */
  paused: boolean;
  /** トレーニング用: 試行数の上書き(未指定時は config 値=従来挙動) */
  trialsOverride?: number;
  onDone: (result: PvtResult) => void;
}

/** 有効試行の記録後、次の待機に入るまでの結果表示時間 */
const FEEDBACK_MS = 600;
/** False Start 警告の表示時間 */
const FALSE_START_MS = 900;

export function PvtTask({ seed, paused, trialsOverride, onDone }: PvtTaskProps) {
  const cfg = scoringConfig.pvt;
  const totalTrials = trialsOverride ?? cfg.trials;
  const [phase, setPhase] = useState<PvtPhase>("waiting");
  const [trialNo, setTrialNo] = useState(1);
  const [lastRt, setLastRt] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  // ランダム待機はシード決定論(seed + ':pvt')
  const rngRef = useRef<Rng | null>(null);
  if (rngRef.current === null) rngRef.current = createRng(`${seed}:pvt`);

  const trialsRef = useRef<number[]>([]);
  const falseStartsRef = useRef(0);
  /** 0 = 刺激未表示(描画確定前) */
  const shownAtRef = useRef(0);
  /** レンダーの phase state と同期しない即時参照(競合窓の排除) */
  const phaseRef = useRef<PvtPhase>("waiting");
  /** 試行の有効性トークン。遷移のたびに増分し、stale なコールバックを無効化 */
  const tokenRef = useRef(0);
  const waitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef(0);
  const msElRef = useRef<HTMLSpanElement | null>(null);
  const doneRef = useRef(false);
  const pausedRef = useRef(paused);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  function transition(p: PvtPhase) {
    phaseRef.current = p;
    setPhase(p);
  }

  function clearTrialCallbacks() {
    if (waitTimerRef.current !== null) {
      clearTimeout(waitTimerRef.current);
      waitTimerRef.current = null;
    }
    if (stimTimerRef.current !== null) {
      clearTimeout(stimTimerRef.current);
      stimTimerRef.current = null;
    }
    cancelAnimationFrame(rafRef.current);
    shownAtRef.current = 0;
  }

  function clearAll() {
    clearTrialCallbacks();
    if (nextTimerRef.current !== null) {
      clearTimeout(nextTimerRef.current);
      nextTimerRef.current = null;
    }
  }

  function startWait() {
    if (doneRef.current) return;
    if (trialsRef.current.length >= totalTrials) {
      finish();
      return;
    }
    tokenRef.current += 1;
    clearTrialCallbacks();
    setTimedOut(false);
    setLastRt(null);
    setTrialNo(trialsRef.current.length + 1);
    transition("waiting");
    const delay = rngRef.current!.int(cfg.minIntervalMs, cfg.maxIntervalMs);
    waitTimerRef.current = setTimeout(showStimulus, delay);
  }

  function showStimulus() {
    waitTimerRef.current = null;
    const token = tokenRef.current;
    transition("shown");
    // 描画反映後(rAF 2段)に基準時刻を確定し、タイムアウトとカウンタを開始
    rafRef.current = requestAnimationFrame(() => {
      if (token !== tokenRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        if (token !== tokenRef.current) return;
        shownAtRef.current = performance.now();
        stimTimerRef.current = setTimeout(() => {
          if (token !== tokenRef.current) return;
          handleTimeout();
        }, cfg.timeoutMs);
        tickCounter(token);
      });
    });
  }

  /** 出現からの経過msをカウントアップ表示(再レンダーを避け DOM 直接更新) */
  function tickCounter(token: number) {
    if (token !== tokenRef.current) return;
    const el = msElRef.current;
    if (el && shownAtRef.current > 0) {
      el.textContent = String(
        Math.max(0, Math.round(performance.now() - shownAtRef.current)),
      );
    }
    rafRef.current = requestAnimationFrame(() => tickCounter(token));
  }

  function recordTrial(rt: number, wasTimeout: boolean) {
    tokenRef.current += 1;
    clearTrialCallbacks();
    trialsRef.current.push(rt);
    setLastRt(Math.round(rt));
    setTimedOut(wasTimeout);
    // 効果音は判定確定後のみ。刺激出現時には鳴らさない(聴覚反応化の防止)
    if (wasTimeout) playMeasureBad();
    else playPvtTap();
    transition("feedback");
    nextTimerRef.current = setTimeout(() => {
      nextTimerRef.current = null;
      if (trialsRef.current.length >= totalTrials) finish();
      else startWait();
    }, FEEDBACK_MS);
  }

  function handleTimeout() {
    stimTimerRef.current = null;
    // 無応答: RT=timeoutMs として記録(Lapse は閾値超えとして自動計上)
    recordTrial(cfg.timeoutMs, true);
  }

  function finish() {
    if (doneRef.current) return;
    doneRef.current = true;
    tokenRef.current += 1;
    clearAll();
    const trials = trialsRef.current;
    const lapses = trials.filter((rt) => rt > cfg.lapseThresholdMs).length;
    onDoneRef.current({ trials, lapses, falseStarts: falseStartsRef.current });
  }

  function respond() {
    if (doneRef.current || pausedRef.current) return;
    // レンダー済み state ではなく phaseRef を見る(刺激出現直前タップの競合窓を排除)
    if (phaseRef.current === "waiting") {
      // False Start: 進行中のコールバックを全破棄 → 警告 → 同じ試行を新しい待機で再実行
      tokenRef.current += 1;
      clearTrialCallbacks();
      falseStartsRef.current += 1;
      playPvtFalseStart();
      transition("falseStart");
      nextTimerRef.current = setTimeout(() => {
        nextTimerRef.current = null;
        startWait();
      }, FALSE_START_MS);
    } else if (phaseRef.current === "shown") {
      // 描画確定前(視認不可能なタイミング)は無視
      if (shownAtRef.current === 0) return;
      recordTrial(performance.now() - shownAtRef.current, false);
    }
    // feedback / falseStart 中の連打は無視(二重発火防止)
  }

  useEffect(() => {
    if (paused) return;
    if (doneRef.current) return;
    startWait();
    return clearAll;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  // キーボード対応(§7): Space / Enter でも反応できる
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        respond();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    // 全画面(セーフエリア・ナビ余白も含む)をタップ判定にする(受け入れ基準4対策)
    <div
      className="fixed inset-0 z-10 flex flex-col select-none"
      onPointerDown={respond}
    >
      <div
        className="mx-auto w-full flex-1 flex flex-col items-center"
        style={{
          maxWidth: "var(--app-max-w)",
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        <p className="pt-3 font-mono text-sm text-ink-2">
          {t("measure.progress", { n: trialNo, total: totalTrials })}
        </p>
        <div className="flex-1 flex flex-col items-center justify-center gap-6 w-full">
          {phase === "waiting" && (
            <p className="text-lg text-ink-2">{t("measure.pvt.waiting")}</p>
          )}
          {phase === "shown" && (
            <div className="relative w-44 h-44 rounded-full bg-radial-[at_35%_28%] from-[#9fd0f2] via-[#4a8ad8] to-[#1d4e96] shadow-lg shadow-primary/40 ring-1 ring-white/60 flex flex-col items-center justify-center">
              {/* 水滴をまとった青いガラスのオーブ(装飾レイヤー) */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full bg-radial-[at_50%_120%] from-white/35 via-white/0 to-white/0"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-6 top-3 h-14 rounded-full bg-linear-to-b from-white/60 to-white/0 blur-[2px]"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute right-8 top-10 size-3 rounded-full bg-white/70 blur-[1px]"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute left-9 bottom-9 size-2 rounded-full bg-white/50 blur-[1px]"
              />
              <span
                ref={msElRef}
                className="relative font-mono text-4xl text-white"
              >
                0
              </span>
              <span className="relative font-mono text-sm text-white">
                {t("measure.msUnit")}
              </span>
            </div>
          )}
          {phase === "feedback" &&
            (timedOut ? (
              <p className="text-2xl font-bold text-zone-orange-text">
                {t("measure.pvt.timeout")}
              </p>
            ) : (
              <p className="font-mono text-5xl text-ink">
                {lastRt}
                <span className="text-xl text-ink-mute">
                  {" "}
                  {t("measure.msUnit")}
                </span>
              </p>
            ))}
          {phase === "falseStart" && (
            <p className="text-2xl font-bold text-zone-orange-text">
              {t("measure.falseStart")}
            </p>
          )}
        </div>
        {/* 下部ヒント(2段組み): モック準拠の濃紺。375px 級の狭い端末でも
            各行が折り返さないよう 8.5vw を上限併用(min())する */}
        <PvtInstruction
          className="pb-10 text-center text-[min(1.5rem,8.5vw)] leading-snug text-ink-2"
          iconClassName="w-6 h-6 align-[-3px]"
          style={{ paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))" }}
        />
      </div>
    </div>
  );
}
