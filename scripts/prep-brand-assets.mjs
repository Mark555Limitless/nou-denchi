import sharp from "sharp";
import { mkdir } from "node:fs/promises";

/**
 * ブランド素材の加工(1回実行)。
 * - キャッチ&ロゴ05.png からロゴ部(脳アイコン+脳でんち)と全体版を public/brand/ へ
 * - キャラクター2体を public/characters/ へ(リサイズのみ・改変なし)
 */

const SRC = "ロゴ_キャッチコピー/キャッチ&ロゴ05.png"; // 1329x784
const GIRL = "/Users/ohno_m1/fable5-x-bot/イラスト参考/20260720_女の子全身.jpeg";
const FAL = "/Users/ohno_m1/fable5-x-bot/イラスト参考/20260704_Fal.jpg";

await mkdir("public/brand", { recursive: true });
await mkdir("public/characters", { recursive: true });

// ロゴ部(脳アイコン+「脳でんち」)。キャッチコピー行は含めない。
await sharp(SRC)
  .extract({ left: 230, top: 80, width: 880, height: 470 })
  .resize({ width: 880 })
  .png()
  .toFile("public/brand/logo.png");

// キャッチコピー行のみ(「キミ! いま何%?!?」)
await sharp(SRC)
  .extract({ left: 230, top: 555, width: 880, height: 150 })
  .png()
  .toFile("public/brand/catch.png");

// 全体版(オンボーディング等で使用)
await sharp(SRC).resize({ width: 1000 }).png().toFile("public/brand/catch-logo.png");

// キャラクター
await sharp(GIRL).resize({ height: 720 }).jpeg({ quality: 88 }).toFile("public/characters/girl.jpg");
await sharp(FAL).resize({ height: 512 }).jpeg({ quality: 88 }).toFile("public/characters/fal.jpg");

for (const f of [
  "public/brand/logo.png",
  "public/brand/catch.png",
  "public/brand/catch-logo.png",
  "public/characters/girl.jpg",
  "public/characters/fal.jpg",
]) {
  const m = await sharp(f).metadata();
  console.log(f, `${m.width}x${m.height}`);
}
