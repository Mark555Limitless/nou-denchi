"use client";

import { t } from "@/lib/i18n";

const RAY_COUNT = 12;

/** 金×青の祝福エンブレム(王冠+放射する光条・SVG装飾)。 */
function CelebrationEmblem() {
  return (
    <div
      aria-hidden
      className="nd-confirmed-pop relative flex items-center justify-center"
    >
      {/* 背後の淡い青の光彩 */}
      <div
        className="absolute -inset-6 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(42,120,214,0.14) 0%, rgba(42,120,214,0) 70%)",
        }}
      />
      <svg
        width="140"
        height="112"
        viewBox="0 0 140 112"
        className="relative drop-shadow-md"
      >
        <defs>
          <linearGradient id="nd-crown-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--color-gold)" }} />
            <stop offset="1" style={{ stopColor: "var(--color-gold-deep)" }} />
          </linearGradient>
        </defs>
        {/* 放射する光条(金) */}
        {Array.from({ length: RAY_COUNT }, (_, i) => {
          const a = (i / RAY_COUNT) * Math.PI * 2 - Math.PI / 2;
          const cx = 70;
          const cy = 56;
          return (
            <line
              key={i}
              x1={cx + Math.cos(a) * 42}
              y1={cy + Math.sin(a) * 42}
              x2={cx + Math.cos(a) * 52}
              y2={cy + Math.sin(a) * 52}
              stroke="var(--color-gold-soft)"
              strokeWidth={3}
              strokeLinecap="round"
            />
          );
        })}
        {/* 王冠(金グラデ) */}
        <path
          d="M40 68 L36 40 L54 54 L70 32 L86 54 L104 40 L100 68 Z"
          fill="url(#nd-crown-gold)"
        />
        <rect x="38" y="72" width="64" height="10" rx="3" fill="url(#nd-crown-gold)" />
        {/* 頂点の玉(金) */}
        <circle cx="36" cy="36" r="4" fill="var(--color-gold)" />
        <circle cx="70" cy="28" r="4.5" fill="var(--color-gold)" />
        <circle cx="104" cy="36" r="4" fill="var(--color-gold)" />
        {/* 青の宝石(ダイヤ) */}
        <rect
          x="65"
          y="72.5"
          width="9"
          height="9"
          transform="rotate(45 69.5 77)"
          fill="var(--color-primary)"
        />
        <circle cx="70" cy="52" r="3.5" fill="var(--color-primary)" />
      </svg>
    </div>
  );
}

/**
 * 「キミの100%! 確定!!」celebration(§4.4 confirmed=1)。
 * アクア・ガラステーマ: すりガラスカード+金×青の王冠エンブレムで
 * プレミアムなお祝い感を出す(mock-aqua-result.png の質感準拠)。
 * CSSアニメは控えめ+prefers-reduced-motion では無効。
 * Day7記念シェアカード(§6.4②)への導線(水滴ピル)を持つ。
 */
export function ConfirmedCelebration({ onShare }: { onShare: () => void }) {
  return (
    <section className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/70 shadow-glass p-6 text-center flex flex-col items-center gap-3">
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
      <CelebrationEmblem />
      <h2 className="text-2xl font-extrabold text-ink nd-confirmed-pop-delayed">
        {t("calibration.confirmed.title")}
      </h2>
      <p className="text-sm text-ink-2 leading-relaxed">
        {t("result.confirmed.subtitle")}
      </p>
      <button
        type="button"
        onClick={onShare}
        className="relative mt-1 w-full overflow-hidden rounded-full bg-linear-to-b from-aqua-btn to-aqua-btn-deep text-primary-ink font-bold py-3.5 min-h-[44px] shadow-lg shadow-primary/30 ring-1 ring-white/60 active:opacity-80"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-4 top-1 h-1/2 rounded-full bg-linear-to-b from-white/45 to-white/0"
        />
        {t("result.confirmed.shareButton")}
      </button>
    </section>
  );
}
