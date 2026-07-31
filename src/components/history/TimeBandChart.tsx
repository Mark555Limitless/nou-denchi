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
 * バーは青グラデーション単系列(ゾーン色を系列色に使わない)・バー上に値の直接ラベル。
 * mock-rich-result.png のステータスバー(光沢ブルーの丸バー)に準拠。
 * データが無い時間帯はバー非表示(null)+「−」注記で扱う。
 */

/** バーの青グラデーション(上=明・下=深)。Recharts の Bar は fill 1色のため defs で定義 */
const BAR_GRADIENT_ID = "timeBandBarGradient";
const BAR_BLUE_LIGHT = "#5da3ef";
const BAR_BLUE_DEEP = "#1c5cab"; // --color-primary-deep
const AXIS_INK = "#5f6d98"; // --color-ink-mute
const GRID_HAIRLINE = "rgba(35, 47, 92, 0.12)"; // 白面上のやわらかいグリッド(--color-hairline系)
const LABEL_INK = "#46538a"; // --color-ink-2

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
    <section className="rounded-3xl border border-hairline bg-surface-2 p-5 shadow-md">
      <h2 className="text-sm font-semibold text-ink-2">
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
              <linearGradient
                id={BAR_GRADIENT_ID}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={BAR_BLUE_LIGHT} />
                <stop offset="100%" stopColor={BAR_BLUE_DEEP} />
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
              barSize={36}
              radius={[8, 8, 0, 0]}
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
