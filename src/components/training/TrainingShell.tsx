"use client";

import Link from "next/link";
import { t } from "@/lib/i18n";

/**
 * トレオタ各モード共通の部品(2026-08-02 ユーザー指示[6])。
 * アクア・ガラステーマ(Start画面11 準拠・2026-08-02 改訂):
 * 水滴をまとった青いガラスの主要ボタン+すりガラスカード+気泡装飾。
 * DB保存は一切しないため、中断✕は確認ダイアログなしで即メニューへ戻る。
 */

/** トレオタ主要ボタン(水滴ピル: 青ガラスグラデ+上面グロス+白リング) */
export function TrainingButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full overflow-hidden rounded-full bg-linear-to-b from-aqua-btn to-aqua-btn-deep py-4 text-lg font-bold text-primary-ink shadow-lg shadow-primary/30 ring-1 ring-white/60 active:translate-y-0.5 active:shadow-md"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-4 top-1 h-1/2 rounded-full bg-linear-to-b from-white/45 to-white/0"
      />
      <span className="relative">{label}</span>
    </button>
  );
}

/** 左上✕: 保存が無いため確認なしで即メニューへ(PVT全画面 z-10 より上の z-20) */
export function TrainingExit() {
  return (
    <Link
      href="/training/"
      aria-label={t("training.exit.aria")}
      className="absolute top-1 left-1 z-20 flex h-11 w-11 items-center justify-center text-xl text-ink-mute"
      style={{ marginTop: "env(safe-area-inset-top)" }}
    >
      ✕
    </Link>
  );
}

/** アクアの気泡装飾オーブ(画像アセット不使用・水面の波紋+青ガラスの水滴球) */
export function TrainingArt() {
  return (
    <div
      aria-hidden
      className="pointer-events-none relative flex h-40 w-40 items-center justify-center"
    >
      {/* 水色の光彩 */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(62,127,208,0.18) 0%, rgba(127,208,198,0) 70%)",
        }}
      />
      {/* 同心のリング(水面の波紋) */}
      <div className="absolute inset-4 rounded-full border border-white/70" />
      <div className="absolute inset-9 rounded-full border border-primary/30" />
      {/* 中央の水滴球(青ガラスグラデ+グロス+白リング) */}
      <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-linear-to-b from-aqua-btn to-aqua-btn-deep shadow-lg shadow-primary/30 ring-1 ring-white/60">
        <span className="absolute inset-x-2 top-1 h-1/2 rounded-full bg-linear-to-b from-white/45 to-white/0" />
      </div>
      {/* ただよう気泡(白ガラス) */}
      <span className="absolute right-2 top-6 h-3 w-3 rounded-full border border-white/80 bg-white/40" />
      <span className="absolute bottom-8 left-3 h-2 w-2 rounded-full border border-white/70 bg-white/30" />
      <span className="absolute bottom-3 right-6 h-2.5 w-2.5 rounded-full border border-white/70 bg-white/35" />
    </div>
  );
}

/** 開始前の1画面: タイトル+メタ(回数/時間)+説明+スタート */
export function TrainingIntro({
  title,
  meta,
  desc,
  onStart,
}: {
  title: string;
  meta: string;
  desc: string;
  onStart: () => void;
}) {
  return (
    <>
      <section className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
        <TrainingArt />
        <h1 className="text-2xl font-extrabold text-ink">{title}</h1>
        {/* メタ(回数/時間)はすりガラスのピルで */}
        <p className="rounded-full border border-white/70 bg-white/70 px-4 py-1 text-sm font-bold text-primary-deep shadow-sm backdrop-blur-sm">
          {meta}
        </p>
        <p className="max-w-72 text-sm leading-relaxed text-ink-2">{desc}</p>
        {/* 意味のある注記のためコントラスト確保(ink-faint は装飾専用) */}
        <p className="text-xs text-ink-mute">{t("training.freePlayNote")}</p>
      </section>
      <div
        className="px-6"
        style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
      >
        <TrainingButton label={t("training.start")} onClick={onStart} />
      </div>
    </>
  );
}

export interface TrainingStat {
  label: string;
  value: string;
  unit: string;
}

/** 完了画面: おつかれさま+簡単な結果+「もう一度」「メニューへ戻る」 */
export function TrainingDone({
  stats,
  onRetry,
}: {
  stats: TrainingStat[];
  onRetry: () => void;
}) {
  return (
    <>
      <section className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
        <TrainingArt />
        <p role="status" className="text-2xl font-extrabold text-ink">
          {t("training.done.title")}
        </p>
        {/* 結果カードはすりガラス */}
        <dl className="w-full max-w-72 rounded-3xl border border-white/70 bg-white/60 px-5 py-4 shadow-glass backdrop-blur-md">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex items-baseline justify-between gap-3 py-1.5"
            >
              <dt className="text-sm text-ink-2">{s.label}</dt>
              <dd className="font-mono text-2xl font-bold text-ink">
                {s.value}
                <span className="ml-1 text-sm font-normal text-ink-mute">
                  {s.unit}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <div
        className="flex flex-col gap-3 px-6"
        style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
      >
        <TrainingButton label={t("training.done.again")} onClick={onRetry} />
        <Link
          href="/training/"
          className="w-full rounded-full border-2 border-primary/70 bg-white/70 py-3.5 text-center font-bold text-primary-deep shadow-sm backdrop-blur-sm active:opacity-80"
        >
          {t("training.done.menu")}
        </Link>
      </div>
    </>
  );
}
