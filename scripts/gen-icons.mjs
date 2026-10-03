// アイコン生成スクリプト(要件§7)。
// 2026-10-03 改訂: 図案を「電池」から「頭+電球+稲妻」(docs/design/app-icon/app-icon-1024.png)へ変更。
// 原画(1024x1024・不透明・白背景)から、PWA(public/icons/)・Next.js ファイル規約(src/app/)・
// iOS アプリアイコン・iOS 起動画面の全サイズを生成する。
// 実行: npm run gen:icons
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SRC = path.join(root, "docs/design/app-icon/app-icon-1024.png");
const BG = "#ffffff"; // 原画の背景色(manifest の background_color / theme_color と同一)

// maskable はOSが外周を切り抜くため、図柄を中心から半径40%の円に収める必要がある。
// 原画の図柄の最遠点は中心から幅の約48.7%なので、0.8倍に縮小して白で余白を足す。
const MASKABLE_SCALE = 0.8;

/**
 * 原画を一辺 size の正方形 PNG にする。
 * @param {number} size 出力の一辺(px)
 * @param {{maskable?: boolean}} opts
 */
async function iconPng(size, { maskable = false } = {}) {
  if (!maskable) {
    return sharp(SRC).resize(size, size).flatten({ background: BG }).withIccProfile("srgb").png().toBuffer();
  }
  const inner = Math.round(size * MASKABLE_SCALE);
  const pad = Math.floor((size - inner) / 2);
  return sharp(SRC)
    .resize(inner, inner)
    .extend({ top: pad, bottom: size - inner - pad, left: pad, right: size - inner - pad, background: BG })
    .flatten({ background: BG })
    .withIccProfile("srgb")
    .png()
    .toBuffer();
}

const outputs = [
  { file: "public/icons/icon-192.png", size: 192 },
  { file: "public/icons/icon-512.png", size: 512 },
  { file: "public/icons/icon-maskable-512.png", size: 512, maskable: true },
  // macOS Safari の「Dockに追加」は 1024 の不透明 maskable を推奨(WebKit, Safari 17.2)
  { file: "public/icons/icon-maskable-1024.png", size: 1024, maskable: true },
  // Next.js のファイル規約(layout.tsx 編集不要で <head> に自動リンクされる)
  { file: "src/app/icon.png", size: 32 },
  { file: "src/app/apple-icon.png", size: 180 },
  // iOS アプリのアイコン。Xcode 16 以降は 1024 の単一サイズから全サイズを自動生成する。
  // Apple はアルファチャンネル付きアイコンをアップロード時に弾く(ITMS-90717)ため flatten で不透明にする。
  { file: "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png", size: 1024 },
];

for (const { file, size, maskable } of outputs) {
  const dest = path.join(root, file);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, await iconPng(size, { maskable }));
  console.log(`generated ${file} (${size}x${size}${maskable ? ", maskable" : ""})`);
}

// favicon.ico(16/32/48 を PNG 埋め込みで1ファイルに束ねる)
const icoSizes = [16, 32, 48];
const icoImages = await Promise.all(icoSizes.map((s) => iconPng(s)));
const header = Buffer.alloc(6 + 16 * icoSizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(icoSizes.length, 4);
let offset = header.length;
icoSizes.forEach((s, i) => {
  const e = 6 + 16 * i;
  header.writeUInt8(s, e);
  header.writeUInt8(s, e + 1);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(icoImages[i].length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += icoImages[i].length;
});
await writeFile(path.join(root, "src/app/favicon.ico"), Buffer.concat([header, ...icoImages]));
console.log("generated src/app/favicon.ico (16/32/48)");

// iOS 起動画面。Capacitor の LaunchScreen.storyboard は Splash 画像集合を
// 1x/2x/3x の3ファイルで参照する(いずれも同一の 2732x2732)。
// storyboard 側が scaleAspectFill で表示するため、どの画面比率でも切れないよう
// 図柄(白い余白を除いた部分)を高さ520pxに縮めて中央に置く(旧電池図柄と同程度の大きさ)。
const SPLASH = 2732;
const art = await sharp(SRC).trim({ background: BG, threshold: 30 }).resize({ height: 520 }).png().toBuffer();
const { width: aw, height: ah } = await sharp(art).metadata();
// sharp は composite をパイプラインの最後に適用するため、透過除去は合成後の別パスで行う
const composed = await sharp({ create: { width: SPLASH, height: SPLASH, channels: 3, background: BG } })
  .composite([{ input: art, left: Math.floor((SPLASH - aw) / 2), top: Math.floor((SPLASH - ah) / 2) }])
  .png()
  .toBuffer();
const splashPng = await sharp(composed).flatten({ background: BG }).withIccProfile("srgb").png().toBuffer();
const SPLASH_DIR = "ios/App/App/Assets.xcassets/Splash.imageset";
for (const name of ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"]) {
  const dest = path.join(root, SPLASH_DIR, name);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, splashPng);
  console.log(`generated ${SPLASH_DIR}/${name} (2732x2732)`);
}
