import { describe, expect, it } from "vitest";
import { generateMathProblems, mathSignature } from "../mathGen";

describe("mathGen", () => {
  it("同一シードで同一の問題列(決定論・§9)", () => {
    expect(generateMathProblems("s1", 30)).toEqual(
      generateMathProblems("s1", 30),
    );
  });

  it("異なるシードで異なる問題列(練習効果対策)", () => {
    const a = generateMathProblems("s1", 30).map(mathSignature);
    const b = generateMathProblems("s2", 30).map(mathSignature);
    expect(a).not.toEqual(b);
  });

  it("難易度分布は 易:中 = 6:4(10問ごと)", () => {
    const problems = generateMathProblems("ratio", 30);
    for (let i = 0; i < 30; i += 10) {
      const chunk = problems.slice(i, i + 10);
      expect(chunk.filter((p) => p.difficulty === "easy")).toHaveLength(6);
      expect(chunk.filter((p) => p.difficulty === "medium")).toHaveLength(4);
    }
  });

  it("答えが正しい・オペランドが仕様の範囲", () => {
    for (const p of generateMathProblems("answers", 50)) {
      expect(p.answer).toBe(p.op === "+" ? p.a + p.b : p.a - p.b);
      expect(p.answer).toBeGreaterThan(0);
      if (p.difficulty === "easy") {
        // 1桁 + 1桁
        expect(p.op).toBe("+");
        expect(p.a).toBeGreaterThanOrEqual(2);
        expect(p.a).toBeLessThanOrEqual(9);
        expect(p.b).toBeGreaterThanOrEqual(2);
        expect(p.b).toBeLessThanOrEqual(9);
      } else {
        // 2桁 ± 1桁
        expect(p.a).toBeGreaterThanOrEqual(11);
        expect(p.a).toBeLessThanOrEqual(99);
        expect(p.b).toBeGreaterThanOrEqual(2);
        expect(p.b).toBeLessThanOrEqual(9);
      }
    }
  });

  it("4択は重複なし・正答を含む・近傍値・非負", () => {
    for (const p of generateMathProblems("choices", 50)) {
      expect(p.choices).toHaveLength(4);
      expect(new Set(p.choices).size).toBe(4);
      expect(p.choices).toContain(p.answer);
      for (const c of p.choices) {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(Math.abs(c - p.answer)).toBeLessThanOrEqual(10);
      }
    }
  });

  it("同一セッション内で問題が重複しない", () => {
    const sigs = generateMathProblems("dedup", 30).map(mathSignature);
    expect(new Set(sigs).size).toBe(sigs.length);
  });

  it("avoid に含まれる直近セッションの問題を回避する", () => {
    const prev = new Set(generateMathProblems("prev", 20).map(mathSignature));
    const next = generateMathProblems("next", 20, prev).map(mathSignature);
    expect(next.filter((s) => prev.has(s))).toHaveLength(0);
  });
});
