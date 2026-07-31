import { describe, expect, it } from "vitest";
import { createRng, hashString } from "../prng";

describe("prng", () => {
  it("同一シードで同一系列を返す(決定論)", () => {
    const a = createRng("seed-1");
    const b = createRng("seed-1");
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it("異なるシードで異なる系列を返す", () => {
    const a = createRng("seed-1");
    const b = createRng("seed-2");
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).not.toEqual(seqB);
  });

  it("int は [min, max] の整数を返す", () => {
    const rng = createRng("range");
    for (let i = 0; i < 500; i++) {
      const v = rng.int(2, 9);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(2);
      expect(v).toBeLessThanOrEqual(9);
    }
  });

  it("shuffle は要素集合を保存し、決定論的", () => {
    const rng1 = createRng("shuffle");
    const rng2 = createRng("shuffle");
    const src = [1, 2, 3, 4, 5, 6, 7, 8];
    const s1 = rng1.shuffle(src);
    const s2 = rng2.shuffle(src);
    expect(s1).toEqual(s2);
    expect([...s1].sort((a, b) => a - b)).toEqual(src);
    expect(src).toEqual([1, 2, 3, 4, 5, 6, 7, 8]); // 非破壊
  });

  it("hashString は安定", () => {
    expect(hashString("abc")).toBe(hashString("abc"));
    expect(hashString("abc")).not.toBe(hashString("abd"));
  });
});
