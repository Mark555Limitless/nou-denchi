/**
 * AI素材生成スクリプト v3(2026-07-31 ユーザー指示[0][2][3])。
 *
 * - Google Nano Banana Pro (gemini-3-pro-image-preview):
 *   参照"画像"を読ませ、背景を除去した純白背景版を生成
 *   ① ロゴ+キャッチコピーのみ(背景のグラデ・泡なし)
 *   ② 女の子のみ ③ Fal のみ
 * - OpenAI GPT Image 2 (gpt-image-2): 白背景リッチデザインのモックアップ2枚
 * - 仕上げ: sharp で白飛ばし(near-white → 純白)し、アプリの白面に馴染ませる
 *
 * 実行: set -a; source ~/fable5-x-bot/.env; set +a; node scripts/gen-ai-assets-v3.mjs
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RAW = path.join(root, "public/art-src");
const MOCK = path.join(root, "docs/design");

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!GEMINI_KEY || !OPENAI_KEY) {
  console.error("GEMINI_API_KEY / OPENAI_API_KEY を環境変数で渡してください");
  process.exit(1);
}

const REF_LOGO = path.join(root, "ロゴ_キャッチコピー/キャッチ&ロゴ05.png");
const REF_GIRL = "/Users/ohno_m1/fable5-x-bot/イラスト参考/20260720_女の子全身.jpeg";
const REF_FAL = "/Users/ohno_m1/fable5-x-bot/イラスト参考/20260704_Fal.jpg";

async function b64(p) {
  return (await readFile(p)).toString("base64");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function nanoBanana(name, prompt, refs, aspectRatio = "1:1") {
  const parts = [{ text: prompt }];
  for (const r of refs) {
    parts.push({ inline_data: { mime_type: r.mime, data: await b64(r.path) } });
  }
  // 高負荷時(UNAVAILABLE/429)は指数バックオフで最大5回リトライ
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseModalities: ["IMAGE"],
            imageConfig: { aspectRatio, imageSize: "1K" },
          },
        }),
      },
    );
    if (!res.ok) {
      const body = await res.text();
      const retryable = res.status === 503 || res.status === 429 || res.status >= 500;
      if (retryable && attempt < 10) {
        const wait = 60_000;
        console.log(`gemini ${name}: ${res.status} — ${wait / 1000}s 後にリトライ(${attempt}/10)`);
        await sleep(wait);
        continue;
      }
      throw new Error(`gemini ${name}: ${res.status} ${body}`);
    }
    const data = await res.json();
    const img = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
    if (!img) {
      if (attempt < 10) {
        console.log(`gemini ${name}: 画像パートなし — リトライ(${attempt}/10)`);
        await sleep(10_000);
        continue;
      }
      throw new Error(`gemini ${name}: 画像パートなし`);
    }
    const file = path.join(RAW, `${name}.png`);
    await writeFile(file, Buffer.from(img.inlineData.data, "base64"));
    console.log(`nano-banana-pro → ${file}`);
    return file;
  }
}

async function gptImage(name, prompt, size = "1024x1536") {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "gpt-image-2", prompt, size, quality: "medium" }),
  });
  if (!res.ok) throw new Error(`gpt-image-2 ${name}: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const b64json = data.data?.[0]?.b64_json;
  if (!b64json) throw new Error(`gpt-image-2 ${name}: b64なし`);
  const file = path.join(MOCK, `${name}.png`);
  await writeFile(file, Buffer.from(b64json, "base64"));
  console.log(`gpt-image-2 → ${file}`);
}

/** near-white を純白に飛ばす(a*x+b で 245 付近以上を 255 にクリップ) */
function whiteFlatten(pipeline) {
  return pipeline.linear(1.12, -18);
}

await mkdir(RAW, { recursive: true });
await mkdir(MOCK, { recursive: true });

const FAITHFUL =
  "参照画像のデザイン・形・色・タッチに完全に忠実に再現すること。新しい要素を足さない。" +
  "背景は完全な純白(#ffffff)のベタ塗りにする。影・グラデーション・模様・泡・きらめきなど背景の装飾は一切描かない。" +
  "文字・ウォーターマークを追加しない。";

if (!process.env.SKIP_GEMINI) {
// ② ロゴ+キャッチコピーのみ(純白背景)
await nanoBanana(
  "logo-clean",
  "参照画像から「脳のアイコン」と「脳でんち」のロゴ文字と「キミ！いま何%?!?」のキャッチコピー文字だけを抜き出す。" +
    "配置は参照画像と同じ(上に脳アイコン、中央に脳でんち、下にキャッチコピー)。" +
    FAITHFUL,
  [{ path: REF_LOGO, mime: "image/png" }],
  "4:3",
);

// ③ 女の子のみ(純白背景)
await nanoBanana(
  "girl-clean",
  "参照画像の女の子キャラクターだけを抜き出す。ポーズ・顔・服装・比率は参照画像に完全に忠実に。" + FAITHFUL,
  [{ path: REF_GIRL, mime: "image/jpeg" }],
  "3:4",
);

// ③' Fal のみ(純白背景)
await nanoBanana(
  "fal-clean",
  "参照画像のネコ型ロボットだけを抜き出す。デザイン・浮遊リング・比率は参照画像に完全に忠実に。" +
    "背景の回路模様は描かない。" +
    FAITHFUL,
  [{ path: REF_FAL, mime: "image/jpeg" }],
  "1:1",
);

// ── 仕上げ(Gemini分): 白飛ばし+リサイズして配置 ──
await whiteFlatten(sharp(path.join(RAW, "logo-clean.png")))
  .resize({ width: 900 })
  .png()
  .toFile(path.join(root, "public/brand/logo-clean.png"));
await whiteFlatten(sharp(path.join(RAW, "girl-clean.png")))
  .resize({ height: 720 })
  .jpeg({ quality: 90 })
  .toFile(path.join(root, "public/characters/girl.jpg"));
await whiteFlatten(sharp(path.join(RAW, "fal-clean.png")))
  .resize({ height: 512 })
  .jpeg({ quality: 90 })
  .toFile(path.join(root, "public/characters/fal.jpg"));
}

if (!process.env.SKIP_OPENAI) {
// ⓪ 白背景リッチデザインのモックアップ(GPT Image 2)
const RICH =
  "Smartphone app UI design mockup, 9:16 phone screen, Japanese cognitive self-condition app 脳でんち. " +
  "Art direction: RICH and premium design on a pure WHITE background. Refined luxury feel: " +
  "soft layered drop shadows, generous white space, large rounded cards with delicate hairline borders, " +
  "subtle blue gradient accents (brand blue #2a78d6 to light azure), a touch of gold accent allowed, " +
  "deep navy typography, glossy highlights, elegant editorial composition. NOT flat minimalism, NOT dark mode, " +
  "no photo, no hands, no device frame, no watermark. Flat 2D UI.";

await gptImage(
  "mock-rich-home",
  RICH +
    " Screen: home. Top: small elegant logo area. Center: a large luxurious circular gauge showing 92% " +
    "(gradient ring with soft glow and glossy depth). Bottom: one premium primary button labeled 測定する, " +
    "3-tab bottom nav (ホーム, 履歴, 設定).",
);

await gptImage(
  "mock-rich-result",
  RICH +
    " Screen: measurement result. A rich card with huge 92% number, a status chip, 3 elegant stat bars, " +
    "two wide banner buttons labeled BOOST!! (warm red accent) and RELAX (green accent) in the same rich white style, " +
    "and a share button.",
);

}

if (!process.env.SKIP_FLATTEN) {
// 既存アート3点+シェアカード用ロゴも白飛ばしで馴染ませる(in-place)
for (const f of ["fal-boost", "girl-relax", "duo-hero"]) {
  const src = path.join(RAW, `${f}.png`);
  const out = path.join(root, `public/art/${f}.webp`);
  await whiteFlatten(sharp(src))
    .resize({ width: f === "duo-hero" ? 800 : 512 })
    .webp({ quality: 90 })
    .toFile(out);
}
{
  const buf = await whiteFlatten(sharp(path.join(root, "public/brand/logo.png"))).png().toBuffer();
  await writeFile(path.join(root, "public/brand/logo.png"), buf);
}
}

console.log("done");
