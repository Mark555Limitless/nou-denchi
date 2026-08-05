import type { CapacitorConfig } from "@capacitor/cli";

/**
 * iOS ネイティブアプリ(App Store 提出用)の設定(2026-08-05 ユーザー指示)。
 *
 * 方針: Web版と同一の静的エクスポート(out/)をアプリ内に同梱し、
 * 端末内のファイルだけで完結させる(サーバー接続・外部送信は一切なし)。
 * これにより機内モードでも全機能が動作し、App Store のプライバシー申告も
 * 「データを収集しません」で通せる。
 *
 * ビルド手順は docs/IOS_RELEASE.md を参照。
 * 注意: webDir に入れる out/ は basePath なし(ルート配信)でビルドすること。
 * GitHub Pages 用の NEXT_PUBLIC_BASE_PATH=/nou-denchi ビルドを同梱すると
 * アセットの参照先がずれて白画面になる。
 */
const config: CapacitorConfig = {
  appId: "com.marklimitless.noudenchi",
  appName: "脳でんち",
  webDir: "out",
  // 端末内ファイルのみを読み込む(リモートURLへは接続しない)
  server: {
    androidScheme: "https",
    iosScheme: "capacitor",
  },
  ios: {
    // 起動時の背景色。Web版のテーマ(白基調)に合わせる
    backgroundColor: "#ffffff",
    // ゴムバンド(過スクロール)を無効化してネイティブアプリらしい挙動にする
    scrollEnabled: true,
    // WKWebView の自動インセットを切り、safe-area は CSS 側で制御する
    contentInset: "never",
  },
};

export default config;
