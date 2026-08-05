/**
 * 実行環境の判定(2026-08-05 iOSネイティブアプリ化)。
 *
 * 同じコードが「ブラウザ/PWA」と「iOSネイティブアプリ(Capacitor)」の
 * 両方で動くため、両者で挙動を変えたい箇所だけこの判定を使う。
 * Capacitor は WKWebView に capacitor://localhost/ でページを読み込むので、
 * プロトコルだけで判別でき、Capacitor の JS ランタイム読み込みを待たなくてよい。
 */
export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.protocol === "capacitor:";
}
