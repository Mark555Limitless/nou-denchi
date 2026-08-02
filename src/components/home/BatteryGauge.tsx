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

  return (
    <div className="relative aspect-square w-[78vw] max-w-[330px]">
      <svg
        viewBox="0 0 220 220"
        className="h-full w-full"
        aria-hidden="true"
        style={{ filter: "drop-shadow(0 12px 24px rgba(44, 93, 168, 0.25))" }}
      >
        <defs>
          <linearGradient id="aquaArc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a9e6df" />
            <stop offset="55%" stopColor="var(--color-ring-teal)" />
            <stop offset="100%" stopColor="var(--color-ring-teal-deep)" />
          </linearGradient>
          <linearGradient id="glassTube" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="50%" stopColor="var(--color-ring-glass)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#9cc4e4" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        {/* トラック: 透明ガラスの管(外縁の青いリム+内側のガラスグラデ) */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#7fb3d8" strokeWidth="17" opacity="0.5" />
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="url(#glassTube)" strokeWidth="13" />
        {/* 残量アーク(青緑のガラス発光・12時起点) */}
        {measured && frac > 0 && (
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke="url(#aquaArc)"
            strokeWidth="13"
            strokeLinecap="round"
            strokeDasharray={`${circumference * frac} ${circumference}`}
            transform={`rotate(-90 ${CX} ${CY})`}
            className="transition-[stroke-dasharray] duration-700 ease-out"
            style={{ filter: "drop-shadow(0 0 6px rgba(127, 208, 198, 0.8))" }}
          />
        )}
        {/* ガラス管のハイライト(上面の白い反射) */}
        <circle
          cx={CX}
          cy={CY}
          r={R + 4.5}
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.6"
          opacity="0.85"
        />
        {/* 中央: ブラッシュドシルバーの金属ディスク */}
        <image
          href={asset("/art/metal-disc.webp")}
          x={CX - (R - 14)}
          y={CY - (R - 14)}
          width={(R - 14) * 2}
          height={(R - 14) * 2}
        />
        {/* ディスク縁の陰影(ガラスとの接地感) */}
        <circle
          cx={CX}
          cy={CY}
          r={R - 14}
          fill="none"
          stroke="rgba(28,58,102,0.35)"
          strokeWidth="1.2"
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
