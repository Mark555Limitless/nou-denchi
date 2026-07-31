"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  generateMathProblems,
  mathSignature,
  type MathProblem,
} from "@/lib/engine/mathGen";
import {
  generateStroopQuestions,
  type StroopQuestion,
} from "@/lib/engine/stroopGen";
import type {
  MathResult,
  PvtResult,
  StroopResult,
  TaskResults,
} from "@/lib/engine/types";
import { playBellChord } from "@/lib/audio/sfx";
import { getLatestSession, getProfile } from "@/lib/db/repo";
import { completeSession } from "@/lib/service/measurement";
import { t } from "@/lib/i18n";
import { Countdown } from "./Countdown";
import { Interstitial } from "./Interstitial";
import { PvtTask } from "./PvtTask";
import { MathTask } from "./MathTask";
import { StroopTask } from "./StroopTask";
import { ExitConfirmDialog } from "./ExitConfirmDialog";

/**
 * 測定フロー状態機械(§3.1 / §4.3)。
 * loading → countdown → pvt → interMath → math → interStroop → stroop → saving。
 * 保存は completeSession のみが行い、途中離脱では何も保存しない。
 */

type FlowPhase =
  | "loading"
  | "countdown"
  | "pvt"
  | "interMath"
  | "math"
  | "interStroop"
  | "stroop"
  | "saving";

/** 前回セッションの出題を回避するために再現する問題数(§3.1 練習効果対策) */
const AVOID_PREV_COUNT = 24;
/** 今回セッションで先読み生成しておく計算問題数(30秒では使い切らない量) */
const MATH_POOL_COUNT = 60;

export function MeasureFlow() {
  const router = useRouter();
  const [phase, setPhase] = useState<FlowPhase>("loading");
  const [exitOpen, setExitOpen] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [seed, setSeed] = useState("");
  const [mathProblems, setMathProblems] = useState<MathProblem[] | null>(null);
  const [stroopQuestions, setStroopQuestions] = useState<
    StroopQuestion[] | null
  >(null);

  const startedAtRef = useRef(0);
  const pvtRef = useRef<PvtResult | null>(null);
  const mathRef = useRef<MathResult | null>(null);
  const stroopRef = useRef<StroopResult | null>(null);
  const initRef = useRef(false);
  const savedRef = useRef(false);

  // 初期化: プロフィール確認 → seed/startedAt 確定 → 出題を先読み生成
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    (async () => {
      const profile = await getProfile();
      if (!profile) {
        router.replace("/onboarding/");
        return;
      }
      const newSeed = crypto.randomUUID();
      startedAtRef.current = Date.now();
      // 直近セッションで実際に出題された問題(保存済みシグネチャ)を回避する(§3.1)
      const latest = await getLatestSession();
      const avoid = latest?.mathSigs?.length
        ? new Set(latest.mathSigs)
        : undefined;
      setSeed(newSeed);
      setMathProblems(generateMathProblems(newSeed, MATH_POOL_COUNT, avoid));
      setStroopQuestions(generateStroopQuestions(newSeed));
      setPhase("countdown");
    })();
  }, [router]);

  // 完了処理: 採点・保存・ベースライン遷移は completeSession に一任
  useEffect(() => {
    if (phase !== "saving" || savedRef.current) return;
    savedRef.current = true;
    (async () => {
      try {
        const taskResults: TaskResults = {
          pvt: pvtRef.current!,
          math: mathRef.current!,
          stroop: stroopRef.current!,
        };
        // 次回の重複回避用に、今回の出題プール先頭のシグネチャを保存する(§3.1)
        const mathSigs = (mathProblems ?? [])
          .slice(0, AVOID_PREV_COUNT)
          .map(mathSignature);
        const r = await completeSession(
          taskResults,
          startedAtRef.current,
          seed,
          mathSigs,
        );
        router.replace(
          `/result/?sid=${r.session.id}&new=1` +
            (r.baselineConfirmedNow ? "&confirmed=1" : "") +
            (r.bestUpdated ? "&best=1" : ""),
        );
      } catch (e) {
        console.error("completeSession failed", e);
        setSaveFailed(true);
      }
    })();
  }, [phase, router, seed, mathProblems]);

  const handleQuit = () => {
    // 中断: 何も保存せずホームへ
    router.replace("/");
  };

  return (
    <div
      className="relative flex-1 flex flex-col"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* 没入設計: 測定中のUIは左上の小さい✕のみ(§4.3) */}
      {phase !== "saving" && (
        <button
          type="button"
          aria-label={t("measure.exit.aria")}
          onClick={() => setExitOpen(true)}
          className="absolute top-1 left-1 z-20 w-11 h-11 flex items-center justify-center text-xl text-ink-mute"
          style={{ marginTop: "env(safe-area-inset-top)" }}
        >
          ✕
        </button>
      )}

      {phase === "countdown" && (
        <Countdown onDone={() => setPhase("pvt")} />
      )}

      {phase === "pvt" && (
        <PvtTask
          seed={seed}
          paused={exitOpen}
          onDone={(r) => {
            pvtRef.current = r;
            setPhase("interMath");
          }}
        />
      )}

      {phase === "interMath" && (
        <Interstitial
          label={t("task.math.label")}
          desc={t("measure.math.desc")}
          paused={exitOpen}
          onDone={() => setPhase("math")}
        />
      )}

      {phase === "math" && mathProblems && (
        <MathTask
          problems={mathProblems}
          paused={exitOpen}
          onDone={(r) => {
            mathRef.current = r;
            setPhase("interStroop");
          }}
        />
      )}

      {phase === "interStroop" && (
        <Interstitial
          label={t("task.stroop.label")}
          desc={t("measure.stroop.desc")}
          paused={exitOpen}
          onDone={() => setPhase("stroop")}
        />
      )}

      {phase === "stroop" && stroopQuestions && (
        <StroopTask
          questions={stroopQuestions}
          paused={exitOpen}
          onDone={(r) => {
            stroopRef.current = r;
            // 測定完了の祝福(グラスベル和音)。計時はすべて確定済み
            playBellChord();
            setPhase("saving");
          }}
        />
      )}

      {phase === "saving" && !saveFailed && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <p className="text-lg text-ink-2">{t("measure.saving")}</p>
        </div>
      )}

      {phase === "saving" && saveFailed && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <h2 className="text-lg font-bold text-ink">
            {t("measure.saveError.title")}
          </h2>
          <p className="text-sm text-ink-2 leading-relaxed">
            {t("measure.saveError.body")}
          </p>
          <button
            type="button"
            onClick={() => router.replace("/")}
            className="w-full max-w-xs h-12 rounded-xl bg-surface-3 font-bold text-ink"
          >
            {t("measure.saveError.home")}
          </button>
        </div>
      )}

      {exitOpen && phase !== "saving" && (
        <ExitConfirmDialog
          onContinue={() => setExitOpen(false)}
          onQuit={handleQuit}
        />
      )}
    </div>
  );
}
