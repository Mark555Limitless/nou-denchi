"use client";

import { t } from "@/lib/i18n";
import type { Zone } from "@/lib/engine/types";
import { zoneClasses } from "@/lib/ui/zone";

/**
 * リッチテーマの大型円形ゲージ(mock-rich-home.png 準拠・2026-07-31)。
 * 光沢ブルーのグラデーションリング+やわらかい光彩+白ディスク+金のヘアライン。
 * 0〜105% を360°リングにマップし、中央に本日の%を特大表示する。
 * リング自体はブランドブルーで統一し、ゾーンの意味情報は下のチップ(色+文言)で伝える。
 * SVG は装飾(aria-hidden)とし、数値・バッジは通常の DOM テキストとして読ませる。
 */

/** リングにマップする%の上限(表示クリップと同じ 105) */
const RING_MAX_PERCENT = 105;
const CX = 110;
const CY = 110;
const R = 96;

export interface BatteryGaugeProps {
  /** 表示用%(クリップ済)。undefined = 今日未測定 */
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
    <div className="relative aspect-square w-[72vw] max-w-[310px]">
      <svg
        viewBox="0 0 220 220"
        className="h-full w-full"
        aria-hidden="true"
        style={{ filter: "drop-shadow(0 10px 22px rgba(42, 120, 214, 0.28))" }}
      >
        <defs>
          <linearGradient id="richRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5da3ef" />
            <stop offset="55%" stopColor="#2a78d6" />
            <stop offset="100%" stopColor="#1c5cab" />
          </linearGradient>
        </defs>
        {/* トラック */}
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke="var(--color-surface-3)"
          strokeWidth="15"
        />
        {/* 残量リング(光沢ブルーグラデーション・12時起点) */}
        {measured && frac > 0 && (
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke="url(#richRing)"
            strokeWidth="15"
            strokeLinecap="round"
            strokeDasharray={`${circumference * frac} ${circumference}`}
            transform={`rotate(-90 ${CX} ${CY})`}
            className="transition-[stroke-dasharray] duration-700 ease-out"
          />
        )}
        {/* 白ディスク+金のヘアラインリング(リッチ感の要) */}
        <circle
          cx={CX}
          cy={CY}
          r={R - 16}
          fill="var(--color-surface-2)"
          className="drop-shadow-md"
        />
        <circle
          cx={CX}
          cy={CY}
          r={R - 21}
          fill="none"
          stroke="var(--color-gold-soft)"
          strokeWidth="1.4"
        />
      </svg>

      {/* 中央表示 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-9 text-center">
        {measured ? (
          <>
            <p className="text-[17px] font-bold tracking-[0.22em] text-ink-mute">
              {t("home.gaugeLabel")}
            </p>
            <div className="flex items-baseline">
              {/* 狭幅端末で3桁(100%)が白ディスクから溢れないよう流体サイズ(通常幅では84px) */}
              <span
                className="font-mono font-bold leading-none tracking-tight text-ink"
                style={{ fontSize: "min(84px, 20vw)" }}
              >
                {value}
              </span>
              <span className="ml-0.5 font-mono text-2xl font-bold text-primary-deep">
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
                  <span className="inline-block rounded-md border border-hairline bg-surface-3 px-1.5 py-0.5 text-[15px] leading-tight text-ink-2">
                    {t("percent.provisional.badge")}
                  </span>
                </button>
              )}
            </div>
            {overCap && (
              <span
                className={`mt-2 rounded-full border bg-surface-2 px-3 py-0.5 text-sm font-bold ${zoneClasses[zone].text} ${zoneClasses[zone].border}`}
              >
                {t("percent.overCap")}
              </span>
            )}
          </>
        ) : (
          <>
            <span className="font-mono text-6xl font-bold text-ink-mute">
              ?
            </span>
            <span className="mt-3 text-xs leading-relaxed text-balance text-ink-mute">
              {t("home.notMeasured")}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
