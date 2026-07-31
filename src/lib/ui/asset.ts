/**
 * 静的アセットURLのベースパス対応(GitHub Pages のサブパス配信用)。
 * next/link・router は next.config の basePath を自動付与するが、
 * 素の <img src> や Canvas 用 Image.src には付かないため、必ずこの asset() を通す。
 * NEXT_PUBLIC_BASE_PATH はビルド時にインライン展開される(未設定=ルート配信では空文字)。
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** "/brand/logo.png" のようなルート相対パスに配信ベースパスを付与する */
export function asset(path: string): string {
  return `${BASE_PATH}${path}`;
}
