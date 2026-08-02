"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";
import { getSessionView, type SessionView } from "@/lib/service/measurement";
import { timeLabel } from "@/lib/ui/format";
import { zoneClasses } from "@/lib/ui/zone";
import { PercentCounter } from "./PercentCounter";
import { TaskBars } from "./TaskBars";
import { ShareCardModal } from "./ShareCardModal";
import { ConfirmedCelebration } from "./ConfirmedCelebration";
import { GameBanners } from "./GameBanners";
import { ProvisionalModal } from "@/components/home/ProvisionalModal";

type Status = "loading" | "ready" | "notFound";

/**
 * 結果画面本体(§4.4)。useSearchParams を使うため呼び出し側で <Suspense> 必須。
 * IndexedDB アクセスは useEffect 内のみ(静的エクスポートのプリレンダー対策)。
 */
export function ResultContent() {
  const params = useSearchParams();
  const sid = params.get("sid");
  const isNew = params.get("new") === "1";
  const isConfirmed = params.get("confirmed") === "1";
  const isBest = params.get("best") === "1";

  const [view, setView] = useState<SessionView | undefined>(undefined);
  // sid なしで開かれた場合は最初から notFound(effect 内の同期 setState を避ける)
  const [status, setStatus] = useState<Status>(sid ? "loading" : "notFound");
  const [shareVariant, setShareVariant] = useState<"daily" | "day7" | null>(
    null,
  );
  const [provisionalOpen, setProvisionalOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!sid) return;
    getSessionView(sid)
      .then((v) => {
        if (!alive) return;
        if (v) {
          setView(v);
          setStatus("ready");
        } else {
          setStatus("notFound");
        }
      })
      .catch(() => {
        if (alive) setStatus("notFound");
      });
    return () => {
      alive = false;
    };
  }, [sid]);

  if (status === "loading") {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-sm text-ink-2">{t("result.loading")}</p>
      </main>
    );
  }

  if (status === "notFound" || !view) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-lg font-bold text-ink">
          {t("result.notFound.title")}
        </h1>
        <p className="text-sm text-ink-2 leading-relaxed">
          {t("result.notFound.body")}
        </p>
        <Link
          href="/"
          className="relative overflow-hidden rounded-full bg-linear-to-b from-aqua-btn to-aqua-btn-deep text-primary-ink font-bold py-3.5 px-8 min-h-[44px] inline-flex items-center justify-center shadow-lg shadow-primary/30 ring-1 ring-white/60 active:scale-[0.99] active:opacity-90"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-4 top-1 h-1/2 rounded-full bg-linear-to-b from-white/45 to-white/0"
          />
          {t("result.backHome")}
        </Link>
      </main>
    );
  }

  const { session, score, display, zone } = view;
  const zc = zoneClasses[zone];

  return (
    <main className="flex-1 px-4 pt-6 pb-8 flex flex-col gap-4">
      {/* タイトルは濃紺タイポのエンボス風(mock-aqua-result.png 準拠) */}
      <h1
        className="text-center text-2xl font-bold tracking-wide text-ink"
        style={{
          textShadow:
            "0 1px 0 rgba(255,255,255,0.8), 0 2px 8px rgba(255,255,255,0.55)",
        }}
      >
        {t("result.title")}
      </h1>

      {isConfirmed && (
        <ConfirmedCelebration onShare={() => setShareVariant("day7")} />
      )}

      <section className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/70 shadow-glass p-6 flex flex-col items-center gap-4">
        {/* 見出しは2段組み(上段=測定日時 / 下段=主見出し) */}
        <div className="text-center">
          <p className="text-base font-semibold text-ink-2">
            {t("percent.labelTime", { time: timeLabel(session.startedAt) })}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center justify-center gap-2">
            <p className="text-xl font-bold leading-snug text-ink">
              {t("percent.labelMain")}
            </p>
            {session.baselineType === "provisional" && (
              <button
                type="button"
                onClick={() => setProvisionalOpen(true)}
                className="rounded-full border border-white/70 bg-white/70 backdrop-blur-sm text-ink-2 px-2.5 py-2 -my-1.5 text-xs min-h-[36px]"
              >
                {t("percent.provisional.badge")}
              </button>
            )}
          </div>
          <p className="mt-1 text-xs font-mono text-ink-2">
            {t("result.timeBandNote", {
              band: t(`timeBand.${session.timeBand}`),
            })}
          </p>
        </div>

        {isBest && (
          <span className="rounded-full bg-white/80 backdrop-blur-sm border border-zone-yellow-text text-zone-yellow-text px-4 py-1.5 text-sm font-extrabold tracking-wide">
            🎉 {t("bestUpdated.label")}
          </span>
        )}

        <PercentCounter value={display.value} zone={zone} animate={isNew} />

        {display.overCap && (
          <span className="rounded-full bg-white/80 backdrop-blur-sm border border-zone-green-text text-zone-green-text px-3 py-1 text-sm font-bold">
            {t("percent.overCap")}
          </span>
        )}

        <div className="flex flex-col items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border bg-white/80 backdrop-blur-sm px-3 py-1 text-sm font-bold shadow-sm ${zc.border} ${zc.text}`}
          >
            <span aria-hidden className={`w-2 h-2 rounded-full ${zc.bg}`} />
            {t(`zone.${zone}.label`)}
          </span>
          <p className="text-sm text-ink-2 text-center">
            {t(`zone.${zone}.message`)}
          </p>
        </div>
      </section>

      <section className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/70 shadow-glass p-5">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-base font-bold text-ink">
            {t("result.breakdown.title")}
          </h2>
          <span className="text-xs text-ink-2">
            {t("result.breakdown.unit")}
          </span>
        </div>
        <TaskBars norm={score.norm} />
      </section>

      {/* ゲームバナーはスコアの高低に関わらず常時表示(条件分岐しない) */}
      <GameBanners />

      {/* シェアは白ガラス+青文字+青枠のアウトラインピル(mock-aqua-result.png 準拠) */}
      <button
        type="button"
        onClick={() => setShareVariant("daily")}
        className="w-full rounded-full border-2 border-primary/70 bg-white/70 backdrop-blur-sm text-primary-deep font-bold py-4 min-h-[44px] shadow-glass active:scale-[0.99] active:opacity-90"
      >
        {t("result.shareButton")}
      </button>

      <Link
        href="/"
        className="text-center text-sm text-ink-2 underline underline-offset-4 py-3"
      >
        {t("result.backHome")}
      </Link>

      {shareVariant && (
        <ShareCardModal
          percent={shareVariant === "day7" ? 100 : display.value}
          overCap={shareVariant === "day7" ? false : display.overCap}
          zone={zone}
          dateMs={session.startedAt}
          variant={shareVariant}
          onClose={() => setShareVariant(null)}
        />
      )}

      <ProvisionalModal
        open={provisionalOpen}
        onClose={() => setProvisionalOpen(false)}
      />
    </main>
  );
}
