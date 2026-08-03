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
  // Nano Banana Pro 生成のゲージ写真素材(public/art/gauge.webp・Start画面11を完全再現)を
  // そのまま表示し、%はガラス管部分だけをドーナツ扇形クリップで開示して表現する。
  // 素材の実測比率(トリム後2048px原画・中心からの半径/最大半径):
  //   ディスク外縁 0.769 / 管の内縁 0.824 / 管の外縁 1.0 / 12時に約20°の切れ目
  const S = 216; // viewBox 内での素材表示サイズ
  const IMG_MAX = 1725; // 真円補正・トリム後素材の長辺
  const scale = S / IMG_MAX;
  const R_OUT = 870 * scale; // 管外縁(余白ぶん少し広め)
  const R_IN = 708 * scale; // 管内縁(グロー帯との境界)
  // 素材の切れ目は12時のわずかに左(実測: 中心角353°・開口約4°)。
  // 開示アークは切れ目の右端(A0)から時計回りに伸ばし、途中で止まるときも
  // 端が平らに切れないよう丸キャップ(半円)で閉じる(修正指示01→02)。
  const A0 = -4.6; // 切れ目の右端(deg・12時起点時計回り)
  const USABLE = 355; // 切れ目を除いた開示可能角度
  /** 12時起点・時計回り deg → viewBox 座標 */
  const pt = (r: number, deg: number): string => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return `${(CX + r * Math.cos(rad)).toFixed(2)} ${(CY + r * Math.sin(rad)).toFixed(2)}`;
  };
  /** ガラス管のドーナツ扇形パス(端は平ら。終端は本物のキャップ画像を重ねて閉じる) */
  const donutSector = (a0: number, sweep: number, pad = 0): string => {
    const a1 = a0 + sweep;
    const large = sweep > 180 ? 1 : 0;
    const rOut = (R_OUT + pad).toFixed(2);
    const rIn = Math.max(0, R_IN - pad).toFixed(2);
    return [
      `M ${pt(R_OUT + pad, a0)}`,
      `A ${rOut} ${rOut} 0 ${large} 1 ${pt(R_OUT + pad, a1)}`,
      `L ${pt(Math.max(0, R_IN - pad), a1)}`,
      `A ${rIn} ${rIn} 0 ${large} 0 ${pt(Math.max(0, R_IN - pad), a0)}`,
      "Z",
    ].join(" ");
  };
  // ほぼ満充電(約101%以上)は素材の丸キャップ両端をそのまま見せる(クリップなし)
  const fullRing = frac >= 0.96;
  const sweep = Math.max(0, frac) * USABLE;
  const arcPath = donutSector(A0, sweep);
  // 終端キャップ: 素材の左側の焼き込みキャップ(約-13.3°〜-8.8°)を切り出し、
  // 終端角(A0+sweep)へ回転して重ねる(修正指示10→11: 紺の縁が回り込んだ本物の管端)
  const CAP_END_DEG = -8.8; // 素材の左キャップの端(切れ目の左縁)
  const capStampPath = donutSector(CAP_END_DEG - 5.2, 5.4, 1.5);
  const capRotate = A0 + sweep - CAP_END_DEG;
  const showCapStamp = !fullRing && sweep > 6;

  return (
    <div className="relative aspect-square w-[70vw] max-w-[297px]">
      <svg
        viewBox="0 0 220 220"
        className="h-full w-full"
        aria-hidden="true"
        style={{ filter: "drop-shadow(0 12px 24px rgba(44, 93, 168, 0.25))" }}
      >
        <defs>
          {/* 静的部分: ディスク+ミントのグロー帯(管の内側全体) */}
          <clipPath id="gaugeInner">
            <circle cx={CX} cy={CY} r={R_IN + 1} />
          </clipPath>
          {/* 動的部分: ガラス管を%ぶんだけ開示するドーナツ扇形 */}
          {!fullRing && (
            <clipPath id="gaugeArc">
              <path d={arcPath} />
            </clipPath>
          )}
          {/* 終端キャップ切り出し(素材の焼き込みキャップ周辺の扇形) */}
          {showCapStamp && (
            <clipPath id="gaugeCap">
              <path d={capStampPath} />
            </clipPath>
          )}
        </defs>
        {/* 未達分のかすかなトラック(位置の手がかり。参照に馴染む白ガラスの細帯) */}
        <circle
          cx={CX}
          cy={CY}
          r={(R_IN + R_OUT) / 2}
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.32"
          strokeWidth={R_OUT - R_IN - 7}
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * ((R_IN + R_OUT) / 2) * ((USABLE - 6) / 360)} ${2 * Math.PI * ((R_IN + R_OUT) / 2)}`}
          transform={`rotate(${-90 + A0 + 3} ${CX} ${CY})`}
        />
        {/* ゲージ写真素材(ディスク+グロー: 常時表示) */}
        <image
          href={asset("/art/gauge.webp")}
          x={CX - S / 2}
          y={CY - S / 2}
          width={S}
          height={S}
          preserveAspectRatio="xMidYMid meet"
          clipPath="url(#gaugeInner)"
        />
        {/* ゲージ写真素材(ガラス管: %ぶんだけ開示) */}
        {measured && frac > 0 && (
          <image
            href={asset("/art/gauge.webp")}
            x={CX - S / 2}
            y={CY - S / 2}
            width={S}
            height={S}
            preserveAspectRatio="xMidYMid meet"
            clipPath={fullRing ? undefined : "url(#gaugeArc)"}
          />
        )}
        {/* 終端の本物の管端(素材キャップを終端角へ回転して重ねる) */}
        {measured && frac > 0 && showCapStamp && (
          <g transform={`rotate(${capRotate.toFixed(2)} ${CX} ${CY})`}>
            <image
              href={asset("/art/gauge.webp")}
              x={CX - S / 2}
              y={CY - S / 2}
              width={S}
              height={S}
              preserveAspectRatio="xMidYMid meet"
              clipPath="url(#gaugeCap)"
            />
          </g>
        )}
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
