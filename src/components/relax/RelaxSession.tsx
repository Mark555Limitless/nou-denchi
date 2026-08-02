"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { t } from "@/lib/i18n";
import { playRelaxCue, playRelaxEnd } from "@/lib/audio/sfx";
import { BreathCircle, type BreathPhase } from "./BreathCircle";
import { FloatingBubbles } from "./FloatingBubbles";

/**
 * RELAX: 呼吸にあわせるブリージングセッション。
 * 4秒吸う → 2秒とめる → 6秒吐く(1サイクル12秒)× 5サイクル(約1分)。
 * スコア・計測・保存は一切しない(評価しないことが安心感)。
 * 音はフェーズ切替のやわらかな合図(playRelaxCue / playRelaxEnd)のみ。
 */

const TOTAL_CYCLES = 5;
const PHASE_MS: Record<BreathPhase, number> = {
  inhale: 4000,
  hold: 2000,
  exhale: 6000,
};
const PHASE_LABEL_KEY = {
  inhale: "relax.phase.inhale",
  hold: "relax.phase.hold",
  exhale: "relax.phase.exhale",
} as const;

type Stage = "idle" | "running" | "done";

/**
 * 「おわる」リンク。基本は history.back() で来た画面へ戻り、
 * 履歴が無いとき(直接開いた等)は Link のフォールバックでホームへ。
 */
function QuitLink({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href="/"
      className={className}
      onClick={(e) => {
        if (window.history.length > 1) {
          e.preventDefault();
          window.history.back();
        }
      }}
    >
      {children}
    </Link>
  );
}

/** サイクル進捗(1/5 のドット)。色だけに頼らず aria-label で数字も伝える。 */
function CycleDots({ cycle }: { cycle: number }) {
  return (
    <div
      role="img"
      aria-label={t("relax.cycle.aria", {
        current: cycle + 1,
        total: TOTAL_CYCLES,
      })}
      className="flex items-center justify-center gap-2"
    >
      {Array.from({ length: TOTAL_CYCLES }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className={`h-2.5 w-2.5 rounded-full transition-colors duration-500 ${
            i <= cycle ? "bg-relax-deep" : "bg-relax/40"
          }`}
        />
      ))}
    </div>
  );
}

/**
 * 呼吸円の世界観にあわせた緑の光の装飾(画像アセット不使用)。
 * 同心の淡いリング+中央の光る球+ただよう泡で BreathCircle と調和させる。
 */
function RelaxGlowArt() {
  return (
    <div
      aria-hidden
      className="pointer-events-none relative flex h-40 w-40 items-center justify-center"
    >
      {/* 緑の光彩 */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(47,158,99,0.20) 0%, rgba(47,158,99,0) 70%)",
        }}
      />
      {/* 同心のリング(呼吸の波紋) */}
      <div className="absolute inset-4 rounded-full border border-relax/30" />
      <div className="absolute inset-9 rounded-full border border-relax/50" />
      {/* 中央の光る球(緑グラデ+グロス+金の細リング) */}
      <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-linear-to-b from-relax to-relax-deep shadow-lg ring-1 ring-gold-soft">
        <span className="absolute inset-x-2 top-1 h-1/2 rounded-full bg-linear-to-b from-white/40 to-white/0" />
      </div>
      {/* ただよう泡 */}
      <span className="absolute right-2 top-6 h-3 w-3 rounded-full bg-relax/30" />
      <span className="absolute bottom-8 left-3 h-2 w-2 rounded-full bg-relax/40" />
      <span className="absolute bottom-3 right-6 h-2.5 w-2.5 rounded-full bg-relax/25" />
    </div>
  );
}

export function RelaxSession() {
  const [stage, setStage] = useState<Stage>("idle");
  const [cycle, setCycle] = useState(0);
  const [phase, setPhase] = useState<BreathPhase>("inhale");
  const [reduced, setReduced] = useState(false);

  // prefers-reduced-motion の検出(SSR/プリレンダー対策で effect 内・初期反映は rAF で非同期に)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const raf = requestAnimationFrame(() => setReduced(mq.matches));
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => {
      cancelAnimationFrame(raf);
      mq.removeEventListener("change", onChange);
    };
  }, []);

  // フェーズ進行タイマー(計時精度は不要なので setTimeout でよい)
  useEffect(() => {
    if (stage !== "running") return;
    const timer = setTimeout(() => {
      if (phase === "inhale") {
        setPhase("hold");
        playRelaxCue();
      } else if (phase === "hold") {
        setPhase("exhale");
        playRelaxCue();
      } else if (cycle + 1 >= TOTAL_CYCLES) {
        setStage("done");
        playRelaxEnd();
      } else {
        setCycle((c) => c + 1);
        setPhase("inhale");
        playRelaxCue();
      }
    }, PHASE_MS[phase]);
    return () => clearTimeout(timer);
  }, [stage, phase, cycle]);

  const start = () => {
    setCycle(0);
    setPhase("inhale");
    setStage("running");
  };

  return (
    <div
      className="relative flex flex-1 flex-col overflow-hidden px-6 pt-10 select-none"
      style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
    >
      <FloatingBubbles />

      <div className="relative flex flex-1 flex-col">
        {/* 上部: RELAX 見出し(+セッション中はサイクル進捗) */}
        <header className="flex flex-col items-center gap-2 text-center">
          <h1 className="pl-[0.3em] text-3xl font-extrabold tracking-[0.3em] text-relax-deep">
            {t("relax.title")}
          </h1>
          {stage === "idle" && (
            <p className="text-sm text-ink-2">{t("relax.subtitle")}</p>
          )}
          {stage === "running" && <CycleDots cycle={cycle} />}
        </header>

        {stage === "idle" && (
          <>
            <section className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
              <RelaxGlowArt />
              <p className="text-lg font-bold text-ink">
                {t("relax.intro.lead")}
              </p>
              <p className="max-w-72 text-sm leading-relaxed text-ink-2">
                {t("relax.intro.desc")}
              </p>
            </section>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={start}
                className="relative w-full overflow-hidden rounded-full bg-linear-to-b from-relax to-relax-deep py-4 text-lg font-bold text-primary-ink shadow-lg ring-1 ring-gold-soft active:opacity-85"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-3 top-1 h-1/2 rounded-full bg-linear-to-b from-white/40 to-white/0"
                />
                <span className="relative">{t("relax.start")}</span>
              </button>
              <QuitLink className="flex min-h-11 w-full items-center justify-center rounded-3xl text-sm font-bold text-ink-mute active:opacity-80">
                {t("relax.quit")}
              </QuitLink>
            </div>
          </>
        )}

        {stage === "running" && (
          <>
            <section className="flex flex-1 flex-col items-center justify-center gap-10">
              <p
                aria-live="polite"
                className="text-2xl font-bold tracking-wider text-ink"
              >
                {t(PHASE_LABEL_KEY[phase])}
              </p>
              <BreathCircle phase={phase} reduced={reduced} />
            </section>
            {/* いつでも途中終了できる */}
            <QuitLink className="mx-auto w-full max-w-64 rounded-full border border-hairline bg-surface-2 py-3.5 text-center font-bold text-relax-deep shadow-sm active:opacity-80">
              {t("relax.quit")}
            </QuitLink>
          </>
        )}

        {stage === "done" && (
          <>
            <section className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
              <RelaxGlowArt />
              <p role="status" className="text-2xl font-extrabold text-relax-deep">
                {t("relax.done.title")}
              </p>
              <p className="max-w-72 text-sm leading-relaxed text-ink-2">
                {t("relax.done.desc")}
              </p>
            </section>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={start}
                className="relative w-full overflow-hidden rounded-full bg-linear-to-b from-relax to-relax-deep py-4 text-lg font-bold text-primary-ink shadow-lg ring-1 ring-gold-soft active:opacity-85"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-3 top-1 h-1/2 rounded-full bg-linear-to-b from-white/40 to-white/0"
                />
                <span className="relative">{t("relax.again")}</span>
              </button>
              <QuitLink className="w-full rounded-full border border-hairline bg-surface-2 py-3.5 text-center font-bold text-relax-deep shadow-sm active:opacity-80">
                {t("relax.quit")}
              </QuitLink>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
