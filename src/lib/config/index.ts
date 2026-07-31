import type { Zone } from "@/lib/engine/types";

export const SCHEMA_VERSION = 1;
export const APP_NAME = "脳でんち";

/** Phase 2 を見据えた機能フラグ(§8)。MVPでは全機能開放・ゲーティングなし。 */
export const featureFlags = {
  premiumGating: false,
  aiCoach: false,
  /** §3.3(c) 時間帯別ベースライン(SHOULD) */
  timeBandBaseline: true,
} as const;

/**
 * スコア算出の全定数(§3.2)。重み等はここでのみ変更する。
 * normRef は各タスクスコアを無次元化する固定参照定数(DECISIONS.md Q1)。
 */
export const scoringConfig = {
  weights: { pvt: 0.4, math: 0.3, stroop: 0.3 },
  normRef: { pvt: 3.4, math: 0.4, stroop: 0.5 },
  /** 反応時間の上下5%タイルトリム(§3.2) */
  trimRatio: 0.05,
  pvt: {
    trials: 8,
    minIntervalMs: 2000,
    /** 待ち時間の上限(2026-07-31 ユーザー指示[2]: 最大4秒に短縮) */
    maxIntervalMs: 4000,
    lapseThresholdMs: 500,
    /** 無応答タイムアウト。RT=timeoutMs として記録し Lapse 計上(DECISIONS.md Q5) */
    timeoutMs: 3000,
    lapsePenalty: 0.05,
    falseStartPenalty: 0.03,
  },
  math: {
    durationMs: 30_000,
    /** 難易度分布 易:中 = 6:4 (§3.1 Task B) — 5問ブロックあたりの内訳 */
    easyPerBlock: 3,
    mediumPerBlock: 2,
    /**
     * 誤答ペナルティ(2026-07-31 ユーザー指示[4]):
     * 誤答1問につき実効経過時間に加算するms。速く押しても間違えれば
     * 「遅い回答」(PVTのタイムアウト=Failedと同等)として扱う。
     */
    wrongPenaltyMs: 3000,
  },
  stroop: {
    maxQuestions: 20,
    durationMs: 30_000,
    /** 一致:不一致 = 1:2 (§3.1 Task C) */
    congruentRatio: 1 / 3,
    /** 干渉量補正: clamp(1 − max(0, 干渉 − ref) × slope, min, 1) (DECISIONS.md Q2) */
    interferenceRefMs: 150,
    interferenceSlopePerMs: 0.001,
    interferenceMinCorrection: 0.8,
  },
  /** 表示上限クリップ(§3.2)。保存値は実値のまま。 */
  percentDisplayCap: 105,
  /**
   * ベースライン=「その時点までのMAXスコア」(2026-07-31 §3.3上書き)。
   * rollingWindowDays / minSessionsPerBand は時間帯別MAX(§3.3(c)改)にのみ使用。
   */
  baseline: {
    rollingWindowDays: 90,
    minSessionsPerBand: 3,
  },
} as const;

export type ScoringConfig = typeof scoringConfig;

/**
 * ゾーニング(§4.2)。色はラベル文言と必ず併記する(色覚多様性対応 §7)。
 * hex は検証済みステータスパレット(シェアカードCanvas描画でも使用)。
 */
export interface ZoneDef {
  zone: Zone;
  /** この値以上でこのゾーン */
  min: number;
  hex: string;
}

export const zoneDefs: readonly ZoneDef[] = [
  { zone: "green", min: 90, hex: "#0ca30c" },
  { zone: "yellow", min: 70, hex: "#fab219" },
  { zone: "orange", min: 50, hex: "#ec835a" },
  { zone: "red", min: 0, hex: "#d03b3b" },
] as const;

/** 白面上で「文字」として使う場合のゾーン色(コントラスト4.5:1以上を検証済み) */
export const zoneTextHex: Record<Zone, string> = {
  green: "#077f07",
  yellow: "#8a6100",
  orange: "#b5490f",
  red: "#d03b3b",
};

/** ブランドカラー(キャッチ&ロゴ05準拠)。Canvas 描画等で使用。 */
export const brandColors = {
  navy: "#232f5c",
  blue: "#256abf",
  cyan: "#29b6e8",
  amber: "#f5a623",
  surface: "#ffffff",
  surfaceTint: "#f2f6fb",
} as const;

/** ストループ課題のインク色(刺激色)。原色として明確に認識できる彩度を優先。 */
export const stroopInkHex = {
  red: "#ef4444",
  blue: "#3b82f6",
  green: "#22c55e",
  yellow: "#fde047",
} as const;
