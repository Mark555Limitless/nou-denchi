// AIアセット生成 v4(2026-08-01 ユーザー指示)。
// [0] GPT Image 2 でキャラ非依存の白背景リッチ・デザインモックを再生成
// [6] BOOST05/RELAX01 と同系統デザインの「トレオタ」バナー+トレーニング3バナーを生成
// APIキーは実行時に環境変数から読む(リポジトリ非保存)。
// 使い方: set -a; source ~/fable5-x-bot/.env; set +a; node scripts/gen-ai-assets-v4.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_KEY) {
  console.error("OPENAI_API_KEY がありません");
  process.exit(1);
}

const RETRIES = 6;
const WAIT_MS = 30_000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withRetry(label, fn) {
  for (let i = 1; i <= RETRIES; i++) {
    try {
      return await fn();
    } catch (e) {
      console.error(`${label}: 失敗 (${i}/${RETRIES}): ${e.message}`);
      if (i === RETRIES) throw e;
      await sleep(WAIT_MS);
    }
  }
}

/** gpt-image-2 生成(テキストプロンプトのみ) */
async function generate(label, prompt, size, outPath) {
  await withRetry(label, async () => {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "gpt-image-2", prompt, size, quality: "high" }),
    });
    if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 300)}`);
    const json = await res.json();
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) throw new Error("b64_json なし");
    writeFileSync(outPath, Buffer.from(b64, "base64"));
    console.log(`${label}: 生成OK → ${outPath}`);
  });
}

/** gpt-image-2 edits(参照画像つき) */
async function editWithRefs(label, prompt, refPaths, size, outPath) {
  await withRetry(label, async () => {
    const form = new FormData();
    form.append("model", "gpt-image-2");
    form.append("prompt", prompt);
    form.append("size", size);
    form.append("quality", "high");
    for (const p of refPaths) {
      form.append(
        "image[]",
        new Blob([readFileSync(p)], { type: "image/png" }),
        path.basename(p),
      );
    }
    const res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_KEY}` },
      body: form,
    });
    if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 300)}`);
    const json = await res.json();
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) throw new Error("b64_json なし");
    writeFileSync(outPath, Buffer.from(b64, "base64"));
    console.log(`${label}: 生成OK → ${outPath}`);
  });
}

const designDir = path.join(root, "docs", "design");
const rawDir = path.join(root, "docs", "design", "raw-v4");
mkdirSync(rawDir, { recursive: true });

// ---------- [0] デザインモック(キャラなし・白背景リッチ) ----------
const mockCommon = `
Design a single smartphone app screen mockup (9:16 portrait phone, drawn large and centered).
Style: luxurious "rich white" Japanese wellness app. Pure white background (#ffffff),
glossy royal-blue gradient accents (#5da3ef → #2a78d6 → #1c5cab), thin elegant gold hairline
ornaments (#b8912f, subtle), deep navy typography (#232f5c), generous whitespace,
soft blue glow shadows, rounded cards. Absolutely NO mascots, NO characters, NO people,
NO animals, NO illustrations of any creature. Decoration is limited to abstract light,
gradients, thin gold lines and geometry. Clean, premium, trustworthy.
Text may be Japanese. App name: 脳でんち.`;

const mockJobs = [
  {
    label: "mock-home-v4",
    out: path.join(designDir, "mock-rich2-home.png"),
    prompt: `${mockCommon}
Screen: HOME. Top: app logo text 脳でんち with catchphrase キミ！いま何%!?.
Center: a large circular gauge ring in glossy blue gradient with a thin gold hairline ring
inside, big number 92% in deep navy, label 脳でんちスコア above it.
Below: a small status chip 好調 and one line of supporting text.
Bottom: a large glossy blue gradient pill button 測定する with subtle gold ring,
and a simple bottom navigation bar (ホーム / 履歴 / 設定).`,
  },
  {
    label: "mock-result-v4",
    out: path.join(designDir, "mock-rich2-result.png"),
    prompt: `${mockCommon}
Screen: RESULT. Header: 測定結果 with thin gold rule.
Card 1 (white, rounded, soft shadow): date line 2026年8月1日9時30分の, big heading
キミの判断力!(全盛期比), a very large green number 92%, chip 好調.
Card 2: horizontal bar chart タスク別内訳 with three blue gradient bars
(覚醒度 / 処理速度 / 切替力). Below: two wide dark game banners (one red BOOST!!, one green
RELAX) shown as simple abstract placeholders. Bottom: outlined blue pill button
シェアカードを作る.`,
  },
];

// ---------- [6] トレーニングバナー(BOOST05/RELAX01 と同系統) ----------
const boost05 = path.join(root, "BOOST05.png");
const relax01 = path.join(root, "RELAX01.png");

const bannerCommon = `
The two reference images are game banners from the same app (red BOOST!! banner and green
RELAX banner). Create ONE new wide banner in EXACTLY the same visual series and layout
language: same dark navy outer frame with rounded corners and thin glowing inner frame,
same 4:1 wide proportions drawn edge-to-edge (the banner fills the whole canvas),
same glossy 3D title lettering style with Japanese subtitle below in white bold rounded font,
same right-side glowing brain motif with arrows, same small rounded pill button at bottom
right reading ゲームをプレイ with the same style.
Render all Japanese text EXACTLY as specified, with correct glyphs, no typos, no extra text.`;

const bannerJobs = [
  {
    label: "banner-treota",
    out: path.join(rawDir, "banner-treota.png"),
    prompt: `${bannerCommon}
Color theme: royal blue / violet neon (instead of red or green). Motifs on the left:
glowing dumbbells, lightning and abstract neural circuits.
Big glossy title: トレオタ
Japanese subtitle below the title: 脳をきたえる追加トレーニング
Pill button text: メニューを開く`,
  },
  {
    label: "banner-tr-pvt",
    out: path.join(rawDir, "banner-tr-pvt.png"),
    prompt: `${bannerCommon}
Color theme: deep azure blue neon. Motifs on the left: glowing eye and radar pulses.
Big glossy title: 覚醒度×30回
Japanese subtitle below the title: 反応スピードを鍛える
Pill button text: トレーニング開始`,
  },
  {
    label: "banner-tr-math",
    out: path.join(rawDir, "banner-tr-math.png"),
    prompt: `${bannerCommon}
Color theme: amber / orange neon. Motifs on the left: glowing numbers and math symbols
(+ − × ÷) floating.
Big glossy title: 処理速度×2分
Japanese subtitle below the title: 計算スピードを鍛える
Pill button text: トレーニング開始`,
  },
  {
    label: "banner-tr-stroop",
    out: path.join(rawDir, "banner-tr-stroop.png"),
    prompt: `${bannerCommon}
Color theme: violet / magenta neon. Motifs on the left: glowing color swatches and
switching arrows (crossed swap arrows).
Big glossy title: 切替力×50回
Japanese subtitle below the title: 切り替える力を鍛える
Pill button text: トレーニング開始`,
  },
];

const only = process.env.ONLY ? process.env.ONLY.split(",") : null;

for (const job of mockJobs) {
  if (only && !only.includes(job.label)) continue;
  await generate(job.label, job.prompt, "1024x1536", job.out);
}

for (const job of bannerJobs) {
  if (only && !only.includes(job.label)) continue;
  // 4:1 は指定不可のため 1536x1024 で生成し、後段で中央の帯をクロップする
  await editWithRefs(job.label, job.prompt, [boost05, relax01], "1536x1024", job.out);
}

console.log("done");
