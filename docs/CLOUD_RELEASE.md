# クラウド経由の iOS リリース手順(Xcode 不要)

ローカルに Xcode を入れず、Codemagic(クラウドの Mac)でビルドして
App Store へ提出する手順。ローカルのディスク消費はゼロ。

- ビルド設定: [`codemagic.yaml`](../codemagic.yaml)(リポジトリ直下・コミット済み)
- ストア掲載内容: [APPSTORE_METADATA.md](APPSTORE_METADATA.md)
- Xcode をローカルに入れる場合は [IOS_RELEASE.md](IOS_RELEASE.md) を使う(併用も可)

どちらの方式でも **Apple Developer Program(年額 US$99)の登録は必須**。

---

## 1. Apple Developer Program に登録

<https://developer.apple.com/programs/enroll/> から登録。
本人確認に1〜2日かかることがある。完了するまで先へ進めない。

## 2. App Store Connect API キーを作成(ブラウザのみ・5分)

<https://appstoreconnect.apple.com/> → ユーザとアクセス → 統合 →
App Store Connect API → キーを生成。

- 名前: **`Codemagic`**(自由に決めてよい。理由は下記)
- アクセス権: **App Manager**

控えるもの(Codemagic 登録で使う):

| 項目 | 備考 |
|---|---|
| **.p8 ファイル** | ⚠️ **ダウンロードは一度きり**。安全な場所に保管 |
| **Issuer ID** | キー一覧の上部に表示 |
| **Key ID** | キーの行に表示 |

この3点だけで、配布証明書・プロビジョニングプロファイルは
Codemagic が自動生成する。Mac も Keychain も .p12 も不要。

### ⚠️ 「名前」が2か所出てくる — 別物なので混同しないこと

| どこ | 何の名前 | 決め方 |
|---|---|---|
| **手順2**(Apple 側・この節) | API キーのラベル | **自由**。`Codemagic` 推奨 |
| **手順4**(Codemagic 側) | 連携の登録名 | **`noudenchi-asc` 固定** |

**手順4の名前だけがビルドの成否に関わる**(`codemagic.yaml` の
`integrations.app_store_connect` と一致しないと署名で失敗する)。
手順2の名前は何にしても動く。

**手順2で `Codemagic` を推す理由**: このラベルは Apple の管理画面に並ぶだけで、
認証には使われずユーザーにも見えない(.p8 のファイル名も `AuthKey_<KeyID>.p8` で
名前は入らない)。選ぶ基準は「将来の自分が見て何の鍵か分かるか」だけなので、
**鍵を使う相手(=Codemagic)**を名前にするのが最も分かりやすい。

- ❌ アプリ名(`脳でんち`) … キーは**アカウント全体**で有効でアプリに紐づかない。
  2つ目のアプリを出したとき名前と実体がずれる
- ❌ 個人名・グループ名 … これは人の資格情報ではなく**システム用の資格情報**。
  「誰の鍵か」より「何に使う鍵か」が分かる名前にする

## 3. バンドル ID とアプリ枠を作成(ブラウザのみ)

1. <https://developer.apple.com/account/resources/identifiers/list> →
   「+」→ App IDs → App → 以下を入力して登録:
   - Description: **`Noudenchi`**
     - ⚠️ この欄は**英数字と半角スペースのみ**。日本語(`脳でんち`)・ハイフン
       (`nou-denchi`)・記号(`@ & * ' " - + .`)は弾かれる
     - 開発者ポータルの一覧に出るだけの**自分用ラベル**。利用者には見えず、
       App Store の表示名(`脳でんち`)とも無関係。**後から変更できる**
   - Bundle ID: **Explicit** で `com.marklimitless.noudenchi`
     (⚠️ こちらは**後から変更不可**。1文字も違えないこと)
   - Capabilities: 何もチェックしない
2. App Store Connect → マイ App → 「+」→ 新規 App:
   - プラットフォーム: iOS / 名前: `脳でんち` / 主言語: 日本語
   - バンドル ID: 上で作ったもの / SKU: `noudenchi-ios-001`

**ビルドをアップロードする前にこのアプリ枠が必要。**

## 4. Codemagic をセットアップ(無料枠 500分/月)

UI のボタン表記は英語の原文で記す(2026-08 時点の公式ドキュメント準拠)。
**Team は作らないこと**(Team にすると無料500分が消える。個人 = Personal account のまま使う)。

### 4-1. サインアップ

1. <https://codemagic.io/signup> → **Sign up with GitHub**
2. GitHub 側の認可画面で **Authorize Codemagic** をクリック
   - この認可は**本人確認(ログイン)専用**で、リポジトリへのアクセス権は渡らない。
     サインアップ直後にリポジトリ一覧が空でも正常
3. クレジットカード登録は不要(求められたら何かおかしいので中断して確認)

### 4-2. リポジトリを追加(GitHub App のインストール)

1. **Applications** ページ右上の **Add application**
2. Git provider で **GitHub** → **Next: Authorize integration**
3. 新しいウィンドウで **Authorize Codemagic CI/CD**
4. 続けて **Install GitHub App** をクリック
5. GitHub のインストール画面でアカウント(Mark555Limitless)を選び、
   ⚠️ **Select repositories only** を選んで **nou-denchi だけ**にチェック
   (All repositories は全リポジトリへの読み取り権を渡すので選ばない)
6. **Install & Authorize**(パスワード確認が出ることがある)
7. Codemagic に戻り、ドロップダウンから `Mark555Limitless/nou-denchi` を選択
8. **Select project type** は **Ionic** を選ぶ
   (Capacitor 専用タイルは無い。Ionic が Capacitor 用の選択肢。
    ビルド内容は codemagic.yaml で決まるため、この選択は表示にしか影響しない)
9. **Finish: Add application**

### 4-3. App Store Connect API キーを登録

1. 左ナビのチーム選択で **Personal account** を選び **Settings** を開く
2. **Integrations** セクション → **Developer Portal** の **Connect**
   (2回目以降は **Manage keys** → **Add key**)
3. フォームに入力:
   - **App Store Connect API key name**: ⚠️ **`noudenchi-asc`** で固定。
     `codemagic.yaml` の `integrations.app_store_connect` と1文字でも違うと失敗する。
     Apple 側でキーに付けた名前(`Codemagic` 等)とは**無関係**。揃える必要はない
   - **Issuer ID**: 手順2で控えた値
   - **Key ID**: 手順2で控えた値
   - **API key**: **Choose a .p8 file** で .p8 をアップロード
4. **Save**

### 4-4. 署名用の秘密鍵を登録(自動コード署名に必須)

Codemagic が Apple Distribution 証明書を自動作成するために、
**App Store Connect API キーとは別の** RSA 秘密鍵が1本必要。
生成済み: `脳でんち_非公開情報/App Store登録/Codemagic署名用秘密鍵/codemagic_signing_key`
(再生成する場合: `ssh-keygen -t rsa -b 2048 -m PEM -f codemagic_signing_key -q -N ""`)

1. Codemagic の **Applications** → nou-denchi → アプリ設定の
   **Environment variables** タブを開く
2. 次の内容で追加:
   - **Variable name**: `CERTIFICATE_PRIVATE_KEY`(この名前で固定)
   - **Variable value**: 上記ファイルの中身を貼り付け
     (ターミナルで `pbcopy < ファイルパス` するとクリップボードに入る)
   - **Group**: `ios-signing`(⚠️ `codemagic.yaml` の `environment.groups` と一致必須)
   - **Secret**: ⚠️ 必ずチェックを入れる
3. **Add** で保存

## 5. ビルド実行(ボタン1つ)

1. Applications → nou-denchi → **codemagic.yaml** タブ右上でブランチ **main** を選び、
   **Check for configuration files** をクリック(yaml を認識させる)
2. **Start your first build**(2回目以降は **Start new build**)をクリック
3. **Specify build configuration** ポップアップで branch **main** と
   workflow **ios-release(iOS App Store ビルド…)** を選び **Start new build**

15〜25分で:

- IPA のビルドと署名
- App Store Connect へのアップロード
- TestFlight への登録

まで自動で完了する。結果はメールにも届く。

> 1ビルド約20分 = 無料枠で月20回以上。課金は不要のはず。

## 6. iPhone の TestFlight で動作確認

1. iPhone に App Store から「TestFlight」アプリを入れる
2. App Store Connect → TestFlight タブ → 内部テスト → 自分を追加
3. iPhone に届いた招待から「脳でんち」をインストール

**確認すること**(シミュレータ確認の代わり。実機なのでより確実):

- [ ] 測定が最後まで進む(計算 → ストループ → PVT → 結果)
- [ ] アプリを終了して再起動しても履歴が残っている
- [ ] 効果音が鳴る(最初のタップまで鳴らないのは仕様)
- [ ] 画面上端・下端が Dynamic Island / ホームバーに被っていない

## 7. App Store Connect で申請

[APPSTORE_METADATA.md](APPSTORE_METADATA.md) の内容をそのまま貼り付ける。

1. スクリーンショット: `docs/appstore/screenshots/` の5枚(1290x2796)をアップロード
2. 説明・キーワード・サポートURL・プライバシーポリシーURL
3. App のプライバシー: 「データを収集しません」
4. 年齢制限の質問票: 医療・ウェルネス関連は「診断・治療目的ではない」で一貫回答
5. ビルド: TestFlight に上がったものを選択
6. 審査メモ欄: APPSTORE_METADATA.md の文面を貼り付け
7. 審査へ提出(通常1〜3日)

## 8. 2回目以降の更新

コードを修正して main へプッシュ → Codemagic で Start new build → 手順7の
「ビルド選択」だけやり直して再提出。ビルド番号は自動で増える
(`agvtool` + Codemagic の `BUILD_NUMBER`)。
利用者に見えるバージョン(1.0 → 1.1 等)を上げたいときは
`ios/App/App.xcodeproj` の `MARKETING_VERSION` を変更してコミットする。

---

## つまずいたときは

| 症状 | 原因と対処 |
|---|---|
| Specify build configuration に workflow が出ない | ブランチが main 以外を向いている/「Check for configuration files」を押していない。yaml はビルドのたびにリポジトリから読み直される |
| 「No signing certificate "iOS Distribution" found」で ARCHIVE FAILED | `keychain initialize`→`keychain add-certificates` の2ステップが yaml に無い(証明書は取得後キーチェーンに入れて初めて xcodebuild から見える)。現行 yaml は対応済み |
| App Store distribution だけ赤で終わる(Complete test information is required…) | **アップロード自体は成功している**。外部テスター向けベータ審査への自動提出(`submit_to_testflight: true`)が、TestFlight テスト情報(Feedback Email 等)未入力で失敗しただけ。内部テスト・App Store 申請には不要なので現行 yaml は false。外部テスターを招く時だけ <https://appstoreconnect.apple.com/apps/6799632701/testflight/test-info> を入力して true に戻す |
| fetch-signing-files でエラー | 手順4-4 の `CERTIFICATE_PRIVATE_KEY` が未登録、Group 名が `ios-signing` と不一致、Secret 漏れ、または鍵が PEM 形式でない |
| ビルドが署名エラー | **Codemagic 側**(手順4-3)のキー名が `noudenchi-asc` になっているか。Apple 側(手順2)の名前は無関係なので変えなくてよい。Developer Program の登録が完了しているか。API キーの権限が **App Manager** か(Developer 権限だとアップロードで失敗) |
| アップロードで「アプリが見つからない」 | 手順3のアプリ枠(バンドルID一致)を作っていない |
| 起動しても真っ白 | `npm run build:ios` を経由しない成果物を同梱している(codemagic.yaml を変更した場合のみ起こり得る) |
| TestFlight に出てこない | アップロード後の処理に10〜30分かかる。「輸出コンプライアンス」は Info.plist 設定済みのため質問されない |
| 無料枠を使い切った | 翌月まで待つか、$0.095/分で追加。通常は月500分で十分 |
