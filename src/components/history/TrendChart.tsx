"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { featureFlags } from "@/lib/config";
import { displayPercent, zoneOf } from "@/lib/engine/scoring";
import type { Zone } from "@/lib/engine/types";
import { t } from "@/lib/i18n";
import { zoneClasses } from "@/lib/ui/zone";

/**
 * ①折れ線グラフ: %の推移(§4.5)。
 * デザイン言語: 単一系列=チャート青1色・凡例なし(タイトルが系列名を兼ねる)・
 * グリッドは hairline・軸ラベルは ink-mute。ゾーン(ステータス)色は系列色に使わない。
 */

/** チャート描画色。SVG属性にはトークンの実値を渡す(globals.css @theme と同値) */
const CHART_BLUE = "#256abf"; // --color-chart(ブランドアクセントとして系列色のみ許容)
const AXIS_INK = "#5f6d98"; // --color-ink-mute
const GRID_HAIRLINE = "rgba(35, 47, 92, 0.12)"; // 白面上のやわらかいグリッド(--color-hairline系)

export type TrendRangeDays = 7 | 30;

const ALL_RANGES: readonly TrendRangeDays[] = [7, 30];

/**
 * 利用可能な期間レンジ(§4.5)。
 * 将来の無料/有料ゲーティングは必ずこの関数だけで制御する
 * (featureFlags.premiumGating が有効になったらここでレンジを絞る)。
 * MVPは全開放(premiumGating: false)なので全レンジを返す。
 */
export function availableTrendRanges(): readonly TrendRangeDays[] {
  if (featureFlags.premiumGating) {
    // Phase 2: ゲーティング時のレンジ制限はここに実装する(MVPでは到達しない)
    return ALL_RANGES;
  }
  return ALL_RANGES;
}

function rangeLabel(days: TrendRangeDays): string {
  return days === 7 ? t("history.range.7d") : t("history.range.30d");
}

interface TrendSessionInput {
  startedAt: number;
  /** 実値の%(null は呼び出し側で除外済み) */
  percent: number;
}

interface TrendPoint {
  startedAt: number;
  /** 表示用クリップ後の%(グラフ・ツールチップ表示に使用) */
  value: number;
  zone: Zone;
}

function formatMonthDay(ms: number): string {
  const d = new Date(ms);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatDateTime(ms: number): string {
  const d = new Date(ms);
  const hm = `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${formatMonthDay(ms)} ${hm}`;
}

/** 期間の開始(N-1日前の0時)・終了(明日0時)と、日境界の目盛りを作る */
function buildRange(days: TrendRangeDays): {
  start: number;
  end: number;
  ticks: number[];
} {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(todayStart);
  start.setDate(start.getDate() - (days - 1));
  const end = new Date(todayStart);
  end.setDate(end.getDate() + 1);
  // 目盛りは「今日」を必ず含むよう今日から stride 日刻みで遡って作る
  const stride = days === 7 ? 1 : 5;
  const ticks: number[] = [];
  for (let i = days - 1; i >= 0; i -= stride) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    ticks.unshift(d.getTime());
  }
  return { start: start.getTime(), end: end.getTime(), ticks };
}

/** ツールチップ: 日付+%+ゾーンラベル(色は必ずラベル文言と併記) */
function TrendTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0].payload as TrendPoint | undefined;
  if (!p) return null;
  return (
    <div className="rounded-xl border border-hairline bg-surface-2 px-3 py-2 shadow-lg">
      <p className="text-[11px] text-ink-mute">{formatDateTime(p.startedAt)}</p>
      <p className="mt-0.5 font-mono text-base tabular-nums text-ink">
        {p.value}
        <span className="text-xs">%</span>
      </p>
      <p className={`text-[11px] ${zoneClasses[p.zone].text}`}>
        {t(`zone.${p.zone}.label`)}
      </p>
    </div>
  );
}

export function TrendChart({
  sessions,
}: {
  sessions: readonly TrendSessionInput[];
}) {
  const ranges = availableTrendRanges();
  const [days, setDays] = useState<TrendRangeDays>(ranges[0]);

  const { start, end, ticks } = useMemo(() => buildRange(days), [days]);

  const points = useMemo<TrendPoint[]>(
    () =>
      sessions
        .filter((s) => s.startedAt >= start && s.startedAt < end)
        .slice()
        .sort((a, b) => a.startedAt - b.startedAt)
        .map((s) => ({
          startedAt: s.startedAt,
          value: displayPercent(s.percent).value,
          zone: zoneOf(s.percent),
        })),
    [sessions, start, end],
  );

  return (
    <section className="rounded-3xl border border-hairline bg-surface-2 p-5 shadow-md">
      <h2 className="text-sm font-semibold text-ink-2">
        {t("history.trend.title")}
      </h2>
      {/* 金のヘアライン(見出しの下・装飾) */}
      <div
        aria-hidden
        className="mt-2 h-px bg-linear-to-r from-gold-soft to-transparent"
      />

      {ranges.length > 1 && (
        <div
          role="tablist"
          aria-label={t("history.trend.title")}
          className="mt-3 grid grid-cols-2 gap-1 rounded-full bg-surface-3 p-1"
        >
          {ranges.map((d) => {
            const active = d === days;
            return (
              <button
                key={d}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setDays(d)}
                className={`h-10 rounded-full text-sm transition-colors ${
                  active
                    ? "bg-surface-2 font-semibold text-ink shadow-sm"
                    : "text-ink-mute"
                }`}
              >
                {rangeLabel(d)}
              </button>
            );
          })}
        </div>
      )}

      <div className="relative mt-3 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={points}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          >
            <CartesianGrid stroke={GRID_HAIRLINE} vertical={false} />
            <XAxis
              dataKey="startedAt"
              type="number"
              domain={[start, end]}
              ticks={ticks}
              tickFormatter={formatMonthDay}
              tick={{ fill: AXIS_INK, fontSize: 11 }}
              axisLine={{ stroke: GRID_HAIRLINE }}
              tickLine={false}
              tickMargin={6}
            />
            <YAxis
              domain={[0, 110]}
              ticks={[0, 50, 100]}
              width={30}
              tick={{ fill: AXIS_INK, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <ReferenceLine
              y={100}
              stroke={AXIS_INK}
              strokeDasharray="4 4"
              strokeWidth={1}
            />
            <Tooltip
              content={TrendTooltip}
              cursor={{
                stroke: "rgba(35, 47, 92, 0.25)",
                strokeDasharray: "4 4",
              }}
            />
            <Line
              dataKey="value"
              type="monotone"
              stroke={CHART_BLUE}
              strokeWidth={2}
              dot={{ r: 3, fill: CHART_BLUE, stroke: "none" }}
              activeDot={{ r: 5, fill: CHART_BLUE, stroke: "none" }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
        {points.length === 0 && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-ink-mute">
            {t("history.range.empty")}
          </p>
        )}
      </div>
    </section>
  );
}
