"use client";

import { useState } from "react";
import { playBellChord, playBellSoft } from "@/lib/audio/sfx";
import { generateMathProblems, type MathProblem } from "@/lib/engine/mathGen";
import type { MathResult } from "@/lib/engine/types";
import { t } from "@/lib/i18n";
import { MathTask } from "@/components/measure/MathTask";
import {
  TrainingDone,
  TrainingExit,
  TrainingIntro,
} from "./TrainingShell";

/**
 * トレオタ: 処理速度トレーニング(単純計算 × 2分)。
 * 計測フローと同じ MathTask を durationMsOverride=120000 で再利用する。
 * 出題プールは 300問(2分では使い切らない量)。avoid 回避は不要(§指示[6])。
 * DB保存は一切しない。
 */

const DURATION_MS = 120_000;
const POOL_COUNT = 300;

type Stage = "intro" | "running" | "done";

export function MathTraining() {
  const [stage, setStage] = useState<Stage>("intro");
  const [problems, setProblems] = useState<MathProblem[] | null>(null);
  const [result, setResult] = useState<MathResult | null>(null);

  const start = () => {
    const seed = crypto.randomUUID();
    setProblems(generateMathProblems(seed, POOL_COUNT));
    setResult(null);
    playBellSoft();
    setStage("running");
  };

  return (
    <div
      className="relative flex flex-1 flex-col"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <TrainingExit />

      {stage === "intro" && (
        <TrainingIntro
          title={t("training.math.title")}
          meta={t("training.math.meta")}
          desc={t("training.math.desc")}
          onStart={start}
        />
      )}

      {stage === "running" && problems && (
        <MathTask
          problems={problems}
          paused={false}
          durationMsOverride={DURATION_MS}
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
              label: t("training.math.result.correct"),
              value: String(result.correct),
              unit: t("training.unit.count"),
            },
          ]}
          onRetry={start}
        />
      )}
    </div>
  );
}
