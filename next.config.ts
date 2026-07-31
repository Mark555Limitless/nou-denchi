import type { NextConfig } from "next";

// 完全オフライン動作(MUST)のため静的エクスポート + 自前Service Worker構成。
// サーバー機能・外部送信は一切使わない(ローカルファースト)。
// GitHub Pages 等のサブパス配信時は NEXT_PUBLIC_BASE_PATH(例: /nou-denchi)を
// 設定してビルドする(素の <img src> は src/lib/ui/asset.ts の asset() が付与)。
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  ...(basePath ? { basePath } : {}),
};

export default nextConfig;
