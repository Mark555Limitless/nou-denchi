"use client";

import Link from "next/link";
import { t } from "@/lib/i18n";

/**
 * トレオタ各モード共通の部品(2026-08-02 ユーザー指示[6])。
 * 白背景リッチテーマ+トレオタ用アクセント(青〜紫グラデーション)。
 * DB保存は一切しないため、中断✕は確認ダイアログなしで即メニューへ戻る。
 */

/** トレオタ主要ボタン(青〜紫グラデ+グロス+金リング) */
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
      className="relative w-full overflow-hidden rounded-full bg-linear-to-b from-primary to-violet-700 py-4 text-lg font-bold text-primary-ink shadow-lg ring-1 ring-gold-soft active:opacity-85"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-3 top-1 h-1/2 rounded-full bg-linear-to-b from-white/40 to-white/0"
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

/** 青〜紫の光の装飾オーブ(画像アセット不使用・RelaxGlowArt と同じ流儀) */
export function TrainingArt() {
  return (
    <div
      aria-hidden
      className="pointer-events-none relative flex h-40 w-40 items-center justify-center"
    >
      {/* 青紫の光彩 */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(109,40,217,0.16) 0%, rgba(42,120,214,0) 70%)",
        }}
      />
      {/* 同心のリング(集中の波紋) */}
      <div className="absolute inset-4 rounded-full border border-primary/30" />
      <div className="absolute inset-9 rounded-full border border-violet-500/40" />
      {/* 中央の光る球(青→紫グラデ+グロス+金の細リング) */}
      <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-linear-to-b from-primary to-violet-700 shadow-lg ring-1 ring-gold-soft">
        <span className="absolute inset-x-2 top-1 h-1/2 rounded-full bg-linear-to-b from-white/40 to-white/0" />
      </div>
      {/* ただよう光の粒 */}
      <span className="absolute right-2 top-6 h-3 w-3 rounded-full bg-violet-400/30" />
      <span className="absolute bottom-8 left-3 h-2 w-2 rounded-full bg-primary/40" />
      <span className="absolute bottom-3 right-6 h-2.5 w-2.5 rounded-full bg-violet-500/25" />
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
        <p className="rounded-full border border-hairline bg-surface-3 px-4 py-1 text-sm font-bold text-violet-700">
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
        <p role="status" className="text-2xl font-extrabold text-violet-700">
          {t("training.done.title")}
        </p>
        <dl className="w-full max-w-72 rounded-3xl border border-hairline bg-surface-2 px-5 py-4 shadow-md">
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
          className="w-full rounded-full border border-hairline bg-surface-2 py-3.5 text-center font-bold text-ink-2 shadow-sm active:opacity-80"
        >
          {t("training.done.menu")}
        </Link>
      </div>
    </>
  );
}
