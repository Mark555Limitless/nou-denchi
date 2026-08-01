import { describe, expect, it } from "vitest";
import type { SessionSummary, TimeBand } from "../types";
import { beatBaseline, computeTimeBandBaseline } from "../baseline";
import { timeBandOf } from "../timeBand";

const DAY = 86_400_000;
const NOW = new Date(2026, 6, 30, 12, 0, 0).getTime();

function sess(
  id: string,
  daysAgo: number,
  rawScore: number,
  timeBand: TimeBand = "day",
): SessionSummary {
  return {
    id,
    startedAt: NOW - daysAgo * DAY,
    timeBand,
    rawScore,
    isCalibration: false,
  };
}

describe("beatBaseline (MAX直接更新・2026-07-31)", () => {
  it("現在のMAXを超えたスコアはそのまま新しいMAXになる", () => {
    const beat = beatBaseline(1.2, 1.35, "s1");
    expect(beat).toEqual({ value: 1.35, sourceSessionIds: ["s1"] });
  });

  it("同値・未満では更新しない(null)", () => {
    expect(beatBaseline(1.2, 1.2, "s1")).toBeNull();
    expect(beatBaseline(1.2, 1.19, "s1")).toBeNull();
  });
});

describe("computeTimeBandBaseline (§3.3(c)改: 区分内MAX)", () => {
  it("区分内3セッション未満は null(全体MAXを使用)", () => {
    const sessions = [
      sess("a", 1, 1.0, "night"),
      sess("b", 2, 1.1, "night"),
      sess("c", 3, 1.2, "day"),
    ];
    expect(computeTimeBandBaseline(sessions, "night", NOW)).toBeNull();
  });

  it("区分内3セッション以上で、その区分の最高スコアを返す", () => {
    const sessions = [
      sess("a", 1, 1.0, "night"),
      sess("b", 2, 1.1, "night"),
      sess("c", 3, 1.3, "night"),
      sess("d", 4, 1.9, "day"),
    ];
    const comp = computeTimeBandBaseline(sessions, "night", NOW);
    expect(comp).toEqual({ value: 1.3, sourceSessionIds: ["c"] });
  });

  it("90日より古いセッションは対象外", () => {
    const sessions = [
      sess("old", 100, 9.9, "night"),
      sess("a", 1, 1.0, "night"),
      sess("b", 2, 1.1, "night"),
      sess("c", 3, 1.2, "night"),
    ];
    const comp = computeTimeBandBaseline(sessions, "night", NOW);
    expect(comp?.value).toBe(1.2);
    expect(comp?.sourceSessionIds).not.toContain("old");
  });
});

describe("timeBandOf (§3.3(c) 4区分)", () => {
  it("朝4-11 / 昼11-17 / 夜17-24 / 深夜0-4", () => {
    const at = (h: number) => new Date(2026, 6, 30, h, 0, 0);
    expect(timeBandOf(at(4))).toBe("morning");
    expect(timeBandOf(at(10))).toBe("morning");
    expect(timeBandOf(at(11))).toBe("day");
    expect(timeBandOf(at(16))).toBe("day");
    expect(timeBandOf(at(17))).toBe("evening");
    expect(timeBandOf(at(23))).toBe("evening");
    expect(timeBandOf(at(0))).toBe("night");
    expect(timeBandOf(at(3))).toBe("night");
  });
});
