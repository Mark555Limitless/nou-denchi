"use client";

/**
 * 背景の浮遊円の定義(位置・大きさ・色・周期)。
 * 白背景リッチテーマ(2026-07-31): 純白の上に relax グリーンの薄い透過円のみで
 * 上品に構成する(グレー階調・ベタ黒は使わない)。
 */
const BUBBLES = [
  {
    size: 64,
    left: "8%",
    top: "16%",
    color: "bg-relax/15",
    durationS: 9,
    delayS: 0,
  },
  {
    size: 36,
    left: "78%",
    top: "10%",
    color: "bg-relax-deep/20",
    durationS: 7,
    delayS: 1.2,
  },
  {
    size: 48,
    left: "84%",
    top: "58%",
    color: "bg-relax/30",
    durationS: 11,
    delayS: 0.6,
  },
  {
    size: 28,
    left: "14%",
    top: "66%",
    color: "bg-relax-deep/10",
    durationS: 8,
    delayS: 2,
  },
  {
    size: 40,
    left: "60%",
    top: "82%",
    color: "bg-relax-deep/15",
    durationS: 10,
    delayS: 0.3,
  },
] as const;

/**
 * 周囲をゆっくり漂う淡い泡(純装飾・aria-hidden)。
 * アニメーションは prefers-reduced-motion: no-preference のときだけ有効。
 */
export function FloatingBubbles() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes nd-relax-float {
            from { transform: translateY(-10px); }
            to { transform: translateY(12px); }
          }
          .nd-relax-float {
            animation: nd-relax-float 8s ease-in-out infinite alternate;
          }
        }
      `}</style>
      {BUBBLES.map((b, i) => (
        <span
          key={i}
          className={`nd-relax-float absolute rounded-full blur-[2px] ${b.color}`}
          style={{
            width: b.size,
            height: b.size,
            left: b.left,
            top: b.top,
            animationDuration: `${b.durationS}s`,
            animationDelay: `${b.delayS}s`,
          }}
        />
      ))}
    </div>
  );
}
