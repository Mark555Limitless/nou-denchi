import type { NextConfig } from "next";

// 完全オフライン動作(MUST)のため静的エクスポート + 自前Service Worker構成。
// サーバー機能・外部送信は一切使わない(ローカルファースト)。
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
