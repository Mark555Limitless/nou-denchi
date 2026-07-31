/**
 * シードベース決定論的乱数(xmur3 ハッシュ + mulberry32)。
 * 出題の動的生成と練習効果対策(§3.1)・決定論的テスト(§9)の基盤。
 */

export function hashString(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

export interface Rng {
  /** [0, 1) */
  next(): number;
  /** [min, max] の整数 */
  int(min: number, max: number): number;
  pick<T>(arr: readonly T[]): T;
  /** 非破壊シャッフル(Fisher–Yates) */
  shuffle<T>(arr: readonly T[]): T[];
}

export function createRng(seed: string | number): Rng {
  let a = (typeof seed === "number" ? seed : hashString(seed)) >>> 0;
  const next = (): number => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number): number =>
    min + Math.floor(next() * (max - min + 1));
  return {
    next,
    int,
    pick: (arr) => arr[int(0, arr.length - 1)],
    shuffle: (arr) => {
      const out = [...arr];
      for (let i = out.length - 1; i > 0; i--) {
        const j = int(0, i);
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
  };
}
