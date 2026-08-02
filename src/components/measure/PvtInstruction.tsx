"use client";

import type { CSSProperties } from "react";
import { t } from "@/lib/i18n";

/**
 * PVT の操作説明の共通表示(2段組み)。
 *   1行目: ●が出たら、
 *   2行目: 素早く画面をタップ!
 * 「○」の代わりに実際の刺激と同じ青グラデーションの円をインラインで示し、
 * スクリーンリーダーには行全体の aria-label で「円が出たら…」と伝える。
 * 円アイコンの大きさは使用箇所の文字サイズに合わせ iconClassName で調整できる。
 */
export function PvtInstruction({
  className,
  style,
  iconClassName = "w-4 h-4 align-[-2px]",
}: {
  className?: string;
  style?: CSSProperties;
  /** 青丸アイコンのサイズ・ベースライン調整(既定: w-4 h-4 align-[-2px]) */
  iconClassName?: string;
}) {
  return (
    <p
      className={className}
      style={style}
      aria-label={t("measure.pvt.instructionAria")}
    >
      <span aria-hidden className="block">
        <span
          className={`inline-block rounded-full bg-radial-[at_35%_28%] from-[#9fd0f2] via-[#4a8ad8] to-[#1d4e96] ring-1 ring-white/60 ${iconClassName}`}
        />
        {t("measure.pvt.instructionAfter")}
      </span>
      <span aria-hidden className="block">
        {t("measure.pvt.instructionLine2")}
      </span>
    </p>
  );
}
