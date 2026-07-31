import { createRng } from "./prng";
import { scoringConfig } from "@/lib/config";

/**
 * Task B: 単純計算のシードベース動的生成(§3.1)。
 * 難易度分布は 易:中 = 6:4 で固定し、同一セッション内は重複なし、
 * 直近セッションの問題(avoid)もベストエフォートで回避する。
 */

export type MathDifficulty = "easy" | "medium";
export type MathOp = "+" | "-";

export interface MathProblem {
  a: number;
  b: number;
  op: MathOp;
  answer: number;
  /** 4択(正答含む・シャッフル済・重複なし・非負) */
  choices: number[];
  difficulty: MathDifficulty;
}

export function mathSignature(p: Pick<MathProblem, "a" | "b" | "op">): string {
  return `${p.a}${p.op}${p.b}`;
}

const DISTRACTOR_OFFSETS = [-10, -2, -1, 1, 2, 10] as const;

export function generateMathProblems(
  seed: string,
  count: number,
  avoid?: ReadonlySet<string>,
  cfg = scoringConfig.math,
): MathProblem[] {
  const rng = createRng(`math:${seed}`);
  const used = new Set<string>();
  const problems: MathProblem[] = [];

  // 5問ブロックごとに 易3:中2 をシャッフルして 6:4 分布を固定(§3.1)
  const difficulties: MathDifficulty[] = [];
  while (difficulties.length < count) {
    const block: MathDifficulty[] = [
      ...Array<MathDifficulty>(cfg.easyPerBlock).fill("easy"),
      ...Array<MathDifficulty>(cfg.mediumPerBlock).fill("medium"),
    ];
    difficulties.push(...rng.shuffle(block));
  }

  for (let i = 0; i < count; i++) {
    const difficulty = difficulties[i];
    let candidate: { a: number; b: number; op: MathOp; answer: number } | null =
      null;
    // 同一セッション内の重複は禁止、直近セッション(avoid)はベストエフォート回避
    for (let attempt = 0; attempt < 60; attempt++) {
      const c = generateOne(rng, difficulty);
      const sig = mathSignature(c);
      if (used.has(sig)) continue;
      if (attempt < 40 && avoid?.has(sig)) continue;
      candidate = c;
      break;
    }
    if (!candidate) {
      // フォールバック: セッション内重複のみ回避を諦めず、最後に生成した値を採用
      candidate = generateOne(rng, difficulty);
    }
    used.add(mathSignature(candidate));
    problems.push({
      ...candidate,
      difficulty,
      choices: buildChoices(rng, candidate.answer),
    });
  }
  return problems;
}

function generateOne(
  rng: ReturnType<typeof createRng>,
  difficulty: MathDifficulty,
): { a: number; b: number; op: MathOp; answer: number } {
  if (difficulty === "easy") {
    // 1桁 + 1桁
    const a = rng.int(2, 9);
    const b = rng.int(2, 9);
    return { a, b, op: "+", answer: a + b };
  }
  // 2桁 ± 1桁(減算でも正の結果になる範囲)
  const a = rng.int(11, 99);
  const b = rng.int(2, 9);
  const op: MathOp = rng.next() < 0.5 ? "+" : "-";
  return { a, b, op, answer: op === "+" ? a + b : a - b };
}

function buildChoices(
  rng: ReturnType<typeof createRng>,
  answer: number,
): number[] {
  const choices = new Set<number>([answer]);
  const offsets = rng.shuffle(DISTRACTOR_OFFSETS);
  for (const off of offsets) {
    if (choices.size >= 4) break;
    const v = answer + off;
    if (v >= 0) choices.add(v);
  }
  // オフセットが尽きた場合(answer が 0-1 近傍)の保険
  let extra = 3;
  while (choices.size < 4) {
    choices.add(answer + extra);
    extra += 1;
  }
  return rng.shuffle([...choices]);
}
