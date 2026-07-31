/** 設定画面(§4.6)の文言。担当エージェントが追記する。 */
export const settings = {
  "settings.title": "設定",
  "settings.loading": "読み込み中…",

  // プロフィール変更
  "settings.profile.title": "プロフィール",
  "settings.profile.save": "保存する",
  "settings.profile.saved": "保存しました",

  // ベースラインの説明
  "settings.baseline.title": "ベースラインの説明",
  "settings.baseline.p1":
    "これまでに計測した最高スコアが、そのまま「100%」の基準(あなたのMAX)になります。",
  "settings.baseline.p2":
    "最初の測定が、あなたの最初の100%です。",
  "settings.baseline.p3":
    "基準を超えるスコアが出るたびに、「ベスト更新!」とともに100%はその記録へ即時更新されます。",
  "settings.baseline.p4":
    "基準を作り直したいときは、下の「ベースライン再計測」からいつでもリセットできます。",

  // ベースライン再計測
  "settings.recalib.title": "ベースライン再計測",
  "settings.recalib.desc":
    "「100%」の基準(MAX)をリセットして、次の測定から作り直します。",
  "settings.recalib.button": "再計測を始める",
  "settings.recalib.explain.title": "ベースラインを再計測しますか?",
  "settings.recalib.explain.body":
    "現在の「100%」基準(MAX)を破棄します。次の測定がそのまま新しい100%になります。これまでの測定履歴は消えません。",
  "settings.recalib.confirm.title": "最終確認",
  "settings.recalib.confirm.body":
    "ベースラインをリセットします。よろしいですか?(測定履歴はそのまま残ります)",
  "settings.recalib.confirm.action": "リセットする",
  "settings.recalib.done": "ベースラインをリセットしました。履歴は残っています。",

  // データ全削除
  "settings.wipe.title": "データを全て削除",
  "settings.wipe.desc":
    "プロフィール・測定履歴・ベースラインを端末から完全に削除します。",
  "settings.wipe.button": "全データを削除する",
  "settings.wipe.explain.title": "データを全て削除しますか?",
  "settings.wipe.explain.body":
    "プロフィール・すべての測定履歴・ベースラインが、この端末から削除されます。この操作は取り消せません。",
  "settings.wipe.confirm.title": "最終確認",
  "settings.wipe.confirm.body":
    "本当にすべてのデータを削除しますか? 削除後は元に戻せません。",
  "settings.wipe.confirm.action": "全て削除する",

  // 免責事項・アプリ情報
  "settings.disclaimer.title": "免責事項",
  "settings.about.title": "アプリ情報",
  "settings.about.version": "バージョン {version}",
  "settings.about.privacy":
    "データは端末内にのみ保存されます。外部送信・アナリティクスはありません。",
} as const;
