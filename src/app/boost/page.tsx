"use client";

import { BoostGame } from "@/components/boost/BoostGame";

/**
 * BOOST!! ゲーム(あそび・測定データとは独立)。
 * 没入設計のため下部ナビは layout 側で自動非表示(/boost)。
 */
export default function BoostPage() {
  return <BoostGame />;
}
