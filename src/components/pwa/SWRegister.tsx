"use client";

import { useEffect } from "react";
import { BASE_PATH } from "@/lib/ui/asset";

/** Service Worker 登録(§7 オフライン動作)。本番ビルドでのみ有効。 */
export function SWRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      typeof navigator === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }
    navigator.serviceWorker.register(`${BASE_PATH}/sw.js`).catch(() => {
      // オフライン強化の失敗はアプリ動作を妨げない
    });
  }, []);
  return null;
}
