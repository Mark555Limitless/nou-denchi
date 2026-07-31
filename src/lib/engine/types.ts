/**
 * 測定エンジン共通型。
 * UI・DBに依存しない純粋モジュール(将来のネイティブ移植・B2B転用を想定 §2)。
 */

export type TimeBand = "morning" | "day" | "evening" | "night";
export type AgeBand = "10s" | "20s" | "30s" | "40s" | "50s" | "60s+";
export type Zone = "green" | "yellow" | "orange" | "red";
export type BaselineType = "provisional" | "personal" | "personalTimeBand";
export type BaselineScope = "global" | TimeBand;

export interface PvtResult {
  /** 各有効試行の反応時間(ms) */
  trials: number[];
  /** 500ms超の試行数 */
  lapses: number;
  /** 出現前タップの回数(該当試行は再実行済み) */
  falseStarts: number;
}

export interface MathResult {
  correct: number;
  wrong: number;
  /** 各問の回答時間(ms) */
  rtList: number[];
  /** 実測タスク時間(ms) */
  durationMs: number;
}

export interface StroopResult {
  correct: number;
  wrong: number;
  rtList: number[];
  /** 不一致条件RT平均 − 一致条件RT平均(ms) */
  interferenceMs: number;
  /** 実測タスク時間(ms)。仕様interfaceへの追加フィールド(DECISIONS.md参照) */
  durationMs: number;
}

export interface TaskResults {
  pvt: PvtResult;
  math: MathResult;
  stroop: StroopResult;
}

export interface TaskScores {
  pvt: number;
  math: number;
  stroop: number;
}

export interface SessionScore {
  /** scoreA/B/C の生値 */
  taskScores: TaskScores;
  /** 固定参照定数(config.normRef)で正規化した値 */
  norm: TaskScores;
  /** 総合スコア S = Σ weight × norm */
  rawScore: number;
}

/** ベースライン計算に必要な最小限のセッション情報 */
export interface SessionSummary {
  id: string;
  startedAt: number;
  timeBand: TimeBand;
  rawScore: number;
  isCalibration: boolean;
}
