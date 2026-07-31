/** 測定フロー(§4.3)の文言。担当エージェントが追記する。 */
export const measure = {
  "measure.falseStart": "まだ! 出てから押して",

  // タスク名称見出し(例: 覚醒度計測)
  "measure.taskTitle": "{name}",

  // 中断(✕)
  "measure.exit.aria": "測定を中断",
  "measure.exitConfirm.title": "測定を中断しますか?",
  "measure.exitConfirm.body": "ここまでの記録は保存されません。",
  "measure.exitConfirm.continue": "測定をつづける",
  "measure.exitConfirm.quit": "中断してホームへ",

  // カウントダウン
  "measure.countdown.ready": "まもなくスタート",

  // Task A: PVT(「○」は実刺激と同色の円をインライン表示するため前後分割)
  "measure.pvt.instructionAfter": "が出たら、すぐに画面をタップ!",
  "measure.pvt.instructionAria": "円が出たら、すぐに画面をタップ!",
  "measure.pvt.waiting": "そのまま待って…",
  "measure.pvt.timeout": "時間切れ",
  "measure.msUnit": "ms",

  // 共通表示
  "measure.progress": "{n} / {total}",
  "measure.secondsLeft": "残り {sec} 秒",

  // インタースティシャル(次タスク予告)
  "measure.interstitial.next": "つぎのタスク",
  "measure.math.desc": "計算の答えを4つのボタンから選んでタップ(30秒)",
  "measure.stroop.desc": "ことばに惑わされず「文字の色」のボタンをタップ(20問)",
  "measure.stroop.hint": "文字の「色」は?",

  // 保存中
  "measure.saving": "結果を計算中…",

  // 保存失敗
  "measure.saveError.title": "結果を保存できませんでした",
  "measure.saveError.body":
    "端末のストレージの空き状況などをご確認のうえ、もう一度測定してください。今回の測定は保存されていません。",
  "measure.saveError.home": "ホームへ戻る",
} as const;
