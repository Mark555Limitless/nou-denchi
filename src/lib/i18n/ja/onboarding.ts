/** オンボーディング(§4.1)の文言。担当エージェントが追記する。 */
export const onboarding = {
  "onboarding.start": "はじめる",

  // スライド①: コンセプト
  "onboarding.slide1.imageAlt": "脳でんち — キミ！いま何%!?",
  "onboarding.slide1.body":
    "今の判断力を、ベストな自分との比較で%表示。電池残量を見るように、頭のコンディションを確かめられます。",

  // スライド②: キミの100%(MAX)の仕組み
  "onboarding.slide2.title": "キミの100%は更新されていく",
  "onboarding.slide2.body":
    "最初の測定が、キミの最初の「100%」。それを超えるスコアが出るたびに、基準は自動でその記録に更新されます。",
  "onboarding.slide2.note":
    "何度でも測ってOK。過去のベストと比べて、今の自分が何%かをいつでも確認できます。",
  "onboarding.slide2.visualLabel": "これまでの最高スコア = キミの100%",

  // スライド③: 免責・プライバシー
  "onboarding.slide3.title": "はじめる前に",
  "onboarding.slide3.privacy":
    "測定データはすべてこの端末の中だけに保存されます。外部への送信は一切ありません。",

  // スライド操作
  "onboarding.slide.goto": "スライド{n}へ",

  // 任意入力フォーム
  "onboarding.form.title": "あなたについて",
  "onboarding.form.lead": "すべて任意です。",
  "onboarding.age.label": "年代",
  "onboarding.age.none": "答えない",
  "onboarding.age.10s": "10代",
  "onboarding.age.20s": "20代",
  "onboarding.age.30s": "30代",
  "onboarding.age.40s": "40代",
  "onboarding.age.50s": "50代",
  "onboarding.age.60s+": "60代以上",
  "onboarding.form.submit": "完了",

  // 完了画面
  "onboarding.done.title": "準備完了!",
  "onboarding.done.body":
    "1回の測定は1〜2分。まずは今の自分の%を見てみよう。",
  "onboarding.done.cta": "さっそく測ってみよう",
  "onboarding.done.later": "あとでホームから測る",
} as const;
