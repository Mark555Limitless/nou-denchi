"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { displayPercent } from "@/lib/engine/scoring";
import type { TimeBand } from "@/lib/engine/types";
import { t } from "@/lib/i18n";

/**
 * ②時間帯別平均バー(§4.5)。朝/昼/夜/深夜の平均%。
 * バーは「ガラスの水柱」風の半透明青グラデ単系列(ゾーン色を系列色に使わない)・
 * バー上に値の直接ラベル。mock-aqua-history.png のガラス水柱に準拠。
 * データが無い時間帯はバー非表示(null)+「−」注記で扱う。
 */

/** ガラス水柱のグラデ(上=白ハイライト・下=深い青)。Recharts の Bar は fill 1色のため defs で定義 */
const BAR_GRADIENT_ID = "timeBandBarGradient";
const BAR_GLASS_TOP = "#ffffff"; // 上面の白ハイライト
const BAR_BLUE_LIGHT = "#9fc8ea"; // 半透明の水色ガラス
const BAR_BLUE_DEEP = "#2c5da8"; // --color-aqua-btn-deep
const BAR_RIM = "rgba(255, 255, 255, 0.85)"; // ガラスの白い縁
const AXIS_INK = "#546c99"; // --color-ink-mute
const GRID_HAIRLINE = "rgba(28, 58, 102, 0.16)"; // ガラス面上のやわらかいグリッド(--color-hairline)
const LABEL_INK = "#3c5687"; // --color-ink-2

const BANDS: readonly TimeBand[] = ["morning", "day", "evening", "night"];

interface TimeBandSessionInput {
  timeBand: TimeBand;
  /** 実値の%(null は呼び出し側で除外済み) */
  percent: number;
}

interface BandDatum {
  band: TimeBand;
  label: string;
  /** 平均%(表示クリップ後の値の平均)。測定なしは null(バー非描画) */
  avg: number | null;
}

export function TimeBandChart({
  sessions,
}: {
  sessions: readonly TimeBandSessionInput[];
}) {
  const data = useMemo<BandDatum[]>(
    () =>
      BANDS.map((band) => {
        const values = sessions
          .filter((s) => s.timeBand === band)
          .map((s) => displayPercent(s.percent).value);
        return {
          band,
          label: t(`timeBand.${band}`),
          avg:
            values.length === 0
              ? null
              : Math.round(
                  values.reduce((sum, v) => sum + v, 0) / values.length,
                ),
        };
      }),
    [sessions],
  );

  const missingBands = data.filter((d) => d.avg === null);

  return (
    <section className="rounded-3xl border border-white/70 bg-white/60 p-5 shadow-glass backdrop-blur-md">
      <h2 className="text-base font-bold text-ink">
        {t("history.timeBand.title")}
      </h2>
      {/* 金のヘアライン(見出しの下・装飾) */}
      <div
        aria-hidden
        className="mt-2 h-px bg-linear-to-r from-gold-soft to-transparent"
      />
      <div className="mt-3 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 18, right: 8, bottom: 0, left: 8 }}
          >
            <defs>
              {/* ガラスの水柱: 上面に白ハイライト→水色→深い青(すべて半透明) */}
              <linearGradient
                id={BAR_GRADIENT_ID}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={BAR_GLASS_TOP} stopOpacity={0.95} />
                <stop offset="30%" stopColor={BAR_BLUE_LIGHT} stopOpacity={0.8} />
                <stop offset="100%" stopColor={BAR_BLUE_DEEP} stopOpacity={0.85} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID_HAIRLINE} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: AXIS_INK, fontSize: 12 }}
              axisLine={{ stroke: GRID_HAIRLINE }}
              tickLine={false}
              tickMargin={6}
            />
            <YAxis hide domain={[0, 110]} />
            <Bar
              dataKey="avg"
              fill={`url(#${BAR_GRADIENT_ID})`}
              stroke={BAR_RIM}
              strokeWidth={1}
              barSize={36}
              radius={[12, 12, 12, 12]}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="avg"
                position="top"
                offset={6}
                fill={LABEL_INK}
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {missingBands.length > 0 && (
        <p className="mt-2 text-xs text-ink-mute">
          {t("history.timeBand.note", {
            bands: missingBands.map((d) => d.label).join("・"),
          })}
        </p>
      )}
    </section>
  );
}
