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
      <header
        className="flex items-center justify-center gap-3 pb-2 pt-6"
        // iOSノッチ/Dynamic Island を避ける。env() 非対応環境では pt-6 のまま(2026-08-08)
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.5rem)" }}
      >
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
      {/* 青く光る水の球(気泡)+ガラスのリング(装飾・アクアテーマ) */}
      <div
        aria-hidden
        className="relative mx-auto flex h-28 w-28 items-center justify-center"
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(62,127,208,0.30) 0%, rgba(62,127,208,0) 70%)",
          }}
        />
        <div className="absolute inset-4 rounded-full border border-white/80" />
        <div className="relative h-12 w-12 overflow-hidden rounded-full bg-linear-to-b from-aqua-btn to-aqua-btn-deep shadow-lg shadow-primary/40 ring-1 ring-white/70">
          <span className="absolute inset-x-2 top-1 h-1/2 rounded-full bg-linear-to-b from-white/70 to-white/0" />
          <span className="absolute left-2.5 top-2.5 h-2 w-2 rounded-full bg-white/90 blur-[1px]" />
        </div>
      </div>
      <div className="mt-4 rounded-3xl border border-white/70 bg-white/60 p-6 shadow-glass backdrop-blur-md">
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
          className="relative mt-6 flex h-12 items-center justify-center overflow-hidden rounded-full bg-linear-to-b from-aqua-btn to-aqua-btn-deep text-base font-bold text-primary-ink shadow-lg shadow-primary/30 ring-1 ring-white/60 active:translate-y-0.5 active:shadow-md"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-4 top-1 h-1/2 rounded-full bg-linear-to-b from-white/45 to-white/0"
          />
          {t("common.measure")}
        </Link>
      </div>
    </section>
  );
}
