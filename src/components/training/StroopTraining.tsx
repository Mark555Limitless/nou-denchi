"use client";

import { useState } from "react";
import { playBellChord, playBellSoft } from "@/lib/audio/sfx";
import {
  generateStroopQuestions,
  type StroopQuestion,
} from "@/lib/engine/stroopGen";
import type { StroopResult } from "@/lib/engine/types";
import { t } from "@/lib/i18n";
import { StroopTask } from "@/components/measure/StroopTask";
import {
  TrainingDone,
  TrainingExit,
  TrainingIntro,
} from "./TrainingShell";

/**
 * トレオタ: 切替力トレーニング(ストループ × 50問)。
 * 計測フローと同じ StroopTask を 50問・時間無制限相当
 * (durationMsOverride=60分・残り秒表示なし)で再利用する。
 * DB保存は一切しない。
 */

const QUESTIONS = 50;
/** 「時間無制限相当」の上限(60分。50問でほぼ確実に先に到達する) */
const UNLIMITED_MS = 3_600_000;

type Stage = "intro" | "running" | "done";

export function StroopTraining() {
  const [stage, setStage] = useState<Stage>("intro");
  const [questions, setQuestions] = useState<StroopQuestion[] | null>(null);
  const [result, setResult] = useState<StroopResult | null>(null);

  const start = () => {
    const seed = crypto.randomUUID();
    setQuestions(generateStroopQuestions(seed, QUESTIONS));
    setResult(null);
    playBellSoft();
    setStage("running");
  };

  const avgRt =
    result && result.rtList.length > 0
      ? Math.round(
          result.rtList.reduce((a, b) => a + b, 0) / result.rtList.length,
        )
      : 0;

  return (
    <div
      className="relative flex flex-1 flex-col"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <TrainingExit />

      {stage === "intro" && (
        <TrainingIntro
          title={t("training.stroop.title")}
          meta={t("training.stroop.meta")}
          desc={t("training.stroop.desc")}
          onStart={start}
        />
      )}

      {stage === "running" && questions && (
        <StroopTask
          questions={questions}
          paused={false}
          maxQuestionsOverride={QUESTIONS}
          durationMsOverride={UNLIMITED_MS}
          hideTimer
          onDone={(r) => {
            setResult(r);
            playBellChord();
            setStage("done");
          }}
        />
      )}

      {stage === "done" && result && (
        <TrainingDone
          stats={[
            {
              label: t("training.stroop.result.correct"),
              value: String(result.correct),
              unit: t("training.unit.count"),
            },
            {
              label: t("training.stroop.result.avgRt"),
              value: String(avgRt),
              unit: t("training.unit.ms"),
            },
          ]}
          onRetry={start}
        />
      )}
    </div>
  );
}
