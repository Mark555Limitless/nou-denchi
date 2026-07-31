import { scoringConfig } from "@/lib/config";
import type { SessionSummary, TimeBand } from "./types";

/**
 * ベースライン(=自分の100%)ロジック。純粋関数のみ。保存は service 層が担当。
 *
 * 仕様(2026-07-31 ユーザー指示で§3.3を上書き):
 * 「その時点までに計測された最高スコア」が常に100%の基準(MAX)。
 * - 初回測定がそのままMAXになる(暫定基準・7回のベスト計測は廃止)
 * - MAXを超えるスコアが出たら、平均化せずそのスコアへ即時更新
 * - 時間帯別ベースライン(§3.3(c)改)は「その区分の直近90日のMAX」
 */

export interface BaselineComputation {
  value: number;
  sourceSessionIds: string[];
}

/**
 * MAX更新: 現在のMAXを超えるスコアが記録されたら、
 * そのスコアをそのまま新しいMAXとして返す。超えていなければ null(更新なし)。
 */
export function beatBaseline(
  currentValue: number,
  rawScore: number,
  sessionId: string,
): BaselineComputation | null {
  if (rawScore <= currentValue) return null;
  return { value: rawScore, sourceSessionIds: [sessionId] };
}

/**
 * 時間帯別ベースライン(§3.3(c)改):
 * 直近90日でその区分に3セッション以上ある場合のみ、区分内の最高スコアを返す。
 * 未達は null(全体MAXを使用)。
 */
export function computeTimeBandBaseline(
  sessions: SessionSummary[],
  band: TimeBand,
  now: number,
  cfg = scoringConfig,
): BaselineComputation | null {
  const windowStart = now - cfg.baseline.rollingWindowDays * 86_400_000;
  const inBand = sessions.filter(
    (s) => s.timeBand === band && s.startedAt >= windowStart,
  );
  if (inBand.length < cfg.baseline.minSessionsPerBand) return null;
  const best = inBand.reduce((a, b) => (b.rawScore > a.rawScore ? b : a));
  return { value: best.rawScore, sourceSessionIds: [best.id] };
}
