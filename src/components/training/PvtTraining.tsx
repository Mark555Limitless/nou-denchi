"use client";

import { useState } from "react";
import { playBellChord, playBellSoft } from "@/lib/audio/sfx";
import type { PvtResult } from "@/lib/engine/types";
import { t } from "@/lib/i18n";
import { PvtTask } from "@/components/measure/PvtTask";
import {
  TrainingDone,
  TrainingExit,
  TrainingIntro,
} from "./TrainingShell";

/**
 * トレオタ: 覚醒度トレーニング(PVT × 30回)。
 * 計測フローと同じ PvtTask を trialsOverride=30 で再利用する。
 * DB保存は一切しない(結果はその場で表示するだけ)。
 */

const TRIALS = 30;

type Stage = "intro" | "running" | "done";

export function PvtTraining() {
  const [stage, setStage] = useState<Stage>("intro");
  const [seed, setSeed] = useState("");
  const [result, setResult] = useState<PvtResult | null>(null);

  const start = () => {
    setSeed(crypto.randomUUID());
    setResult(null);
    playBellSoft();
    setStage("running");
  };

  const avgRt =
    result && result.trials.length > 0
      ? Math.round(
          result.trials.reduce((a, b) => a + b, 0) / result.trials.length,
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
          title={t("training.pvt.title")}
          meta={t("training.pvt.meta")}
          desc={t("training.pvt.desc")}
          onStart={start}
        />
      )}

      {stage === "running" && (
        <PvtTask
          seed={seed}
          paused={false}
          trialsOverride={TRIALS}
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
              label: t("training.pvt.result.avgRt"),
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
