"use client";

import { t } from "@/lib/i18n";
import type { Zone } from "@/lib/engine/types";
import { asset } from "@/lib/ui/asset";
import { zoneClasses } from "@/lib/ui/zone";

/**
 * アクア・ガラステーマの大型円形ゲージ(イラスト/Start画面11.png 準拠・2026-08-02)。
 * 透明ガラスのリング(トラック)+青緑に光る残量アーク+
 * 中央はブラッシュドシルバーの金属ディスク(public/art/metal-disc.webp)。
 * 0〜105% を360°リングにマップし、中央に本日の%を濃紺のエンボス風で表示する。
 * ゾーンの意味情報は下のチップ(色+文言)で伝える(色覚多様性対応)。
 * SVG・画像は装飾(aria-hidden)とし、数値・バッジは通常の DOM テキストとして読ませる。
 */

/** リングにマップする%の上限(表示クリップと同じ 105) */
const RING_MAX_PERCENT = 105;
const CX = 110;
const CY = 110;
const R = 96;

export interface BatteryGaugeProps {
  /** 表示用%(クリップ済)。undefined = 未測定 */
  value?: number;
  /** リング塗りに使う実値%(0〜105 にクランプしてマップ)。省略時は value */
  rawPercent?: number;
  zone?: Zone;
  /** 105%超(「絶好調!」バッジを表示) */
  overCap?: boolean;
  /** 暫定ベースライン由来(「推定」バッジを常時表示) */
  provisional?: boolean;
  /** 「推定」バッジタップ時(説明モーダルを開く) */
  onProvisionalTap?: () => void;
}

export function BatteryGauge({
  value,
  rawPercent,
  zone,
  overCap = false,
  provisional = false,
  onProvisionalTap,
}: BatteryGaugeProps) {
  const measured = value !== undefined && zone !== undefined;
  const frac = measured
    ? Math.min(Math.max(rawPercent ?? value, 0), RING_MAX_PERCENT) /
      RING_MAX_PERCENT
    : 0;
  const circumference = 2 * Math.PI * R;
  // Start画面11 準拠: リングは12時に恒常的な切れ目(丸キャップの管の両端が
  // 11時〜1時に見える)。0〜105% を切れ目を除いた316°にマップする。
  const GAP_DEG = 44;
  const usable = (360 - GAP_DEG) / 360;
  const startRotate = -90 + GAP_DEG / 2;

  return (
    <div className="relative aspect-square w-[78vw] max-w-[330px]">
      <svg
        viewBox="0 0 220 220"
        className="h-full w-full"
        aria-hidden="true"
        style={{ filter: "drop-shadow(0 12px 24px rgba(44, 93, 168, 0.25))" }}
      >
        <defs>
          {/* 青いガラス管(残量アーク)の断面グラデ: 白い上面反射→水色→青の底 */}
          <linearGradient id="blueTube" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#eaf5fc" />
            <stop offset="45%" stopColor="#bcd9f0" />
            <stop offset="100%" stopColor="#8fb9e0" />
          </linearGradient>
          <linearGradient id="trackTube" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#dcebf7" stopOpacity="0.6" />
          </linearGradient>
          <filter id="tealSoft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.2" />
          </filter>
        </defs>
        {/* 内側の静的な青緑グロー帯(ディスクとガラス管の間・Start画面11準拠) */}
        <circle
          cx={CX}
          cy={CY}
          r={R - 9}
          fill="none"
          stroke="#bfe8d9"
          strokeWidth="9"
          opacity="0.85"
          filter="url(#tealSoft)"
        />
        {/* トラック: 白いガラス管(未達分。12時の切れ目を除く316°) */}
        <circle
          cx={CX} cy={CY} r={R} fill="none" stroke="#a9c8e2" strokeWidth="15" opacity="0.45"
          strokeLinecap="round"
          strokeDasharray={`${circumference * usable} ${circumference}`}
          transform={`rotate(${startRotate} ${CX} ${CY})`}
        />
        <circle
          cx={CX} cy={CY} r={R} fill="none" stroke="url(#trackTube)" strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${circumference * usable} ${circumference}`}
          transform={`rotate(${startRotate} ${CX} ${CY})`}
        />
        {/* 残量アーク: 青いガラス管(丸キャップ・12時起点。満充電時は上部に丸い切れ目が残る) */}
        {measured && frac > 0 && (
          <g
            className="transition-[stroke-dasharray] duration-700 ease-out"
            style={{ filter: "drop-shadow(0 2px 4px rgba(90, 140, 190, 0.45))" }}
          >
            {/* 管の外縁(濃いめの青のリム) */}
            <circle
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke="#7ba8d4"
              strokeWidth="15"
              strokeLinecap="round"
              strokeDasharray={`${circumference * usable * frac} ${circumference}`}
              transform={`rotate(${startRotate} ${CX} ${CY})`}
            />
            {/* 管の本体(ガラスグラデ) */}
            <circle
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke="url(#blueTube)"
              strokeWidth="11.5"
              strokeLinecap="round"
              strokeDasharray={`${circumference * usable * frac} ${circumference}`}
              transform={`rotate(${startRotate} ${CX} ${CY})`}
            />
            {/* 管の上面ハイライト(細い白) */}
            <circle
              cx={CX}
              cy={CY}
              r={R + 3.2}
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.8"
              opacity="0.9"
              strokeLinecap="round"
              strokeDasharray={`${circumference * usable * frac * 0.97} ${circumference}`}
              transform={`rotate(${startRotate + 2} ${CX} ${CY})`}
            />
          </g>
        )}
        {/* 中央: ブラッシュドシルバーの金属ディスク */}
        <image
          href={asset("/art/metal-disc.webp")}
          x={CX - (R - 14)}
          y={CY - (R - 14)}
          width={(R - 14) * 2}
          height={(R - 14) * 2}
        />
        {/* ディスク縁: 白銀のベベル+接地の陰影 */}
        <circle cx={CX} cy={CY} r={R - 13.4} fill="none" stroke="#f4f9fd" strokeWidth="1.6" opacity="0.9" />
        <circle
          cx={CX}
          cy={CY}
          r={R - 14.8}
          fill="none"
          stroke="rgba(28,58,102,0.3)"
          strokeWidth="1"
        />
      </svg>

      {/* 中央表示(金属ディスク上の濃紺エンボス) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-10 text-center">
        {measured ? (
          <>
            <p
              className="text-[13px] font-bold tracking-[0.2em] text-ink"
              style={{ textShadow: "0 1px 0 rgba(255,255,255,0.7)" }}
            >
              {t("home.gaugeLabel")}
            </p>
            <div className="flex items-baseline">
              <span
                className="font-mono font-bold leading-none tracking-tight text-ink"
                style={{
                  fontSize: "min(64px, 15vw)",
                  textShadow:
                    "0 1px 0 rgba(255,255,255,0.75), 0 2px 3px rgba(28,58,102,0.35)",
                }}
              >
                {value}
              </span>
              <span
                className="ml-0.5 font-mono text-2xl font-bold text-ink"
                style={{ textShadow: "0 1px 0 rgba(255,255,255,0.7)" }}
              >
                %
              </span>
              {provisional && (
                <button
                  type="button"
                  onClick={onProvisionalTap}
                  aria-haspopup="dialog"
                  aria-label={t("percent.provisional.badge")}
                  className="-m-3 ml-0 self-center p-3"
                >
                  <span className="inline-block rounded-md border border-white/70 bg-white/70 px-1.5 py-0.5 text-[11px] leading-tight text-ink-2 backdrop-blur-sm">
                    {t("percent.provisional.badge")}
                  </span>
                </button>
              )}
            </div>
            {overCap && (
              <span
                className={`mt-2 rounded-full border bg-white/80 px-3 py-0.5 text-sm font-bold backdrop-blur-sm ${zoneClasses[zone].text} ${zoneClasses[zone].border}`}
              >
                {t("percent.overCap")}
              </span>
            )}
          </>
        ) : (
          <>
            <span
              className="font-mono text-6xl font-bold text-ink-2"
              style={{ textShadow: "0 1px 0 rgba(255,255,255,0.7)" }}
            >
              ?
            </span>
            <span className="mt-3 text-xs leading-relaxed text-ink-2 text-balance">
              {t("home.notMeasured")}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
