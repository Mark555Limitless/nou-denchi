@AGENTS.md

# 司令塔(Claude)向け

- AGENTS.md の「実装エージェント(Codex)として作業するときだけの決まり」は司令塔には適用しない(司令塔はビルド・コミットを行う)
- アプリのコード変更は原則 Codex に指示書で渡す。受け取った差分は `npm run verify:full` とコード審査(Agent・model 明示)で APPROVE を得てからコミットする
- 司令塔が直接コードを直してよいのは、Codex が上限・不通のとき、または1行程度の修正のときだけ
- push・Pages 公開・Codemagic・App Store Connect の提出は、ユーザーの依頼の範囲で行う
