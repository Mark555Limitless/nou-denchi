# iOS リリース手順(App Store 提出)

Web版と同じコードを、iOSネイティブアプリとして App Store に出すための手順。
アプリ本体は Capacitor で包んであり、`out/`(静的エクスポート)をアプリ内に丸ごと
同梱して端末内だけで動かす。サーバー接続は一切しない。

- 設定: [`capacitor.config.ts`](../capacitor.config.ts)
- Xcodeプロジェクト: `ios/App/App.xcodeproj`
- ストア掲載内容: [APPSTORE_METADATA.md](APPSTORE_METADATA.md)

---

## 0. 事前に必要なもの(Apple ID が要る作業)

この2つは Apple ID とお支払いが必要なため、**必ずご本人の操作**で行う。

1. **Xcode**(無料・**バージョン26以降が必須**)
   Mac App Store から「Xcode」をインストール(約10GB・数十分)。
   2026年4月28日以降、App Store へのアップロードには **Xcode 26(iOS 26 SDK)
   以降でのビルドが必須**。Mac App Store から入れれば常に最新なので条件を満たす。
   インストール後、ターミナルで一度だけ以下を実行して、コマンドラインの
   参照先を Xcode 本体に切り替える(管理者パスワードを聞かれる)。

   ```bash
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer && xcodebuild -runFirstLaunch
   ```

   切り替え後、`xcodebuild -version` が **26.x 以上**であることを確認する。

2. **Apple Developer Program**(年額 US$99。日本からはおよそ1.3万円前後・
   為替により変動し、**登録画面に表示される額が正**)
   <https://developer.apple.com/programs/enroll/> から登録。
   本人確認に1〜2日かかることがある。**登録が完了するまで提出はできない。**

---

## 1. ビルドして Xcode プロジェクトへ反映

```bash
npm run build:ios
```

`NEXT_PUBLIC_BASE_PATH` を空にして静的エクスポートし、`ios/App/App/public/` へ同期する。

> ⚠️ GitHub Pages 用のビルド(`NEXT_PUBLIC_BASE_PATH=/nou-denchi`)を同梱すると
> アセットの参照先がずれて**白画面**になる。iOS向けは必ずこのコマンドを使うこと。
> `npm run deploy:pages` を実行した後は `out/` が Pages 用に上書きされているので、
> iOSビルド前にもう一度 `npm run build:ios` を通す。

---

## 2. Xcode で開く

```bash
npm run ios:open
```

初回はSwift Packageの解決に数分かかる。

---

## 3. 署名の設定(初回のみ)

Xcode 左のファイル一覧で **App**(いちばん上の青いアイコン)を選び、
`TARGETS > App` の **Signing & Capabilities** タブを開く。

- **Automatically manage signing** … チェックを入れる
- **Team** … Apple Developer Program で登録したチームを選ぶ
  (ここに何も出ない場合は Xcode > Settings > Accounts で Apple ID を追加する)
- **Bundle Identifier** … `com.marklimitless.noudenchi` のままでよい

数秒でプロビジョニングプロファイルが自動作成される。赤いエラーが消えれば完了。

---

## 4. シミュレータで動作確認

Xcode 上部のデバイス選択で iPhone のシミュレータを選び、▶ ボタンで実行。

**必ず確認すること**(WKWebView 特有の問題が出るのはこの3点):

- [ ] 起動して測定が最後まで進む(計算 → ストループ → PVT → 結果)
- [ ] アプリを終了して再起動しても履歴が残っている(IndexedDB の永続化)
- [ ] 効果音が鳴る(Web Audio。最初のタップまで鳴らないのは仕様)
- [ ] 画面下端・上端の表示が Dynamic Island / ホームバーに被っていない

---

## 5. 実機で確認(任意・推奨)

iPhone を Mac に接続し、デバイス選択で自分の iPhone を選んで ▶。
初回は iPhone 側で 設定 > 一般 > VPNとデバイス管理 から開発者を信頼する必要がある。

---

## 6. スクリーンショットを撮る

App Store には **6.9インチ iPhone(1320 x 2868 px)** のスクリーンショットが必須。
6.9インチのシミュレータ(iPhone 16 Pro Max 以降)で実行し、見せたい画面で:

```bash
xcrun simctl io booted screenshot ~/Desktop/noudenchi-01.png
```

撮る画面の構成は [APPSTORE_METADATA.md](APPSTORE_METADATA.md#スクリーンショット) を参照。
撮影後、サイズが 1320x2868 になっているか確認する:

```bash
sips -g pixelWidth -g pixelHeight ~/Desktop/noudenchi-01.png
```

---

## 7. アップロード

1. Xcode 上部のデバイス選択を **Any iOS Device (arm64)** に変更
   (シミュレータのままだと Archive がグレーアウトして押せない)
2. メニューの **Product > Archive**
3. 完了後に開く Organizer で **Distribute App** → **App Store Connect** → **Upload**
4. 署名は **Automatically manage signing** のまま次へ進み、**Upload**

アップロード後、App Store Connect で処理されるまで10〜30分かかる。

---

## 8. App Store Connect で申請

<https://appstoreconnect.apple.com/> にサインインし、

1. **App を新規作成** — 名前・言語・バンドルID・SKU を
   [APPSTORE_METADATA.md](APPSTORE_METADATA.md) の表のとおり入力
2. **App情報** — カテゴリ、年齢制限、プライバシーポリシーURL
3. **価格および配信状況** — 無料
4. **App のプライバシー** — 「データを収集しません」
5. **バージョン情報** — 説明・キーワード・スクリーンショット・サポートURL、
   ビルド(アップロードしたもの)を選択
6. **審査に関する情報** — メモ欄に [APPSTORE_METADATA.md](APPSTORE_METADATA.md#審査に関する情報-app-review-information) の文面を貼る
7. **審査へ提出**

審査は通常1〜3日。

---

## 9. 2回目以降の更新

```bash
npm run build:ios
```

そのうえで Xcode の `TARGETS > App > General` で番号を上げる。

- **Version**(`MARKETING_VERSION`) … 利用者に見えるバージョン。`1.0` → `1.1` など
- **Build**(`CURRENT_PROJECT_VERSION`) … アップロードのたびに必ず +1。同じ番号は再利用できない

あとは手順7・8と同じ。

---

## つまずいたときは

| 症状 | 原因と対処 |
|---|---|
| 起動しても真っ白 | Pages用ビルド(basePath付き)を同梱している。`npm run build:ios` をやり直す |
| Archive が押せない | デバイス選択がシミュレータのまま。**Any iOS Device (arm64)** に変える |
| Signing でエラー | Xcode > Settings > Accounts に Apple ID が入っているか、Developer Program の登録が完了しているかを確認 |
| 効果音が鳴らない | Web Audio はユーザー操作後にしか鳴らない仕様。画面を1回タップしてから確認する |
| `xcodebuild` が見つからない | 手順0の `xcode-select -s` を実行していない |
| アップロード後に SDK バージョン不足で拒否される | 古い Xcode でビルドしている。Xcode を 26 以降に更新して Archive からやり直す(2026年4月28日以降の要件) |
| 履歴が消える | シミュレータの「Erase All Content and Settings」を実行していないか確認。実機では消えない |
