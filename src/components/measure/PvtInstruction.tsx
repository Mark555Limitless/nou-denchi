"use client";

import type { CSSProperties } from "react";
import { t } from "@/lib/i18n";

/**
 * PVT の操作説明「●が出たら、すぐに画面をタップ!」の共通表示。
 * 「○」の代わりに実際の刺激と同じ青グラデーションの円をインラインで示し、
 * スクリーンリーダーには行全体の aria-label で「円が出たら…」と伝える。
 */
export function PvtInstruction({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <p
      className={className}
      style={style}
      aria-label={t("measure.pvt.instructionAria")}
    >
      <span
        aria-hidden
        className="inline-block w-4 h-4 rounded-full bg-linear-to-b from-primary to-primary-deep align-[-2px]"
      />
      {t("measure.pvt.instructionAfter")}
    </p>
  );
}
