import { createRng } from "./prng";
import { scoringConfig } from "@/lib/config";

/**
 * Task C: ストループ課題のシードベース生成(§3.1)。
 * 一致:不一致 = 1:2(20問なら 7:13)で固定し、順序をシャッフルする。
 */

export const STROOP_COLORS = ["red", "blue", "green", "yellow"] as const;
export type StroopColor = (typeof STROOP_COLORS)[number];

/** 刺激語(色名の単語)。回答ボタンのラベルにも使う。 */
export const STROOP_WORD_JA: Record<StroopColor, string> = {
  red: "あか",
  blue: "あお",
  green: "みどり",
  yellow: "きいろ",
};

export interface StroopQuestion {
  /** 表示する単語(色名) */
  word: StroopColor;
  /** 文字の色 = 正答 */
  ink: StroopColor;
  congruent: boolean;
}

export function generateStroopQuestions(
  seed: string,
  count = scoringConfig.stroop.maxQuestions,
  cfg = scoringConfig.stroop,
): StroopQuestion[] {
  const rng = createRng(`stroop:${seed}`);
  const congruentCount = Math.round(count * cfg.congruentRatio);
  const pattern: boolean[] = rng.shuffle([
    ...Array<boolean>(congruentCount).fill(true),
    ...Array<boolean>(count - congruentCount).fill(false),
  ]);

  const questions: StroopQuestion[] = [];
  for (const congruent of pattern) {
    let q = generateOne(rng, congruent);
    // 直前と同一刺激(単語・色とも同じ)の連続は1回だけ引き直す
    const prev = questions[questions.length - 1];
    if (prev && prev.word === q.word && prev.ink === q.ink) {
      q = generateOne(rng, congruent);
    }
    questions.push(q);
  }
  return questions;
}

function generateOne(
  rng: ReturnType<typeof createRng>,
  congruent: boolean,
): StroopQuestion {
  const word = rng.pick(STROOP_COLORS);
  if (congruent) return { word, ink: word, congruent };
  const others = STROOP_COLORS.filter((c) => c !== word);
  return { word, ink: rng.pick(others), congruent };
}
