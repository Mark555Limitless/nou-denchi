"use client";

import { t } from "@/lib/i18n";

/**
 * 「キミの100%! 確定!!」celebration(§4.4 confirmed=1)。
 * 白背景リッチテーマ: 白カード+金のオーナメント(gold-soft の枠・gold-deep の文字)+
 * Fal(猫耳ロボット)でプレミアムなお祝い感を出す(mock-rich-result.png の質感準拠)。
 * CSSアニメは控えめ+prefers-reduced-motion では無効。
 * Day7記念シェアカード(§6.4②)への導線を持つ。
 */
export function ConfirmedCelebration({ onShare }: { onShare: () => void }) {
  return (
    <section className="bg-surface-2 rounded-3xl border-2 border-gold-soft shadow-md p-6 text-center flex flex-col items-center gap-3">
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes nd-confirmed-pop {
            0% { transform: scale(0.6); opacity: 0; }
            70% { transform: scale(1.08); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          .nd-confirmed-pop { animation: nd-confirmed-pop 0.6s ease-out both; }
          .nd-confirmed-pop-delayed { animation: nd-confirmed-pop 0.6s ease-out 0.15s both; }
        }
      `}</style>
      <div className="flex items-center justify-center gap-3">
        <span aria-hidden className="text-5xl leading-none nd-confirmed-pop">
          🏆
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/characters/fal.jpg"
          alt=""
          aria-hidden
          className="h-[120px] w-auto rounded-2xl bg-surface nd-confirmed-pop-delayed"
        />
      </div>
      <h2 className="text-2xl font-extrabold text-ink nd-confirmed-pop-delayed">
        {t("calibration.confirmed.title")}
      </h2>
      <p className="text-sm text-ink-2 leading-relaxed">
        {t("result.confirmed.subtitle")}
      </p>
      <button
        type="button"
        onClick={onShare}
        className="mt-1 w-full rounded-full border-2 border-gold-soft bg-surface-2 text-gold-deep font-bold py-3.5 min-h-[44px] shadow-sm active:opacity-80"
      >
        {t("result.confirmed.shareButton")}
      </button>
    </section>
  );
}
