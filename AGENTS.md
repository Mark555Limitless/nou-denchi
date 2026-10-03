<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 脳でんち — 全エージェント共通の不変条件

判断力セルフチェックアプリ。Next.js 16(App Router・`output: 'export'`・`trailingSlash: true`)+ React 19 +
TypeScript strict + Tailwind 4 + Dexie(IndexedDB)+ Capacitor 8(iOS)。経緯と判断の正典は `docs/DECISIONS.md`。

**設計思想(変えない)**
- 完全ローカル: 外部送信・アカウント・アナリティクス・広告を入れない。新しい npm 依存も足さない(必要ならユーザー確認)
- 非医療: 診断・医療的訴求をしない。低スコア時に商品・広告・外部リンク・レコメンドを出さない。他者比較をしない
- シェアカードに載せるのは % と日付だけ
- 対外的な掲示物(アプリ名・アイコン・ストア文言・宣伝画像)は製品名「脳でんち」を最優先で大きく

**実装の約束**
- ユーザー向け文言は `t("キー")`(`@/lib/i18n`)を通す
- 反応時間は `performance.now()`、タップの計時は `pointerdown`(`Date.now()` を RT 計測に使わない)
- `useSearchParams` を使うコンポーネントは `<Suspense>` で包む(静的エクスポートの要件)
- 素の `<img src>`・Canvas の `Image.src`・CSS の `url()` は `src/lib/ui/asset.ts` の `asset()` を通す
  (GitHub Pages は basePath=/nou-denchi、iOS は basePath 空。`next/link` 以外は basePath が自動で付かない)
- ネイティブ(Capacitor)では Service Worker を登録しない(判定は `src/lib/ui/platform.ts` の `isNativeApp()`)
- スコアの正規化は固定参照定数 `scoringConfig.normRef`。スコア・ベースライン・% の意味を変える変更はユーザー確認が必要
- 計算問題の重複回避は `Session.mathSigs`(実際に出題したシグネチャ)。シードからの再構成で代用しない
- `wipeAllData()` は IndexedDB に加えて localStorage の BOOST!! 自己ベスト(キーは `lib/config` で共有)も消す
- DB は `schemaVersion` を持つ。保存形式を変えるならマイグレーションを書く(ユーザー確認が必要)
- アイコン類は `npm run gen:icons` で原画 `docs/design/app-icon/app-icon-1024.png` から生成する(手で個別に作らない)
- 公開リポジトリなので、秘匿情報・ローカルの絶対パス(`/Users/…`)・リポジトリ外の保管場所をファイルに書かない

**検証**: `npm run verify`(型・lint・単体テスト・画像参照の静的検査)。ビルドまで含めるなら `npm run verify:full`。

# 実装エージェント(Codex)として作業するときだけの決まり

この節は、指示書を受け取って実装する Codex にだけ適用する。司令塔(Claude)には適用しない。

- 指示書の `<!-- ALLOWED -->` ブロックに列挙されたファイル以外は、変更も新規作成もしない
- git の操作(commit・push・branch・stash・checkout・reset)をしない
- ネットワークを使わない。`npm install` / `npm ci` / `npm run build` / `next build` / `build:ios` / `deploy:pages` を実行しない(ビルドは司令塔が行う)
- このリポジトリの外(親フォルダを含む)を読み書きしない
- `ios/`・`codemagic.yaml`・`.env*`・`*.p8`・`*.pem`・`docs/`・`public/`・`.claude/` を変更しない。`package*.json` は指示書が明示的に許可したときだけ
- `scripts/gen-ai-assets*.mjs` などの画像生成スクリプトを実行しない(外部 API キーを使うため)
- サブエージェントの起動やモデルの切り替えはしない。ニュース検証の規定はこのリポジトリには適用しない
- 終わる前に `npm run verify` を通す(通らなければ原因を最終メッセージに書く)。最終メッセージには、変更したファイル・要点3行・未解決点を書く
