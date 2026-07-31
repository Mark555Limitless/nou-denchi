import { scoringConfig, zoneDefs } from "@/lib/config";
import type {
  MathResult,
  PvtResult,
  SessionScore,
  StroopResult,
  TaskResults,
  Zone,
} from "./types";

/**
 * スコア算出ロジック(§3.2)。すべて決定論的な純粋関数(単体テスト対象・MUST)。
 */

/** 上下 trimRatio 分位をトリムした平均(§3.2 外れ値処理) */
export function trimmedMean(
  values: number[],
  trimRatio: number = scoringConfig.trimRatio,
): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const k = Math.floor(sorted.length * trimRatio);
  const kept = sorted.slice(k, sorted.length - k);
  return kept.reduce((s, v) => s + v, 0) / kept.length;
}

/** Task A: scoreA = 1000 / meanRT に Lapse −5%/回・FalseStart −3%/回 のペナルティ */
export function scorePvt(r: PvtResult, cfg = scoringConfig): number {
  if (r.trials.length === 0) return 0;
  const meanRt = trimmedMean(r.trials, cfg.trimRatio);
  if (meanRt <= 0) return 0;
  const penalty = Math.max(
    0,
    1 - cfg.pvt.lapsePenalty * r.lapses - cfg.pvt.falseStartPenalty * r.falseStarts,
  );
  return (1000 / meanRt) * penalty;
}

/** 正答率補正 = 正答率^1.5(無回答は 0) */
export function accuracyCorrection(correct: number, wrong: number): number {
  const total = correct + wrong;
  if (total === 0) return 0;
  return Math.pow(correct / total, 1.5);
}

/**
 * Task B: scoreB = 正答数/実効経過秒 × 正答率^1.5
 * 実効経過秒 = 経過秒 + 誤答数 × wrongPenaltyMs(2026-07-31 [4]):
 * 反応が速くても誤答はタイムアウト(Failed)相当の遅い回答として速度に反映する。
 */
export function scoreMath(r: MathResult, cfg = scoringConfig): number {
  const sec = (r.durationMs + r.wrong * cfg.math.wrongPenaltyMs) / 1000;
  if (sec <= 0) return 0;
  return (r.correct / sec) * accuracyCorrection(r.correct, r.wrong);
}

/**
 * 干渉量補正(DECISIONS.md Q2):
 * clamp(1 − max(0, 干渉ms − ref) × slope, min, 1)
 * 干渉が小さい(切替コストが低い)ほど 1.0 に近づく。
 */
export function interferenceCorrection(
  interferenceMs: number,
  cfg = scoringConfig,
): number {
  const { interferenceRefMs, interferenceSlopePerMs, interferenceMinCorrection } =
    cfg.stroop;
  const c =
    1 - Math.max(0, interferenceMs - interferenceRefMs) * interferenceSlopePerMs;
  return Math.min(1, Math.max(interferenceMinCorrection, c));
}

/** Task C: scoreC = 正答数/経過秒 × 正答率^1.5 × 干渉量補正 */
export function scoreStroop(r: StroopResult, cfg = scoringConfig): number {
  const sec = r.durationMs / 1000;
  if (sec <= 0) return 0;
  return (
    (r.correct / sec) *
    accuracyCorrection(r.correct, r.wrong) *
    interferenceCorrection(r.interferenceMs, cfg)
  );
}

/** 干渉量 = 不一致条件RT平均 − 一致条件RT平均(正答試行のみを渡すこと) */
export function computeInterference(
  congruentRts: number[],
  incongruentRts: number[],
): number {
  if (congruentRts.length === 0 || incongruentRts.length === 0) return 0;
  const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
  return mean(incongruentRts) - mean(congruentRts);
}

/** 総合スコア S = 0.40×normA + 0.30×normB + 0.30×normC (§3.2) */
export function scoreSession(
  tr: TaskResults,
  cfg = scoringConfig,
): SessionScore {
  const taskScores = {
    pvt: scorePvt(tr.pvt, cfg),
    math: scoreMath(tr.math, cfg),
    stroop: scoreStroop(tr.stroop, cfg),
  };
  const norm = {
    pvt: taskScores.pvt / cfg.normRef.pvt,
    math: taskScores.math / cfg.normRef.math,
    stroop: taskScores.stroop / cfg.normRef.stroop,
  };
  const rawScore =
    cfg.weights.pvt * norm.pvt +
    cfg.weights.math * norm.math +
    cfg.weights.stroop * norm.stroop;
  return { taskScores, norm, rawScore };
}

/** 今日の判断力% = round(S ÷ ベースラインS × 100) */
export function computePercent(rawScore: number, baselineValue: number): number {
  if (baselineValue <= 0) return 0;
  return Math.round((rawScore / baselineValue) * 100);
}

export interface DisplayPercent {
  value: number;
  /** 105%超(表示は105にクリップし「絶好調!」を出す) */
  overCap: boolean;
}

/** 表示用クリップ(§3.2)。保存値は実値のまま。 */
export function displayPercent(
  percent: number,
  cap: number = scoringConfig.percentDisplayCap,
): DisplayPercent {
  return percent > cap
    ? { value: cap, overCap: true }
    : { value: percent, overCap: false };
}

/** ゾーニング(§4.2) */
export function zoneOf(percent: number): Zone {
  for (const def of zoneDefs) {
    if (percent >= def.min) return def.zone;
  }
  return "red";
}
