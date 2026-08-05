"use client";

import { useEffect } from "react";
import { BASE_PATH } from "@/lib/ui/asset";
import { isNativeApp } from "@/lib/ui/platform";

/**
 * Service Worker 登録(§7 オフライン動作)。本番ビルドでのみ有効。
 * 2026-08-04: 新バージョン配信時、旧キャッシュの画面が1回分残り続けないよう、
 * 新SWがページの制御を引き継いだ時点(controllerchange)で1度だけ自動リロードする。
 * 初回インストール(それまで制御SWなし)ではリロードしない。
 * 2026-08-05: iOSネイティブアプリ(Capacitor)では全ファイルが端末内に同梱され
 * 常に最新なので、SW によるキャッシュも自動リロードも不要・有害(capacitor:
 * スキームでは SW 自体が動作しない)。ネイティブ実行時は何もしない。
 */
export function SWRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      typeof navigator === "undefined" ||
      !("serviceWorker" in navigator) ||
      isNativeApp()
    ) {
      return;
    }
    // 既に制御中のSWがいる場合のみ「更新」とみなして自動リロード対象にする
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    const onControllerChange = () => {
      if (!hadController || reloaded) return;
      reloaded = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );
    navigator.serviceWorker.register(`${BASE_PATH}/sw.js`).catch(() => {
      // オフライン強化の失敗はアプリ動作を妨げない
    });
    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, []);
  return null;
}
