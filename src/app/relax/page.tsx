"use client";

import { RelaxSession } from "@/components/relax/RelaxSession";

/**
 * RELAX 画面(心を鎮めてゆるりとする)。
 * 呼吸にあわせるブリージングセッション。没入のため下部ナビは非表示
 * (BottomNav / ContentFrame 側で /relax を除外済み)。
 */
export default function RelaxPage() {
  return <RelaxSession />;
}
