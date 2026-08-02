"use client";

import { useEffect, useState } from "react";

export type BreathPhase = "inhale" | "hold" | "exhale";

/** 円の縮尺(仕様: 0.55 ⇔ 1.0)。 */
const MIN_SCALE = 0.55;
const MAX_SCALE = 1;
/** reduced-motion 時の固定縮尺(拡縮しない)。 */
const STATIC_SCALE = 0.8;

/** フェーズごとの CSS transition 時間。hold は吸い切りの残差をやわらかく吸収する。 */
const TRANSITION_MS: Record<BreathPhase, number> = {
  inhale: 4000,
  hold: 500,
  exhale: 6000,
};

/**
 * 呼吸円(アクア・ガラステーマ・2026-08-02 改訂)。
 * 「水面の波紋+青緑ガラスの球」: relax グリーンに ring-teal の青緑を溶かした
 * ガラス球に、多層の光彩と上面グロス+白のヘアラインを重ね、外周には静的な
 * 白い波紋リングを同心に広げる(呼吸のスケール変化には追従しない)。
 * CSS transition(easeInOutSine 近似)でなめらかに拡縮し、
 * prefers-reduced-motion では固定サイズのまま動かない。
 */
export function BreathCircle({
  phase,
  reduced,
}: {
  phase: BreathPhase;
  reduced: boolean;
}) {
  // マウント直後は縮んだ状態で描画し、描画確定後に目標縮尺へ遷移させる
  // (初回レンダーから scale(1) だと transition が走らずいきなり膨らんで見えるため)。
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setArmed(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  const target = phase === "exhale" ? MIN_SCALE : MAX_SCALE;
  const scale = reduced ? STATIC_SCALE : armed ? target : MIN_SCALE;
  const transition =
    reduced || !armed
      ? "none"
      : `transform ${TRANSITION_MS[phase]}ms cubic-bezier(0.37, 0, 0.63, 1)`;

  return (
    <div
      aria-hidden
      className="relative shrink-0"
      style={{ width: "min(62vw, 15rem)", aspectRatio: "1 / 1" }}
    >
      {/* 水面の波紋(静的な白の同心リング・呼吸のスケール変化には追従しない) */}
      <div className="absolute -inset-5 rounded-full border-2 border-white/60" />
      <div className="absolute -inset-10 rounded-full border border-white/40" />
      <div className="absolute -inset-14 rounded-full border border-ring-teal/30" />
      {/* 外側のぼかし光輪(青緑) */}
      <div
        className="absolute inset-0 rounded-full bg-ring-teal/35 blur-2xl"
        style={{ transform: `scale(${scale})`, transition }}
      />
      {/* 本体(relax グリーン×青緑ガラスのグラデーション+多層光彩+白ヘアライン) */}
      <div
        className="absolute inset-0 overflow-hidden rounded-full border border-white/60"
        style={{
          transform: `scale(${scale})`,
          transition,
          background:
            "radial-gradient(circle at 35% 28%, #f0fbf7 0%, #c9eee0 30%, #7fd0c6 56%, #4db08a 76%, var(--color-relax) 90%, #1f8a52 100%)",
          boxShadow:
            "0 0 22px rgba(63, 168, 155, 0.32), 0 0 60px rgba(47, 158, 99, 0.20), 0 0 110px rgba(127, 208, 198, 0.14), inset 0 -18px 36px rgba(22, 107, 63, 0.18)",
        }}
      >
        {/* 上面の光沢ハイライト(水滴のグロス) */}
        <div className="absolute inset-x-[14%] top-[5%] h-[38%] rounded-full bg-linear-to-b from-white/55 to-white/0 blur-md" />
      </div>
    </div>
  );
}
