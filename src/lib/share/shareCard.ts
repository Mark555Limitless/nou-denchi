import type { Zone } from "@/lib/engine/types";
import { zoneHex, zoneTextHexOf } from "@/lib/ui/zone";
import { brandColors } from "@/lib/config";
import { t } from "@/lib/i18n";
import { timeLabel } from "@/lib/ui/format";

/**
 * シェアカード生成(§6 MUST)。1080×1350 縦型PNG を Canvas に描画する関数。
 * 白背景リッチテーマ(mock-rich-result.png 準拠): 純白地+濃紺の数字・見出し+
 * 金のヘアラインサークル+ゾーン色アクセント(上部の帯+円形ゲージ)。
 * day7 バリアントは白+アンバーの🏆記念デザイン(§6.4②)。
 * 個人情報は「%」と「日付」以外一切載せない(§6.3)。
 * ブラウザ実行前提(document / canvas / Image 使用)のため、必ずイベントハンドラ等から呼ぶこと。
 */

const W = 1080;
const H = 1350;
const FONT = "system-ui, -apple-system, sans-serif";

/** デザイントークン(白背景リッチテーマ。globals.css と同値。Canvas では CSS 変数を参照できないため直書き) */
const C = {
  bg: brandColors.surface,
  /** ink 相当(数字・主見出し・濃紺) */
  ink: "#232f5c",
  /** ink-2 相当(サブ文言) */
  sub: "#46538a",
  /** ink-mute 相当(日付・ハッシュタグ) */
  mute: "#5f6d98",
  /** surface-3 相当(ゲージトラック・淡い青灰) */
  track: "#edf2fa",
  /** gold-soft 相当(金のヘアラインサークル) */
  gold: "#ead9ab",
} as const;

/** 上部アクセント帯の高さ */
const BAND_H = 18;

export interface ShareCardOptions {
  /** 表示%(displayPercent.value のクリップ済み値) */
  percent: number;
  overCap: boolean;
  zone: Zone;
  date: Date;
  variant: "daily" | "day7";
}

/** ロゴ画像(/brand/logo.png 880×470・白背景焼き込み)のロードキャッシュ */
let logoPromise: Promise<HTMLImageElement | null> | null = null;

/** ロゴを Promise で読み込む。失敗時は null(テキスト描画へフォールバック)を返し、失敗はキャッシュしない */
function loadLogo(): Promise<HTMLImageElement | null> {
  if (logoPromise) return logoPromise;
  const p = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      logoPromise = null; // 次回の生成で再試行できるようにする
      resolve(null);
    };
    img.src = "/brand/logo.png";
  });
  logoPromise = p;
  return p;
}

export async function generateShareCard(
  opts: ShareCardOptions,
): Promise<Blob> {
  const logo = await loadLogo();

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context unavailable");

  if (opts.variant === "day7") {
    drawBackground(ctx, brandColors.amber, 790);
    drawDay7Body(ctx, opts.date);
  } else {
    drawBackground(ctx, zoneHex(opts.zone), 640);
    drawDailyBody(ctx, opts);
  }
  drawFooter(ctx, logo);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("share card toBlob failed"))),
      "image/png",
    );
  });
}

/** カード用日付表示 YYYY.MM.DD */
export function formatCardDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function setFont(
  ctx: CanvasRenderingContext2D,
  weight: number,
  size: number,
): void {
  ctx.font = `${weight} ${size}px ${FONT}`;
}

/** 白ベース+上部のアクセント帯+ゲージ背後の淡いアクセントチント */
function drawBackground(
  ctx: CanvasRenderingContext2D,
  accent: string,
  glowCy: number,
): void {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  const rad = ctx.createRadialGradient(W / 2, glowCy, 80, W / 2, glowCy, 720);
  rad.addColorStop(0, hexToRgba(accent, 0.1));
  rad.addColorStop(1, hexToRgba(accent, 0));
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, W, BAND_H);
}

function centerText(
  ctx: CanvasRenderingContext2D,
  text: string,
  y: number,
  weight: number,
  size: number,
  color: string,
): void {
  setFont(ctx, weight, size);
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, W / 2, y);
}

/** 円形ゲージ(淡色トラック+アクセント色アーク。12時起点・時計回り) */
function drawGauge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  lineWidth: number,
  fraction: number,
  accent: string,
): void {
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.strokeStyle = C.track;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  const f = Math.min(1, Math.max(0, fraction));
  if (f > 0) {
    const start = -Math.PI / 2;
    ctx.strokeStyle = accent;
    ctx.beginPath();
    ctx.arc(cx, cy, r, start, start + Math.PI * 2 * f);
    ctx.stroke();
  }
}

/** 大型%数字。maxWidth に収まるまでフォントサイズを自動縮小して中央描画 */
function drawPercentNumber(
  ctx: CanvasRenderingContext2D,
  value: number,
  cx: number,
  cy: number,
  baseSize: number,
  maxWidth: number,
  color: string,
): void {
  const digits = String(value);
  let size = baseSize;
  let numW = 0;
  let pctW = 0;
  let gap = 0;
  for (;;) {
    setFont(ctx, 800, size);
    numW = ctx.measureText(digits).width;
    setFont(ctx, 800, size * 0.34);
    pctW = ctx.measureText("%").width;
    gap = size * 0.02;
    if (numW + gap + pctW <= maxWidth || size <= 120) break;
    size -= 16;
  }
  const left = cx - (numW + gap + pctW) / 2;
  const baseline = cy + size * 0.35;
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  setFont(ctx, 800, size);
  ctx.fillText(digits, left, baseline);
  setFont(ctx, 800, size * 0.34);
  ctx.fillText("%", left + numW + gap, baseline);
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 「絶好調!」等のピルバッジ(白面用: 淡色地+文字色ボーダー) */
function drawPill(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  text: string,
  fontSize: number,
  bg: string,
  fg: string,
): void {
  setFont(ctx, 700, fontSize);
  const padX = fontSize * 0.8;
  const w = ctx.measureText(text).width + padX * 2;
  const h = fontSize * 1.9;
  roundedRectPath(ctx, cx - w / 2, cy - h / 2, w, h, h / 2);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = fg;
  ctx.stroke();
  setFont(ctx, 700, fontSize);
  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy + fontSize * 0.05);
  ctx.textBaseline = "alphabetic";
}

/**
 * 円形ゲージの外周を囲む金のヘアラインサークル(リッチテーマの上品な装飾)。
 * gold-soft の細線1本のみで、視認性は妨げない。
 */
function drawGoldRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
): void {
  ctx.save();
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** 4点スパークル(day7 のきらめき演出) */
function drawSparkle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.closePath();
  ctx.fill();
}

/** 通常デイリーカード本体(白地+ゾーン色アクセント) */
function drawDailyBody(
  ctx: CanvasRenderingContext2D,
  opts: ShareCardOptions,
): void {
  const arc = zoneHex(opts.zone);
  const text = zoneTextHexOf(opts.zone);

  // 見出しに完全な日時を含むため、単独の日付行は置かない
  centerText(
    ctx,
    t("percent.label", { time: timeLabel(opts.date.getTime()) }),
    170,
    800,
    40,
    C.ink,
  );

  const cx = W / 2;
  const cy = 640;
  drawGoldRing(ctx, cx, cy, 445);
  drawGauge(ctx, cx, cy, 380, 28, Math.min(opts.percent, 100) / 100, arc);
  drawPercentNumber(ctx, opts.percent, cx, cy, 480, 640, text);

  if (opts.overCap) {
    drawPill(ctx, cx, 940, t("percent.overCap"), 42, hexToRgba(arc, 0.15), text);
  }
}

/** Day7 記念カード本体(白+アンバーの🏆演出+%は100固定 §6.4②) */
function drawDay7Body(ctx: CanvasRenderingContext2D, date: Date): void {
  const amber = brandColors.amber;

  drawSparkle(ctx, 350, 150, 16, hexToRgba(amber, 0.85));
  drawSparkle(ctx, 300, 235, 10, hexToRgba(amber, 0.55));
  drawSparkle(ctx, 715, 125, 22, hexToRgba(amber, 0.9));
  drawSparkle(ctx, 775, 220, 12, hexToRgba(amber, 0.6));

  centerText(ctx, "🏆", 246, 400, 130, C.ink);
  centerText(ctx, t("share.day7.title"), 368, 800, 66, C.ink);
  centerText(ctx, t("share.day7.caption"), 432, 500, 36, C.sub);
  centerText(ctx, formatCardDate(date), 484, 500, 34, C.mute);

  const cx = W / 2;
  const cy = 790;
  drawGoldRing(ctx, cx, cy, 305);
  drawGauge(ctx, cx, cy, 250, 24, 1, amber);
  drawPercentNumber(ctx, 100, cx, cy, 270, 400, C.ink);
}

/** 下部CTA+ロゴ+ハッシュタグ(共通)。ロゴロード失敗時はテキストにフォールバック */
function drawFooter(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement | null,
): void {
  centerText(ctx, t("share.cta"), 1112, 800, 52, C.ink);
  if (logo && logo.naturalWidth > 0) {
    const lw = 300;
    const lh = Math.round((lw * logo.naturalHeight) / logo.naturalWidth);
    ctx.drawImage(logo, (W - lw) / 2, 1140, lw, lh);
    centerText(ctx, t("share.hashtags"), 1330, 500, 30, C.mute);
  } else {
    centerText(ctx, `🔋 ${t("app.name")}`, 1216, 800, 46, C.ink);
    centerText(ctx, t("share.hashtags"), 1290, 500, 32, C.mute);
  }
}
