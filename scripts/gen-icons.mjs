// PWAアイコン生成スクリプト(要件§7)。
// ブランド(モノトーン・アーティスティック方向 v2)準拠: 白背景 + 漆黒の電池 + 青の稲妻。
// manifest 用(public/icons/)と Next.js ファイル規約用(src/app/)のPNGを生成する。
// 実行: npm run gen:icons
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const BG = "#ffffff"; // 白(--color-surface / manifest theme_color と同一)
const INK = "#0a0a0a"; // 電池のブランド漆黒(--color-ink と同一)
const ACCENT = "#256abf"; // 稲妻のアクセント青(--color-chart と同一)

/**
 * 512x512 のアイコンSVGを組み立てる。
 * 縦型電池(漆黒のシルエット)の中央に青の稲妻を重ねた、小サイズでも判別できる単純図形。
 * @param {{maskable?: boolean}} opts maskable=true でセーフゾーン考慮(図柄を中央80%に縮小)
 */
function iconSvg({ maskable = false } = {}) {
  const art = `
    <g fill="${INK}">
      <!-- 電池の端子(上部キャップ) -->
      <rect x="206" y="52" width="100" height="52" rx="14"/>
      <!-- 電池本体 -->
      <rect x="140" y="88" width="232" height="372" rx="48"/>
    </g>
    <!-- 稲妻(ブランドアクセントの青) -->
    <path fill="${ACCENT}" d="M295 146 L189 300 L251 300 L219 414 L327 252 L263 252 Z"/>`;
  const body = maskable
    ? `<g transform="translate(51.2 51.2) scale(0.8)">${art}\n  </g>`
    : art;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${BG}"/>
  ${body}
</svg>`;
}

const outputs = [
  { file: "public/icons/icon-192.png", size: 192, maskable: false },
  { file: "public/icons/icon-512.png", size: 512, maskable: false },
  { file: "public/icons/icon-maskable-512.png", size: 512, maskable: true },
  // Next.js のファイル規約(layout.tsx 編集不要で <head> に自動リンクされる)
  { file: "src/app/icon.png", size: 32, maskable: false },
  { file: "src/app/apple-icon.png", size: 180, maskable: false },
];

for (const { file, size, maskable } of outputs) {
  const dest = path.join(root, file);
  await mkdir(path.dirname(dest), { recursive: true });
  await sharp(Buffer.from(iconSvg({ maskable })), { density: 288 })
    .resize(size, size)
    .png()
    .toFile(dest);
  console.log(`generated ${file} (${size}x${size}${maskable ? ", maskable" : ""})`);
}
