"use client";

import { useRef, useState } from "react";
import { Disclaimer } from "@/components/Disclaimer";
import { t } from "@/lib/i18n";
import { asset } from "@/lib/ui/asset";

const SLIDE_COUNT = 3;

const slideCls =
  "w-full shrink-0 snap-center flex flex-col justify-center gap-6 px-6 py-8 overflow-y-auto";

/** 金のオーナメント(見出しの飾り罫・装飾専用)。 */
function GoldOrnament() {
  return (
    <div aria-hidden className="flex items-center justify-center gap-2">
      <span className="block h-px w-12 bg-linear-to-r from-transparent to-gold-soft" />
      <span className="block h-1.5 w-1.5 rotate-45 bg-gold" />
      <span className="block h-px w-12 bg-linear-to-l from-transparent to-gold-soft" />
    </div>
  );
}

/** 測定を重ねてMAX(最高スコア)が基準になることを表す装飾ビジュアル(スライド②)。 */
function CalibrationBars() {
  // 装飾用の仮の高さ(%)。最高スコアの1本だけをチャート青で強調。
  const heights = [40, 72, 48, 88, 56, 80, 44];
  const maxIndex = heights.indexOf(Math.max(...heights));
  return (
    <div aria-hidden className="flex items-end justify-center gap-2">
      {heights.map((h, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div className="h-24 flex items-end">
            <div
              style={{ height: `${h}%` }}
              className={`w-6 rounded-full ${
                i === maxIndex
                  ? "bg-linear-to-b from-primary to-primary-deep shadow-md ring-1 ring-gold-soft"
                  : "bg-surface-3"
              }`}
            />
          </div>
          <span
            className={`text-[10px] font-mono ${
              i === maxIndex ? "text-gold-deep font-bold" : "text-ink-mute"
            }`}
          >
            {i === maxIndex ? "MAX" : " "}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * オンボーディング3枚スライド(§4.1)。
 * 横スワイプ(scroll-snap)または「次へ」ボタンで進み、ドットで現在位置を示す。
 */
export function OnboardingSlides({ onFinish }: { onFinish: () => void }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const goTo = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    // snap-mandatory とプログラムからの smooth スクロールは環境によって
    // 途中停止する(Chromium系の既知の癖)ため instant で確実に移動し、
    // インジケータは state を直接更新する
    setIndex(i);
    el.scrollTo({ left: i * el.clientWidth, behavior: "auto" });
  };

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el || el.clientWidth === 0) return;
    const i = Math.min(
      SLIDE_COUNT - 1,
      Math.max(0, Math.round(el.scrollLeft / el.clientWidth)),
    );
    if (i !== index) setIndex(i);
  };

  const next = () => {
    if (index >= SLIDE_COUNT - 1) onFinish();
    else goTo(index + 1);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory"
        style={{ scrollbarWidth: "none" }}
      >
        {/* ① コンセプト: ブランドロゴ+キャッチ画像 */}
        <section className={slideCls}>
          <div className="flex flex-col items-center text-center gap-5">
            <div className="relative">
              {/* ロゴ背後の淡い光彩(装飾) */}
              <div
                aria-hidden
                className="absolute -inset-10 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(42,120,214,0.12) 0%, rgba(42,120,214,0) 70%)",
                }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset("/brand/logo-clean.png")}
                alt={t("onboarding.slide1.imageAlt")}
                width={900}
                height={672}
                className="relative w-full max-w-xs h-auto"
              />
            </div>
            <GoldOrnament />
            <p className="text-sm text-ink-2 leading-relaxed">
              {t("onboarding.slide1.body")}
            </p>
          </div>
        </section>

        {/* ② ベスト計測ウィーク */}
        <section className={slideCls}>
          <div className="flex flex-col items-center text-center gap-5">
            <h2 className="text-2xl font-bold">{t("onboarding.slide2.title")}</h2>
            <GoldOrnament />
            <div className="bg-surface-2 rounded-3xl border border-hairline shadow-md p-5 w-full">
              <CalibrationBars />
              <p className="mt-3 text-xs text-ink-mute">
                {t("onboarding.slide2.visualLabel")}
              </p>
            </div>
            <p className="text-sm text-ink-2 leading-relaxed">
              {t("onboarding.slide2.body")}
            </p>
            <p className="text-xs text-ink-mute leading-relaxed">
              {t("onboarding.slide2.note")}
            </p>
          </div>
        </section>

        {/* ③ 免責・プライバシー */}
        <section className={slideCls}>
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-center">
              {t("onboarding.slide3.title")}
            </h2>
            <GoldOrnament />
            {/* 免責事項を大きく表示([&>div]:text-sm で Disclaimer の文字を一段拡大) */}
            <div className="bg-surface-2 rounded-3xl border border-hairline shadow-md p-5 [&>div]:text-sm">
              <Disclaimer detail />
            </div>
            <div className="bg-surface-2 rounded-3xl border border-hairline shadow-md p-5">
              <p className="text-sm text-ink-2 leading-relaxed">
                {t("onboarding.slide3.privacy")}
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* ドットインジケータ + 次へ */}
      <div className="px-6 pb-6 pt-2 flex flex-col items-center gap-4">
        <div className="flex">
          {Array.from({ length: SLIDE_COUNT }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={t("onboarding.slide.goto", { n: i + 1 })}
              aria-current={i === index}
              onClick={() => goTo(i)}
              className="w-11 h-11 flex items-center justify-center"
            >
              <span
                className={`block w-2.5 h-2.5 rounded-full transition-colors ${
                  i === index ? "bg-primary" : "bg-surface-3"
                }`}
              />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={next}
          className="w-full h-12 rounded-full bg-linear-to-b from-primary to-primary-deep text-primary-ink font-bold text-base shadow-lg ring-1 ring-gold-soft active:translate-y-0.5 active:shadow-md"
        >
          {index >= SLIDE_COUNT - 1 ? t("onboarding.start") : t("common.next")}
        </button>
      </div>
    </div>
  );
}
