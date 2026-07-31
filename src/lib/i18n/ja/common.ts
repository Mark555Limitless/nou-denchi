/** 画面横断で使う文言。キーは "領域.名前" 形式(§7 i18n構造)。 */
export const common = {
  "app.name": "脳でんち",
  "app.tagline": "キミ！いま何%!?",
  "app.disclaimer": "本アプリは医療機器ではなく、診断を目的としません。",
  "app.disclaimer.detail":
    "測定結果は医学的な評価ではありません。体調に不安がある場合は医療機関にご相談ください。測定データはすべてこの端末内にのみ保存され、外部に送信されることはありません。",

  "nav.home": "ホーム",
  "nav.history": "履歴",
  "nav.settings": "設定",

  "zone.green.label": "好調",
  "zone.green.message": "今、勝負をかける時",
  "zone.yellow.label": "通常",
  "zone.yellow.message": "通常運転",
  "zone.orange.label": "注意",
  "zone.orange.message": "重要な決定は避けて。休憩推奨",
  "zone.red.label": "休養",
  "zone.red.message": "今日は休養日。運転・重要判断は特に注意",

  "percent.label": "{time}の判断力(全盛期比)",
  /** 結果画面の2段組み見出し(上段=日時、下段=主見出し) */
  "percent.labelTime": "{time}の",
  "percent.labelMain": "キミの判断力!(全盛期比)",
  "percent.overCap": "絶好調!",
  "percent.provisional.badge": "推定",
  "percent.provisional.explain":
    "この%は旧バージョンの暫定基準による推定です。現在は、これまでの最高スコアがそのまま「100%」の基準になります。",
  "percent.timeBandNote": "この時間帯のベスト基準で算出",
  "percent.globalNote": "全体ベスト基準で算出(この時間帯のデータが貯まると切替)",

  "calibration.confirmed.title": "キミの100%! 確定!!",
  "bestUpdated.label": "ベスト更新!",

  "task.pvt.label": "覚醒度",
  "task.math.label": "処理速度",
  "task.stroop.label": "切替力",

  "timeBand.morning": "朝",
  "timeBand.day": "昼",
  "timeBand.evening": "夜",
  "timeBand.night": "深夜",

  "common.close": "閉じる",
  "common.cancel": "キャンセル",
  "common.ok": "OK",
  "common.next": "次へ",
  "common.back": "戻る",
  "common.measure": "測定する",
} as const;
