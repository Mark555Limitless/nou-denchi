// PWAアイコン生成スクリプト(要件§7)。
// ブランド(モノトーン・アーティスティック方向 v2)準拠: 白背景 + 漆黒の電池 + 青の稲妻。
// manifest 用(public/icons/)と Next.js ファイル規約用(src/app/)のPNGを生成する。
// 実行: npm run gen:icons
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const BG = "#ffffff"; // 白(--color-surface / manifest theme_color と同一)
const INK = "#0a0a0a"; // 電池のブランド漆黒(--color-ink と同一)
const ACCENT = "#256abf"; // 稲妻のアクセント青(--color-chart と同一)

/**
 * ブランド図柄(512x512 座標系)。縦型電池(漆黒のシルエット)の中央に
 * 青の稲妻を重ねた、小サイズでも判別できる単純図形。
 * アイコンと起動画面で同一の図柄を使うため関数に切り出している。
 */
function iconArt() {
  return `
    <g fill="${INK}">
      <!-- 電池の端子(上部キャップ) -->
      <rect x="206" y="52" width="100" height="52" rx="14"/>
      <!-- 電池本体 -->
      <rect x="140" y="88" width="232" height="372" rx="48"/>
    </g>
    <!-- 稲妻(ブランドアクセントの青) -->
    <path fill="${ACCENT}" d="M295 146 L189 300 L251 300 L219 414 L327 252 L263 252 Z"/>`;
}

/**
 * 512x512 のアイコンSVGを組み立てる。
 * @param {{maskable?: boolean}} opts maskable=true でセーフゾーン考慮(図柄を中央80%に縮小)
 */
function iconSvg({ maskable = false } = {}) {
  const art = iconArt();
  const body = maskable
    ? `<g transform="translate(51.2 51.2) scale(0.8)">${art}\n  </g>`
    : art;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${BG}"/>
  ${body}
</svg>`;
}

/**
 * iOS 起動画面(LaunchScreen)用の正方形スプラッシュ(2026-08-05 App Store 提出)。
 * storyboard 側が scaleAspectFill で表示するため、どの画面比率でも切れないよう
 * 図柄は中央のごく一部に置き、周囲は白の余白にする。
 * @param {number} size 出力の一辺(px)
 */
function splashSvg(size) {
  const art = 640; // 図柄の一辺。2732 基準で約23%(端末実寸で約150pt)
  const offset = (2732 - art) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 2732 2732">
  <rect width="2732" height="2732" fill="${BG}"/>
  <g transform="translate(${offset} ${offset}) scale(${art / 512})">
    ${iconArt()}
  </g>
</svg>`;
}

const outputs = [
  { file: "public/icons/icon-192.png", size: 192, maskable: false },
  { file: "public/icons/icon-512.png", size: 512, maskable: false },
  { file: "public/icons/icon-maskable-512.png", size: 512, maskable: true },
  // Next.js のファイル規約(layout.tsx 編集不要で <head> に自動リンクされる)
  { file: "src/app/icon.png", size: 32, maskable: false },
  { file: "src/app/apple-icon.png", size: 180, maskable: false },
  // iOS アプリのアイコン(2026-08-05 App Store 提出)。
  // Xcode 16 以降は 1024 の単一サイズから全サイズを自動生成する。
  // Apple はアルファチャンネル付きアイコンを審査で弾くため flatten で不透明にする。
  {
    file: "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png",
    size: 1024,
    maskable: false,
    opaque: true,
  },
];

for (const { file, size, maskable, opaque } of outputs) {
  const dest = path.join(root, file);
  await mkdir(path.dirname(dest), { recursive: true });
  let img = sharp(Buffer.from(iconSvg({ maskable })), { density: 288 }).resize(
    size,
    size,
  );
  if (opaque) img = img.flatten({ background: BG });
  await img.png().toFile(dest);
  console.log(
    `generated ${file} (${size}x${size}${maskable ? ", maskable" : ""}${opaque ? ", opaque" : ""})`,
  );
}

// iOS 起動画面。Capacitor の LaunchScreen.storyboard は Splash 画像集合を
// 1x/2x/3x の3ファイルで参照する(いずれも同一の 2732x2732 を使う既定構成)。
const SPLASH_DIR = "ios/App/App/Assets.xcassets/Splash.imageset";
const splashPng = await sharp(Buffer.from(splashSvg(2732)), { density: 72 })
  .resize(2732, 2732)
  .flatten({ background: BG })
  .png()
  .toBuffer();
for (const name of [
  "splash-2732x2732.png",
  "splash-2732x2732-1.png",
  "splash-2732x2732-2.png",
]) {
  const dest = path.join(root, SPLASH_DIR, name);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, splashPng);
  console.log(`generated ${SPLASH_DIR}/${name} (2732x2732)`);
}
