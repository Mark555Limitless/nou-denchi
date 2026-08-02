/**
 * アクア・ガラスデザイン生成スクリプト(2026-08-02 ユーザー指示)。
 *
 * ユーザー提供の新スタート画面デザイン(イラスト/Start画面11.png)を
 * Nano Banana Pro (gemini-3-pro-image-preview) に「画像として」読ませ、
 * ① スタート画面のクリーン再現(ブラウザUI・ステータスバー抜き)
 * ② 他の全ページの同系統デザインモック
 * ③ 実装用素材(水面背景・金属ディスク)
 * を生成する。ロゴ&キャッチコピーの細部は キャッチ&ロゴ05.png を併読させる。
 *
 * 実行: set -a; source ~/fable5-x-bot/.env; set +a; node scripts/gen-aqua-design.mjs
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "docs/design/aqua");

const GEMINI_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_KEY) {
  console.error("GEMINI_API_KEY を環境変数で渡してください");
  process.exit(1);
}

const REF_START = path.join(root, "イラスト/Start画面11.png");
const REF_LOGO = path.join(root, "ロゴ_キャッチコピー/キャッチ&ロゴ05.png");

async function b64(p) {
  return (await readFile(p)).toString("base64");
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function nanoBanana(name, prompt, refs, aspectRatio, file) {
  const parts = [{ text: prompt }];
  for (const r of refs) {
    parts.push({ inline_data: { mime_type: r.mime, data: await b64(r.path) } });
  }
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
            imageConfig: { aspectRatio, imageSize: "2K" },
          },
        }),
      },
    );
    if (!res.ok) {
      const body = await res.text();
      const retryable = res.status === 503 || res.status === 429 || res.status >= 500;
      if (retryable && attempt < 12) {
        console.log(`${name}: HTTP ${res.status} — 60s後にリトライ(${attempt}/12)`);
        await sleep(60_000);
        continue;
      }
      throw new Error(`${name}: ${res.status} ${body.slice(0, 300)}`);
    }
    const data = await res.json();
    const img = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
    if (!img) {
      if (attempt < 12) {
        console.log(`${name}: 画像パートなし — 15s後にリトライ(${attempt}/12)`);
        await sleep(15_000);
        continue;
      }
      throw new Error(`${name}: 画像パートなし`);
    }
    await writeFile(file, Buffer.from(img.inlineData.data, "base64"));
    console.log(`${name}: 生成OK → ${file}`);
    return;
  }
}

/** 共通スタイル説明(全ページプロンプトの先頭に付ける) */
const STYLE = `最初の参照画像は、スマホアプリ「脳でんち」の確定済みスタート画面デザインです。これを画像として注意深く観察し、次の視覚言語を完全に理解してください:
- 背景: 明るい水色の水面(コースティクス光模様・透明な気泡・波紋)。清潔で透明感のある世界観
- ガラス感: 透明ガラスのリング・泡・すりガラスの白いカード
- 金属感: 中央の円盤はヘアライン加工のブラッシュドシルバー金属
- 文字: 濃紺(ネイビー)の太いゴシック。エンボス気味
- ボタン: 水滴をまとった光沢のある青いガラスの丸角ピル+白文字
- 下部ナビ: すりガラスのバーに紺のアイコン(ホーム/履歴/設定)
2枚目の参照画像はロゴ&キャッチコピーの原典です。ロゴの細部(脳+電池の頭部アイコン、「脳でんち」の青グラデ文字、「キミ！いま何%?!?」の斜体キャッチ)はこちらに忠実に。
出力はスマホ画面そのもののみ(9:16)。iPhoneのステータスバー・ブラウザのURLバー・ホームインジケータは絶対に描かない。日本語の文字は全て正確に。`;

const jobs = [
  {
    name: "aqua-home",
    file: "mock-aqua-home.png",
    prompt: `${STYLE}
このスタート画面デザインを、ブラウザUIやステータスバーを取り除いたクリーンなアプリ画面として忠実に再現してください。構成は参照画像と同一:
上部=ロゴ&キャッチコピー(2枚目参照に忠実)+右上に半透明のホログラム脳、
見出し「2026年8月2日3時36分の判断力(全盛期比)」、
中央=ガラスリング+金属ディスクのゲージ「脳でんちスコア 101%」、
「好調」白ガラスチップ(緑文字)+「今、勝負をかける時」、
注記「全体ベスト基準で算出(この時間帯のデータが貯まると切替)」、
青い水滴ボタン「測定する →」、
すりガラスの下部ナビ(ホーム/履歴/設定)。`,
  },
  {
    name: "aqua-result",
    file: "mock-aqua-result.png",
    prompt: `${STYLE}
同じ視覚言語で「測定結果」画面を新規デザインしてください。構成(上から):
見出し「測定結果」(濃紺)、
すりガラスの白カード: 「2026年8月2日6時44分の」「キミの判断力!(全盛期比)」「夜の測定」と大きな緑の「92%」、白ガラスチップ「好調」+「今、勝負をかける時」、
別のすりガラスカード「タスク別内訳」: 覚醒度98%・処理速度81%・切替力93%の3本の横バー(青いガラスのバー)、
その下に横長バナー3枚のプレースホルダー(赤系/緑系/紫系の暗いバナー。中身はぼかしでよい)、
白抜きの丸角アウトラインボタン「シェアカードを作る」、
下部ナビ。`,
  },
  {
    name: "aqua-measure",
    file: "mock-aqua-measure.png",
    prompt: `${STYLE}
同じ視覚言語で「覚醒度計測中」画面を新規デザインしてください。構成:
最上部に小さく「1 / 8」(濃紺・等幅)、左上に小さな✕、
画面中央に大きな青いガラスの円(水滴質感・内側に白文字で「243 ms」)、
画面下部に淡いグレーの2行ヒント「●が出たら、」「素早く画面をタップ!」(●は小さな青い円)。
背景は同じ水面。余計なカードやナビは無し(没入画面)。`,
  },
  {
    name: "aqua-history",
    file: "mock-aqua-history.png",
    prompt: `${STYLE}
同じ視覚言語で「履歴」画面を新規デザインしてください。構成:
見出し「履歴」、
すりガラスカード「判断力の推移(%)」: 「直近7日/直近30日」のガラスのセグメント切替+青い折れ線グラフ(0-100軸)、
すりガラスカード「時間帯別の平均(%)」: 朝/昼/夜/深夜の4本の青いガラス棒グラフ、
すりガラスカード「セッション一覧」: 日時+%+ゾーンチップの行が3行、
下部ナビ(履歴がアクティブ)。`,
  },
  {
    name: "aqua-settings",
    file: "mock-aqua-settings.png",
    prompt: `${STYLE}
同じ視覚言語で「設定」画面を新規デザインしてください。構成:
見出し「設定」、
すりガラスカード「プロフィール」: 「年代」ラベル+「30代」のガラスのセレクト+青い水滴ボタン「保存する」、
すりガラスカード「ベースラインの説明」(折りたたみ・v印)、
すりガラスカード「ベースライン再計測」: 説明文+白抜きアウトラインボタン、
すりガラスカード「データを全て削除」: 赤文字の危険ボタン、
下部ナビ(設定がアクティブ)。`,
  },
  {
    name: "aqua-training",
    file: "mock-aqua-training.png",
    prompt: `${STYLE}
同じ視覚言語で「トレオタ」(追加トレーニング選択メニュー)画面を新規デザインしてください。構成:
左上に✕、見出し「トレオタ」(青〜紫のグラデ文字)、
説明「記録に残らない自由特訓で、脳をとことん鍛えよう」(濃紺)、
横長バナー3枚(青系「覚醒度×30回」/オレンジ系「処理速度×2分」/紫系「切替力×50回」— 暗い近未来調のバナーがすりガラスの水面世界に浮かぶ)、
下部ナビ。`,
  },
  {
    name: "aqua-onboarding",
    file: "mock-aqua-onboarding.png",
    prompt: `${STYLE}
同じ視覚言語で「オンボーディング1枚目」画面を新規デザインしてください。構成:
中央にロゴ&キャッチコピー(2枚目参照に忠実・大きく)、
その下に金の小さなオーナメント(◆)、
説明文「今の判断力を、ベストな自分との比較で%表示。電池残量を見るように、頭のコンディションを確かめられます。」(濃紺)、
ページドット(●○○)、
青い水滴ボタン「次へ」。`,
  },
  {
    name: "asset-water-bg",
    file: "asset-water-bg.png",
    prompt: `最初の参照画像の背景と同じ世界観で、スマホアプリの背景用テクスチャを生成してください。
内容: 明るい水色の澄んだ水面を真上から見たテクスチャ。柔らかいコースティクス(光の網目)、ごく少数の透明な気泡、淡い波紋。
条件: 文字・UI・ロゴ・脳・物体は一切描かない。純粋な背景のみ。中央部は特に穏やかでフラット(上にUIが載るため)。明るさは参照画像と同じく白っぽい水色。`,
  },
  {
    name: "asset-holo-brain",
    file: "asset-holo-brain.png",
    prompt: `最初の参照画像の右上にある半透明のホログラム風の脳と同じものを、素材として単体で生成してください。
内容: 淡い水色〜青の線と点(ワイヤーフレーム+ネットワークの点描)で描かれた脳。柔らかい発光。
条件: 純白(#ffffff)の背景に脳1つだけを大きく中央に。文字・他の物体は一切描かない。`,
  },
  {
    name: "asset-metal-disc",
    file: "asset-metal-disc.png",
    prompt: `最初の参照画像の中央にある金属ディスクと同じ質感の素材を生成してください。
内容: ヘアライン(同心円ブラシ)加工のブラッシュドシルバー金属の円盤を真正面から。縁は僅かに面取りされ明るいハイライト。
条件: 円盤は画面中央に大きく1つだけ。背景は純白(#ffffff)。文字・数字・ロゴは一切描かない。円盤の外周がはっきり分かること。`,
  },
];

const main = async () => {
  await mkdir(OUT, { recursive: true });
  const only = process.env.ONLY ? process.env.ONLY.split(",") : null;
  for (const j of jobs) {
    if (only && !only.includes(j.name)) continue;
    const refs = [{ path: REF_START, mime: "image/png" }];
    if (!j.name.startsWith("asset-")) refs.push({ path: REF_LOGO, mime: "image/png" });
    const aspect = j.name === "asset-metal-disc" ? "1:1" : "9:16";
    await nanoBanana(j.name, j.prompt, refs, aspect, path.join(OUT, j.file));
  }
  console.log("done");
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
