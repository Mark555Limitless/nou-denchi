"use client";

import Link from "next/link";
import { useMemo } from "react";
import { displayPercent, zoneOf } from "@/lib/engine/scoring";
import type { BaselineType, TimeBand } from "@/lib/engine/types";
import { t } from "@/lib/i18n";
import { zoneClasses } from "@/lib/ui/zone";

/**
 * ③測定一覧(§4.5)。新しい順。行タップで /result/?sid=<id> へ。
 * ゾーン色は必ずラベル文言と併記(色単独で意味を伝えない)。
 */

interface SessionListInput {
  id: string;
  startedAt: number;
  timeBand: TimeBand;
  /** 実値の%(null は呼び出し側で除外済み) */
  percent: number;
  baselineType: BaselineType;
}

/** 日付+時刻。年が変わっている記録だけ年も付ける */
function formatDateTime(ms: number, nowYear: number): string {
  const d = new Date(ms);
  const md = `${d.getMonth() + 1}/${d.getDate()}`;
  const ymd = d.getFullYear() === nowYear ? md : `${d.getFullYear()}/${md}`;
  const hm = `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${ymd} ${hm}`;
}

export function SessionList({
  sessions,
}: {
  sessions: readonly SessionListInput[];
}) {
  const sorted = useMemo(
    () => sessions.slice().sort((a, b) => b.startedAt - a.startedAt),
    [sessions],
  );
  const nowYear = new Date().getFullYear();

  return (
    <section>
      <h2 className="px-1 text-base font-bold text-ink">
        {t("history.list.title")}
      </h2>
      {/* 金のヘアライン(見出しの下・装飾) */}
      <div
        aria-hidden
        className="mt-2 h-px bg-linear-to-r from-gold-soft to-transparent"
      />
      {/* すりガラスカード。行区切りはガラスの hairline(白の光る線) */}
      <ul className="mt-3 divide-y divide-white/70 overflow-hidden rounded-3xl border border-white/70 bg-white/60 shadow-glass backdrop-blur-md">
        {sorted.map((s) => {
          const zone = zoneOf(s.percent);
          const value = displayPercent(s.percent).value;
          return (
            <li key={s.id}>
              <Link
                href={`/result/?sid=${s.id}`}
                className="flex min-h-14 items-center gap-3 px-4 py-3 transition-colors active:bg-white/60"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink">
                    {formatDateTime(s.startedAt, nowYear)}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-2">
                    <span>{t(`timeBand.${s.timeBand}`)}</span>
                    {s.baselineType === "provisional" && (
                      <span className="rounded-full bg-white/80 px-1.5 py-px ring-1 ring-hairline">
                        {t("percent.provisional.badge")}
                      </span>
                    )}
                  </p>
                </div>
                <span className="font-mono text-lg tabular-nums text-ink">
                  {value}
                  <span className="text-xs text-ink-2">%</span>
                </span>
                <span
                  className={`rounded-full border bg-white/80 px-2 py-0.5 text-xs font-bold ${zoneClasses[zone].border} ${zoneClasses[zone].text}`}
                >
                  {t(`zone.${zone}.label`)}
                </span>
                <span aria-hidden className="text-ink-mute">
                  ›
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
