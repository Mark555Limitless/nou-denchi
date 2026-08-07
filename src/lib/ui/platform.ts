/**
 * 実行環境の判定(2026-08-05 iOSネイティブアプリ化)。
 *
 * 同じコードが「ブラウザ/PWA」と「iOSネイティブアプリ(Capacitor)」の
 * 両方で動くため、両者で挙動を変えたい箇所だけこの判定を使う。
 * 判定は Capacitor ランタイムの isNativePlatform() を優先し、
 * ランタイム読み込み前でも判定できるよう capacitor: プロトコルを併用する
 * (Android 版は androidScheme=https でプロトコル判定が効かないため。2026-08-08)。
 */
export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (
    window as unknown as {
      Capacitor?: { isNativePlatform?: () => boolean };
    }
  ).Capacitor;
  if (cap?.isNativePlatform?.()) return true;
  return window.location.protocol === "capacitor:";
}
