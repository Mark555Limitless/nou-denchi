"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { t } from "@/lib/i18n";
import {
  playBoostClear,
  playBoostRoundClear,
  playBoostTapBad,
  playBoostTapGood,
} from "@/lib/audio/sfx";
import { BoostLogo, BoostOutlineText } from "./BoostLogo";
import { NumberGrid, type TapResult } from "./NumberGrid";
import { asset } from "@/lib/ui/asset";

/**
 * BOOST!! — ナンバーラッシュ(あそび)。
 * 3×3 グリッドの 1〜9 を順に最速タップ × 3ラウンド連続。
 * 測定データ(セッションDB)には一切保存しない。localStorage のベストタイムのみ。
 */

type Phase = "intro" | "countdown" | "playing" | "done";

const TOTAL_ROUNDS = 3;
const COUNTDOWN_STEP_MS = 600;
const GO_FLASH_MS = 550;
const ROUND_FLASH_MS = 650;
const BEST_KEY = "nou-denchi-boost-best";
/** 褒め文言の段階(合計タイム・27タップぶん) */
const PRAISE_FAST_MS = 22_000;
const PRAISE_MID_MS = 32_000;

/** 1〜9 の Fisher–Yates シャッフル(あそびのためシード不要) */
function shuffle9(): number[] {
  const a = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 10ms 単位の秒表示("12.34") */
function fmtSec(ms: number): string {
  return (Math.floor(ms / 10) / 100).toFixed(2);
}

function readBest(): number | null {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    if (!raw) return null;
    const v = Number(raw);
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}

const boostCss = `
@keyframes boost-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-7px); }
  40% { transform: translateX(7px); }
  60% { transform: translateX(-5px); }
  80% { transform: translateX(5px); }
}
.boost-shake { animation: boost-shake 0.3s ease-in-out; }
@keyframes boost-pop {
  0% { transform: scale(0.85); }
  60% { transform: scale(1.06); }
  100% { transform: scale(1); }
}
.boost-pop { animation: boost-pop 0.18s ease-out; }
.boost-pop-in { animation: boost-pop 0.4s ease-out; }
@keyframes boost-flash {
  0% { opacity: 0; transform: scale(0.6); }
  25% { opacity: 1; transform: scale(1.1); }
  70% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.25); }
}
.boost-flash { animation: boost-flash 0.5s ease-out forwards; }
`;

export function BoostGame() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [count, setCount] = useState(3);
  const [grid, setGrid] = useState<number[]>([]);
  const [round, setRound] = useState(1);
  const [nextNumber, setNextNumber] = useState(1);
  const [goFlash, setGoFlash] = useState(false);
  const [roundFlash, setRoundFlash] = useState<number | null>(null);
  const [totalMs, setTotalMs] = useState(0);
  const [bestMs, setBestMs] = useState<number | null>(null);
  const [bestUpdated, setBestUpdated] = useState(false);

  // レンダー state と同期しない即時参照(連続タップの取りこぼし防止)
  const phaseRef = useRef<Phase>("intro");
  const roundRef = useRef(1);
  const nextRef = useRef(1);
  /** 0 = 計時未開始(GO の描画反映前) */
  const startRef = useRef(0);
  const rafRef = useRef(0);
  const timeElRef = useRef<HTMLSpanElement | null>(null);

  // イントロで自己ベストを表示(localStorage はクライアントのみ・コールバックで反映)
  useEffect(() => {
    let alive = true;
    Promise.resolve().then(() => {
      if (alive) setBestMs(readBest());
    });
    return () => {
      alive = false;
    };
  }, []);

  function transition(p: Phase) {
    phaseRef.current = p;
    setPhase(p);
  }

  function startGame() {
    roundRef.current = 1;
    setRound(1);
    nextRef.current = 1;
    setNextNumber(1);
    setGrid(shuffle9());
    setTotalMs(0);
    setBestUpdated(false);
    setGoFlash(false);
    setRoundFlash(null);
    setCount(3);
    transition("countdown");
  }

  // 「3,2,1」カウントダウン(短く)→ GO! と同時にプレイ開始
  useEffect(() => {
    if (phase !== "countdown") return;
    const timer = setTimeout(() => {
      if (count <= 1) {
        setGoFlash(true);
        transition("playing");
      } else {
        setCount(count - 1);
      }
    }, COUNTDOWN_STEP_MS);
    return () => clearTimeout(timer);
  }, [phase, count]);

  /** 経過タイムのリアルタイム表示(再レンダーを避け DOM 直接更新・10ms単位) */
  function tickTimer() {
    const el = timeElRef.current;
    if (el && startRef.current > 0) {
      el.textContent = fmtSec(performance.now() - startRef.current);
    }
    rafRef.current = requestAnimationFrame(tickTimer);
  }

  // プレイ開始: 描画反映後(rAF 2段)に計時開始+GO!フラッシュを消す
  useEffect(() => {
    if (phase !== "playing") return;
    const goTimer = setTimeout(() => setGoFlash(false), GO_FLASH_MS);
    startRef.current = 0;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        startRef.current = performance.now();
        tickTimer();
      });
    });
    return () => {
      clearTimeout(goTimer);
      cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ラウンド切替フラッシュ(入力は妨げない)
  useEffect(() => {
    if (roundFlash === null) return;
    const timer = setTimeout(() => setRoundFlash(null), ROUND_FLASH_MS);
    return () => clearTimeout(timer);
  }, [roundFlash]);

  function finish() {
    cancelAnimationFrame(rafRef.current);
    const total =
      startRef.current > 0 ? performance.now() - startRef.current : 0;
    const prev = readBest();
    const updated = prev === null || total < prev;
    if (updated) {
      try {
        localStorage.setItem(BEST_KEY, String(Math.round(total)));
      } catch {
        // 保存できなくてもゲームは続行
      }
    }
    setTotalMs(total);
    setBestMs(updated ? total : prev);
    setBestUpdated(updated);
    transition("done");
    playBoostClear();
  }

  function handleTap(value: number): TapResult {
    if (phaseRef.current !== "playing") return "ignore";
    // 計時確定前(GO直後の描画反映中)にタップされたら、その瞬間を開始とする
    if (startRef.current === 0) startRef.current = performance.now();
    if (value < nextRef.current) return "ignore";
    if (value !== nextRef.current) {
      playBoostTapBad();
      return "wrong";
    }
    playBoostTapGood();
    if (value === 9) {
      if (roundRef.current >= TOTAL_ROUNDS) {
        finish();
      } else {
        roundRef.current += 1;
        setRound(roundRef.current);
        nextRef.current = 1;
        setNextNumber(1);
        setGrid(shuffle9());
        setRoundFlash(roundRef.current);
        playBoostRoundClear();
      }
    } else {
      nextRef.current += 1;
      setNextNumber(nextRef.current);
    }
    return "ok";
  }

  return (
    <main
      className="relative flex-1 flex flex-col overflow-hidden px-5 pb-6 select-none"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.5rem)" }}
    >
      <style>{boostCss}</style>

      {/* 背景装飾(リッチ白背景テーマ: やわらかな光彩をごく淡く) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-24 -top-28 h-72 w-72 rounded-full bg-boost/10 blur-3xl" />
        <div className="absolute -right-28 bottom-[-5rem] h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      </div>

      {/* 左上の✕(没入モード: 下部ナビは自動非表示) */}
      <div className="relative flex items-center -ml-2">
        <Link
          href="/"
          aria-label={t("boost.exit")}
          className="w-11 h-11 flex items-center justify-center rounded-full text-xl text-ink-2 active:bg-surface-3"
        >
          ✕
        </Link>
      </div>

      {phase === "intro" && (
        <div className="relative flex-1 flex flex-col items-center justify-center gap-5 text-center">
          <div className="flex flex-col items-center gap-2.5">
            <BoostLogo size="lg" />
            <p className="text-sm font-semibold text-ink-2">
              {t("boost.subtitle")}
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset("/art/fal-boost.webp")}
            alt=""
            aria-hidden
            draggable={false}
            className="h-40 w-40 rounded-3xl ring-1 ring-gold-soft shadow-md pointer-events-none"
          />
          <div className="w-full bg-surface-2 rounded-3xl border border-hairline shadow-md p-5 flex flex-col gap-1.5">
            <p className="text-base font-extrabold text-ink">
              {t("boost.intro.lead")}
            </p>
            <p className="text-sm text-ink-2">{t("boost.intro.rounds")}</p>
          </div>
          {bestMs !== null && (
            <p className="rounded-full bg-surface-3 px-4 py-1.5 text-sm text-ink-2">
              {t("boost.best.label")}{" "}
              <span className="font-mono font-bold text-ink tabular-nums">
                {fmtSec(bestMs)}
              </span>
              {t("boost.secUnit")}
            </p>
          )}
          <button
            type="button"
            onClick={startGame}
            className="relative w-full overflow-hidden rounded-full bg-linear-to-b from-boost to-boost-deep text-primary-ink text-xl font-extrabold py-4 min-h-[56px] shadow-lg ring-1 ring-gold-soft active:opacity-85"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-3 top-1 h-1/2 rounded-full bg-linear-to-b from-white/40 to-white/0"
            />
            <span className="relative">{t("boost.start")}</span>
          </button>
        </div>
      )}

      {phase === "countdown" && (
        <div className="relative flex-1 flex flex-col items-center justify-center gap-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset("/art/fal-boost.webp")}
            alt=""
            aria-hidden
            draggable={false}
            className="h-32 w-32 rounded-3xl ring-1 ring-gold-soft shadow-md pointer-events-none"
          />
          <p
            aria-live="polite"
            className="font-mono text-8xl font-black text-boost-deep"
          >
            {count}
          </p>
          <p className="text-base font-bold text-ink-2">
            {t("boost.playHint")}
          </p>
        </div>
      )}

      {phase === "playing" && (
        <div className="relative flex-1 flex flex-col items-center gap-4 pt-1">
          <BoostLogo size="sm" />
          <div className="w-full max-w-xs flex items-center justify-between">
            <span
              aria-live="polite"
              className="rounded-full bg-surface-2 border border-hairline shadow-sm px-3.5 py-1.5 text-sm font-bold text-ink"
            >
              {t("boost.round", { n: round, total: TOTAL_ROUNDS })}
            </span>
            <span className="font-mono text-2xl font-bold text-ink tabular-nums">
              <span ref={timeElRef}>0.00</span>
              <span className="text-sm text-ink-mute">
                {" "}
                {t("boost.secUnit")}
              </span>
            </span>
          </div>
          <div className="relative w-full">
            <NumberGrid grid={grid} nextNumber={nextNumber} onTap={handleTap} />
            {(goFlash || roundFlash !== null) && (
              <div
                key={`${goFlash}-${roundFlash}`}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <BoostOutlineText
                  text={
                    goFlash
                      ? t("boost.go")
                      : t("boost.nextRound", { n: roundFlash ?? 0 })
                  }
                  strokeWidth={8}
                  className="boost-flash text-6xl"
                />
              </div>
            )}
          </div>
          <p className="text-sm text-ink-mute">{t("boost.playHint")}</p>
        </div>
      )}

      {phase === "done" && (
        <div className="relative flex-1 flex flex-col items-center justify-center gap-5 text-center">
          <BoostLogo size="sm" />
          <div className="w-full bg-surface-2 rounded-3xl border border-hairline shadow-md p-6 flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset("/art/fal-boost.webp")}
              alt=""
              aria-hidden
              draggable={false}
              className="h-24 w-24 rounded-2xl ring-1 ring-gold-soft pointer-events-none"
            />
            <p className="text-sm font-bold text-ink-mute">
              {t("boost.result.label")}
            </p>
            <p className="font-mono font-black text-ink tabular-nums leading-none">
              <span className="text-6xl">{fmtSec(totalMs)}</span>
              <span className="text-xl text-ink-mute">
                {" "}
                {t("boost.secUnit")}
              </span>
            </p>
            <p className="text-xl font-extrabold text-boost-deep">
              {t(
                totalMs < PRAISE_FAST_MS
                  ? "boost.praise.fast"
                  : totalMs < PRAISE_MID_MS
                    ? "boost.praise.mid"
                    : "boost.praise.warm",
              )}
            </p>
            {bestUpdated ? (
              <span className="boost-pop-in rounded-full bg-surface-2 ring-1 ring-gold-soft shadow-sm px-4 py-1.5 text-sm font-extrabold text-boost-deep">
                🎉 {t("boost.best.updated")}
              </span>
            ) : (
              bestMs !== null && (
                <p className="text-sm text-ink-2">
                  {t("boost.best.label")}{" "}
                  <span className="font-mono font-bold text-ink tabular-nums">
                    {fmtSec(bestMs)}
                  </span>
                  {t("boost.secUnit")}
                </p>
              )
            )}
          </div>
          <button
            type="button"
            onClick={startGame}
            className="relative w-full overflow-hidden rounded-full bg-linear-to-b from-boost to-boost-deep text-primary-ink text-lg font-extrabold py-4 min-h-[56px] shadow-lg ring-1 ring-gold-soft active:opacity-85"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-3 top-1 h-1/2 rounded-full bg-linear-to-b from-white/40 to-white/0"
            />
            <span className="relative">{t("boost.retry")}</span>
          </button>
          {/* 遷移元は結果画面のため history.back()。直アクセス時はホームLinkで戻る */}
          <button
            type="button"
            onClick={() => history.back()}
            className="text-sm text-ink-2 underline underline-offset-4 py-2 min-h-[44px]"
          >
            {t("boost.backResult")}
          </button>
          <Link
            href="/"
            className="-mt-4 text-sm text-ink-mute underline underline-offset-4 py-2"
          >
            {t("boost.backHome")}
          </Link>
        </div>
      )}
    </main>
  );
}
