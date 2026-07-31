import { describe, expect, it } from "vitest";
import { generateStroopQuestions, STROOP_COLORS } from "../stroopGen";

describe("stroopGen", () => {
  it("同一シードで同一の問題列(決定論)", () => {
    expect(generateStroopQuestions("s1")).toEqual(generateStroopQuestions("s1"));
  });

  it("20問中 一致:不一致 = 7:13 (≒1:2)", () => {
    const qs = generateStroopQuestions("ratio", 20);
    expect(qs).toHaveLength(20);
    expect(qs.filter((q) => q.congruent)).toHaveLength(7);
    expect(qs.filter((q) => !q.congruent)).toHaveLength(13);
  });

  it("一致条件は word === ink、不一致条件は word !== ink", () => {
    for (const q of generateStroopQuestions("cond", 20)) {
      expect(STROOP_COLORS).toContain(q.word);
      expect(STROOP_COLORS).toContain(q.ink);
      if (q.congruent) expect(q.word).toBe(q.ink);
      else expect(q.word).not.toBe(q.ink);
    }
  });
});
