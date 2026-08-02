"use client";

import { t } from "@/lib/i18n";

interface OutlineTextProps {
  text: string;
  /** 縁取りの太さ(px) */
  strokeWidth?: number;
  className?: string;
}

/**
 * 白文字+boost-deep 縁取りのロゴ風テキスト(GO! / ROUND フラッシュ演出用)。
 * paint-order 非対応環境でも確実に「外縁のみ」の縁取りになるよう、
 * 縁取り層(下)と白文字層(上)を重ねる2層構成。
 */
export function BoostOutlineText({
  text,
  strokeWidth = 6,
  className = "",
}: OutlineTextProps) {
  return (
    <span
      className={`relative inline-block italic font-black tracking-tight pr-1 ${className}`}
    >
      <span
        aria-hidden
        className="absolute inset-0 text-transparent select-none"
        style={{ WebkitTextStroke: `${strokeWidth}px var(--color-boost-deep)` }}
      >
        {text}
      </span>
      <span className="relative text-white">{text}</span>
    </span>
  );
}

/**
 * BOOST!! ロゴ(アクア・ガラステーマ・2026-08-02 改訂)。
 * 赤グラデーション(boost → boost-deep)のピルに白文字、上端に白の光沢ハイライト、
 * 白のガラスリング(ring-white/60)で水滴の質感に。BOOST の赤アイデンティティは維持。
 */
export function BoostLogo({ size = "lg" }: { size?: "lg" | "sm" }) {
  const isLg = size === "lg";
  return (
    <span
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-full bg-linear-to-b from-boost to-boost-deep ring-1 ring-white/60 ${
        isLg ? "px-8 py-3 shadow-lg" : "px-6 py-1.5 shadow-md"
      }`}
    >
      {/* 上端の光沢ハイライト */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-2 top-[3px] h-[46%] rounded-full bg-linear-to-b from-white/45 to-white/0"
      />
      <span
        className={`relative pr-1 italic font-black tracking-tight text-white ${
          isLg ? "text-4xl" : "text-2xl"
        }`}
        style={{ textShadow: "0 1px 2px rgba(110, 18, 10, 0.35)" }}
      >
        {t("boost.title")}
      </span>
    </span>
  );
}
