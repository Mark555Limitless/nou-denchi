"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SessionList } from "@/components/history/SessionList";
import { TimeBandChart } from "@/components/history/TimeBandChart";
import { TrendChart } from "@/components/history/TrendChart";
import type { SessionRecord } from "@/lib/db/db";
import { listSessions } from "@/lib/db/repo";
import { t } from "@/lib/i18n";

/** %が算出済みのセッション(履歴表示対象) */
type ScoredSession = SessionRecord & { percent: number };

/**
 * 履歴・トレンド画面(§4.5)。
 * IndexedDB アクセスは必ず useEffect 内(ビルド時プリレンダー対策)。
 * チャートはマウント後にのみ描画し ResponsiveContainer のハイドレーション不整合を回避。
 */
export default function HistoryPage() {
  // sessions はクライアントの非同期ロード後にのみ non-null になるため、
  // チャート描画は自動的にマウント後に限定される(ハイドレーション不整合なし)
  const [sessions, setSessions] = useState<ScoredSession[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    listSessions().then((all) => {
      if (cancelled) return;
      setSessions(
        all.filter((s): s is ScoredSession => s.percent !== null),
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="flex flex-1 flex-col px-4 pb-6">
      {/* 見出し: 濃紺タイポ+両脇に金のヘアライン(モックの見出し装飾に準拠) */}
      <header className="flex items-center justify-center gap-3 pb-2 pt-6">
        <span
          aria-hidden
          className="h-px w-10 bg-linear-to-r from-transparent to-gold-soft"
        />
        <h1 className="text-xl font-bold tracking-wide text-ink">
          {t("history.title")}
        </h1>
        <span
          aria-hidden
          className="h-px w-10 bg-linear-to-l from-transparent to-gold-soft"
        />
      </header>

      {sessions === null ? (
        <p className="py-16 text-center text-sm text-ink-mute">
          {t("history.loading")}
        </p>
      ) : sessions.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="mt-2 space-y-4">
          <TrendChart sessions={sessions} />
          <TimeBandChart sessions={sessions} />
          <SessionList sessions={sessions} />
        </div>
      )}
    </main>
  );
}

/** セッション0件: 測定を促す(§4.5)。広告・医療的訴求は置かない。 */
function EmptyState() {
  return (
    <section className="mt-6 text-center">
      {/* 青グラデの光る円+金のヘアラインリング(装飾・白背景リッチテーマ) */}
      <div
        aria-hidden
        className="relative mx-auto flex h-28 w-28 items-center justify-center"
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(42,120,214,0.14) 0%, rgba(42,120,214,0) 70%)",
          }}
        />
        <div className="absolute inset-4 rounded-full border border-gold-soft" />
        <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-linear-to-b from-primary to-primary-deep shadow-lg ring-1 ring-gold-soft">
          <span className="absolute inset-x-1.5 top-0.5 h-1/2 rounded-full bg-linear-to-b from-white/40 to-white/0" />
          <span className="relative block h-2 w-2 rotate-45 bg-gold-soft" />
        </div>
      </div>
      <div className="mt-4 rounded-3xl border border-hairline bg-surface-2 p-6 shadow-md">
        <h2 className="text-base font-semibold text-ink">
          {t("history.empty.title")}
        </h2>
        {/* 金のヘアライン(装飾・軽く) */}
        <div aria-hidden className="mx-auto mt-3 h-px w-12 bg-gold-soft" />
        <p className="mt-3 text-sm leading-6 text-ink-2">
          {t("history.empty.body")}
        </p>
        <Link
          href="/measure/"
          className="mt-6 flex h-12 items-center justify-center rounded-full bg-linear-to-b from-primary to-primary-deep text-base font-bold text-primary-ink shadow-lg ring-1 ring-gold-soft active:opacity-80"
        >
          {t("common.measure")}
        </Link>
      </div>
    </section>
  );
}
