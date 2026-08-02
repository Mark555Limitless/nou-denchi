/**
 * 効果音ユーティリティ(2026-08-02 全面改訂・ユーザー指示*10)。
 * 全アプリを通じて「ガラス系」の音色に統一する。
 * 外部音源ファイルを使わず Web Audio API で都度合成する(著作権フリー・軽量)。
 * ブラウザの自動再生ポリシー対策として AudioContext はユーザー操作後に遅延生成する。
 * サウンドは付加的な演出であり、鳴らせなくても(非対応ブラウザ・生成失敗)UIは成立する。
 *
 * ガラス音の合成方式: 基音+非整数倍音(1, 2.01, 2.99, 4.16)を重ねた減衰サイン波。
 * - glassBell: 長い減衰(1.2〜1.8s) — 合図・祝福・呼吸キュー
 * - glassTap : 速い減衰(0.2〜0.4s) — タップ・正誤などの短いフィードバック
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

interface ToneOpts {
  freq: number;
  /** 秒 */
  duration: number;
  /** ピーク音量(0-1) */
  gain?: number;
  /** 開始からの遅延(秒) */
  delay?: number;
}

/** 減衰サイン波1本(ガラス音の部分音用) */
function sine({ freq, duration, gain = 0.12, delay = 0 }: ToneOpts): void {
  const audio = getCtx();
  if (!audio) return;
  const start = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, start);
  amp.gain.setValueAtTime(0, start);
  amp.gain.linearRampToValueAtTime(gain, start + 0.006);
  amp.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(amp).connect(audio.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** ガラスの非整数倍音セット(透明感のある鐘・グラスの響き) */
const GLASS_PARTIALS: Array<[number, number]> = [
  [1, 1],
  [2.01, 0.55],
  [2.99, 0.28],
  [4.16, 0.16],
];

/** グラスベル(長い減衰。合図・祝福・呼吸キュー用) */
function glassBell(
  freq: number,
  { gain = 0.09, delay = 0, duration = 1.5 } = {},
): void {
  for (const [ratio, g] of GLASS_PARTIALS) {
    sine({ freq: freq * ratio, duration, gain: gain * g, delay });
  }
}

/** グラスタップ(速い減衰。タップ・正誤の短いフィードバック用) */
function glassTap(
  freq: number,
  { gain = 0.07, delay = 0, duration = 0.28 } = {},
): void {
  for (const [ratio, g] of GLASS_PARTIALS) {
    sine({ freq: freq * ratio, duration, gain: gain * g, delay });
  }
}

/** BOOST!!: 正タップ(高いグラスの澄んだ一打) */
export function playBoostTapGood(): void {
  glassTap(1174.66, { gain: 0.07, duration: 0.22 }); // D6
}

/** BOOST!!: 誤タップ(低く鈍いグラスの当たり) */
export function playBoostTapBad(): void {
  glassTap(311.13, { gain: 0.06, duration: 0.22 }); // D#4
}

/** BOOST!!: ラウンドクリア(2音の上昇グラス) */
export function playBoostRoundClear(): void {
  glassTap(783.99, { gain: 0.08, duration: 0.3 }); // G5
  glassTap(1046.5, { gain: 0.08, duration: 0.38, delay: 0.1 }); // C6
}

/** BOOST!!: 全ラウンドクリア(グラスの上昇アルペジオ+仕上げのグラスベル) */
export function playBoostClear(): void {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5,E5,G5,C6
  notes.forEach((f, i) =>
    glassTap(f, { gain: 0.08, duration: 0.34, delay: i * 0.09 }),
  );
  glassBell(1046.5, { gain: 0.06, delay: 0.4, duration: 1.4 });
}

/** グラスベル単音(タスク開始・画面遷移の合図) */
export function playBellSoft(): void {
  glassBell(880, { gain: 0.06, duration: 1.2 });
}

/** グラスベル和音(測定完了の祝福) */
export function playBellChord(): void {
  glassBell(659.25, { gain: 0.08 });
  glassBell(987.77, { gain: 0.07, delay: 0.18 });
}

/** 測定タスク: 正答(小さく高いグラスタップ。計時の邪魔をしない音量) */
export function playMeasureGood(): void {
  glassTap(1318.51, { gain: 0.045, duration: 0.18 }); // E6
}

/** 測定タスク: 誤答(低いグラスの当たり。責めないトーン) */
export function playMeasureBad(): void {
  glassTap(349.23, { gain: 0.045, duration: 0.2 }); // F4
}

/** PVT: 有効タップの確認音(短いグラスタップ) */
export function playPvtTap(): void {
  glassTap(987.77, { gain: 0.055, duration: 0.18 }); // B5
}

/** PVT: False Start の警告音(低いグラスを2度・穏やかに) */
export function playPvtFalseStart(): void {
  glassTap(392, { gain: 0.05, duration: 0.2 }); // G4
  glassTap(392, { gain: 0.04, duration: 0.24, delay: 0.14 });
}

/** RELAX: 呼吸フェーズ切り替え(グラスベル・小さめ) */
export function playRelaxCue(): void {
  glassBell(523.25, { gain: 0.045, duration: 1.6 });
}

/** RELAX: セッション終了(下降するグラスベル) */
export function playRelaxEnd(): void {
  glassBell(523.25, { gain: 0.07 });
  glassBell(392, { gain: 0.06, delay: 0.28, duration: 1.8 });
}
