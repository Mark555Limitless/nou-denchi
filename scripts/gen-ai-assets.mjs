/**
 * AI素材生成スクリプト(1回実行・2026-07-31 ユーザー指示[2][3])。
 *
 * - Google Nano Banana Pro (gemini-3-pro-image-preview):
 *   ロゴ・キャラ2体の参照"画像"を読ませ、ブランド一貫のアートを生成
 * - OpenAI GPT Image 2 (gpt-image-2):
 *   パステルPOPの画面デザイン案(モックアップ)を生成(リテーマの参照用)
 *
 * APIキーは環境変数 GEMINI_API_KEY / OPENAI_API_KEY から読む(リポジトリに保存しない)。
 * 実行例: set -a; source ~/fable5-x-bot/.env; set +a; node scripts/gen-ai-assets.mjs
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_ART = path.join(root, "public/art-src"); // 原寸(後で sharp で縮小して public/art へ)
const OUT_MOCK =
  process.env.MOCK_DIR ??
  "/private/tmp/claude-501/-Users-ohno-m1-Desktop-AI-Claude---/d7623914-34a8-4bd7-a756-a59ca9afa68e/scratchpad/mockups";

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!GEMINI_KEY || !OPENAI_KEY) {
  console.error("GEMINI_API_KEY / OPENAI_API_KEY を環境変数で渡してください");
  process.exit(1);
}

const REF_LOGO = path.join(root, "ロゴ_キャッチコピー/キャッチ&ロゴ05.png");
const REF_GIRL = path.join(root, "public/characters/girl.jpg");
const REF_FAL = path.join(root, "public/characters/fal.jpg");

async function b64(p) {
  return (await readFile(p)).toString("base64");
}

/** Nano Banana Pro: 参照画像つき画像生成 */
async function nanoBanana(name, prompt, refs, aspectRatio = "1:1") {
  const parts = [{ text: prompt }];
  for (const r of refs) {
    parts.push({
      inline_data: { mime_type: r.mime, data: await b64(r.path) },
    });
  }
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
  if (!res.ok) throw new Error(`gemini ${name}: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const img = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!img) throw new Error(`gemini ${name}: 画像パートなし ${JSON.stringify(data).slice(0, 400)}`);
  const file = path.join(OUT_ART, `${name}.png`);
  await writeFile(file, Buffer.from(img.inlineData.data, "base64"));
  console.log(`nano-banana-pro → ${file}`);
}

/** GPT Image 2: テキスト→デザインモックアップ */
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
  const file = path.join(OUT_MOCK, `${name}.png`);
  await writeFile(file, Buffer.from(b64json, "base64"));
  console.log(`gpt-image-2 → ${file}`);
}

await mkdir(OUT_ART, { recursive: true });
await mkdir(OUT_MOCK, { recursive: true });

const STYLE =
  "参照画像1のロゴ「脳でんち」の世界観(白ベース・やわらかい丸み・青系+きらめき)と完全に一貫したタッチで。" +
  "背景は真っ白(#ffffff)。文字・ロゴ・ウォーターマークは一切描かない。キャラクターのデザイン・顔・服装・比率は参照画像に忠実に。";

// ① BOOST!! バナー用: Fal(参照3)が赤オレンジのエネルギーで急加速
await nanoBanana(
  "fal-boost",
  STYLE +
    "参照画像2のネコ型ロボット(Fal)が、元気いっぱいに空中でダッシュするダイナミックなポーズ。" +
    "周囲に赤〜オレンジのパステル調の稲妻とスピード線、エネルギーのきらめき。楽しく健全な「脳が急激に活性化する」イメージ。",
  [
    { path: REF_LOGO, mime: "image/png" },
    { path: REF_FAL, mime: "image/jpeg" },
  ],
  "1:1",
);

// ② RELAX バナー用: 女の子(参照2)がミントグリーンの空気でゆったり
await nanoBanana(
  "girl-relax",
  STYLE +
    "参照画像2の女の子が、目を閉じて深呼吸しながら穏やかに微笑んでいる、リラックスした座りポーズ。" +
    "周囲にミントグリーン〜若草色のパステルのやわらかい泡と葉っぱ、ゆったりした空気感。「心が鎮まる」イメージ。",
  [
    { path: REF_LOGO, mime: "image/png" },
    { path: REF_GIRL, mime: "image/jpeg" },
  ],
  "1:1",
);

// ③ ヒーロー: 2人そろって歓迎(オンボーディング完了などに配置)
await nanoBanana(
  "duo-hero",
  STYLE +
    "参照画像2の女の子と参照画像3のネコ型ロボット(Fal)が並んで、こちらに向かって明るく手を振っている。" +
    "周囲に青系パステルの泡とオレンジのきらめき(ロゴの世界観)。仲良しで楽しい歓迎のイメージ。",
  [
    { path: REF_LOGO, mime: "image/png" },
    { path: REF_GIRL, mime: "image/jpeg" },
    { path: REF_FAL, mime: "image/jpeg" },
  ],
  "4:3",
);

// ④⑤ パステルPOPデザイン案(GPT Image 2)— リテーマの参照用モックアップ
const MOCK_REQ =
  "Smartphone app UI design mockup, 9:16 phone screen, Japanese self-condition tracking app named 脳でんち. " +
  "Design requirements: pastel color POP style (soft pink, mint, lavender, cream, baby blue), white-ish pastel background, " +
  "very rounded corners (large border radius), candy-like soft buttons with subtle shadows, playful but clean and readable, " +
  "dark navy text for high contrast, cute sparkle and bubble accents. NOT dark mode. Flat 2D UI, no hands, no photo, no device frame.";

await gptImage(
  "mock-home",
  MOCK_REQ +
    " Screen: home screen with a big circular battery-style gauge in the center showing 92%, a small logo area at top, " +
    "a large primary button at bottom labeled 測定する, bottom navigation with 3 tabs (ホーム, 履歴, 設定).",
);

await gptImage(
  "mock-result",
  MOCK_REQ +
    " Screen: measurement result screen with a huge 92% number in a rounded card, a green status chip, " +
    "3 small horizontal stat bars, two wide banner buttons (one red-ish labeled BOOST!!, one green labeled RELAX), " +
    "and a share button at the bottom.",
);

console.log("done");
