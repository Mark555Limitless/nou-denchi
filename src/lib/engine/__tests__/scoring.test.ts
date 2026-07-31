import { describe, expect, it } from "vitest";
import { scoringConfig } from "@/lib/config";
import type { TaskResults } from "../types";
import {
  accuracyCorrection,
  computeInterference,
  computePercent,
  displayPercent,
  interferenceCorrection,
  scoreMath,
  scorePvt,
  scoreSession,
  scoreStroop,
  trimmedMean,
  zoneOf,
} from "../scoring";

describe("trimmedMean", () => {
  it("上下5%タイルをトリムする(20件 → 両端1件ずつ除外)", () => {
    const values = Array.from({ length: 20 }, (_, i) => i + 1); // 1..20
    // 2..19 の平均 = 10.5
    expect(trimmedMean(values, 0.05)).toBe(10.5);
  });

  it("8件では実質トリムなし(floor(8×0.05)=0)", () => {
    const values = [100, 200, 300, 400, 500, 600, 700, 800];
    expect(trimmedMean(values, 0.05)).toBe(450);
  });

  it("空配列は 0", () => {
    expect(trimmedMean([], 0.05)).toBe(0);
  });
});

describe("scorePvt (Task A)", () => {
  it("基準式 1000/meanRT", () => {
    const r = { trials: Array(8).fill(300), lapses: 0, falseStarts: 0 };
    expect(scorePvt(r)).toBeCloseTo(1000 / 300, 10);
  });

  it("Lapse 1回 −5%、FalseStart 1回 −3%", () => {
    const r = { trials: Array(8).fill(250), lapses: 2, falseStarts: 1 };
    expect(scorePvt(r)).toBeCloseTo((1000 / 250) * (1 - 0.05 * 2 - 0.03), 10);
  });

  it("ペナルティは 0 で下限クリップ", () => {
    const r = { trials: Array(8).fill(250), lapses: 30, falseStarts: 0 };
    expect(scorePvt(r)).toBe(0);
  });

  it("試行なしは 0", () => {
    expect(scorePvt({ trials: [], lapses: 0, falseStarts: 0 })).toBe(0);
  });
});

describe("scoreMath (Task B)", () => {
  it("誤答なしは 正答数/経過秒 × 正答率^1.5", () => {
    const r = { correct: 10, wrong: 0, rtList: [], durationMs: 30000 };
    expect(scoreMath(r)).toBeCloseTo(10 / 30, 10);
  });

  it("誤答1問につき3000ms(Failed相当)を実効経過時間に加算([4] 2026-07-31)", () => {
    const r = { correct: 10, wrong: 2, rtList: [], durationMs: 30000 };
    // 実効経過秒 = (30000 + 2×3000) / 1000 = 36
    expect(scoreMath(r)).toBeCloseTo((10 / 36) * Math.pow(10 / 12, 1.5), 10);
  });

  it("同じ正答数なら誤答が多いほどスコアが下がる(速度+正答率の二重ペナルティ)", () => {
    const clean = { correct: 10, wrong: 0, rtList: [], durationMs: 30000 };
    const sloppy = { correct: 10, wrong: 5, rtList: [], durationMs: 30000 };
    expect(scoreMath(sloppy)).toBeLessThan(scoreMath(clean));
  });

  it("無回答は 0", () => {
    const r = { correct: 0, wrong: 0, rtList: [], durationMs: 30000 };
    expect(scoreMath(r)).toBe(0);
  });

  it("accuracyCorrection は 正答率^1.5", () => {
    expect(accuracyCorrection(9, 1)).toBeCloseTo(Math.pow(0.9, 1.5), 10);
    expect(accuracyCorrection(0, 0)).toBe(0);
  });
});

describe("interferenceCorrection", () => {
  it("干渉が基準値(150ms)以下なら補正なし(=1)", () => {
    expect(interferenceCorrection(0)).toBe(1);
    expect(interferenceCorrection(150)).toBe(1);
    expect(interferenceCorrection(-50)).toBe(1); // 不一致の方が速い場合
  });

  it("基準超過分に比例して減衰(250ms → 0.9)", () => {
    expect(interferenceCorrection(250)).toBeCloseTo(0.9, 10);
  });

  it("下限 0.8 でクリップ(500ms)", () => {
    expect(interferenceCorrection(500)).toBe(0.8);
  });
});

describe("scoreStroop (Task C)", () => {
  it("正答数/経過秒 × 正答率^1.5 × 干渉量補正", () => {
    const r = {
      correct: 15,
      wrong: 1,
      rtList: [],
      interferenceMs: 250,
      durationMs: 30000,
    };
    expect(scoreStroop(r)).toBeCloseTo(
      (15 / 30) * Math.pow(15 / 16, 1.5) * 0.9,
      10,
    );
  });
});

describe("computeInterference", () => {
  it("不一致RT平均 − 一致RT平均", () => {
    expect(computeInterference([500, 600], [700, 800])).toBe(200);
  });

  it("どちらかが空なら 0", () => {
    expect(computeInterference([], [700])).toBe(0);
    expect(computeInterference([500], [])).toBe(0);
  });
});

const sampleResults: TaskResults = {
  pvt: { trials: Array(8).fill(300), lapses: 1, falseStarts: 0 },
  math: { correct: 12, wrong: 1, rtList: [], durationMs: 30000 },
  stroop: {
    correct: 14,
    wrong: 2,
    rtList: [],
    interferenceMs: 180,
    durationMs: 28000,
  },
};

describe("scoreSession (総合スコア S)", () => {
  it("S = 0.40×normA + 0.30×normB + 0.30×normC", () => {
    const s = scoreSession(sampleResults);
    const expectedA = scorePvt(sampleResults.pvt) / scoringConfig.normRef.pvt;
    const expectedB = scoreMath(sampleResults.math) / scoringConfig.normRef.math;
    const expectedC =
      scoreStroop(sampleResults.stroop) / scoringConfig.normRef.stroop;
    expect(s.norm.pvt).toBeCloseTo(expectedA, 10);
    expect(s.rawScore).toBeCloseTo(
      0.4 * expectedA + 0.3 * expectedB + 0.3 * expectedC,
      10,
    );
  });

  it("同一入力に対し決定論的(受け入れ基準3)", () => {
    expect(scoreSession(sampleResults)).toEqual(scoreSession(sampleResults));
  });
});

describe("computePercent / displayPercent", () => {
  it("round(S ÷ ベースラインS × 100)", () => {
    expect(computePercent(1.234, 1.2)).toBe(103);
    expect(computePercent(0.9, 1.2)).toBe(75);
  });

  it("ベースライン 0 以下は 0(ゼロ除算防止)", () => {
    expect(computePercent(1.0, 0)).toBe(0);
  });

  it("表示は105%でクリップし絶好調フラグ、保存値相当はそのまま", () => {
    expect(displayPercent(112)).toEqual({ value: 105, overCap: true });
    expect(displayPercent(105)).toEqual({ value: 105, overCap: false });
    expect(displayPercent(42)).toEqual({ value: 42, overCap: false });
  });
});

describe("zoneOf (ゾーニング §4.2)", () => {
  it("境界値", () => {
    expect(zoneOf(90)).toBe("green");
    expect(zoneOf(120)).toBe("green");
    expect(zoneOf(89)).toBe("yellow");
    expect(zoneOf(70)).toBe("yellow");
    expect(zoneOf(69)).toBe("orange");
    expect(zoneOf(50)).toBe("orange");
    expect(zoneOf(49)).toBe("red");
    expect(zoneOf(0)).toBe("red");
  });
});
