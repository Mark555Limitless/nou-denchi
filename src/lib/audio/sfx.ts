/**
 * 効果音ユーティリティ(2026-07-31 ユーザー指示[4])。
 * 外部音源ファイルを使わず Web Audio API で都度合成する(著作権フリー・軽量)。
 * ブラウザの自動再生ポリシー対策として AudioContext はユーザー操作後に遅延生成する。
 * サウンドは付加的な演出であり、鳴らせなくても(非対応ブラウザ・生成失敗)UIは成立する。
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
  type?: OscillatorType;
  /** ピーク音量(0-1) */
  gain?: number;
  /** 開始からの遅延(秒) */
  delay?: number;
  /** 終端周波数(グライド)。省略で一定 */
  toFreq?: number;
}

function tone({
  freq,
  duration,
  type = "sine",
  gain = 0.12,
  delay = 0,
  toFreq,
}: ToneOpts): void {
  const audio = getCtx();
  if (!audio) return;
  const start = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (toFreq !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(toFreq, 1),
      start + duration,
    );
  }
  amp.gain.setValueAtTime(0, start);
  amp.gain.linearRampToValueAtTime(gain, start + 0.008);
  amp.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(amp).connect(audio.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** BOOST!!: 正タップ(短く高い上昇音) */
export function playBoostTapGood(): void {
  tone({ freq: 520, toFreq: 720, duration: 0.09, type: "square", gain: 0.1 });
}

/** BOOST!!: 誤タップ(短い低いバズ) */
export function playBoostTapBad(): void {
  tone({ freq: 160, duration: 0.1, type: "sawtooth", gain: 0.08 });
}

/** BOOST!!: ラウンドクリア(2音の上昇) */
export function playBoostRoundClear(): void {
  tone({ freq: 660, duration: 0.11, type: "square", gain: 0.11 });
  tone({ freq: 880, duration: 0.14, type: "square", gain: 0.11, delay: 0.1 });
}

/** BOOST!!: 全ラウンドクリア(上昇アルペジオ+仕上げのグラスベル) */
export function playBoostClear(): void {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5,E5,G5,C6
  notes.forEach((f, i) =>
    tone({ freq: f, duration: 0.16, type: "square", gain: 0.12, delay: i * 0.09 }),
  );
  glassBell(1046.5, { gain: 0.06, delay: 0.4, duration: 1.4 });
}

/**
 * グラスベル(ガラスの鐘)音(2026-07-31 ユーザー指示[1])。
 * 基音+非整数倍音を長い減衰で重ねて、透明感のある鐘の響きを合成する。
 */
function glassBell(
  freq: number,
  { gain = 0.09, delay = 0, duration = 1.5 } = {},
): void {
  const partials: Array<[number, number]> = [
    [1, 1],
    [2.01, 0.55],
    [2.99, 0.28],
    [4.16, 0.16],
  ];
  for (const [ratio, g] of partials) {
    tone({ freq: freq * ratio, duration, type: "sine", gain: gain * g, delay });
  }
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

/** 測定タスク: 正答(短く控えめな上昇音。計時の邪魔をしない音量) */
export function playMeasureGood(): void {
  tone({ freq: 740, toFreq: 920, duration: 0.07, type: "sine", gain: 0.05 });
}

/** 測定タスク: 誤答(短い低音。責めないトーン) */
export function playMeasureBad(): void {
  tone({ freq: 180, duration: 0.09, type: "triangle", gain: 0.05 });
}

/** PVT: 有効タップの確認音 */
export function playPvtTap(): void {
  tone({ freq: 600, toFreq: 820, duration: 0.06, type: "sine", gain: 0.06 });
}

/** PVT: False Start の警告音(短く・穏やかに) */
export function playPvtFalseStart(): void {
  tone({ freq: 240, duration: 0.16, type: "triangle", gain: 0.06 });
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
