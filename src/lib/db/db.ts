import Dexie, { type EntityTable } from "dexie";
import type {
  AgeBand,
  BaselineScope,
  BaselineType,
  TaskResults,
  TimeBand,
} from "@/lib/engine/types";

/**
 * IndexedDB スキーマ(§5)。ローカルファースト・外部送信なし。
 * schemaVersion をレコードに持たせ、将来マイグレーション可能にする。
 */

export interface UserProfile {
  /** ローカルUUID(単一プロファイル運用。固定IDで保存) */
  id: string;
  ageBand?: AgeBand;
  isShiftWorker: boolean;
  createdAt: number;
  schemaVersion: number;
  /** ベースライン再計測(§4.6)でこの時刻以降のセッションのみを対象にする */
  calibrationStartAt: number;
  /** 通知時刻の目安(端末通知は行わず文言表示のみ・§4.1) */
  reminderNote?: string;
}

export interface SessionRecord {
  id: string;
  /** epoch ms */
  startedAt: number;
  timeBand: TimeBand;
  taskResults: TaskResults;
  /** 総合スコア S */
  rawScore: number;
  /** 実値の%(表示クリップ前)。 */
  percent: number | null;
  baselineType: BaselineType;
  /** ベスト計測ウィーク中の測定か */
  isCalibration: boolean;
  /** 出題生成に使ったシード(決定論・再現用) */
  seed: string;
  /**
   * このセッションで実際に生成した計算問題のシグネチャ(先頭24件)。
   * 次回セッションの重複回避(§3.1 練習効果対策)に使う。
   */
  mathSigs?: string[];
  schemaVersion: number;
}

export interface BaselineRecord {
  scope: BaselineScope;
  /** 上位3平均スコア */
  value: number;
  sourceSessionIds: string[];
  updatedAt: number;
}

export const db = new Dexie("nou-denchi") as Dexie & {
  profile: EntityTable<UserProfile, "id">;
  sessions: EntityTable<SessionRecord, "id">;
  baselines: EntityTable<BaselineRecord, "scope">;
};

db.version(1).stores({
  profile: "id",
  sessions: "id, startedAt, timeBand",
  baselines: "scope",
});
