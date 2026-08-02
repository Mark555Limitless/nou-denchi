/**
 * トレオタ(追加トレーニング)の文言(2026-08-02 ユーザー指示[6])。
 * 計測とは独立した自由トレーニング。記録・保存は一切しない。
 */
export const training = {
  // 結果画面の第3バナー(見出しはバナー画像に焼き込み済み・aria で日本語説明)
  "training.banner.aria": "トレオタ 追加トレーニングのメニューへ",

  // 選択メニュー
  "training.menu.title": "トレオタ",
  "training.menu.desc": "記録に残らない自由特訓で、脳をとことん鍛えよう",
  "training.menu.back.aria": "トレオタを閉じて前の画面へ戻る",
  "training.menu.pvt.aria": "覚醒度トレーニング 反応スピード30回チャレンジへ",
  "training.menu.math.aria": "処理速度トレーニング 単純計算2分間チャレンジへ",
  "training.menu.stroop.aria": "切替力トレーニング ストループ50問チャレンジへ",

  // 各モード共通
  "training.exit.aria": "トレーニングをやめてメニューへ戻る",
  "training.start": "スタート!",
  "training.freePlayNote": "スコアや履歴には残りません",
  "training.done.title": "おつかれさま!",
  "training.done.again": "もう一度",
  "training.done.menu": "メニューへ戻る",

  // 覚醒度 × 30回
  "training.pvt.title": "覚醒度トレーニング",
  "training.pvt.meta": "反応スピード × 30回",
  "training.pvt.desc":
    "円が出たら、最速で画面をタップ! 30回連続で反応力をきたえよう。",
  "training.pvt.result.avgRt": "平均反応時間",

  // 処理速度 × 2分
  "training.math.title": "処理速度トレーニング",
  "training.math.meta": "単純計算 × 2分",
  "training.math.desc":
    "2分間ぶっ通しの計算ラッシュ! 答えを4つのボタンから選んで、何問解けるかチャレンジ。",
  "training.math.result.correct": "正答数",

  // 切替力 × 50問
  "training.stroop.title": "切替力トレーニング",
  "training.stroop.meta": "ストループ × 50問",
  "training.stroop.desc":
    "ことばに惑わされず「文字の色」をタップ! 時間制限なしの50問で切り替え力をきたえよう。",
  "training.stroop.result.correct": "正答数",
  "training.stroop.result.avgRt": "平均反応時間",

  // 単位
  "training.unit.ms": "ms",
  "training.unit.count": "問",
} as const;
