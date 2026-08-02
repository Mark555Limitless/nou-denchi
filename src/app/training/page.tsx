"use client";

import Link from "next/link";
import { t } from "@/lib/i18n";
import { asset } from "@/lib/ui/asset";
import { TrainingBanner } from "@/components/training/TrainingBanner";

/**
 * トレオタ(追加トレーニング)選択メニュー(2026-08-02 ユーザー指示[6])。
 * 計測とは独立した自由トレーニング3モードへの入口。DB保存は一切しない。
 * ボトムナビは既存レイアウト任せ(非表示リストに含めない)。
 */
export default function TrainingMenuPage() {
  return (
    <div
      className="relative flex flex-1 flex-col px-5"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* 左上✕: 常にホームへ(history.back() だとトレーニング往復後に
          直前のモードページへ戻ってしまい一発で出られないため) */}
      <Link
        href="/"
        aria-label={t("training.menu.back.aria")}
        className="absolute top-1 left-1 z-20 flex h-11 w-11 items-center justify-center text-xl text-ink-mute"
        style={{ marginTop: "env(safe-area-inset-top)" }}
      >
        ✕
      </Link>

      <header className="flex flex-col items-center gap-1.5 pt-10 pb-5 text-center">
        <h1 className="bg-linear-to-r from-primary to-violet-700 bg-clip-text pl-[0.3em] text-3xl font-extrabold tracking-[0.3em] text-transparent">
          {t("training.menu.title")}
        </h1>
        <p className="text-sm text-ink-2">{t("training.menu.desc")}</p>
      </header>

      <div className="flex flex-col gap-3 pb-6">
        <TrainingBanner
          href="/training/pvt/"
          ariaLabel={t("training.menu.pvt.aria")}
          imgSrc={asset("/games/banner-tr-pvt.webp")}
        />
        <TrainingBanner
          href="/training/math/"
          ariaLabel={t("training.menu.math.aria")}
          imgSrc={asset("/games/banner-tr-math.webp")}
        />
        <TrainingBanner
          href="/training/stroop/"
          ariaLabel={t("training.menu.stroop.aria")}
          imgSrc={asset("/games/banner-tr-stroop.webp")}
        />
      </div>
    </div>
  );
}
