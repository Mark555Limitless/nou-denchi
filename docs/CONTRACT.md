# UI実装エージェント向け契約書(Phase B)

このリポジトリは Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + 静的エクスポート
(`output: 'export'`, `trailingSlash: true`)。**画面はすべてクライアントコンポーネント**(先頭に `"use client"`)。
モバイルファースト(layout.tsx が `max-w-md` センタリング済・下部ナビの高さぶん `pb-20` 確保済)。

## 絶対ルール

1. **自分の担当ファイル以外は編集禁止**(読み取りは自由)。特に `src/app/layout.tsx`,
   `src/app/globals.css`, `src/lib/engine/**`, `src/lib/config/**`, `src/lib/db/**`,
   `src/lib/service/**`, `src/lib/i18n/index.ts`, 他エージェントの辞書ファイルは編集不可。
2. ユーザー向け文言はすべて `t("キー")` (`@/lib/i18n`)。キーの追加は**自分の担当辞書ファイルのみ**。
   キーには必ず自領域プレフィックス(例 `home.`)を付ける。共通キーは `ja/common.ts` に定義済(追加不可、使うのは自由)。
3. 新しい npm 依存を追加しない(recharts / dexie / sharp は導入済)。
4. `npm run dev` や `npm run build` を起動しない。検証は `npx tsc --noEmit` と目視。
5. 医療的訴求・広告・外部リンクを一切入れない。低スコア時も同様(受け入れ基準8)。
6. 計時は `performance.now()`(`Date.now()` は RT 計測に使用禁止)、タップ計時は `pointerdown`。

## 使える API(実装済み・変更禁止)

### 設定 `@/lib/config`
- `scoringConfig` — 全定数(PVT試行数8・間隔2-6s・timeoutMs 3000・math 30s・stroop 20問/30s 等)
- `zoneDefs` — ゾーン閾値と hex(green≥90 / yellow≥70 / orange≥50 / red)
- `featureFlags` — `premiumGating:false, timeBandBaseline:true`
- `stroopInkHex` — ストループ刺激のインク色 `{red,blue,green,yellow}`
- `APP_NAME`

### エンジン `@/lib/engine/*`(純粋関数)
- `generateMathProblems(seed, count, avoid?): MathProblem[]` — `{a,b,op:'+'|'-',answer,choices[4],difficulty}`
- `mathSignature(p)` — 重複回避用シグネチャ
- `generateStroopQuestions(seed, count?): StroopQuestion[]` — `{word,ink,congruent}`、`STROOP_WORD_JA`(あか/あお/みどり/きいろ)、`STROOP_COLORS`(固定順 = 回答ボタンの固定配置順)
- `computeInterference(congruentRts, incongruentRts)` — **正答試行のみ**渡す
- `scoreSession(taskResults): SessionScore`、`displayPercent(p): {value, overCap}`、`zoneOf(percent): Zone`
- `timeBandOf(date)`, `dayKeyOf(ms)`
- 型は `@/lib/engine/types`(`TaskResults`, `PvtResult`, `MathResult`, `StroopResult`, `Zone`, …)

### サービス `@/lib/service/measurement`(DB接続済オーケストレーション)
- `completeSession(taskResults, startedAt, seed): Promise<CompletionResult>`
  — 採点・保存・ベースライン遷移まで全部やる。戻り値:
  `{session, score, percent, display, zone, baselineType, baselineValue, baselineConfirmedNow, bestUpdated, calibration:{active,dayIndex,totalDays,sessionCount}}`
- `getHomeState(): Promise<HomeState>` — `{profile, todaySession, latestSession, baselineConfirmed, calibration}`
- `getSessionView(id): Promise<SessionView|undefined>` — `{session, score, percent, display, zone}`

### DB `@/lib/db/repo`
- `getProfile / saveProfile({ageBand?, isShiftWorker, reminderNote?}) / updateProfile(patch)`
- `listSessions / listSessionsSince(ms) / getSession(id) / getLatestSession`
- `resetCalibration()`(ベースライン再計測)/ `wipeAllData()`
- 型 `@/lib/db/db`: `UserProfile`, `SessionRecord`, `BaselineRecord`

### UI ヘルパー
- `@/lib/ui/zone`: `zoneClasses[zone] = {text,bg,border}`(Tailwindクラス)、`zoneHex(zone)`(Canvas用)
- `@/components/Disclaimer`: `<Disclaimer detail />` 免責事項
- Tailwind トークン: `bg-surface / bg-surface-2 / bg-surface-3 / text-ink / text-ink-2 / text-ink-mute /
  border-hairline / text-zone-green|yellow|orange|red / bg-zone-* / text-chart`(チャート青 #3987e5)

## ルーティング

`/`(ホーム) `/onboarding/` `/measure/` `/result/?sid=<id>` `/history/` `/settings/`。
`trailingSlash: true` のためリンクは末尾スラッシュ推奨。`useSearchParams` を使うコンポーネントは
**必ず `<Suspense>` でラップ**(静的エクスポートのビルド要件)。
測定完了後の遷移: `/result/?sid=<id>&new=1[&confirmed=1][&best=1]`(new=アニメーション再生、confirmed=100%確定演出、best=ベスト更新)。

## デザイン言語

ダークネイビー基調(bg-surface)。カードは `bg-surface-2 rounded-2xl border border-hairline p-4`。
大きな数字は `font-mono`。ボタンは大きく(タップターゲット≥44px)。ゾーン色は**必ずラベル文言と併記**
(色単独で意味を伝えない・色覚多様性対応)。グラフは単一系列=チャート青1色、凡例なし、
グリッドは hairline、軸ラベルは text-ink-mute。ステータス(ゾーン)色をグラフの系列色に使わない。
